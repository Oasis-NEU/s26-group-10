import asyncio
from db.client import supabase

active_timers = {}  # game_code -> asyncio.Task

def register(sio):

    @sio.event
    async def game_start(sid, data):
        # data = { "code": "QB26F3", "user_id": "..." }
        code = data["code"]

        # Verify the requester is the host
        game = supabase.table("games")\
            .select("*")\
            .eq("code", code)\
            .single().execute()

        if not game.data:
            await sio.emit("error", {"message": "Game not found"}, to=sid)
            return

        user = supabase.table("users")\
            .select("leader")\
            .eq("id", data["user_id"])\
            .single().execute()

        if not user.data or not user.data["leader"]:
            await sio.emit("error", {"message": "Only the host can start the game"}, to=sid)
            return

        # Update game status
        supabase.table("games").update({
            "status": "active",
            "started_at": "now()",
        }).eq("code", code).execute()

        # Fetch locations for this map
        locations = supabase.table("map_location")\
            .select("locations(*)")\
            .eq("map_id", game.data["map_id"])\
            .execute()

        await sio.emit("game_started", {
            "locations": [row["locations"] for row in locations.data],
            "timer_seconds": game.data["timer_seconds"],
        }, room=code)

        # Start the countdown
        task = asyncio.create_task(run_timer(code, game.data["timer_seconds"], sio))
        active_timers[code] = task

    async def run_timer(code, seconds, sio):
        for remaining in range(seconds, -1, -1):
            await sio.emit("timer_tick", {"seconds_remaining": remaining}, room=code)
            if remaining == 0:
                await end_game(code, sio)
                return
            await asyncio.sleep(1)

    async def end_game(code, sio):
        supabase.table("games").update({
            "status": "ended",
            "is_over": True,
        }).eq("code", code).execute()

        game = supabase.table("games")\
            .select("id")\
            .eq("code", code)\
            .single().execute()

        # Get final scores ordered by score desc
        scores = supabase.table("score")\
            .select("score, users(id, name)")\
            .eq("game_id", game.data["id"])\
            .order("score", desc=True)\
            .execute()

        leaderboard = [
            {
                "name": row["users"]["name"],
                "user_id": row["users"]["id"],
                "score": row["score"],
            }
            for row in scores.data
        ]

        # Mark winner
        if leaderboard:
            supabase.table("games").update({
                "winner_id": leaderboard[0]["user_id"]
            }).eq("code", code).execute()

        await sio.emit("game_ended", {"leaderboard": leaderboard}, room=code)
        active_timers.pop(code, None)