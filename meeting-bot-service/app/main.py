import os
from contextlib import asynccontextmanager

from fastapi import BackgroundTasks, Depends, FastAPI, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from .bot_runner import SESSIONS, create_session, run_bot, stop_browser
from .models import JoinBotRequest


def require_api_key(authorization: str | None = Header(default=None)):
    expected = os.getenv("MEETING_BOT_API_KEY", "").strip()
    if not expected:
        return True
    if authorization != f"Bearer {expected}":
        raise HTTPException(status_code=401, detail="Invalid meeting bot API key.")
    return True


@asynccontextmanager
async def lifespan(app: FastAPI):
    yield
    await stop_browser()


app = FastAPI(
    title="MEZOMAI Meeting Bot Service",
    description="Self-hosted browser bot that joins Google Meet, Zoom, Teams, Jitsi, Whereby, and generic meeting links.",
    version="1.0.0",
    lifespan=lifespan,
)

allowed_origins = [
    origin.strip()
    for origin in os.getenv("ALLOWED_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173").split(",")
    if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health():
    return {
        "status": "online",
        "service": "mezomai-meeting-bot",
        "active_sessions": len(SESSIONS),
    }


@app.post("/bots/join")
async def join_bot(
    req: JoinBotRequest,
    background_tasks: BackgroundTasks,
    _: bool = Depends(require_api_key),
):
    session = create_session(req)
    background_tasks.add_task(run_bot, session.bot_id, req)
    return session.model_dump()


@app.get("/bots/{bot_id}")
async def get_bot(bot_id: str, _: bool = Depends(require_api_key)):
    session = SESSIONS.get(bot_id)
    if not session:
        raise HTTPException(status_code=404, detail="Bot session not found.")
    return session.model_dump()


@app.get("/bots")
async def list_bots(_: bool = Depends(require_api_key)):
    return [session.model_dump() for session in SESSIONS.values()]
