"""Pydantic schemas for API request/response validation."""
from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List, Any
from datetime import datetime
from enum import Enum


class UserRole(str, Enum):
    ADMIN = "admin"
    ANALYST = "analyst"
    VIEWER = "viewer"


class PropertyType(str, Enum):
    MDU = "MDU"
    SUBDIVISION = "Subdivision"


class PropertyStatus(str, Enum):
    PROSPECT = "Prospect"
    CONTACTED = "Contacted"
    IN_NEGOTIATION = "In Negotiation"
    COMMITTED = "Committed"
    UNDER_CONSTRUCTION = "Under Construction"
    COMPLETED = "Completed"
    ON_HOLD = "On Hold"
    DECLINED = "Declined"


class PropertyPhase(str, Enum):
    PRE_DEVELOPMENT = "Pre-Development"
    PLANNING = "Planning"
    PERMITTING = "Permitting"
    CONSTRUCTION = "Construction"
    OCCUPANCY = "Occupancy"
    STABILIZED = "Stabilized"


# ============ User Schemas ============

class UserBase(BaseModel):
    email: EmailStr
    full_name: Optional[str] = None


class UserCreate(UserBase):
    password: str
    role: UserRole = UserRole.VIEWER


class UserOut(UserBase):
    id: int
    role: UserRole
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str


class TokenData(BaseModel):
    email: Optional[str] = None
    role: Optional[str] = None


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


# ============ Organization Schemas ============

class OrganizationBase(BaseModel):
    name: str
    org_type: Optional[str] = None
    website: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    zip_code: Optional[str] = None
    phone: Optional[str] = None
    notes: Optional[str] = None


class OrganizationCreate(OrganizationBase):
    pass


class OrganizationUpdate(BaseModel):
    name: Optional[str] = None
    org_type: Optional[str] = None
    website: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    zip_code: Optional[str] = None
    phone: Optional[str] = None
    notes: Optional[str] = None


class OrganizationOut(OrganizationBase):
    id: int
    created_at: datetime
    
    class Config:
        from_attributes = True


# ============ Contact Schemas ============

class ContactBase(BaseModel):
    first_name: str
    last_name: Optional[str] = None
    title: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    mobile: Optional[str] = None
    is_primary: bool = False
    notes: Optional[str] = None


class ContactCreate(ContactBase):
    organization_id: Optional[int] = None


class ContactUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    title: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    mobile: Optional[str] = None
    is_primary: Optional[bool] = None
    notes: Optional[str] = None
    organization_id: Optional[int] = None


class ContactOut(ContactBase):
    id: int
    organization_id: Optional[int] = None
    created_at: datetime
    
    class Config:
        from_attributes = True


# ============ Property Schemas ============

class PropertyBase(BaseModel):
    name: str
    property_type: PropertyType
    status: PropertyStatus = PropertyStatus.PROSPECT
    phase: PropertyPhase = PropertyPhase.PRE_DEVELOPMENT
    address: Optional[str] = None
    city: Optional[str] = None
    county: str
    state: str = "TX"
    zip_code: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    units: Optional[int] = None
    buildings: Optional[int] = None
    stories: Optional[int] = None
    lots: Optional[int] = None
    phases: Optional[int] = None
    current_phase: Optional[int] = None
    break_ground_date: Optional[datetime] = None
    expected_delivery_date: Optional[datetime] = None
    stabilization_date: Optional[datetime] = None
    fiber_distance_gvtc: Optional[float] = None
    fiber_distance_lease: Optional[float] = None
    lease_partner: Optional[str] = None
    has_fiber_access: bool = False
    competitors: Optional[List[Any]] = None
    competitor_count: int = 0
    median_income: Optional[float] = None
    population_density: Optional[float] = None
    census_tract: Optional[str] = None
    nearby_schools: int = 0
    nearby_libraries: int = 0
    notes: Optional[str] = None
    source: str = "Manual"


class PropertyCreate(PropertyBase):
    pass


class PropertyUpdate(BaseModel):
    name: Optional[str] = None
    property_type: Optional[PropertyType] = None
    status: Optional[PropertyStatus] = None
    phase: Optional[PropertyPhase] = None
    address: Optional[str] = None
    city: Optional[str] = None
    county: Optional[str] = None
    state: Optional[str] = None
    zip_code: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    units: Optional[int] = None
    buildings: Optional[int] = None
    stories: Optional[int] = None
    lots: Optional[int] = None
    phases: Optional[int] = None
    current_phase: Optional[int] = None
    break_ground_date: Optional[datetime] = None
    expected_delivery_date: Optional[datetime] = None
    stabilization_date: Optional[datetime] = None
    fiber_distance_gvtc: Optional[float] = None
    fiber_distance_lease: Optional[float] = None
    lease_partner: Optional[str] = None
    has_fiber_access: Optional[bool] = None
    competitors: Optional[List[Any]] = None
    competitor_count: Optional[int] = None
    median_income: Optional[float] = None
    population_density: Optional[float] = None
    census_tract: Optional[str] = None
    nearby_schools: Optional[int] = None
    nearby_libraries: Optional[int] = None
    notes: Optional[str] = None


class PropertyOut(PropertyBase):
    id: int
    score: float = 0
    tier: int = 3
    score_breakdown: Optional[List[Any]] = None
    last_scored_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class PropertyListOut(BaseModel):
    id: int
    name: str
    property_type: PropertyType
    status: PropertyStatus
    city: Optional[str] = None
    county: str
    units: Optional[int] = None
    lots: Optional[int] = None
    score: float = 0
    tier: int = 3
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    
    class Config:
        from_attributes = True


# ============ Property Cost Schemas ============

class PropertyCostBase(BaseModel):
    build_cost: float = 0
    lateral_cost: float = 0
    make_ready_cost: float = 0
    drop_cost: float = 0
    equipment_cost: float = 0
    lease_monthly: float = 0
    lease_term_months: Optional[int] = None
    estimated_take_rate: Optional[float] = None
    arpu: Optional[float] = None
    assumptions: Optional[str] = None
    notes: Optional[str] = None


class PropertyCostCreate(PropertyCostBase):
    property_id: int


class PropertyCostUpdate(PropertyCostBase):
    pass


class PropertyCostOut(PropertyCostBase):
    id: int
    property_id: int
    total_capex: Optional[float] = None
    cost_per_unit: Optional[float] = None
    estimated_monthly_revenue: Optional[float] = None
    payback_months: Optional[int] = None
    updated_at: datetime
    
    class Config:
        from_attributes = True


# ============ Document Schemas ============

class DocumentBase(BaseModel):
    document_type: Optional[str] = None
    description: Optional[str] = None


class DocumentOut(DocumentBase):
    id: int
    property_id: int
    filename: str
    original_filename: Optional[str] = None
    file_type: Optional[str] = None
    file_size: Optional[int] = None
    created_at: datetime
    
    class Config:
        from_attributes = True


# ============ Import Schemas ============

class ImportJobOut(BaseModel):
    id: int
    filename: Optional[str] = None
    import_type: Optional[str] = None
    status: str
    total_rows: Optional[int] = None
    imported_count: int = 0
    updated_count: int = 0
    skipped_count: int = 0
    error_count: int = 0
    errors: Optional[List[dict]] = None
    created_at: datetime
    completed_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True


# ============ Scoring Schemas ============

class ScoreBreakdown(BaseModel):
    factor: str
    raw_value: Any
    weight: float
    points: float
    unit: Optional[str] = None


class ScoreOut(BaseModel):
    total_score: float
    tier: int
    breakdown: List[ScoreBreakdown]
    calculated_at: datetime


class ScoringWeightBase(BaseModel):
    property_type: PropertyType
    factor_name: str
    weight: float
    is_active: bool = True


class ScoringWeightCreate(ScoringWeightBase):
    pass


class ScoringWeightOut(ScoringWeightBase):
    id: int
    updated_at: datetime
    
    class Config:
        from_attributes = True


# ============ Map/Filter Schemas ============

class PropertyFilter(BaseModel):
    counties: Optional[List[str]] = None
    property_types: Optional[List[PropertyType]] = None
    statuses: Optional[List[PropertyStatus]] = None
    phases: Optional[List[PropertyPhase]] = None
    tiers: Optional[List[int]] = None
    has_docs: Optional[bool] = None
    lease_viable: Optional[bool] = None
    min_units: Optional[int] = None
    max_units: Optional[int] = None
    min_score: Optional[float] = None
    search: Optional[str] = None


class BoundingBox(BaseModel):
    min_lat: float
    min_lng: float
    max_lat: float
    max_lng: float
