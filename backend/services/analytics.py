import pandas as pd
import numpy as np
from sklearn.cluster import KMeans
from sklearn.linear_model import LinearRegression
from statsmodels.tsa.arima.model import ARIMA
try:
    from prophet import Prophet
except ImportError:
    Prophet = None

class AnalyticsService:
    async def run_analysis(self, request):
        df = pd.DataFrame(request.data)
        
        if request.analysis_type == "growth":
            return await self._analyze_growth(df, request)
        elif request.analysis_type == "retention":
            return await self._analyze_retention(df, request)
        elif request.analysis_type == "segmentation":
            return await self._analyze_segmentation(df, request)
        else:
            raise ValueError(f"Unknown analysis type: {request.analysis_type}")

    async def _analyze_growth(self, df, request):
        # Implementation for Growth Forecasting
        if request.date_column:
            df[request.date_column] = pd.to_datetime(df[request.date_column])
            df = df.sort_values(request.date_column)
            
        target = request.target_column
        
        if request.model_name == "moving_average":
            window = request.parameters.get("window", 3)
            df['forecast'] = df[target].rolling(window=window).mean()
            return {
                "results": df[[request.date_column, target, 'forecast']].to_dict(orient='records'),
                "summary": "Moving average forecast calculated."
            }
        
        elif request.model_name == "regression":
            # Simple linear regression on time index
            X = np.arange(len(df)).reshape(-1, 1)
            y = df[target].values
            model = LinearRegression().fit(X, y)
            future_X = np.arange(len(df), len(df) + 12).reshape(-1, 1)
            future_y = model.predict(future_X)
            
            return {
                "results": {
                    "historical": df[[request.date_column, target]].to_dict(orient='records'),
                    "forecast": future_y.tolist()
                },
                "summary": f"Linear regression growth model. Slope: {model.coef_[0]}"
            }
            
        return {"error": "Unsupported model"}

    async def _analyze_segmentation(self, df, request):
        # K-Means segmentation
        cols = request.parameters.get("columns", [request.target_column])
        n_clusters = request.parameters.get("n_clusters", 3)
        
        kmeans = KMeans(n_clusters=n_clusters, n_init='auto')
        df['segment'] = kmeans.fit_predict(df[cols])
        
        return {
            "results": df.to_dict(orient='records'),
            "summary": f"K-Means segmentation completed with {n_clusters} clusters."
        }
