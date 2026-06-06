from datetime import datetime
from typing import Literal, Optional

from pydantic import BaseModel, Field, HttpUrl


class AvatarProfile(BaseModel):
    name: str = "ARIA"
    gender: str = "female"
    style: str = "gold"
    personality: str = "friendly"
    voice_name: Optional[str] = None


class JoinBotRequest(BaseModel):
    meeting_url: HttpUrl
    bot_name: str = "MEZOMAI AI"
    entry_message: str = "MEZOMAI AI joined to capture notes and action items."
    avatar: AvatarProfile = Field(default_factory=AvatarProfile)
    auto_transcribe: bool = True
    keep_alive_seconds: int = Field(default=5400, ge=60, le=21600)


class BotSession(BaseModel):
    bot_id: str
    meeting_url: str
    platform: str
    bot_name: str
    status: Literal["queued", "joining", "joined", "waiting_room", "failed", "ended"]
    message: str
    created_at: datetime
    updated_at: datetime
    screenshot_path: Optional[str] = None
    last_url: Optional[str] = None
    events: list[str] = Field(default_factory=list)
