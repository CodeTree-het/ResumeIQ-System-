import spacy

from fastapi import FastAPI

from fastapi.middleware.cors import CORSMiddleware

from backend.database.mongodb import check_mongodb_connection

from backend.routes.auth_routes import router as auth_router
from backend.routes.candidate_routes import router as candidate_router
from backend.routes.recruiter_routes import router as recruiter_router
from backend.routes.admin_routes import router as admin_router
from backend.routes.resume_routes import router as resume_router
from backend.routes.chatbot_routes import router as chatbot_router


app = FastAPI(
    title="ResumeIQ API",
    description="AI-Powered Resume Intelligence, Job Matching & Skill Development System",
    version="1.0.0",
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://127.0.0.1:5500",
        "http://localhost:5500",
        "http://127.0.0.1:8000",
        "http://localhost:8000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# =========================================================
# ROUTERS
# =========================================================

app.include_router(auth_router)
app.include_router(candidate_router)
app.include_router(recruiter_router)
app.include_router(admin_router)
app.include_router(resume_router)
app.include_router(chatbot_router)


# =========================================================
# ROOT
# =========================================================

@app.get("/")
async def root():
    return {
        "message": "ResumeIQ API is running"
    }


# =========================================================
# HEALTH CHECK
# =========================================================

@app.get("/health")
async def health_check():

    mongodb_connected = await check_mongodb_connection()

    return {
        "status": "healthy" if mongodb_connected else "degraded",
        "mongodb": "connected" if mongodb_connected else "disconnected",
    }
