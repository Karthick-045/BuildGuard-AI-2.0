from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field

class ChatHistoryItem(BaseModel):
    role: str = Field(..., description="Role: 'user' or 'assistant'/'model'")
    content: str = Field(..., description="Message text")

class ChatMessageRequest(BaseModel):
    message: str = Field(..., min_length=1, description="User's query or inspection instruction")
    api_key: Optional[str] = Field(None, description="Optional user-provided Gemini or OpenAI API key")
    provider: Optional[str] = Field("gemini", description="AI Provider ('gemini' or 'openai')")
    history: Optional[List[Dict[str, str]]] = Field(default=[], description="Recent conversation turns")
    user_location: Optional[str] = Field(None, description="Optional detected user room or starting location")
    gps_coords: Optional[Dict[str, float]] = Field(None, description="Optional device GPS coordinates {latitude, longitude}")

class ChatMessageResponse(BaseModel):
    success: bool = True
    reply: str
    provider_used: str
    has_api_key: bool = False
    context_summary: Optional[Dict[str, Any]] = None

class ChatStatusResponse(BaseModel):
    gemini_configured: bool
    openai_configured: bool
    supported_providers: List[str]
    default_provider: str
