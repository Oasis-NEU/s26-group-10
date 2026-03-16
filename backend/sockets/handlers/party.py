from db.client import supabase

def register(sio):

    @sio.event
    async def party_join(sid, data):
        code = data["code"]

        game = supabase.table("games").select("*").eq("code", code).maybe_single().execute()
        if not game or not game.data:
            await sio.emit("error", {"message": "Game not found"}, to=sid)
            return
        if game.data["status"] != "lobby":
            await sio.emit("error", {"message": "Game already started"}, to=sid)
            return

        # If user_id is provided (host), skip creating a new user
        existing_user_id = data.get("user_id")

        if existing_user_id:
            user_id = existing_user_id
        else:
            # Create new player
            user = supabase.table("users").insert({
                "name": data["name"],
                "leader": False,
            }).execute()
            user_id = user.data[0]["id"]

            # Link to game
            supabase.table("user_game").insert({
                "game_id": game.data["id"],
                "user_id": user_id,
            }).execute()

            # Initialize score row
            supabase.table("score").insert({
                "user_id": user_id,
                "game_id": game.data["id"],
                "score": 0,
            }).execute()

        await sio.enter_room(sid, code)

        players = supabase.table("user_game")\
            .select("users(id, name, leader)")\
            .eq("game_id", game.data["id"])\
            .execute()

        await sio.emit("lobby_updated", {"players": players.data}, room=code)

        await sio.emit("join_confirmed", {
            "user_id": user_id,
            "game_id": game.data["id"],
            "code": code,
        }, to=sid)

    @sio.event
    async def disconnect(sid):
        print(f"[socket] disconnected: {sid}")