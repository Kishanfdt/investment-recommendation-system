from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import profile, prediction

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

from app.routers import profile, prediction, screener

app.include_router(screener.router)
@app.get("/")
def health_check():
    return {"status": "ok", "message": "AI Investment Recommendation API is running"}