"""
Seed script to populate the database with sample data for testing.
Run with: python -m app.seed
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from datetime import datetime, timedelta
import random
from app.database import SessionLocal, init_db
from app.models.models import (
    User, UserRole, Property, PropertyType, PropertyStatus, PropertyPhase,
    Organization, Contact, FiberAsset, ScoringWeight
)
from app.auth import get_password_hash
from app.scoring import recalculate_property_score


def seed_database():
    """Seed the database with sample data."""
    init_db()
    db = SessionLocal()
    
    try:
        # Check if data exists
        if db.query(User).first():
            print("Database already seeded. Skipping...")
            return
        
        print("Seeding database...")
        
        # Create users
        users = [
            User(
                email="admin@gvtc.com",
                hashed_password=get_password_hash("admin123"),
                full_name="GVTC Admin",
                role=UserRole.ADMIN
            ),
            User(
                email="analyst@gvtc.com",
                hashed_password=get_password_hash("analyst123"),
                full_name="Community Development Analyst",
                role=UserRole.ANALYST
            ),
            User(
                email="viewer@gvtc.com",
                hashed_password=get_password_hash("viewer123"),
                full_name="Leadership Viewer",
                role=UserRole.VIEWER
            )
        ]
        db.add_all(users)
        db.commit()
        print(f"Created {len(users)} users")
        
        # Create organizations
        organizations = [
            Organization(
                name="Ashton Woods Homes",
                org_type="Developer",
                city="Austin",
                state="TX",
                phone="(512) 555-0100"
            ),
            Organization(
                name="Meritage Homes",
                org_type="Developer",
                city="San Antonio",
                state="TX",
                phone="(210) 555-0200"
            ),
            Organization(
                name="Greystar Real Estate",
                org_type="Management",
                city="San Antonio",
                state="TX"
            ),
            Organization(
                name="Hill Country HOA Management",
                org_type="HOA",
                city="New Braunfels",
                state="TX"
            ),
            Organization(
                name="David Weekley Homes",
                org_type="Developer",
                city="Houston",
                state="TX"
            )
        ]
        db.add_all(organizations)
        db.commit()
        print(f"Created {len(organizations)} organizations")
        
        # Create contacts
        contacts = [
            Contact(
                organization_id=1,
                first_name="John",
                last_name="Smith",
                title="Development Manager",
                email="jsmith@ashtonwoods.com",
                phone="(512) 555-0101",
                is_primary=True
            ),
            Contact(
                organization_id=2,
                first_name="Sarah",
                last_name="Johnson",
                title="VP of Construction",
                email="sjohnson@meritagehomes.com",
                phone="(210) 555-0201",
                is_primary=True
            ),
            Contact(
                organization_id=3,
                first_name="Mike",
                last_name="Davis",
                title="Property Manager",
                email="mdavis@greystar.com",
                phone="(210) 555-0301"
            ),
            Contact(
                organization_id=4,
                first_name="Lisa",
                last_name="Brown",
                title="HOA Director",
                email="lbrown@hillcountryhoa.com",
                phone="(830) 555-0401"
            )
        ]
        db.add_all(contacts)
        db.commit()
        print(f"Created {len(contacts)} contacts")
        
        # Sample GVTC Texas counties
        counties = ["Bexar", "Comal", "Guadalupe", "Kendall", "Hays", "Blanco", "Gillespie", "Kerr", "Medina"]
        cities = {
            "Bexar": ["San Antonio", "Helotes", "Leon Valley"],
            "Comal": ["New Braunfels", "Canyon Lake", "Bulverde"],
            "Guadalupe": ["Seguin", "Schertz", "Cibolo"],
            "Kendall": ["Boerne", "Comfort", "Fair Oaks Ranch"],
            "Hays": ["San Marcos", "Kyle", "Dripping Springs", "Wimberley"],
            "Blanco": ["Blanco", "Johnson City"],
            "Gillespie": ["Fredericksburg", "Stonewall"],
            "Kerr": ["Kerrville", "Ingram", "Hunt"],
            "Medina": ["Castroville", "Devine", "Hondo"]
        }
        
        # Create MDU properties
        mdu_properties = [
            {
                "name": "The Heights at Stone Oak",
                "city": "San Antonio",
                "county": "Bexar",
                "units": 324,
                "buildings": 8,
                "stories": 4,
                "status": PropertyStatus.IN_NEGOTIATION,
                "phase": PropertyPhase.CONSTRUCTION,
                "latitude": 29.5889,
                "longitude": -98.4961,
                "fiber_distance_gvtc": 0.3,
                "competitor_count": 2,
                "median_income": 85000,
                "nearby_schools": 2
            },
            {
                "name": "Bluebonnet Apartments",
                "city": "New Braunfels",
                "county": "Comal",
                "units": 256,
                "buildings": 6,
                "stories": 3,
                "status": PropertyStatus.COMMITTED,
                "phase": PropertyPhase.PLANNING,
                "latitude": 29.7030,
                "longitude": -98.1246,
                "fiber_distance_gvtc": 0.15,
                "competitor_count": 1,
                "median_income": 78000,
                "nearby_schools": 3
            },
            {
                "name": "Hill Country Lofts",
                "city": "Boerne",
                "county": "Kendall",
                "units": 178,
                "buildings": 4,
                "stories": 3,
                "status": PropertyStatus.PROSPECT,
                "phase": PropertyPhase.PRE_DEVELOPMENT,
                "latitude": 29.7946,
                "longitude": -98.7319,
                "fiber_distance_gvtc": 0.45,
                "competitor_count": 0,
                "median_income": 92000,
                "nearby_schools": 1
            },
            {
                "name": "Riverside Flats",
                "city": "San Marcos",
                "county": "Hays",
                "units": 412,
                "buildings": 10,
                "stories": 4,
                "status": PropertyStatus.CONTACTED,
                "phase": PropertyPhase.PERMITTING,
                "latitude": 29.8833,
                "longitude": -97.9414,
                "fiber_distance_gvtc": 0.8,
                "competitor_count": 3,
                "median_income": 55000,
                "nearby_schools": 4,
                "notes": "Student housing near Texas State University"
            },
            {
                "name": "Vintage at Canyon Lake",
                "city": "Canyon Lake",
                "county": "Comal",
                "units": 144,
                "buildings": 4,
                "stories": 2,
                "status": PropertyStatus.UNDER_CONSTRUCTION,
                "phase": PropertyPhase.CONSTRUCTION,
                "latitude": 29.8700,
                "longitude": -98.2364,
                "fiber_distance_gvtc": 0.25,
                "competitor_count": 1,
                "median_income": 72000,
                "break_ground_date": datetime.now() - timedelta(days=60),
                "expected_delivery_date": datetime.now() + timedelta(days=180)
            },
            {
                "name": "The Residences at Gruene",
                "city": "New Braunfels",
                "county": "Comal",
                "units": 288,
                "buildings": 7,
                "stories": 3,
                "status": PropertyStatus.PROSPECT,
                "phase": PropertyPhase.PLANNING,
                "latitude": 29.7369,
                "longitude": -98.1053,
                "fiber_distance_gvtc": 0.2,
                "competitor_count": 2,
                "median_income": 81000,
                "nearby_schools": 2,
                "nearby_libraries": 1
            },
            {
                "name": "Kerrville Senior Living",
                "city": "Kerrville",
                "county": "Kerr",
                "units": 120,
                "buildings": 2,
                "stories": 3,
                "status": PropertyStatus.CONTACTED,
                "phase": PropertyPhase.PRE_DEVELOPMENT,
                "latitude": 30.0474,
                "longitude": -99.1403,
                "fiber_distance_gvtc": 0.6,
                "competitor_count": 1,
                "median_income": 48000,
                "nearby_schools": 1,
                "notes": "55+ community with potential for bulk agreement"
            }
        ]
        
        for prop_data in mdu_properties:
            prop = Property(
                **prop_data,
                property_type=PropertyType.MDU,
                state="TX",
                source="Seed Data",
                created_by_id=users[0].id
            )
            prop = recalculate_property_score(prop)
            db.add(prop)
        
        db.commit()
        print(f"Created {len(mdu_properties)} MDU properties")
        
        # Create Subdivision properties
        sfu_properties = [
            {
                "name": "Homestead at Bulverde",
                "city": "Bulverde",
                "county": "Comal",
                "lots": 580,
                "phases": 4,
                "current_phase": 2,
                "status": PropertyStatus.COMMITTED,
                "phase": PropertyPhase.CONSTRUCTION,
                "latitude": 29.7439,
                "longitude": -98.4531,
                "fiber_distance_gvtc": 0.1,
                "competitor_count": 1,
                "median_income": 95000,
                "nearby_schools": 2,
                "break_ground_date": datetime.now() - timedelta(days=120),
                "notes": "Phase 1 complete with 145 homes occupied"
            },
            {
                "name": "Cibolo Canyons",
                "city": "Cibolo",
                "county": "Guadalupe",
                "lots": 840,
                "phases": 6,
                "current_phase": 1,
                "status": PropertyStatus.IN_NEGOTIATION,
                "phase": PropertyPhase.PERMITTING,
                "latitude": 29.5614,
                "longitude": -98.2239,
                "fiber_distance_gvtc": 0.35,
                "competitor_count": 2,
                "median_income": 88000,
                "nearby_schools": 3
            },
            {
                "name": "Dripping Springs Ranch",
                "city": "Dripping Springs",
                "county": "Hays",
                "lots": 420,
                "phases": 3,
                "current_phase": 1,
                "status": PropertyStatus.PROSPECT,
                "phase": PropertyPhase.PLANNING,
                "latitude": 30.1902,
                "longitude": -98.0867,
                "fiber_distance_gvtc": 0.5,
                "competitor_count": 0,
                "median_income": 115000,
                "nearby_schools": 1
            },
            {
                "name": "Fair Oaks Estates",
                "city": "Fair Oaks Ranch",
                "county": "Kendall",
                "lots": 320,
                "phases": 2,
                "current_phase": 1,
                "status": PropertyStatus.CONTACTED,
                "phase": PropertyPhase.PRE_DEVELOPMENT,
                "latitude": 29.7461,
                "longitude": -98.6425,
                "fiber_distance_gvtc": 0.2,
                "competitor_count": 1,
                "median_income": 125000,
                "nearby_schools": 2,
                "nearby_libraries": 1
            },
            {
                "name": "Vintage Oaks",
                "city": "New Braunfels",
                "county": "Comal",
                "lots": 3500,
                "phases": 12,
                "current_phase": 8,
                "status": PropertyStatus.UNDER_CONSTRUCTION,
                "phase": PropertyPhase.CONSTRUCTION,
                "latitude": 29.7800,
                "longitude": -98.2100,
                "fiber_distance_gvtc": 0.15,
                "competitor_count": 2,
                "median_income": 105000,
                "nearby_schools": 4,
                "nearby_libraries": 1,
                "notes": "Master-planned community with ongoing phases"
            },
            {
                "name": "Blanco River Village",
                "city": "Wimberley",
                "county": "Hays",
                "lots": 245,
                "phases": 2,
                "current_phase": 1,
                "status": PropertyStatus.PROSPECT,
                "phase": PropertyPhase.PRE_DEVELOPMENT,
                "latitude": 29.9974,
                "longitude": -98.0986,
                "fiber_distance_gvtc": 0.7,
                "competitor_count": 0,
                "median_income": 78000,
                "nearby_schools": 1
            }
        ]
        
        for prop_data in sfu_properties:
            prop = Property(
                **prop_data,
                property_type=PropertyType.SUBDIVISION,
                state="TX",
                source="Seed Data",
                created_by_id=users[0].id
            )
            prop = recalculate_property_score(prop)
            db.add(prop)
        
        db.commit()
        print(f"Created {len(sfu_properties)} Subdivision properties")
        
        # Create default scoring weights
        mdu_weights = [
            ("scale", 0.25),
            ("fiber", 0.20),
            ("competitors", 0.15),
            ("income", 0.10),
            ("density", 0.10),
            ("erate", 0.10),
            ("timing", 0.05),
            ("relationship", 0.05)
        ]
        
        sfu_weights = [
            ("scale", 0.25),
            ("fiber", 0.15),
            ("competitors", 0.15),
            ("income", 0.15),
            ("density", 0.10),
            ("erate", 0.10),
            ("timing", 0.05),
            ("hoa_readiness", 0.05)
        ]
        
        for factor, weight in mdu_weights:
            sw = ScoringWeight(
                property_type=PropertyType.MDU,
                factor_name=factor,
                weight=weight
            )
            db.add(sw)
        
        for factor, weight in sfu_weights:
            sw = ScoringWeight(
                property_type=PropertyType.SUBDIVISION,
                factor_name=factor,
                weight=weight
            )
            db.add(sw)
        
        db.commit()
        print("Created scoring weights")
        
        print("\n✅ Database seeded successfully!")
        print("\nDefault users:")
        print("  admin@gvtc.com / admin123 (Admin)")
        print("  analyst@gvtc.com / analyst123 (Analyst)")
        print("  viewer@gvtc.com / viewer123 (Viewer)")
        
    except Exception as e:
        print(f"Error seeding database: {e}")
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed_database()
