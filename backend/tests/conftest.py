"""Pytest configuration for backend tests."""
import pytest
import os
import sys

# Add app to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Use SQLite for testing
os.environ["DATABASE_URL"] = "sqlite:///./test.db"


@pytest.fixture(scope="session")
def test_db():
    """Create test database."""
    from app.database import engine, Base
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)
    if os.path.exists("./test.db"):
        os.remove("./test.db")
