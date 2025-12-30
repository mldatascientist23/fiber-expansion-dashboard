"""
GVTC Fiber Expansion Intelligence Platform

Main FastAPI application entry point.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os

from .config import get_settings
from .database import init_db
from .routers import auth, properties, imports, contacts, documents, costs

settings = get_settings()

# Create FastAPI app
app = FastAPI(
    title=settings.app_name,
    description="Internal web application to identify, track, score, and prioritize fiber expansion opportunities for MDU and Subdivision developments in GVTC's Texas footprint.",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/api")
app.include_router(properties.router, prefix="/api")
app.include_router(imports.router, prefix="/api")
app.include_router(contacts.router, prefix="/api")
app.include_router(documents.router, prefix="/api")
app.include_router(costs.router, prefix="/api")

# Ensure upload directory exists
os.makedirs(settings.upload_directory, exist_ok=True)


@app.on_event("startup")
async def startup_event():
    """Initialize database on startup."""
    init_db()


@app.get("/api/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "app": settings.app_name,
        "version": "1.0.0"
    }


@app.get("/api/counties")
async def get_gvtc_counties():
    """Get list of GVTC service counties."""
    return {
        "counties": settings.gvtc_counties,
        "state": "TX"
    }


@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "message": "GVTC Fiber Expansion Intelligence Platform API",
        "docs": "/api/docs",
        "version": "1.0.0"
    }
