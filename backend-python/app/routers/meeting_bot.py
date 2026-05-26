import os
from typing import Optional

import httpx
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, HttpUrl

router = APIRouter()


class AvatarProfile(BaseModel):
    name: str = "ARIA"
    gender: str = "female"
    style: str = "gold"
    personality: str = "friendly"
    voice_name: Optional[str] = None


class MeetingBotJoinRequest(BaseModel):
    meeting_url: HttpUrl
    bot_name: str = "MEZOMAI AI"
    entry_message: Optional[str] = None
    avatar: Optional[AvatarProfile] = None


@router.post("/join")
async def join_meeting_bot(req: MeetingBotJoinRequest):
    bot_api_url = os.getenv("MEETING_BOT_API_URL", "").strip().rstrip("/")
    bot_api_key = os.getenv("MEETING_BOT_API_KEY", "").strip()

    if not bot_api_url:
        return {
            "configured": False,
            "provider": "mezomai-selfhosted",
            "status": "missing_bot_api_url",
            "message": "MEETING_BOT_API_URL is not configured. Deploy meeting-bot-service and add its API URL.",
        }

    headers = {"Content-Type": "application/json"}
    if bot_api_key:
        headers["Authorization"] = f"Bearer {bot_api_key}"

    payload = {
        "meeting_url": str(req.meeting_url),
        "bot_name": req.bot_name,
        "entry_message": req.entry_message or "MEZOMAI AI joined to capture notes and action items.",
        "avatar": (req.avatar or AvatarProfile(name=req.bot_name)).model_dump(),
    }

    try:
        async with httpx.AsyncClient(timeout=30) as client:
            response = await client.post(f"{bot_api_url}/bots/join", headers=headers, json=payload)
    except httpx.RequestError as exc:
        raise HTTPException(status_code=502, detail=f"Meeting bot service request failed: {exc}") from exc

    if response.status_code >= 400:
        details = response.text
        if response.status_code == 404 and "Not Found" in details:
            return {
                "configured": True,
                "provider": "mezomai-selfhosted",
                "status": "failed",
                "message": "Meeting bot URL is reachable, but /bots/join was not found. Set MEETING_BOT_API_URL to the deployed meeting-bot-service root, not the frontend app URL or Python API URL.",
                "details": details,
            }
        return {
            "configured": True,
            "provider": "mezomai-selfhosted",
            "status": "failed",
            "message": "Meeting bot service rejected the join request.",
            "details": details,
        }

    data = response.json()
    return {
        "configured": True,
        "provider": "mezomai-selfhosted",
        "status": data.get("status", "joining"),
        "bot_id": data.get("bot_id"),
        "data": data,
    }


@router.get("/providers")
async def meeting_bot_providers():
    return {
        "active_provider": "mezomai-selfhosted",
        "bot_api_configured": bool(os.getenv("MEETING_BOT_API_URL")),
        "auth_enabled": bool(os.getenv("MEETING_BOT_API_KEY")),
    }
