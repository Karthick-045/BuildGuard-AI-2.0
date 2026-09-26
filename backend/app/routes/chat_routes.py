import logging
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.config import settings
from app.models.project import Project
from app.services.chat_service import chat_service
from app.schemas.chat import ChatMessageRequest, ChatMessageResponse, ChatStatusResponse

logger = logging.getLogger("buildguard.chat_routes")

router = APIRouter(tags=["AI Agent Chatbot"])

@router.post("/projects/{project_id}/chat", response_model=ChatMessageResponse)
async def chat_with_project_agent(
    project_id: int,
    payload: ChatMessageRequest,
    db: Session = Depends(get_db)
):
    """
    Sends a query to the BuildGuard AI Agent for a specific project.
    Grounds all responses strictly in real database data (elements, graph topology,
    articulation points, 8 safety checks, plan-vs-actual variances, simulations).
    Supports user-provided or environment Gemini/OpenAI API keys, falling back
    to the deterministic grounded engine when no key is present.
    """
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Project with ID {project_id} not found."
        )

    try:
        result = await chat_service.call_llm_agent(
            message=payload.message,
            project_id=project_id,
            db=db,
            user_api_key=payload.api_key,
            provider=payload.provider or "gemini",
            history=payload.history,
            user_location=payload.user_location,
            gps_coords=payload.gps_coords
        )
        return ChatMessageResponse(**result)
    except Exception as e:
        logger.error(f"Error executing chat for project {project_id}: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Chatbot service error: {str(e)}"
        )


@router.get("/chat/status", response_model=ChatStatusResponse)
def get_chat_status():
    """
    Returns the server-side configuration status of AI providers.
    """
    return ChatStatusResponse(
        gemini_configured=bool(settings.GEMINI_API_KEY),
        openai_configured=bool(settings.OPENAI_API_KEY),
        supported_providers=["gemini", "openai", "deterministic-grounded"],
        default_provider="gemini"
    )
