from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import yfinance as yf
import pandas as pd
import numpy as np

from sklearn.linear_model import LinearRegression
from sklearn.ensemble import RandomForestRegressor

# Add these imports at the top
from sklearn.metrics import r2_score, mean_absolute_error, mean_squared_error
from sklearn.model_selection import train_test_split
import xgboost as xgb

from routers.compound_growth import router as compound_growth_router


app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register router
app.include_router(compound_growth_router)

# ---- Initialize FastAPI app ----
#app = FastAPI(title="MarketCalc API")

# ---- CORS (allow frontend to talk to backend) ----
# This allows requests from any origin (e.g., frontend running on a different domain/port)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---- Request Schema ----
# This validates the POST request body
class ProjectionRequest(BaseModel):
    ticker: str
    horizon: int
    model: str



# ---- API Endpoint: Price Projection ----
@app.post("/api/price-projection")
def price_projection(req: ProjectionRequest):
    ticker = req.ticker.upper()
    horizon = req.horizon
    model_type = req.model

    # ---- Fetch Historical Stock Data ----
    # Download historical data
    df = yf.download(ticker, period="1y", progress=False)

    # If no data returned, respond with an error
    if df.empty:
        return {"error": "Invalid ticker or no data available"}

    # Prepare the data for modeling
    prices = df["Close"].dropna()
    X = np.arange(len(prices)).reshape(-1, 1)
    y = prices.values

    # Train/test split (time-aware, no shuffle)
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, shuffle=False
    )


    # Select model
    if model_type == "rf":
        # Random Forest model for capturing non-linear trends
        model = RandomForestRegressor(n_estimators=200, random_state=42)
    else:
        # Default to Linear Regression (linear trend)
        model = LinearRegression()



    # Train the model on historical data
    model.fit(X_train, y_train)

    # Predictions on test set
    y_pred = model.predict(X_test) 

    # Evaluation metrics
    r2 = r2_score(y_test, y_pred) 
    mae = mean_absolute_error(y_test, y_pred)
    mse = mean_squared_error(y_test, y_pred)


    # Forecast future price
    future_index = np.array([[len(prices) + horizon]]) # Index for future date
    projected_price = float(model.predict(future_index)[0]) # Model prediction

    # Generate linear trend for historical points (for plotting)
    linear_trend = None
    # Forecast future price indices for linear regression trend
    if model_type != "rf":  
        future_X = np.arange(len(prices) + horizon).reshape(-1, 1)  # include future horizon
        linear_trend = model.predict(future_X).tolist()

    current_price = float(prices.iloc[-1]) # Most recent closing price


    # ---- Estimate Price Range (Uncertainty) ----
    # Calculate historical volatility as standard deviation of daily returns
    # Simple uncertainty band (volatility-based)
    volatility = float(prices.pct_change().std())
    low_price = float(projected_price * (1 - volatility * np.sqrt(horizon)))
    high_price = float(projected_price * (1 + volatility * np.sqrt(horizon)))

    # ---- Return JSON Response ----
    return {
        "ticker": ticker,
        "current_price": round(float(current_price), 2),
        "projected_price": round(float(projected_price), 2),
        "low_price": round(low_price, 2),
        "high_price": round(high_price, 2),
        "r2_score": round(float(r2), 4),  
        "mean_absolute_error": round(float(mae), 2), 
        "mean_squared_error": round(float(mse), 2),  
        "linear_trend": linear_trend  # new field
    }



# Historical stock data endpoint
# Endpoint expects 'period' as query parameter
# Endpoint expects 'period' as query parameter
@app.get("/api/historical")
def historical(ticker: str, period: str):

    try:
        df = yf.download(ticker, period=period, progress=False)
    except Exception as e:
        return {"error": str(e), "dates": [], "prices": []}

    if df.empty:
        return {"error": "No data available for this ticker/period", "dates": [], "prices": []}

    # Handle MultiIndex vs single index
    close = df["Close"]
    if isinstance(close, pd.DataFrame):
        close = close.iloc[:, 0]  # extract Series safely

    return {
        "dates": close.index.strftime("%Y-%m-%d").tolist(),
        "prices": close.astype(float).tolist()
    }







# ---- Health Check ----
# Simple endpoint to verify the API is running
@app.get("/health")
def health():
    return {"status": "ok"}
