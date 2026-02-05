import os
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from dotenv import load_dotenv

from database.connection import init_db
from database.models import Base
from routers import conversations, messages, audio, search, summary
from websocket.manager import manager
from services.translation import SUPPORTED_LANGUAGES

load_dotenv()


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield


app = FastAPI(
    title="Healthcare Translation API",
    description="Real-time doctor-patient translation system",
    version="1.0.0",
    lifespan=lifespan
)

allowed_origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000,http://localhost:3001").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(conversations.router)
app.include_router(messages.router)
app.include_router(audio.router)
app.include_router(search.router)
app.include_router(summary.router)


@app.get("/")
async def root():
    return {
        "message": "Healthcare Translation API",
        "version": "1.0.0",
        "status": "running"
    }


@app.get("/languages")
async def get_languages():
    return SUPPORTED_LANGUAGES


@app.websocket("/ws/{conversation_id}")
async def websocket_endpoint(websocket: WebSocket, conversation_id: str):
    await manager.connect(websocket, conversation_id)
    try:
        while True:
            data = await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket, conversation_id)
    except Exception:
        manager.disconnect(websocket, conversation_id)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
