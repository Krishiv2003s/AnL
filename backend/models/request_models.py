from pydantic import BaseModel
from typing import List, Dict, Any, Optional

class AnalysisRequest(BaseModel):
    data: List[Dict[str, Any]]
    analysis_type: str  # e.g., "growth", "retention", "costs"
    model_name: str     # e.g., "arima", "prophet", "kmeans"
    parameters: Optional[Dict[str, Any]] = {}
    target_column: str
    date_column: Optional[str] = None

class AIRecommendRequest(BaseModel):
    selected_goal: str
    columns: List[str]
    rows: int

class AIExplainRequest(BaseModel):
    model_output: Any
