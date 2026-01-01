from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
import io
import json
from services.analytics import AnalyticsService
from services.ai_service import AIService
from models.request_models import AnalysisRequest, AIRecommendRequest, AIExplainRequest

app = FastAPI(title="ClickIT Analytics Engine")

# Enable CORS for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust this in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

analytics_service = AnalyticsService()
ai_service = AIService()

@app.get("/")
async def root():
    return {"message": "ClickIT Business Analytics API is running"}

@app.post("/upload")
async def upload_file(file: UploadFile = File(...), tag: str = Form(...)):
    contents = await file.read()
    df = None
    
    try:
        if file.filename.endswith('.csv'):
            df = pd.read_csv(io.BytesIO(contents))
        elif file.filename.endswith(('.xls', '.xlsx')):
            df = pd.read_excel(io.BytesIO(contents))
        else:
            raise HTTPException(status_code=400, detail="Unsupported file format")
            
        # Basic cleaning
        df = df.where(pd.notnull(df), None)
        
        return {
            "filename": file.filename,
            "tag": tag,
            "columns": df.columns.tolist(),
            "preview": df.head(5).to_dict(orient='records'),
            "row_count": len(df)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/analyze")
async def analyze_data(request: AnalysisRequest):
    try:
        results = await analytics_service.run_analysis(request)
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/ai/recommend")
async def recommend_model(request: AIRecommendRequest):
    try:
        recommendations = await ai_service.recommend_model(
            request.selected_goal, request.columns, request.rows
        )
        return {"recommendations": recommendations}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/ai/explain")
async def explain_results(request: AIExplainRequest):
    try:
        explanation = await ai_service.explain_results(request.model_output)
        return {"explanation": explanation}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
