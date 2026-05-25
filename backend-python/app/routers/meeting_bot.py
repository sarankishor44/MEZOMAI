import os
from typing import Optional

import httpx
from fastapi import APIRouter
from pydantic import BaseModel, HttpUrl

router = APIRouter()


class MeetingBotJoinRequest(BaseModel):
    meeting_url: HttpUrl
    bot_name: str = "MEZOMAI AI"
    entry_message: Optional[str] = None


@router.post("/join")
async def join_meeting_bot(req: MeetingBotJoinRequest):
    provider = os.getenv("MEETING_BOT_PROVIDER", "meetingbaas").lower()

    if provider != "meetingbaas":
        return {
            "configured": False,
            "provider": provider,
            "status": "unsupported_provider",
            "message": "Set MEETING_BOT_PROVIDER=meetingbaas or add a provider adapter.",
        }

    api_key = os.getenv("MEETINGBAAS_API_KEY")
    if not api_key:
        return {
            "configured": False,
            "provider": "meetingbaas",
            "status": "missing_api_key",
            "message": "MEETINGBAAS_API_KEY is not configured, so MEZOMAI can only run as an in-app companion.",
        }

    payload = {
        "meeting_url": str(req.meeting_url),
        "bot_name": req.bot_name,
        "recording_mode": "speaker_view",
        "entry_message": req.entry_message or "MEZOMAI AI has joined to help capture notes and action items.",
        "reserved": False,
        "speech_to_text": {
            "provider": "Default",
        },
        "automatic_leave": {
            "waiting_room_timeout": 600,
        },
    }

    async with httpx.AsyncClient(timeout=20) as client:
        response = await client.post(
            "https://api.meetingbaas.com/bots",
            headers={
                "Content-Type": "application/json",
                "x-meeting-baas-api-key": api_key,
            },
            json=payload,
        )

    if response.status_code >= 400:
        return {
            "configured": True,
            "provider": "meetingbaas",
            "status": "failed",
            "message": "Meeting bot provider rejected the join request.",
            "details": response.text,
        }

    data = response.json()
    return {
        "configured": True,
        "provider": "meetingbaas",
        "status": "joining",
        "bot_id": data.get("bot_id") or data.get("id"),
        "data": data,
    }
