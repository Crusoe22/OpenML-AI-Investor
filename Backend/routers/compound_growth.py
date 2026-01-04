from fastapi import APIRouter
from pydantic import BaseModel
from typing import List

router = APIRouter(
    prefix="/api",
    tags=["Compound Growth"]
)

# -----------------------------
# Models
# -----------------------------

class CompoundGrowthRequest(BaseModel):
    years: int
    rate: float              # annual %
    principal: float
    contribution: float
    frequency: str           # monthly, quarterly, annually

class GrowthPoint(BaseModel):
    year: float
    value: float

class CompoundGrowthResponse(BaseModel):
    final_value: float
    total_invested: float
    total_gain: float
    growth_data: List[GrowthPoint]

# -----------------------------
# Helpers
# -----------------------------

def get_periods_per_year(freq: str) -> int:
    freq = freq.lower()
    if freq == "monthly":
        return 12
    if freq == "quarterly":
        return 4
    if freq == "annually":
        return 1
    raise ValueError("Invalid contribution frequency")

# -----------------------------
# Endpoint
# -----------------------------

@router.post("/compound-growth", response_model=CompoundGrowthResponse)
def calculate_compound_growth(payload: CompoundGrowthRequest):
    periods_per_year = get_periods_per_year(payload.frequency)

    total_periods = payload.years * periods_per_year
    rate_per_period = (payload.rate / 100) / periods_per_year

    balance = payload.principal
    growth_data = []

    for period in range(1, total_periods + 1):
        balance = balance * (1 + rate_per_period) + payload.contribution

        if period % periods_per_year == 0:
            growth_data.append({
                "year": period // periods_per_year,
                "value": round(balance, 2)
            })

    total_invested = payload.principal + payload.contribution * total_periods

    return {
        "final_value": round(balance, 2),
        "total_invested": round(total_invested, 2),
        "total_gain": round(balance - total_invested, 2),
        "growth_data": growth_data
    }
