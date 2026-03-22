import socketio
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from db.client import supabase
from routers import party as party_router
from sockets.handlers import party as party_handler
from sockets.handlers import game as game_handler
from sockets.handlers import quiz as quiz_handler

sio = socketio.AsyncServer(async_mode='asgi', cors_allowed_origins='*')
app = FastAPI()

# Add this block
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

socket_app = socketio.ASGIApp(sio, app)

app.include_router(party_router.router)

party_handler.register(sio)
game_handler.register(sio)
quiz_handler.register(sio)

@app.get("/health")
async def health():
    games = supabase.table("games").select("id").limit(1).execute()
    return {"status": "ok", "tables_reachable": True}

@sio.event
async def connect(sid, environ):
    print(f"[socket] connected: {sid}")