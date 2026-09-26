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
    route_router,
    voice_router
)

# Initialize logger
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("buildguard")

# Initialize database schema tables & ensure KLU Central Library is ingested
try:
    Base.metadata.create_all(bind=engine)
    logger.info("Database tables initialized successfully.")

    from app.services.klu_library_service import import_klu_library_into_db
    from app.models.project import Project
    from app.database import SessionLocal
    _init_db = SessionLocal()
    try:
        _existing = _init_db.query(Project).filter(Project.name == "KLU Central Library").first()
        if not _existing:
            logger.info("Auto-seeding KLU Central Library from visual survey JSON...")
            _res = import_klu_library_into_db(_init_db)
            logger.info(f"KLU Central Library successfully auto-seeded with ID {_res.get('project_id')}")
        else:
            logger.info(f"KLU Central Library is already active with ID {_existing.id}")
    finally:
        _init_db.close()
except Exception as e:
    logger.error(f"Error initializing database or KLU Library: {e}", exc_info=True)

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="BuildGuard AI Phase 1 API - Building safety, egress graph reasoning and bottleneck simulation.",
    docs_url="/docs",
    redoc_url="/redoc"
)

@app.on_event("startup")
def ensure_klu_central_library():
    """
    Auto-ingests KLU Central Library from visual survey JSON:
    Generates blueprint SVG, safety graph, and IoT sensors in corridors and rooms.
    """
    from app.database import SessionLocal
    from app.services.klu_library_service import import_klu_library_into_db
    from app.models.project import Project
    
    db = SessionLocal()
    try:
        existing = db.query(Project).filter(Project.name == "KLU Central Library").first()
        if not existing:
            logger.info("Auto-importing KLU Central Library into database...")
            res = import_klu_library_into_db(db)
            logger.info(f"KLU Central Library ingested successfully: ID {res.get('project_id')}")
        else:
            logger.info(f"KLU Central Library is already active with ID {existing.id}")
    except Exception as e:
        logger.error(f"Failed to auto-import KLU Central Library: {e}", exc_info=True)
    finally:
        db.close()

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
app.include_router(voice_router, prefix=settings.API_PREFIX)

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
