import os
import re
import uvicorn
from dotenv import load_dotenv
load_dotenv()  # Load .env variables before anything else
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.routers import ai, code_run, chat_ws, meeting_ws, meeting_bot

app = FastAPI(
    title="MEZOMAI AI Services Backend",
    description="Python FastAPI backend serving Websockets, AI, and Sandboxed Code Execution.",
    version="1.0.0"
)

# Parse allowed origins from env var
_env_origins = [
    origin.strip()
    for origin in os.getenv(
        "ALLOWED_ORIGINS",
        "https://mezomai.vercel.app,https://mezomai-oao1.vercel.app,https://mezomaiadmin.vercel.app,https://mezomai-1iyn.vercel.app,http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000"
    ).split(",")
    if origin.strip()
]

# Also allow any *.vercel.app subdomain dynamically (handles preview deploys)
_VERCEL_PATTERN = re.compile(r"^https://[a-zA-Z0-9\-]+\.vercel\.app$")

def _is_allowed_origin(origin: str) -> bool:
    if origin in _env_origins:
        return True
    if _VERCEL_PATTERN.match(origin):
        return True
    return False

# Custom CORS middleware that handles vercel.app wildcards
@app.middleware("http")
async def cors_middleware(request: Request, call_next):
    origin = request.headers.get("origin", "")
    if request.method == "OPTIONS":
        # Preflight
        response = JSONResponse(content={}, status_code=200)
        if _is_allowed_origin(origin):
            response.headers["Access-Control-Allow-Origin"] = origin
            response.headers["Access-Control-Allow-Credentials"] = "true"
            response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS, PATCH"
            response.headers["Access-Control-Allow-Headers"] = "*"
            response.headers["Access-Control-Max-Age"] = "86400"
        return response

    response = await call_next(request)
    if _is_allowed_origin(origin):
        response.headers["Access-Control-Allow-Origin"] = origin
        response.headers["Access-Control-Allow-Credentials"] = "true"
        response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS, PATCH"
        response.headers["Access-Control-Allow-Headers"] = "*"
    return response

# Keep standard CORSMiddleware as fallback for explicit origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=_env_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(ai.router, prefix="/ai", tags=["AI Core"])
app.include_router(meeting_bot.router, prefix="/ai/meeting-bot", tags=["Meeting Bot"])
app.include_router(code_run.router, prefix="/code", tags=["Sandbox Code Execution"])
app.include_router(chat_ws.router, prefix="/ws/chat", tags=["WebSockets Chat"])
app.include_router(meeting_ws.router, prefix="/ws/meeting", tags=["WebSockets Meetings"])

@app.get("/")
async def root():
    return {
        "status": "online",
        "service": "MEZOMAI AI Engine",
        "version": "1.0.0"
    }

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=os.getenv("APP_ENV") != "production")
