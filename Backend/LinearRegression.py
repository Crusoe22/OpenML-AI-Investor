import yfinance as yf
import pandas as pd
import numpy as np

from sklearn.linear_model import LinearRegression, Ridge, Lasso, ElasticNet
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_squared_error, r2_score

# =============================
# DATA LOADING
# =============================

def load_data(ticker, start, end):
    df = yf.download(ticker, start=start, end=end)
    df = df.dropna()
    return df


# =============================
# FEATURE ENGINEERING
# =============================

def build_features(df, feature_set):
    df = df.copy()

    if "returns" in feature_set:
        df["return_1"] = df["Close"].pct_change()

    if "momentum" in feature_set:
        df["momentum_5"] = df["Close"] - df["Close"].shift(5)

    if "volatility" in feature_set:
        df["volatility_5"] = df["Close"].pct_change().rolling(5).std()

    if "volume" in feature_set:
        df["volume_change"] = df["Volume"].pct_change()

    # Target: next-day return
    y = df["Close"].pct_change().shift(-1)
    X = df.drop(columns=["Close"])

    # Ensure y is a Series and drop NaNs jointly
    y = y.squeeze()
    y.name = "target"

    combined = pd.concat([X, y], axis=1).dropna()

    X = combined.drop(columns=["target"])
    y = combined["target"]

    return X, y





# =============================
# MODEL FACTORY
# =============================

def get_model(model_name):
    models = {
        "linear": LinearRegression(),
        "ridge": Ridge(alpha=1.0),
        "lasso": Lasso(alpha=0.001),
        "elastic": ElasticNet(alpha=0.001, l1_ratio=0.5)
    }

    if model_name not in models:
        raise ValueError("Invalid model choice")

    return models[model_name]


# =============================
# TRAIN & EVALUATE
# =============================

def train_and_evaluate(X, y, model):
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, shuffle=False
    )

    model.fit(X_train, y_train)
    preds = model.predict(X_test)

    return {
        "mse": mean_squared_error(y_test, preds),
        "r2": r2_score(y_test, preds),
        "last_prediction": preds[-1]
    }


# =============================
# TERMINAL UI
# =============================

def run_terminal():
    print("\n=== QuantifyML Stock Predictor ===\n")

    ticker = input("Ticker (default AAPL): ") or "AAPL"
    model_choice = input("Model (linear/ridge/lasso/elastic): ") or "ridge"

    print("\nSelect features (comma separated):")
    print("returns, momentum, volatility, volume")
    feature_input = input("Features: ") or "returns,momentum,volatility"

    features = [f.strip() for f in feature_input.split(",")]

    df = load_data(ticker, "2020-01-01", "2025-12-16")
    X, y = build_features(df, features)
    model = get_model(model_choice)

    results = train_and_evaluate(X, y, model)

    print("\n=== Results ===")
    print(f"Model: {model_choice}")
    print(f"Features: {features}")
    print(f"MSE: {results['mse']:.6f}")
    print(f"R²: {results['r2']:.4f}")
    print(f"Next-day return prediction: {results['last_prediction']:.5f}")


if __name__ == "__main__":
    run_terminal()
