from db.client import supabase

def register(sio):

    @sio.event
    async def party_join(sid, data):
        # data = { "code": "ABC123", "name": "Satvik" }
        code = data["code"]

        # Check game exists and is still in lobby
        game = supabase.table("games").select("*").eq("code", code).single().execute()
        if not game.data:
            await sio.emit("error", {"message": "Game not found"}, to=sid)
            return
        if game.data["status"] != "lobby":
            await sio.emit("error", {"message": "Game already started"}, to=sid)
            return

        # Create player
        user = supabase.table("users").insert({
            "name": data["name"],
            "leader": False,
        }).execute()

        # Link to game
        supabase.table("user_game").insert({
            "game_id": game.data["id"],
            "user_id": user.data[0]["id"],
        }).execute()

        # Initialize their score row
        supabase.table("score").insert({
            "user_id": user.data[0]["id"],
            "game_id": game.data["id"],
            "score": 0,
        }).execute()

        # Join the socket room for this game
        await sio.enter_room(sid, code)

        # Tell everyone in the lobby a new player joined
        players = supabase.table("user_game")\
            .select("users(id, name, leader)")\
            .eq("game_id", game.data["id"])\
            .execute()

        await sio.emit("lobby_updated", {
            "players": players.data
        }, room=code)

        # Confirm to the joining player
        await sio.emit("join_confirmed", {
            "user_id": user.data[0]["id"],
            "game_id": game.data["id"],
            "code": code,
        }, to=sid)

    @sio.event
    async def disconnect(sid):
        print(f"[socket] disconnected: {sid}")