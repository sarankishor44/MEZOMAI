import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import ai, code_run, chat_ws, meeting_ws

app = FastAPI(
    title="MEZOMAI AI Services Backend",
    description="Python FastAPI backend serving Websockets, AI, and Sandboxed Code Execution.",
    version="1.0.0"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust in production to frontend domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(ai.router, prefix="/ai", tags=["AI Core"])
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
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
