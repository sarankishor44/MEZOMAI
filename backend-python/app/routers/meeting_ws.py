from fastapi import APIRouter, WebSocket, WebSocketDisconnect
import json
import asyncio

router = APIRouter()

# Active connections in rooms
# Format: { room_id: Set[WebSocket] }
active_rooms = {}

@router.websocket("/{room_id}")
async def meeting_websocket(websocket: WebSocket, room_id: str):
    await websocket.accept()
    
    if room_id not in active_rooms:
        active_rooms[room_id] = set()
    active_rooms[room_id].add(websocket)

    try:
        while True:
            data = await websocket.receive_text()
            payload = json.loads(data)
            
            # Types: 
            # 1. "join": user joins meeting room
            # 2. "signal": WebRTC SDP/candidate exchange
            # 3. "transcript": user spoken text to transcribe
            # 4. "bot_speech": Bot speaking response broadcast
            
            msg_type = payload.get("type")
            
            if msg_type == "join":
                # Broadcast join notify to other users in room
                broadcast_payload = {
                    "type": "user_joined",
                    "user": payload.get("user", "Anonymous Participant"),
                    "message": "joined the room"
                }
                await broadcast_to_room(room_id, broadcast_payload, exclude=websocket)
                
            elif msg_type == "signal":
                # WebRTC SDP offer/answer or ICE candidate
                target_payload = {
                    "type": "signal",
                    "sender": payload.get("sender"),
                    "signal_data": payload.get("signal_data")
                }
                await broadcast_to_room(room_id, target_payload, exclude=websocket)
                
            elif msg_type == "transcript":
                # Received live transcript text from a human participant
                text = payload.get("text", "")
                speaker = payload.get("speaker", "User")
                
                # Broadcast the user's spoken words to the meeting room
                await broadcast_to_room(room_id, {
                    "type": "transcript_line",
                    "speaker": "user",
                    "name": speaker,
                    "text": text
                })
                
                # Trigger simulated AI Participant response
                asyncio.create_task(simulate_ai_participant_response(room_id, text))
                
    except WebSocketDisconnect:
        active_rooms[room_id].remove(websocket)
        if not active_rooms[room_id]:
            del active_rooms[room_id]
    except Exception as e:
        pass

async def broadcast_to_room(room_id: str, message: dict, exclude: WebSocket = None):
    if room_id in active_rooms:
        dead_connections = set()
        for ws in active_rooms[room_id]:
            if ws == exclude:
                continue
            try:
                await ws.send_text(json.dumps(message))
            except:
                dead_connections.add(ws)
                
        for dead in dead_connections:
            active_rooms[room_id].remove(dead)

async def simulate_ai_participant_response(room_id: str, trigger_text: str):
    # Wait 2 seconds to simulate thinking
    await asyncio.sleep(2.0)
    
    # Simple semantic router responses to make the demo feel extremely smart and premium
    trigger_lower = trigger_text.lower()
    if "hello" in trigger_lower or "hi" in trigger_lower:
        bot_msg = "Hello everyone! I am ARIA, your AI meeting participant. Ready to take notes, compile action items, or answer technical questions."
    elif "status" in trigger_lower or "project" in trigger_lower:
        bot_msg = "According to our repository logs, the frontend build was successfully compiled and is ready for Vercel deployment. PHP and Python containers are healthy."
    elif "next steps" in trigger_lower or "todo" in trigger_lower:
        bot_msg = "I've recorded the action items. We need to verify theme colors, complete Laravel API middleware testing, and run local integration test suites."
    else:
        bot_msg = f"Got it. I've noted that point about: '{trigger_text}'. I will summarize this in our meeting notes."

    # Broadcast bot thinking indicator
    await broadcast_to_room(room_id, {
        "type": "bot_status",
        "status": "thinking"
    })
    
    await asyncio.sleep(1.5)
    
    # Broadcast bot talking indicator and message
    await broadcast_to_room(room_id, {
        "type": "bot_status",
        "status": "talking"
    })
    
    await broadcast_to_room(room_id, {
        "type": "transcript_line",
        "speaker": "bot",
        "name": "ARIA (AI Bot)",
        "text": bot_msg
    })
    
    await broadcast_to_room(room_id, {
        "type": "bot_status",
        "status": "idle"
    })
