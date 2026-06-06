from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from app.services.claude_service import ClaudeService
import json
import asyncio
import os

router = APIRouter()

# Active connections: { room_id: set[WebSocket] }
active_rooms: dict[str, set] = {}

# Per-room conversation history (last 20 turns to manage token cost)
room_history: dict[str, list[dict]] = {}

MEETING_SYSTEM_PROMPT = (
    "You are ARIA, an intelligent AI participant in a live meeting. "
    "You listen to everything said and respond naturally and helpfully. "
    "Keep responses concise — 1 to 3 sentences maximum. "
    "You take notes, answer questions, and summarize action items when asked. "
    "Be professional, warm, and useful."
)


@router.websocket("/{room_id}")
async def meeting_websocket(websocket: WebSocket, room_id: str):
    await websocket.accept()

    if room_id not in active_rooms:
        active_rooms[room_id] = set()
        room_history[room_id] = []
    active_rooms[room_id].add(websocket)

    try:
        while True:
            data = await websocket.receive_text()
            payload = json.loads(data)
            msg_type = payload.get("type")

            if msg_type == "join":
                await broadcast_to_room(room_id, {
                    "type": "user_joined",
                    "user": payload.get("user", "Anonymous Participant"),
                    "message": "joined the room"
                }, exclude=websocket)

            elif msg_type == "signal":
                await broadcast_to_room(room_id, {
                    "type": "signal",
                    "sender": payload.get("sender"),
                    "signal_data": payload.get("signal_data")
                }, exclude=websocket)

            elif msg_type == "transcript":
                text = payload.get("text", "").strip()
                speaker = payload.get("speaker", "Participant")
                api_key = payload.get("api_key") or os.getenv("ANTHROPIC_API_KEY")
                provider = payload.get("provider", "anthropic")

                if not text:
                    continue

                # Broadcast the human's words to the room
                await broadcast_to_room(room_id, {
                    "type": "transcript_line",
                    "speaker": "user",
                    "name": speaker,
                    "text": text
                })

                # Append to history and cap at 20 turns
                room_history[room_id].append({"role": "user", "content": f"{speaker}: {text}"})
                if len(room_history[room_id]) > 20:
                    room_history[room_id] = room_history[room_id][-20:]

                # Get real AI response asynchronously — non-blocking
                asyncio.create_task(ai_respond(room_id, api_key, provider))

    except WebSocketDisconnect:
        active_rooms[room_id].discard(websocket)
        if not active_rooms[room_id]:
            del active_rooms[room_id]
            room_history.pop(room_id, None)
    except Exception:
        active_rooms[room_id].discard(websocket)


async def ai_respond(room_id: str, api_key: str, provider: str = "anthropic"):
    """Get a real AI response and broadcast it to the room."""
    await broadcast_to_room(room_id, {"type": "bot_status", "status": "thinking"})

    try:
        service = ClaudeService(api_key)
        history = room_history.get(room_id, [])
        last_message = history[-1]["content"] if history else "Hello"

        response = await service.generate_completion(
            system_prompt=MEETING_SYSTEM_PROMPT,
            prompt=last_message,
            model=None,
            api_key=api_key,
            provider=provider,
        )

        # Append AI reply to room history
        if room_id in room_history:
            room_history[room_id].append({"role": "assistant", "content": response})

        await broadcast_to_room(room_id, {"type": "bot_status", "status": "talking"})
        await broadcast_to_room(room_id, {
            "type": "transcript_line",
            "speaker": "bot",
            "name": "ARIA (AI)",
            "text": response
        })

    except Exception as e:
        await broadcast_to_room(room_id, {
            "type": "transcript_line",
            "speaker": "bot",
            "name": "ARIA (AI)",
            "text": f"[AI error: {str(e)}]"
        })
    finally:
        await broadcast_to_room(room_id, {"type": "bot_status", "status": "idle"})


async def broadcast_to_room(room_id: str, message: dict, exclude: WebSocket = None):
    if room_id not in active_rooms:
        return
    dead: set = set()
    for ws in active_rooms[room_id]:
        if ws is exclude:
            continue
        try:
            await ws.send_text(json.dumps(message))
        except Exception:
            dead.add(ws)
    active_rooms[room_id] -= dead
