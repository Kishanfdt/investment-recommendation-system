from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import profile, prediction, screener, mutual_funds, portfolio, monitoring

app = FastAPI(title="AI Investment Recommendation API")

app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"http://localhost:\d+",  # any localhost port, for local dev
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(profile.router)
app.include_router(prediction.router)
app.include_router(screener.router)
app.include_router(mutual_funds.router)
app.include_router(portfolio.router)
app.include_router(monitoring.router)


@app.get("/")
def health_check():
    return {"status": "ok", "message": "AI Investment Recommendation API is running"}