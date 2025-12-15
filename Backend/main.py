from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import yfinance as yf
import pandas as pd
import numpy as np

from sklearn.linear_model import LinearRegression
from sklearn.ensemble import RandomForestRegressor

app = FastAPI(title="MarketCalc API")

# ---- CORS (allow frontend to talk to backend) ----
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---- Request Schema ----
class ProjectionRequest(BaseModel):
    ticker: str
    horizon: int
    model: str

# ---- API Endpoint ----
@app.post("/api/price-projection")
def price_projection(req: ProjectionRequest):
    ticker = req.ticker.upper()
    horizon = req.horizon
    model_type = req.model

    # Download historical data
    df = yf.download(ticker, period="1y", progress=False)

    if df.empty:
        return {"error": "Invalid ticker or no data available"}

    prices = df["Close"].dropna()
    X = np.arange(len(prices)).reshape(-1, 1)
    y = prices.values

    # Select model
    if model_type == "rf":
        model = RandomForestRegressor(n_estimators=200, random_state=42)
    else:
        model = LinearRegression()

    model.fit(X, y)

    # Forecast future price
    future_index = np.array([[len(prices) + horizon]])
    projected_price = float(model.predict(future_index)[0])

    current_price = float(prices.iloc[-1])

    # Simple uncertainty band (volatility-based)
    volatility = float(prices.pct_change().std())
    low_price = float(projected_price * (1 - volatility * np.sqrt(horizon)))
    high_price = float(projected_price * (1 + volatility * np.sqrt(horizon)))


    return {
        "ticker": ticker,
        "current_price": round(float(current_price), 2),
        "projected_price": round(float(projected_price), 2),
        "low_price": round(low_price, 2),
        "high_price": round(high_price, 2),
    }


# ---- Health Check ----
@app.get("/health")
def health():
    return {"status": "ok"}
