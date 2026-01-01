from openai import OpenAI
import os
from dotenv import load_dotenv

load_dotenv()

class AIService:
    def __init__(self):
        self.client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

    async def recommend_model(self, selected_goal, columns, rows):
        prompt = f"""
        You are a business data scientist.
        
        User goal: {selected_goal}
        Dataset columns: {columns}
        Data size: {rows}
        
        Recommend the best statistical or ML models from:
        ARIMA, Moving Average, K-Means, Regression, Logistic, Prophet.
        
        Explain why each model fits.
        """
        response = self.client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[{"role": "user", "content": prompt}]
        )
        return response.choices[0].message.content

    async def explain_results(self, model_output):
        prompt = f"""
        You are a financial analyst.
        
        Explain the following results in simple business language:
        {model_output}
        
        Include:
        - Key trends
        - Risks
        - Actionable insights
        """
        response = self.client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[{"role": "user", "content": prompt}]
        )
        return response.choices[0].message.content
