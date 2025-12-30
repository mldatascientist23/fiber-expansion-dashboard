"""Authentication API endpoints."""
from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..database import get_db
from ..auth import (
    authenticate_user, create_access_token, get_current_user,
    create_user, get_password_hash
)
from ..config import get_settings
from ..models.models import User, UserRole
from ..schemas import Token, LoginRequest, UserOut, UserCreate

router = APIRouter(prefix="/auth", tags=["Authentication"])
settings = get_settings()


@router.post("/login", response_model=Token)
async def login(login_data: LoginRequest, db: Session = Depends(get_db)):
    """Authenticate user and return JWT token."""
    user = authenticate_user(db, login_data.email, login_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=settings.access_token_expire_minutes)
    access_token = create_access_token(
        data={"sub": user.email, "role": user.role.value},
        expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}


@router.get("/me", response_model=UserOut)
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    """Get current authenticated user info."""
    return current_user


@router.post("/register", response_model=UserOut)
async def register_user(user_data: UserCreate, db: Session = Depends(get_db)):
    """Register a new user (admin only in production)."""
    # Check if user exists
    existing = db.query(User).filter(User.email == user_data.email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    user = create_user(
        db=db,
        email=user_data.email,
        password=user_data.password,
        full_name=user_data.full_name,
        role=user_data.role
    )
    return user


@router.post("/init-admin")
async def init_admin_user(db: Session = Depends(get_db)):
    """Initialize default admin user (only works if no users exist)."""
    existing = db.query(User).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Users already exist"
        )
    
    admin = create_user(
        db=db,
        email="admin@gvtc.com",
        password="admin123",
        full_name="GVTC Admin",
        role=UserRole.ADMIN
    )
    
    return {"message": "Admin user created", "email": admin.email}
