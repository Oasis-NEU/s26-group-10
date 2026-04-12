from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional
from db.client import supabase
import random, string

router = APIRouter()

def get_setting(key: str, default):
    try:
        row = supabase.table("settings").select("value").eq("key", key).maybe_single().execute()
        if row and row.data:
            return type(default)(row.data["value"])
    except Exception:
        pass
    return default

class CreatePartyRequest(BaseModel):
    host_name: str
    map_id: str
    timer_seconds: Optional[int] = None
    max_players: Optional[int] = None
    start_lat: float
    start_lng: float

@router.post("/party")
async def create_party(body: CreatePartyRequest):
    timer = body.timer_seconds if body.timer_seconds is not None else get_setting("default_timer_seconds", 600)
    max_p = body.max_players if body.max_players is not None else get_setting("max_players_default", 10)
    code = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))

    # Create the game
    game = supabase.table("games").insert({
        "code": code,
        "map_id": body.map_id,
        "timer_seconds": timer,
        "max_players": max_p,
        "start_location": f"POINT({body.start_lng} {body.start_lat})",
        "status": "lobby",
        "is_over": False,
    }).execute()

    # Create the host as a user
    user = supabase.table("users").insert({
        "name": body.host_name,
        "leader": True,
    }).execute()

    # Link host to game
    supabase.table("user_game").insert({
        "game_id": game.data[0]["id"],
        "user_id": user.data[0]["id"],
    }).execute()

    # Initialize score row for host (same as regular players)
    supabase.table("score").insert({
        "user_id": user.data[0]["id"],
        "game_id": game.data[0]["id"],
        "score": 0,
    }).execute()

    return {
        "code": code,
        "game_id": game.data[0]["id"],
        "user_id": user.data[0]["id"],
    }

@router.get("/party/{code}")
async def get_party(code: str):
    game = supabase.table("games").select("*").eq("code", code).single().execute()
    return game.data