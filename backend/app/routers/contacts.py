"""Contact and Organization API endpoints."""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..auth import get_current_user, require_analyst
from ..models.models import (
    Contact, Organization, Property, PropertyContact, PropertyOrganization, User
)
from ..schemas import (
    ContactCreate, ContactUpdate, ContactOut,
    OrganizationCreate, OrganizationUpdate, OrganizationOut
)

router = APIRouter(tags=["Contacts & Organizations"])


# ============ Organizations ============

@router.get("/organizations", response_model=List[OrganizationOut])
async def list_organizations(
    skip: int = 0,
    limit: int = 100,
    org_type: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """List all organizations."""
    query = db.query(Organization)
    
    if org_type:
        query = query.filter(Organization.org_type == org_type)
    if search:
        query = query.filter(Organization.name.ilike(f"%{search}%"))
    
    return query.offset(skip).limit(limit).all()


@router.get("/organizations/{org_id}", response_model=OrganizationOut)
async def get_organization(org_id: int, db: Session = Depends(get_db)):
    """Get a single organization."""
    org = db.query(Organization).filter(Organization.id == org_id).first()
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")
    return org


@router.post("/organizations", response_model=OrganizationOut)
async def create_organization(
    org_data: OrganizationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_analyst)
):
    """Create a new organization."""
    org = Organization(**org_data.model_dump())
    db.add(org)
    db.commit()
    db.refresh(org)
    return org


@router.patch("/organizations/{org_id}", response_model=OrganizationOut)
async def update_organization(
    org_id: int,
    org_data: OrganizationUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_analyst)
):
    """Update an organization."""
    org = db.query(Organization).filter(Organization.id == org_id).first()
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")
    
    update_data = org_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(org, field, value)
    
    db.commit()
    db.refresh(org)
    return org


@router.delete("/organizations/{org_id}")
async def delete_organization(
    org_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_analyst)
):
    """Delete an organization."""
    org = db.query(Organization).filter(Organization.id == org_id).first()
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")
    
    db.delete(org)
    db.commit()
    return {"message": "Organization deleted"}


# ============ Contacts ============

@router.get("/contacts", response_model=List[ContactOut])
async def list_contacts(
    skip: int = 0,
    limit: int = 100,
    organization_id: Optional[int] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """List all contacts."""
    query = db.query(Contact)
    
    if organization_id:
        query = query.filter(Contact.organization_id == organization_id)
    if search:
        search_pattern = f"%{search}%"
        query = query.filter(
            (Contact.first_name.ilike(search_pattern)) |
            (Contact.last_name.ilike(search_pattern)) |
            (Contact.email.ilike(search_pattern))
        )
    
    return query.offset(skip).limit(limit).all()


@router.get("/contacts/{contact_id}", response_model=ContactOut)
async def get_contact(contact_id: int, db: Session = Depends(get_db)):
    """Get a single contact."""
    contact = db.query(Contact).filter(Contact.id == contact_id).first()
    if not contact:
        raise HTTPException(status_code=404, detail="Contact not found")
    return contact


@router.post("/contacts", response_model=ContactOut)
async def create_contact(
    contact_data: ContactCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_analyst)
):
    """Create a new contact."""
    contact = Contact(**contact_data.model_dump())
    db.add(contact)
    db.commit()
    db.refresh(contact)
    return contact


@router.patch("/contacts/{contact_id}", response_model=ContactOut)
async def update_contact(
    contact_id: int,
    contact_data: ContactUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_analyst)
):
    """Update a contact."""
    contact = db.query(Contact).filter(Contact.id == contact_id).first()
    if not contact:
        raise HTTPException(status_code=404, detail="Contact not found")
    
    update_data = contact_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(contact, field, value)
    
    db.commit()
    db.refresh(contact)
    return contact


@router.delete("/contacts/{contact_id}")
async def delete_contact(
    contact_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_analyst)
):
    """Delete a contact."""
    contact = db.query(Contact).filter(Contact.id == contact_id).first()
    if not contact:
        raise HTTPException(status_code=404, detail="Contact not found")
    
    db.delete(contact)
    db.commit()
    return {"message": "Contact deleted"}


# ============ Property-Contact Links ============

@router.get("/properties/{property_id}/contacts")
async def get_property_contacts(property_id: int, db: Session = Depends(get_db)):
    """Get all contacts linked to a property."""
    prop = db.query(Property).filter(Property.id == property_id).first()
    if not prop:
        raise HTTPException(status_code=404, detail="Property not found")
    
    links = db.query(PropertyContact).filter(PropertyContact.property_id == property_id).all()
    
    result = []
    for link in links:
        contact = db.query(Contact).filter(Contact.id == link.contact_id).first()
        if contact:
            result.append({
                "id": contact.id,
                "first_name": contact.first_name,
                "last_name": contact.last_name,
                "title": contact.title,
                "email": contact.email,
                "phone": contact.phone,
                "organization_id": contact.organization_id,
                "relationship_role": link.relationship_role,
                "relationship_strength": link.relationship_strength
            })
    
    return result


@router.post("/properties/{property_id}/contacts/{contact_id}")
async def link_contact_to_property(
    property_id: int,
    contact_id: int,
    relationship_role: str = "Primary",
    relationship_strength: int = 3,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_analyst)
):
    """Link a contact to a property."""
    prop = db.query(Property).filter(Property.id == property_id).first()
    if not prop:
        raise HTTPException(status_code=404, detail="Property not found")
    
    contact = db.query(Contact).filter(Contact.id == contact_id).first()
    if not contact:
        raise HTTPException(status_code=404, detail="Contact not found")
    
    # Check if link exists
    existing = db.query(PropertyContact).filter(
        PropertyContact.property_id == property_id,
        PropertyContact.contact_id == contact_id
    ).first()
    
    if existing:
        existing.relationship_role = relationship_role
        existing.relationship_strength = relationship_strength
    else:
        link = PropertyContact(
            property_id=property_id,
            contact_id=contact_id,
            relationship_role=relationship_role,
            relationship_strength=relationship_strength
        )
        db.add(link)
    
    db.commit()
    return {"message": "Contact linked to property"}


@router.delete("/properties/{property_id}/contacts/{contact_id}")
async def unlink_contact_from_property(
    property_id: int,
    contact_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_analyst)
):
    """Unlink a contact from a property."""
    link = db.query(PropertyContact).filter(
        PropertyContact.property_id == property_id,
        PropertyContact.contact_id == contact_id
    ).first()
    
    if not link:
        raise HTTPException(status_code=404, detail="Link not found")
    
    db.delete(link)
    db.commit()
    return {"message": "Contact unlinked from property"}


# ============ Property-Organization Links ============

@router.get("/properties/{property_id}/organizations")
async def get_property_organizations(property_id: int, db: Session = Depends(get_db)):
    """Get all organizations linked to a property."""
    prop = db.query(Property).filter(Property.id == property_id).first()
    if not prop:
        raise HTTPException(status_code=404, detail="Property not found")
    
    links = db.query(PropertyOrganization).filter(PropertyOrganization.property_id == property_id).all()
    
    result = []
    for link in links:
        org = db.query(Organization).filter(Organization.id == link.organization_id).first()
        if org:
            result.append({
                "id": org.id,
                "name": org.name,
                "org_type": org.org_type,
                "phone": org.phone,
                "website": org.website,
                "role": link.role,
                "is_primary": link.is_primary
            })
    
    return result


@router.post("/properties/{property_id}/organizations/{org_id}")
async def link_organization_to_property(
    property_id: int,
    org_id: int,
    role: str = "Developer",
    is_primary: bool = False,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_analyst)
):
    """Link an organization to a property."""
    prop = db.query(Property).filter(Property.id == property_id).first()
    if not prop:
        raise HTTPException(status_code=404, detail="Property not found")
    
    org = db.query(Organization).filter(Organization.id == org_id).first()
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")
    
    # Check if link exists
    existing = db.query(PropertyOrganization).filter(
        PropertyOrganization.property_id == property_id,
        PropertyOrganization.organization_id == org_id
    ).first()
    
    if existing:
        existing.role = role
        existing.is_primary = is_primary
    else:
        link = PropertyOrganization(
            property_id=property_id,
            organization_id=org_id,
            role=role,
            is_primary=is_primary
        )
        db.add(link)
    
    db.commit()
    return {"message": "Organization linked to property"}


@router.delete("/properties/{property_id}/organizations/{org_id}")
async def unlink_organization_from_property(
    property_id: int,
    org_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_analyst)
):
    """Unlink an organization from a property."""
    link = db.query(PropertyOrganization).filter(
        PropertyOrganization.property_id == property_id,
        PropertyOrganization.organization_id == org_id
    ).first()
    
    if not link:
        raise HTTPException(status_code=404, detail="Link not found")
    
    db.delete(link)
    db.commit()
    return {"message": "Organization unlinked from property"}
