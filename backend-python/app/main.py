import os
import sys
from dotenv import load_dotenv
load_dotenv()

# Add current and parent directories to sys.path to resolve import path issues on Vercel
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)
if current_dir not in sys.path:
    sys.path.insert(0, current_dir)
if parent_dir not in sys.path:
    sys.path.insert(0, parent_dir)

import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from mangum import Mangum

from app.routers import ai, code_run, chat_ws, meeting_ws, meeting_bot

app = FastAPI(
    title="MEZOMAI AI Services Backend",
    description="Python FastAPI backend serving Websockets, AI, and Sandboxed Code Execution.",
    version="1.0.0"
)

# Allow ALL origins — safe because auth uses Bearer tokens, not cookies.
# This fixes CORS for any Vercel preview URL or local dev environment.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(ai.router, prefix="/ai", tags=["AI Core"])
app.include_router(meeting_bot.router, prefix="/ai/meeting-bot", tags=["Meeting Bot"])
app.include_router(code_run.router, prefix="/code", tags=["Sandbox Code Execution"])
app.include_router(chat_ws.router, prefix="/ws/chat", tags=["WebSockets Chat"])
app.include_router(meeting_ws.router, prefix="/ws/meeting", tags=["WebSockets Meetings"])

# ASGI handler for Vercel Serverless / AWS Lambda
handler = Mangum(app)

@app.get("/")
async def root():
    return {
        "status": "online",
        "service": "MEZOMAI AI Engine",
        "version": "1.0.0"
    }

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=os.getenv("APP_ENV") != "production")

