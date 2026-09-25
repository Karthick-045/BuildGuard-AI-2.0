import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.config import settings, BASE_DIR
from app.database import engine, Base, SessionLocal
import app.models  # Ensures all models are registered with Base.metadata
from app.routes import (
    project_router,
    upload_router,
    analysis_router,
    graph_router,
    finding_router,
    simulation_router,
    chat_router,
    sensor_router,
    route_router
)

# Initialize logger
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("buildguard")

# Initialize database schema tables
try:
    Base.metadata.create_all(bind=engine)
    logger.info("Database tables initialized successfully.")
except Exception as e:
    logger.error(f"Error creating database tables: {e}")

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="BuildGuard AI Phase 1 API - Building safety, egress graph reasoning and bottleneck simulation.",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Configure CORS
origins = [
    settings.CORS_ORIGIN,
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "*"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Hackathon friendly
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve uploaded blueprints and site photos
uploads_path = BASE_DIR / settings.UPLOAD_DIR
uploads_path.mkdir(parents=True, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=str(uploads_path)), name="uploads")

# Include Routers under /api
app.include_router(project_router, prefix=settings.API_PREFIX)
app.include_router(upload_router, prefix=settings.API_PREFIX)
app.include_router(analysis_router, prefix=settings.API_PREFIX)
app.include_router(graph_router, prefix=settings.API_PREFIX)
app.include_router(finding_router, prefix=settings.API_PREFIX)
app.include_router(simulation_router, prefix=settings.API_PREFIX)
app.include_router(chat_router, prefix=settings.API_PREFIX)
app.include_router(sensor_router, prefix=settings.API_PREFIX)
app.include_router(route_router, prefix=settings.API_PREFIX)

@app.get("/")
def root():
    return {
        "status": "online",
        "service": "BuildGuard AI Backend (Phase 1)",
        "version": settings.VERSION,
        "docs": "/docs"
    }

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "database": str(engine.url).split("@")[-1],
        "version": settings.VERSION
    }
