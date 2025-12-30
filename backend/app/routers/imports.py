"""Excel Import API endpoints."""
from typing import Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
import pandas as pd
import io

from ..database import get_db
from ..auth import get_current_user, require_analyst
from ..models.models import (
    Property, PropertyType, PropertyStatus, PropertyPhase,
    ImportJob, User
)
from ..schemas import ImportJobOut
from ..scoring import recalculate_property_score

router = APIRouter(prefix="/imports", tags=["Import"])


# Column mapping for Excel import
MDU_COLUMN_MAPPING = {
    "name": ["Name", "Property Name", "Project Name", "MDU Name", "Development Name"],
    "address": ["Address", "Street Address", "Location", "Street"],
    "city": ["City", "Town"],
    "county": ["County"],
    "state": ["State"],
    "zip_code": ["Zip", "Zip Code", "ZIP", "Postal Code"],
    "units": ["Units", "Unit Count", "Total Units", "# Units", "Number of Units"],
    "buildings": ["Buildings", "Building Count", "# Buildings"],
    "stories": ["Stories", "Floors"],
    "status": ["Status", "Property Status", "Project Status"],
    "phase": ["Phase", "Development Phase", "Construction Phase"],
    "break_ground_date": ["Break Ground", "Break Ground Date", "Ground Breaking", "Start Date"],
    "expected_delivery_date": ["Delivery Date", "Expected Delivery", "Completion Date", "Move In Date"],
    "fiber_distance_gvtc": ["GVTC Distance", "Distance to GVTC", "Fiber Distance", "Distance"],
    "latitude": ["Latitude", "Lat"],
    "longitude": ["Longitude", "Long", "Lng"],
    "competitor_count": ["Competitors", "Competitor Count", "# Competitors"],
    "notes": ["Notes", "Comments", "Description"]
}

SFU_COLUMN_MAPPING = {
    "name": ["Name", "Subdivision Name", "Project Name", "Development Name"],
    "address": ["Address", "Location"],
    "city": ["City", "Town"],
    "county": ["County"],
    "state": ["State"],
    "zip_code": ["Zip", "Zip Code", "ZIP"],
    "lots": ["Lots", "Total Lots", "Lot Count", "# Lots", "Number of Lots"],
    "phases": ["Phases", "Total Phases", "Phase Count"],
    "current_phase": ["Current Phase", "Phase"],
    "status": ["Status"],
    "break_ground_date": ["Break Ground", "Start Date"],
    "expected_delivery_date": ["Delivery Date", "Completion Date"],
    "fiber_distance_gvtc": ["GVTC Distance", "Distance to GVTC", "Fiber Distance"],
    "latitude": ["Latitude", "Lat"],
    "longitude": ["Longitude", "Long", "Lng"],
    "competitor_count": ["Competitors", "Competitor Count"],
    "notes": ["Notes", "Comments"]
}


def find_column_match(df_columns: list, mapping_list: list) -> Optional[str]:
    """Find matching column name from DataFrame."""
    df_columns_lower = [c.lower().strip() for c in df_columns]
    for option in mapping_list:
        if option.lower() in df_columns_lower:
            idx = df_columns_lower.index(option.lower())
            return df_columns[idx]
    return None


def parse_date(value) -> Optional[datetime]:
    """Parse date from various formats."""
    if pd.isna(value) or value is None:
        return None
    if isinstance(value, datetime):
        return value
    if isinstance(value, pd.Timestamp):
        return value.to_pydatetime()
    try:
        return pd.to_datetime(value).to_pydatetime()
    except Exception:
        return None


def parse_float(value) -> Optional[float]:
    """Parse float from various formats."""
    if pd.isna(value) or value is None:
        return None
    try:
        return float(value)
    except Exception:
        return None


def parse_int(value) -> Optional[int]:
    """Parse integer from various formats."""
    if pd.isna(value) or value is None:
        return None
    try:
        return int(float(value))
    except Exception:
        return None


def map_status(value: str) -> PropertyStatus:
    """Map status string to PropertyStatus enum."""
    if not value or pd.isna(value):
        return PropertyStatus.PROSPECT
    
    value_lower = str(value).lower().strip()
    status_map = {
        "prospect": PropertyStatus.PROSPECT,
        "contacted": PropertyStatus.CONTACTED,
        "negotiation": PropertyStatus.IN_NEGOTIATION,
        "in negotiation": PropertyStatus.IN_NEGOTIATION,
        "committed": PropertyStatus.COMMITTED,
        "construction": PropertyStatus.UNDER_CONSTRUCTION,
        "under construction": PropertyStatus.UNDER_CONSTRUCTION,
        "completed": PropertyStatus.COMPLETED,
        "on hold": PropertyStatus.ON_HOLD,
        "declined": PropertyStatus.DECLINED
    }
    return status_map.get(value_lower, PropertyStatus.PROSPECT)


def map_phase(value: str) -> PropertyPhase:
    """Map phase string to PropertyPhase enum."""
    if not value or pd.isna(value):
        return PropertyPhase.PRE_DEVELOPMENT
    
    value_lower = str(value).lower().strip()
    phase_map = {
        "pre-development": PropertyPhase.PRE_DEVELOPMENT,
        "predevelopment": PropertyPhase.PRE_DEVELOPMENT,
        "planning": PropertyPhase.PLANNING,
        "permitting": PropertyPhase.PERMITTING,
        "construction": PropertyPhase.CONSTRUCTION,
        "occupancy": PropertyPhase.OCCUPANCY,
        "stabilized": PropertyPhase.STABILIZED
    }
    return phase_map.get(value_lower, PropertyPhase.PRE_DEVELOPMENT)


@router.post("/upload", response_model=ImportJobOut)
async def import_excel(
    file: UploadFile = File(...),
    property_type: str = Form("MDU"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_analyst)
):
    """
    Import properties from Excel file.
    
    Supports both MDU and Subdivision imports.
    """
    # Validate file type
    if not file.filename.endswith(('.xlsx', '.xls')):
        raise HTTPException(
            status_code=400,
            detail="Invalid file type. Please upload an Excel file (.xlsx or .xls)"
        )
    
    # Create import job record
    import_job = ImportJob(
        filename=file.filename,
        import_type=property_type,
        status="Processing",
        created_by_id=current_user.id
    )
    db.add(import_job)
    db.commit()
    db.refresh(import_job)
    
    try:
        # Read Excel file
        contents = await file.read()
        df = pd.read_excel(io.BytesIO(contents))
        
        import_job.total_rows = len(df)
        
        # Select column mapping based on property type
        prop_type = PropertyType.MDU if property_type == "MDU" else PropertyType.SUBDIVISION
        column_mapping = MDU_COLUMN_MAPPING if property_type == "MDU" else SFU_COLUMN_MAPPING
        
        # Build column map
        df_columns = list(df.columns)
        col_map = {}
        for field, options in column_mapping.items():
            matched = find_column_match(df_columns, options)
            if matched:
                col_map[field] = matched
        
        import_job.column_mapping = col_map
        
        errors = []
        imported = 0
        updated = 0
        skipped = 0
        
        for idx, row in df.iterrows():
            try:
                # Get name - required field
                name_col = col_map.get("name")
                if not name_col or pd.isna(row.get(name_col)):
                    errors.append({
                        "row": idx + 2,
                        "error": "Missing property name"
                    })
                    skipped += 1
                    continue
                
                name = str(row[name_col]).strip()
                
                # Get county - required field
                county_col = col_map.get("county")
                county = str(row.get(county_col, "")).strip() if county_col else ""
                if not county:
                    errors.append({
                        "row": idx + 2,
                        "error": f"Missing county for '{name}'"
                    })
                    skipped += 1
                    continue
                
                # Check for existing property
                existing = db.query(Property).filter(
                    Property.name == name,
                    Property.county == county
                ).first()
                
                # Build property data
                prop_data = {
                    "name": name,
                    "property_type": prop_type,
                    "county": county,
                    "source": "Excel Import",
                    "import_job_id": import_job.id
                }
                
                # Map optional fields
                if col_map.get("address"):
                    prop_data["address"] = str(row.get(col_map["address"], "")).strip() or None
                if col_map.get("city"):
                    prop_data["city"] = str(row.get(col_map["city"], "")).strip() or None
                if col_map.get("state"):
                    prop_data["state"] = str(row.get(col_map["state"], "")).strip() or "TX"
                else:
                    prop_data["state"] = "TX"
                if col_map.get("zip_code"):
                    prop_data["zip_code"] = str(row.get(col_map["zip_code"], "")).strip() or None
                
                # Units/Lots
                if property_type == "MDU" and col_map.get("units"):
                    prop_data["units"] = parse_int(row.get(col_map["units"]))
                if property_type == "Subdivision" and col_map.get("lots"):
                    prop_data["lots"] = parse_int(row.get(col_map["lots"]))
                
                # Buildings/Stories
                if col_map.get("buildings"):
                    prop_data["buildings"] = parse_int(row.get(col_map["buildings"]))
                if col_map.get("stories"):
                    prop_data["stories"] = parse_int(row.get(col_map["stories"]))
                
                # Phases
                if col_map.get("phases"):
                    prop_data["phases"] = parse_int(row.get(col_map["phases"]))
                if col_map.get("current_phase"):
                    prop_data["current_phase"] = parse_int(row.get(col_map["current_phase"]))
                
                # Dates
                if col_map.get("break_ground_date"):
                    prop_data["break_ground_date"] = parse_date(row.get(col_map["break_ground_date"]))
                if col_map.get("expected_delivery_date"):
                    prop_data["expected_delivery_date"] = parse_date(row.get(col_map["expected_delivery_date"]))
                
                # Location
                if col_map.get("latitude"):
                    prop_data["latitude"] = parse_float(row.get(col_map["latitude"]))
                if col_map.get("longitude"):
                    prop_data["longitude"] = parse_float(row.get(col_map["longitude"]))
                
                # Fiber distance
                if col_map.get("fiber_distance_gvtc"):
                    prop_data["fiber_distance_gvtc"] = parse_float(row.get(col_map["fiber_distance_gvtc"]))
                
                # Competitors
                if col_map.get("competitor_count"):
                    prop_data["competitor_count"] = parse_int(row.get(col_map["competitor_count"])) or 0
                
                # Status/Phase
                if col_map.get("status"):
                    prop_data["status"] = map_status(row.get(col_map["status"]))
                if col_map.get("phase"):
                    prop_data["phase"] = map_phase(row.get(col_map["phase"]))
                
                # Notes
                if col_map.get("notes"):
                    notes_val = row.get(col_map["notes"])
                    if not pd.isna(notes_val):
                        prop_data["notes"] = str(notes_val).strip()
                
                if existing:
                    # Update existing property
                    for key, value in prop_data.items():
                        if value is not None:
                            setattr(existing, key, value)
                    existing = recalculate_property_score(existing)
                    updated += 1
                else:
                    # Create new property
                    prop = Property(**prop_data)
                    prop.created_by_id = current_user.id
                    prop = recalculate_property_score(prop)
                    db.add(prop)
                    imported += 1
                    
            except Exception as e:
                errors.append({
                    "row": idx + 2,
                    "error": str(e)
                })
                skipped += 1
        
        # Update import job
        import_job.imported_count = imported
        import_job.updated_count = updated
        import_job.skipped_count = skipped
        import_job.error_count = len(errors)
        import_job.errors = errors[:50]  # Keep first 50 errors
        import_job.status = "Completed"
        import_job.completed_at = datetime.now()
        
        db.commit()
        db.refresh(import_job)
        
        return import_job
        
    except Exception as e:
        import_job.status = "Failed"
        import_job.errors = [{"error": str(e)}]
        db.commit()
        raise HTTPException(status_code=500, detail=f"Import failed: {str(e)}")


@router.get("", response_model=list[ImportJobOut])
async def list_imports(
    skip: int = 0,
    limit: int = 20,
    db: Session = Depends(get_db)
):
    """List all import jobs."""
    return db.query(ImportJob).order_by(ImportJob.created_at.desc()).offset(skip).limit(limit).all()


@router.get("/{job_id}", response_model=ImportJobOut)
async def get_import_job(job_id: int, db: Session = Depends(get_db)):
    """Get details of an import job."""
    job = db.query(ImportJob).filter(ImportJob.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Import job not found")
    return job
