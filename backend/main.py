import socketio
from fastapi import FastAPI
from db.client import supabase

sio = socketio.AsyncServer(async_mode='asgi', cors_allowed_origins='*')
app = FastAPI()
socket_app = socketio.ASGIApp(sio, app)

@app.get("/health")
async def health():
    games = supabase.table("games").select("id").limit(1).execute()
    return {"status": "ok", "tables_reachable": True}

@sio.event
async def connect(sid, environ):
    print(f"[socket] connected: {sid}")