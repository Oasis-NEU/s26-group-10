from fastapi import APIRouter
from pydantic import BaseModel
from db.client import supabase
import random, string

router = APIRouter()

class CreatePartyRequest(BaseModel):
    host_name: str
    map_id: str
    timer_seconds: int = 600
    max_players: int = 10
    start_lat: float
    start_lng: float

@router.post("/party")
async def create_party(body: CreatePartyRequest):
    code = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))

    # Create the game
    game = supabase.table("games").insert({
        "code": code,
        "map_id": body.map_id,
        "timer_seconds": body.timer_seconds,
        "max_players": body.max_players,
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

    return {
        "code": code,
        "game_id": game.data[0]["id"],
        "user_id": user.data[0]["id"],
    }

@router.get("/party/{code}")
async def get_party(code: str):
    game = supabase.table("games").select("*").eq("code", code).single().execute()
    return game.data