"""Property API endpoints."""
from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_

from ..database import get_db
from ..auth import get_current_user, require_analyst
from ..models.models import (
    Property, PropertyType, PropertyStatus, PropertyPhase,
    User, PropertyContact, PropertyOrganization
)
from ..schemas import (
    PropertyCreate, PropertyUpdate, PropertyOut, PropertyListOut,
    PropertyFilter
)
from ..scoring import recalculate_property_score, calculate_score

router = APIRouter(prefix="/properties", tags=["Properties"])


@router.get("", response_model=List[PropertyListOut])
async def list_properties(
    skip: int = 0,
    limit: int = 100,
    county: Optional[str] = None,
    property_type: Optional[PropertyType] = None,
    status: Optional[PropertyStatus] = None,
    tier: Optional[int] = None,
    search: Optional[str] = None,
    min_lat: Optional[float] = None,
    max_lat: Optional[float] = None,
    min_lng: Optional[float] = None,
    max_lng: Optional[float] = None,
    db: Session = Depends(get_db)
):
    """List all properties with optional filters."""
    query = db.query(Property)
    
    # Apply filters
    if county:
        query = query.filter(Property.county == county)
    if property_type:
        query = query.filter(Property.property_type == property_type)
    if status:
        query = query.filter(Property.status == status)
    if tier:
        query = query.filter(Property.tier == tier)
    if search:
        search_pattern = f"%{search}%"
        query = query.filter(
            or_(
                Property.name.ilike(search_pattern),
                Property.city.ilike(search_pattern),
                Property.address.ilike(search_pattern)
            )
        )
    
    # Bounding box filter for map
    if all([min_lat, max_lat, min_lng, max_lng]):
        query = query.filter(
            and_(
                Property.latitude >= min_lat,
                Property.latitude <= max_lat,
                Property.longitude >= min_lng,
                Property.longitude <= max_lng
            )
        )
    
    # Order by score descending (highest priority first)
    query = query.order_by(Property.score.desc())
    
    return query.offset(skip).limit(limit).all()


@router.get("/counties")
async def get_counties(db: Session = Depends(get_db)):
    """Get list of counties with property counts."""
    from sqlalchemy import func
    results = db.query(
        Property.county,
        func.count(Property.id).label('count')
    ).group_by(Property.county).all()
    
    return [{"county": r[0], "count": r[1]} for r in results]


@router.get("/stats")
async def get_stats(db: Session = Depends(get_db)):
    """Get summary statistics for dashboard."""
    from sqlalchemy import func
    
    total = db.query(func.count(Property.id)).scalar() or 0
    
    by_type = db.query(
        Property.property_type,
        func.count(Property.id)
    ).group_by(Property.property_type).all()
    
    by_tier = db.query(
        Property.tier,
        func.count(Property.id)
    ).group_by(Property.tier).all()
    
    by_status = db.query(
        Property.status,
        func.count(Property.id)
    ).group_by(Property.status).all()
    
    total_units = db.query(func.sum(Property.units)).scalar() or 0
    total_lots = db.query(func.sum(Property.lots)).scalar() or 0
    avg_score = db.query(func.avg(Property.score)).scalar() or 0
    
    return {
        "total_properties": total,
        "by_type": {str(t[0].value) if t[0] else "Unknown": t[1] for t in by_type},
        "by_tier": {str(t[0]) if t[0] else "Unknown": t[1] for t in by_tier},
        "by_status": {str(t[0].value) if t[0] else "Unknown": t[1] for t in by_status},
        "total_units": total_units,
        "total_lots": total_lots,
        "average_score": round(avg_score, 2) if avg_score else 0
    }


@router.get("/{property_id}", response_model=PropertyOut)
async def get_property(property_id: int, db: Session = Depends(get_db)):
    """Get a single property by ID."""
    prop = db.query(Property).filter(Property.id == property_id).first()
    if not prop:
        raise HTTPException(status_code=404, detail="Property not found")
    return prop


@router.post("", response_model=PropertyOut)
async def create_property(
    property_data: PropertyCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_analyst)
):
    """Create a new property."""
    prop = Property(
        **property_data.model_dump(),
        created_by_id=current_user.id,
        source="Manual"
    )
    
    # Calculate initial score
    prop = recalculate_property_score(prop)
    
    db.add(prop)
    db.commit()
    db.refresh(prop)
    return prop


@router.patch("/{property_id}", response_model=PropertyOut)
async def update_property(
    property_id: int,
    property_data: PropertyUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_analyst)
):
    """Update an existing property."""
    prop = db.query(Property).filter(Property.id == property_id).first()
    if not prop:
        raise HTTPException(status_code=404, detail="Property not found")
    
    # Update only provided fields
    update_data = property_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(prop, field, value)
    
    # Recalculate score after update
    prop = recalculate_property_score(prop)
    
    db.commit()
    db.refresh(prop)
    return prop


@router.delete("/{property_id}")
async def delete_property(
    property_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_analyst)
):
    """Delete a property."""
    prop = db.query(Property).filter(Property.id == property_id).first()
    if not prop:
        raise HTTPException(status_code=404, detail="Property not found")
    
    db.delete(prop)
    db.commit()
    return {"message": "Property deleted"}


@router.post("/{property_id}/recalculate-score", response_model=PropertyOut)
async def recalculate_score(
    property_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_analyst)
):
    """Recalculate the score for a property."""
    prop = db.query(Property).filter(Property.id == property_id).first()
    if not prop:
        raise HTTPException(status_code=404, detail="Property not found")
    
    prop = recalculate_property_score(prop)
    db.commit()
    db.refresh(prop)
    return prop


@router.post("/recalculate-all")
async def recalculate_all_scores(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_analyst)
):
    """Recalculate scores for all properties."""
    properties = db.query(Property).all()
    count = 0
    for prop in properties:
        recalculate_property_score(prop)
        count += 1
    
    db.commit()
    return {"message": f"Recalculated scores for {count} properties"}


@router.get("/{property_id}/score-breakdown")
async def get_score_breakdown(property_id: int, db: Session = Depends(get_db)):
    """Get detailed score breakdown for a property."""
    prop = db.query(Property).filter(Property.id == property_id).first()
    if not prop:
        raise HTTPException(status_code=404, detail="Property not found")
    
    # Calculate fresh score
    score_result = calculate_score(prop)
    
    return {
        "property_id": property_id,
        "property_name": prop.name,
        "total_score": score_result["total_score"],
        "tier": score_result["tier"],
        "breakdown": score_result["breakdown"],
        "calculated_at": score_result["calculated_at"]
    }
