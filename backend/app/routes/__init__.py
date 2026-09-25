from app.routes.project_routes import router as project_router
from app.routes.upload_routes import router as upload_router
from app.routes.analysis_routes import router as analysis_router
from app.routes.graph_routes import router as graph_router
from app.routes.finding_routes import router as finding_router
from app.routes.simulation_routes import router as simulation_router
from app.routes.chat_routes import router as chat_router
from app.routes.sensor_routes import router as sensor_router
from app.routes.route_routes import router as route_router
from app.routes.voice_routes import router as voice_router

__all__ = [
    "project_router",
    "upload_router",
    "analysis_router",
    "graph_router",
    "finding_router",
    "simulation_router",
    "chat_router",
    "sensor_router",
    "route_router",
    "voice_router",
]

