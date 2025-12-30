"""
Scoring Engine for GVTC Fiber Expansion Intelligence Platform.

Provides transparent, weighted scoring for MDU and Subdivision properties
to prioritize fiber expansion opportunities.
"""
from datetime import datetime, timedelta
from typing import Dict, Any, Optional, List
from .models.models import Property, PropertyType


# Default scoring weights by property type
DEFAULT_WEIGHTS = {
    PropertyType.MDU: {
        "scale": 0.25,        # Units count
        "fiber": 0.20,        # Fiber proximity
        "competitors": 0.15,  # Competitive pressure
        "income": 0.10,       # Median household income
        "density": 0.10,      # Population density
        "erate": 0.10,        # E-Rate anchors nearby
        "timing": 0.05,       # Days until break ground
        "relationship": 0.05  # Contact relationship strength
    },
    PropertyType.SUBDIVISION: {
        "scale": 0.25,        # Lots count
        "fiber": 0.15,        # Fiber proximity
        "competitors": 0.15,  # Competitive pressure
        "income": 0.15,       # Median household income
        "density": 0.10,      # Population density
        "erate": 0.10,        # E-Rate anchors nearby
        "timing": 0.05,       # Days until buildout
        "hoa_readiness": 0.05 # HOA/Management readiness
    }
}


# Minimum score for unknown values - used when property data is incomplete
# This provides a baseline score that doesn't heavily penalize missing data
# while still encouraging complete property information
MIN_UNKNOWN_SCORE = 35


def calculate_scale_points_mdu(units: Optional[int]) -> float:
    """Calculate scale points for MDU based on unit count."""
    if not units:
        return MIN_UNKNOWN_SCORE  # Minimum score if unknown
    if units >= 400:
        return 100
    if units >= 250:
        return 85
    if units >= 150:
        return 70
    if units >= 75:
        return 55
    return MIN_UNKNOWN_SCORE


def calculate_scale_points_sfu(lots: Optional[int]) -> float:
    """Calculate scale points for Subdivision based on lot count."""
    if not lots:
        return MIN_UNKNOWN_SCORE  # Minimum score if unknown
    if lots >= 1000:
        return 100
    if lots >= 600:
        return 85
    if lots >= 300:
        return 70
    if lots >= 150:
        return 55
    return MIN_UNKNOWN_SCORE


def calculate_fiber_proximity_points(distance_miles: Optional[float]) -> float:
    """
    Calculate fiber proximity points.
    Uses the best distance (GVTC or lease partner).
    """
    if distance_miles is None:
        return 40  # Default if unknown
    if distance_miles <= 0.25:
        return 100
    if distance_miles <= 0.50:
        return 80
    if distance_miles <= 1.00:
        return 60
    if distance_miles <= 2.00:
        return 40
    return 20


def calculate_competitor_points(count: Optional[int]) -> float:
    """Calculate competitor pressure points (fewer = better)."""
    if count is None:
        return 50  # Default if unknown
    if count == 0:
        return 100
    if count == 1:
        return 80
    if count == 2:
        return 60
    return 30


def calculate_income_points(median_income: Optional[float]) -> float:
    """Calculate income points based on median household income."""
    if not median_income:
        return 50  # Default if unknown
    if median_income >= 110000:
        return 100
    if median_income >= 85000:
        return 80
    if median_income >= 65000:
        return 60
    if median_income >= 45000:
        return 40
    return 25


def calculate_density_points(density: Optional[float]) -> float:
    """Calculate density points based on population per square mile."""
    if not density:
        return 50  # Default if unknown
    if density >= 3000:
        return 100
    if density >= 2000:
        return 80
    if density >= 1200:
        return 60
    if density >= 600:
        return 40
    return 25


def calculate_erate_points(schools: int, libraries: int) -> float:
    """Calculate E-Rate anchor points based on nearby schools and libraries."""
    total = (schools or 0) + (libraries or 0)
    if total >= 3:
        return 100
    if total == 2:
        return 80
    if total == 1:
        return 60
    return 30


def calculate_timing_points(break_ground_date: Optional[datetime]) -> float:
    """Calculate timing points based on days until break ground."""
    if not break_ground_date:
        return 40  # Default if unknown
    
    days_away = (break_ground_date - datetime.now()).days
    
    if days_away < 0:
        return 50  # Already started
    if days_away <= 180:
        return 100
    if days_away <= 365:
        return 70
    if days_away <= 730:
        return 40
    return 20


def calculate_relationship_points(avg_strength: float = 3) -> float:
    """Calculate relationship points based on average contact relationship strength."""
    if avg_strength >= 4.5:
        return 100
    if avg_strength >= 3.5:
        return 80
    if avg_strength >= 2.5:
        return 60
    if avg_strength >= 1.5:
        return 40
    return 20


def calculate_hoa_readiness_points(has_hoa: bool, has_contact: bool) -> float:
    """Calculate HOA readiness points for subdivisions."""
    if has_hoa and has_contact:
        return 100
    if has_hoa:
        return 70
    return 40


def determine_tier(score: float) -> int:
    """Determine tier based on total score."""
    if score >= 75:
        return 1
    if score >= 50:
        return 2
    return 3


def calculate_score(
    prop: Property,
    weights: Optional[Dict[str, float]] = None,
    relationship_strength: float = 3.0,
    has_hoa: bool = False,
    has_hoa_contact: bool = False
) -> Dict[str, Any]:
    """
    Calculate comprehensive score for a property.
    
    Returns:
        Dict containing total_score, tier, and breakdown of each factor.
    """
    # Get appropriate weights
    prop_type = prop.property_type
    if weights is None:
        weights = DEFAULT_WEIGHTS.get(prop_type, DEFAULT_WEIGHTS[PropertyType.MDU])
    
    breakdown = []
    total_weighted_score = 0
    
    # Scale points (Units for MDU, Lots for SFU)
    if prop_type == PropertyType.MDU:
        scale_raw = prop.units
        scale_points = calculate_scale_points_mdu(prop.units)
        scale_unit = "units"
    else:
        scale_raw = prop.lots
        scale_points = calculate_scale_points_sfu(prop.lots)
        scale_unit = "lots"
    
    scale_weight = weights.get("scale", 0.25)
    scale_weighted = scale_points * scale_weight
    total_weighted_score += scale_weighted
    breakdown.append({
        "factor": "scale",
        "raw_value": scale_raw,
        "weight": scale_weight,
        "points": round(scale_weighted, 2),
        "unit": scale_unit
    })
    
    # Fiber proximity
    best_fiber_distance = min(
        prop.fiber_distance_gvtc or float('inf'),
        prop.fiber_distance_lease or float('inf')
    )
    if best_fiber_distance == float('inf'):
        best_fiber_distance = None
    
    fiber_points = calculate_fiber_proximity_points(best_fiber_distance)
    fiber_weight = weights.get("fiber", 0.20)
    fiber_weighted = fiber_points * fiber_weight
    total_weighted_score += fiber_weighted
    breakdown.append({
        "factor": "fiber_proximity",
        "raw_value": best_fiber_distance,
        "weight": fiber_weight,
        "points": round(fiber_weighted, 2),
        "unit": "miles"
    })
    
    # Competitors
    competitor_points = calculate_competitor_points(prop.competitor_count)
    competitor_weight = weights.get("competitors", 0.15)
    competitor_weighted = competitor_points * competitor_weight
    total_weighted_score += competitor_weighted
    breakdown.append({
        "factor": "competitors",
        "raw_value": prop.competitor_count,
        "weight": competitor_weight,
        "points": round(competitor_weighted, 2),
        "unit": "count"
    })
    
    # Income
    income_points = calculate_income_points(prop.median_income)
    income_weight = weights.get("income", 0.10)
    income_weighted = income_points * income_weight
    total_weighted_score += income_weighted
    breakdown.append({
        "factor": "income",
        "raw_value": prop.median_income,
        "weight": income_weight,
        "points": round(income_weighted, 2),
        "unit": "dollars"
    })
    
    # Density
    density_points = calculate_density_points(prop.population_density)
    density_weight = weights.get("density", 0.10)
    density_weighted = density_points * density_weight
    total_weighted_score += density_weighted
    breakdown.append({
        "factor": "density",
        "raw_value": prop.population_density,
        "weight": density_weight,
        "points": round(density_weighted, 2),
        "unit": "per_sq_mi"
    })
    
    # E-Rate anchors
    erate_points = calculate_erate_points(prop.nearby_schools, prop.nearby_libraries)
    erate_weight = weights.get("erate", 0.10)
    erate_weighted = erate_points * erate_weight
    total_weighted_score += erate_weighted
    breakdown.append({
        "factor": "erate_anchors",
        "raw_value": (prop.nearby_schools or 0) + (prop.nearby_libraries or 0),
        "weight": erate_weight,
        "points": round(erate_weighted, 2),
        "unit": "count"
    })
    
    # Timing
    timing_points = calculate_timing_points(prop.break_ground_date)
    timing_weight = weights.get("timing", 0.05)
    timing_weighted = timing_points * timing_weight
    total_weighted_score += timing_weighted
    
    days_away = None
    if prop.break_ground_date:
        days_away = (prop.break_ground_date - datetime.now()).days
    
    breakdown.append({
        "factor": "timing",
        "raw_value": days_away,
        "weight": timing_weight,
        "points": round(timing_weighted, 2),
        "unit": "days"
    })
    
    # Relationship or HOA readiness (depending on type)
    if prop_type == PropertyType.MDU:
        rel_points = calculate_relationship_points(relationship_strength)
        rel_weight = weights.get("relationship", 0.05)
        rel_weighted = rel_points * rel_weight
        total_weighted_score += rel_weighted
        breakdown.append({
            "factor": "relationship",
            "raw_value": relationship_strength,
            "weight": rel_weight,
            "points": round(rel_weighted, 2),
            "unit": "strength"
        })
    else:
        hoa_points = calculate_hoa_readiness_points(has_hoa, has_hoa_contact)
        hoa_weight = weights.get("hoa_readiness", 0.05)
        hoa_weighted = hoa_points * hoa_weight
        total_weighted_score += hoa_weighted
        breakdown.append({
            "factor": "hoa_readiness",
            "raw_value": {"has_hoa": has_hoa, "has_contact": has_hoa_contact},
            "weight": hoa_weight,
            "points": round(hoa_weighted, 2),
            "unit": "readiness"
        })
    
    # Calculate final score (0-100)
    final_score = round(min(total_weighted_score, 100), 2)
    tier = determine_tier(final_score)
    
    return {
        "total_score": final_score,
        "tier": tier,
        "breakdown": breakdown,
        "calculated_at": datetime.now().isoformat()
    }


def recalculate_property_score(prop: Property) -> Property:
    """
    Recalculate and update property score.
    
    Args:
        prop: Property model instance
        
    Returns:
        Updated property with new score
    """
    score_result = calculate_score(prop)
    prop.score = score_result["total_score"]
    prop.tier = score_result["tier"]
    prop.score_breakdown = score_result["breakdown"]
    prop.last_scored_at = datetime.now()
    return prop
