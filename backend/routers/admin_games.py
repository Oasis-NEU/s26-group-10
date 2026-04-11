from fastapi import APIRouter, Depends, Request
from db.client import supabase
from utils.auth import require_admin
from sockets.handlers.game import active_timers, end_game

router = APIRouter(prefix="/admin/games", tags=["admin-games"])


@router.get("")
async def list_games(status: str = None, admin=Depends(require_admin)):
    query = supabase.table("games").select("*")
    if status:
        query = query.eq("status", status)
    result = query.execute()

    for game in result.data:
        try:
            players = supabase.table("user_game")\
                .select("id")\
                .eq("game_id", game["id"])\
                .execute()
            game["player_count"] = len(players.data)
        except Exception:
            game["player_count"] = 0

    return {"games": result.data}


@router.post("/cleanup")
async def cleanup_stale_games(admin=Depends(require_admin)):
    for status in ["active", "lobby"]:
        games = supabase.table("games").select("code").eq("status", status).execute()
        for game in games.data:
            code = game["code"]
            if code not in active_timers:
                supabase.table("games").update({
                    "status": "ended",
                    "is_over": True,
                }).eq("code", code).execute()
    return {"ok": True}


@router.get("/{game_id}")
async def get_game(game_id: str, admin=Depends(require_admin)):
    game = supabase.table("games").select("*").eq("id", game_id).maybe_single().execute()
    if not game.data:
        return {"error": "Game not found"}

    user_games = supabase.table("user_game")\
        .select("user_id, users(id, name, leader)")\
        .eq("game_id", game_id)\
        .execute()

    scores = supabase.table("score")\
        .select("user_id, score")\
        .eq("game_id", game_id)\
        .execute()

    score_map = {s["user_id"]: s["score"] for s in scores.data}

    players = []
    for ug in user_games.data:
        user = ug.get("users")
        if not user:
            continue
        players.append({
            "user": user,
            "score": score_map.get(ug["user_id"], 0),
        })

    return {"game": game.data, "players": players}


@router.post("/{game_id}/end")
async def force_end_game(game_id: str, request: Request, admin=Depends(require_admin)):
    game = supabase.table("games").select("code").eq("id", game_id).maybe_single().execute()
    if not game.data:
        return {"error": "Game not found"}

    code = game.data["code"]
    task = active_timers.pop(code, None)
    if task:
        task.cancel()

    sio = request.app.state.sio
    await end_game(code, sio)
    return {"ok": True}


@router.post("/{game_id}/kick/{user_id}")
async def kick_player(game_id: str, user_id: str, request: Request, admin=Depends(require_admin)):
    supabase.table("score").delete().eq("game_id", game_id).eq("user_id", user_id).execute()
    supabase.table("user_game").delete().eq("game_id", game_id).eq("user_id", user_id).execute()

    game = supabase.table("games").select("code").eq("id", game_id).maybe_single().execute()
    if game.data:
        sio = request.app.state.sio
        await sio.emit("player_kicked", {"user_id": user_id}, room=game.data["code"])

    return {"ok": True}
