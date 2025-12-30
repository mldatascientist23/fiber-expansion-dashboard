"""Property Cost API endpoints."""
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..auth import get_current_user, require_analyst
from ..models.models import Property, PropertyCost, User
from ..schemas import PropertyCostCreate, PropertyCostUpdate, PropertyCostOut

router = APIRouter(prefix="/costs", tags=["Costs"])


def calculate_derived_costs(cost: PropertyCost, prop: Property) -> PropertyCost:
    """Calculate derived cost fields."""
    # Total CAPEX
    cost.total_capex = (
        (cost.build_cost or 0) +
        (cost.lateral_cost or 0) +
        (cost.make_ready_cost or 0) +
        (cost.drop_cost or 0) +
        (cost.equipment_cost or 0)
    )
    
    # Cost per unit/lot
    unit_count = prop.units if prop.property_type.value == "MDU" else prop.lots
    if unit_count and unit_count > 0:
        cost.cost_per_unit = cost.total_capex / unit_count
    else:
        cost.cost_per_unit = None
    
    # Estimated monthly revenue
    if cost.estimated_take_rate and cost.arpu and unit_count:
        take_rate = cost.estimated_take_rate / 100 if cost.estimated_take_rate > 1 else cost.estimated_take_rate
        cost.estimated_monthly_revenue = unit_count * take_rate * cost.arpu
    else:
        cost.estimated_monthly_revenue = None
    
    # Payback months
    if cost.estimated_monthly_revenue and cost.estimated_monthly_revenue > 0 and cost.total_capex:
        monthly_profit = cost.estimated_monthly_revenue - (cost.lease_monthly or 0)
        if monthly_profit > 0:
            cost.payback_months = int(cost.total_capex / monthly_profit)
        else:
            cost.payback_months = None
    else:
        cost.payback_months = None
    
    return cost


@router.get("/property/{property_id}", response_model=PropertyCostOut)
async def get_property_costs(property_id: int, db: Session = Depends(get_db)):
    """Get costs for a property."""
    prop = db.query(Property).filter(Property.id == property_id).first()
    if not prop:
        raise HTTPException(status_code=404, detail="Property not found")
    
    cost = db.query(PropertyCost).filter(PropertyCost.property_id == property_id).first()
    
    if not cost:
        # Return empty cost object
        return PropertyCostOut(
            id=0,
            property_id=property_id,
            build_cost=0,
            lateral_cost=0,
            make_ready_cost=0,
            drop_cost=0,
            equipment_cost=0,
            lease_monthly=0,
            updated_at=prop.created_at
        )
    
    return cost


@router.put("/property/{property_id}", response_model=PropertyCostOut)
async def upsert_property_costs(
    property_id: int,
    cost_data: PropertyCostUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_analyst)
):
    """Create or update costs for a property."""
    prop = db.query(Property).filter(Property.id == property_id).first()
    if not prop:
        raise HTTPException(status_code=404, detail="Property not found")
    
    cost = db.query(PropertyCost).filter(PropertyCost.property_id == property_id).first()
    
    if cost:
        # Update existing
        update_data = cost_data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(cost, field, value)
        cost.updated_by_id = current_user.id
    else:
        # Create new
        cost = PropertyCost(
            property_id=property_id,
            **cost_data.model_dump(),
            updated_by_id=current_user.id
        )
        db.add(cost)
    
    # Calculate derived fields
    cost = calculate_derived_costs(cost, prop)
    
    db.commit()
    db.refresh(cost)
    
    return cost


@router.delete("/property/{property_id}")
async def delete_property_costs(
    property_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_analyst)
):
    """Delete costs for a property."""
    cost = db.query(PropertyCost).filter(PropertyCost.property_id == property_id).first()
    if not cost:
        raise HTTPException(status_code=404, detail="Cost record not found")
    
    db.delete(cost)
    db.commit()
    
    return {"message": "Cost record deleted"}
