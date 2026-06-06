from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from app.services.claude_service import ClaudeService
import json

router = APIRouter()

@router.websocket("/")
async def chat_websocket(websocket: WebSocket):
    await websocket.accept()
    
    try:
        while True:
            # Expecting JSON message input: 
            # { "system_prompt": "...", "messages": [...], "model": "...", "api_key": "..." }
            data = await websocket.receive_text()
            payload = json.loads(data)
            
            system_prompt = payload.get("system_prompt", "You are a helpful assistant.")
            messages = payload.get("messages", [])
            model = payload.get("model", "claude-3-5-sonnet-20241022")
            api_key = payload.get("api_key")
            
            if not messages:
                await websocket.send_text(json.dumps({"error": "No message history provided"}))
                continue

            try:
                service = ClaudeService(api_key)
                # Stream responses back token by token
                async for token in service.generate_stream(system_prompt, messages, model, api_key):
                    await websocket.send_text(json.dumps({
                        "type": "token",
                        "token": token
                    }))

                # Signal completion
                await websocket.send_text(json.dumps({"type": "done"}))

            except ValueError as e:
                # Missing API key or bad config — tell client clearly
                await websocket.send_text(json.dumps({
                    "type": "error",
                    "message": str(e)
                }))
            except Exception as e:
                await websocket.send_text(json.dumps({
                    "type": "error",
                    "message": f"LLM error: {str(e)}"
                }))
                
    except WebSocketDisconnect:
        # Client closed connection cleanly
        pass
    except Exception as e:
        try:
            await websocket.send_text(json.dumps({"type": "error", "message": str(e)}))
        except:
            pass
