"""SQLAlchemy database models for the Fiber Expansion Platform."""
from sqlalchemy import (
    Column, Integer, String, Float, Text, DateTime, Boolean, 
    ForeignKey, Enum as SQLEnum, JSON
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from datetime import datetime
import enum

from ..database import Base


class UserRole(str, enum.Enum):
    """User roles for access control."""
    ADMIN = "admin"
    ANALYST = "analyst"
    VIEWER = "viewer"


class PropertyType(str, enum.Enum):
    """Property types."""
    MDU = "MDU"
    SUBDIVISION = "Subdivision"


class PropertyStatus(str, enum.Enum):
    """Property status options."""
    PROSPECT = "Prospect"
    CONTACTED = "Contacted"
    IN_NEGOTIATION = "In Negotiation"
    COMMITTED = "Committed"
    UNDER_CONSTRUCTION = "Under Construction"
    COMPLETED = "Completed"
    ON_HOLD = "On Hold"
    DECLINED = "Declined"


class PropertyPhase(str, enum.Enum):
    """Property development phase."""
    PRE_DEVELOPMENT = "Pre-Development"
    PLANNING = "Planning"
    PERMITTING = "Permitting"
    CONSTRUCTION = "Construction"
    OCCUPANCY = "Occupancy"
    STABILIZED = "Stabilized"


class User(Base):
    """User model for authentication."""
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255))
    role = Column(SQLEnum(UserRole), default=UserRole.VIEWER)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())


class Organization(Base):
    """Organization model (Developers, Management companies, HOAs)."""
    __tablename__ = "organizations"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    org_type = Column(String(100))  # Developer, Management, HOA, Builder
    website = Column(String(500))
    address = Column(Text)
    city = Column(String(100))
    state = Column(String(50))
    zip_code = Column(String(20))
    phone = Column(String(50))
    notes = Column(Text)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    
    # Relationships
    contacts = relationship("Contact", back_populates="organization")
    property_links = relationship("PropertyOrganization", back_populates="organization")


class Contact(Base):
    """Contact model."""
    __tablename__ = "contacts"
    
    id = Column(Integer, primary_key=True, index=True)
    organization_id = Column(Integer, ForeignKey("organizations.id"), nullable=True)
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100))
    title = Column(String(100))
    email = Column(String(255))
    phone = Column(String(50))
    mobile = Column(String(50))
    is_primary = Column(Boolean, default=False)
    notes = Column(Text)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    
    # Relationships
    organization = relationship("Organization", back_populates="contacts")
    property_links = relationship("PropertyContact", back_populates="contact")


class Property(Base):
    """Main property model for MDU and Subdivision tracking."""
    __tablename__ = "properties"
    
    id = Column(Integer, primary_key=True, index=True)
    
    # Basic info
    name = Column(String(255), nullable=False)
    property_type = Column(SQLEnum(PropertyType), nullable=False)
    status = Column(SQLEnum(PropertyStatus), default=PropertyStatus.PROSPECT)
    phase = Column(SQLEnum(PropertyPhase), default=PropertyPhase.PRE_DEVELOPMENT)
    
    # Location
    address = Column(Text)
    city = Column(String(100))
    county = Column(String(100), nullable=False)
    state = Column(String(50), default="TX")
    zip_code = Column(String(20))
    latitude = Column(Float)
    longitude = Column(Float)
    
    # Property details - MDU
    units = Column(Integer)
    buildings = Column(Integer)
    stories = Column(Integer)
    
    # Property details - Subdivision
    lots = Column(Integer)
    phases = Column(Integer)
    current_phase = Column(Integer)
    
    # Dates
    break_ground_date = Column(DateTime)
    expected_delivery_date = Column(DateTime)
    stabilization_date = Column(DateTime)
    
    # Fiber/Infrastructure
    fiber_distance_gvtc = Column(Float)  # Miles
    fiber_distance_lease = Column(Float)  # Miles (best lease partner)
    lease_partner = Column(String(100))  # Zayo, Logix, LCRA, etc.
    has_fiber_access = Column(Boolean, default=False)
    
    # Competition
    competitors = Column(JSON)  # List of competitor info
    competitor_count = Column(Integer, default=0)
    
    # Demographics
    median_income = Column(Float)
    population_density = Column(Float)
    census_tract = Column(String(50))
    
    # E-Rate anchors
    nearby_schools = Column(Integer, default=0)
    nearby_libraries = Column(Integer, default=0)
    
    # Scoring
    score = Column(Float, default=0)
    tier = Column(Integer, default=3)
    score_breakdown = Column(JSON)
    last_scored_at = Column(DateTime)
    
    # Notes
    notes = Column(Text)
    
    # Metadata
    source = Column(String(100))  # Manual, Excel Import, etc.
    import_job_id = Column(Integer)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    created_by_id = Column(Integer, ForeignKey("users.id"))
    
    # Relationships
    documents = relationship("Document", back_populates="property")
    costs = relationship("PropertyCost", back_populates="property", uselist=False)
    organization_links = relationship("PropertyOrganization", back_populates="property")
    contact_links = relationship("PropertyContact", back_populates="property")


class PropertyOrganization(Base):
    """Junction table for property-organization relationships."""
    __tablename__ = "property_organizations"
    
    id = Column(Integer, primary_key=True, index=True)
    property_id = Column(Integer, ForeignKey("properties.id"), nullable=False)
    organization_id = Column(Integer, ForeignKey("organizations.id"), nullable=False)
    role = Column(String(100))  # Developer, Owner, Management, HOA
    is_primary = Column(Boolean, default=False)
    created_at = Column(DateTime, default=func.now())
    
    # Relationships
    property = relationship("Property", back_populates="organization_links")
    organization = relationship("Organization", back_populates="property_links")


class PropertyContact(Base):
    """Junction table for property-contact relationships."""
    __tablename__ = "property_contacts"
    
    id = Column(Integer, primary_key=True, index=True)
    property_id = Column(Integer, ForeignKey("properties.id"), nullable=False)
    contact_id = Column(Integer, ForeignKey("contacts.id"), nullable=False)
    relationship_role = Column(String(100))  # Primary, Secondary, etc.
    relationship_strength = Column(Integer, default=3)  # 1-5
    notes = Column(Text)
    created_at = Column(DateTime, default=func.now())
    
    # Relationships
    property = relationship("Property", back_populates="contact_links")
    contact = relationship("Contact", back_populates="property_links")


class Document(Base):
    """Document attachments for properties."""
    __tablename__ = "documents"
    
    id = Column(Integer, primary_key=True, index=True)
    property_id = Column(Integer, ForeignKey("properties.id"), nullable=False)
    filename = Column(String(500), nullable=False)
    original_filename = Column(String(500))
    file_path = Column(String(1000), nullable=False)
    file_type = Column(String(100))  # PDF, Image, Excel, etc.
    file_size = Column(Integer)
    document_type = Column(String(100))  # Plat, Site Plan, Cost Sheet, etc.
    description = Column(Text)
    uploaded_by_id = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=func.now())
    
    # Relationships
    property = relationship("Property", back_populates="documents")


class PropertyCost(Base):
    """Cost modeling for properties."""
    __tablename__ = "property_costs"
    
    id = Column(Integer, primary_key=True, index=True)
    property_id = Column(Integer, ForeignKey("properties.id"), nullable=False)
    
    # Build costs
    build_cost = Column(Float, default=0)
    lateral_cost = Column(Float, default=0)
    make_ready_cost = Column(Float, default=0)
    drop_cost = Column(Float, default=0)
    equipment_cost = Column(Float, default=0)
    
    # Lease costs
    lease_monthly = Column(Float, default=0)
    lease_term_months = Column(Integer)
    
    # Revenue projections
    estimated_take_rate = Column(Float)  # Percentage
    arpu = Column(Float)  # Average Revenue Per Unit
    
    # Calculated fields
    total_capex = Column(Float)
    cost_per_unit = Column(Float)
    estimated_monthly_revenue = Column(Float)
    payback_months = Column(Integer)
    
    # Notes
    assumptions = Column(Text)
    notes = Column(Text)
    
    # Metadata
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    updated_by_id = Column(Integer, ForeignKey("users.id"))
    
    # Relationships
    property = relationship("Property", back_populates="costs")


class FiberAsset(Base):
    """Fiber infrastructure assets."""
    __tablename__ = "fiber_assets"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255))
    provider = Column(String(100))  # GVTC, Zayo, Logix, LCRA, etc.
    asset_type = Column(String(100))  # Backbone, Distribution, Drop
    latitude = Column(Float)
    longitude = Column(Float)
    geometry = Column(Text)  # GeoJSON for line/polygon
    capacity = Column(String(100))
    notes = Column(Text)
    created_at = Column(DateTime, default=func.now())


class ImportJob(Base):
    """Track Excel import jobs."""
    __tablename__ = "import_jobs"
    
    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String(500))
    import_type = Column(String(50))  # MDU, Subdivision
    status = Column(String(50))  # Pending, Processing, Completed, Failed
    total_rows = Column(Integer)
    imported_count = Column(Integer, default=0)
    updated_count = Column(Integer, default=0)
    skipped_count = Column(Integer, default=0)
    error_count = Column(Integer, default=0)
    errors = Column(JSON)
    column_mapping = Column(JSON)
    created_by_id = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=func.now())
    completed_at = Column(DateTime)


class ScoringWeight(Base):
    """Configurable scoring weights."""
    __tablename__ = "scoring_weights"
    
    id = Column(Integer, primary_key=True, index=True)
    property_type = Column(SQLEnum(PropertyType), nullable=False)
    factor_name = Column(String(100), nullable=False)
    weight = Column(Float, nullable=False)
    is_active = Column(Boolean, default=True)
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    updated_by_id = Column(Integer, ForeignKey("users.id"))
