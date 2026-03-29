from db.client import supabase

def register(sio):

    @sio.event
    async def location_check(sid, data):
        result = supabase.rpc("check_player_at_location", {
            "player_lat": data["lat"],
            "player_lng": data["lng"],
            "location_id": data["location_id"],
        }).execute()

        geo = result.data

        if geo["arrived"]:
            location = supabase.table("locations")\
                .select("*")\
                .eq("id", data["location_id"])\
                .maybe_single().execute()

            if not location or not location.data:
                await sio.emit("error", {"message": "Location not found"}, to=sid)
                return

            questions = supabase.table("questions")\
                .select("id, body, options")\
                .eq("location_id", data["location_id"])\
                .execute()

            await sio.emit("location_reached", {
                "location": location.data,
                "questions": questions.data,
            }, to=sid)

        else:
            await sio.emit("location_too_far", {
                "distance": geo["distance"],
                "message": f"You're {geo['distance']}m away, keep walking!",
            }, to=sid)

    @sio.event
    async def quiz_answer(sid, data):
        questions = supabase.table("questions")\
            .select("correct_answer")\
            .eq("location_id", data["location_id"])\
            .execute()

        if not questions.data:
            await sio.emit("error", {"message": "No questions found"}, to=sid)
            return

        # Prevent double scoring
        existing = supabase.table("player_visits").select("id")\
            .eq("player_id", data["user_id"])\
            .eq("location_id", data["location_id"])\
            .execute()

        if existing.data:
            await sio.emit("error", {"message": "Already scored this location"}, to=sid)
            return

        def normalize(answer: str) -> str:
            # Handles "Option A" → "A", or already "A" → "A"
            answer = answer.strip()
            if answer.lower().startswith("option "):
                return answer.split()[-1].upper()
            return answer.upper()

        correct = sum(
            1 for q, a in zip(questions.data, data["answers"])
            if a is not None and normalize(q["correct_answer"]) == normalize(a)
        )
        accuracy = correct / len(questions.data)

        location = supabase.table("locations")\
            .select("point_value")\
            .eq("id", data["location_id"])\
            .maybe_single().execute()

        if not location or not location.data:
            await sio.emit("error", {"message": "Location not found"}, to=sid)
            return

        points_earned = round(location.data["point_value"] * accuracy)

        supabase.rpc("increment_score", {
            "game_id": data["game_id"],
            "player_id": data["user_id"],
            "amount": points_earned,
        }).execute()

        # Record the visit so they can't score this location again
        supabase.table("player_visits").insert({
            "player_id": data["user_id"],
            "location_id": data["location_id"],
        }).execute()

        breakdown = [
            {
                "question": q.get("body", ""),
                "correct_answer": normalize(q["correct_answer"]),
                "submitted_answer": normalize(a) if a is not None else None,
                "is_correct": a is not None and normalize(q["correct_answer"]) == normalize(a),
            }
            for q, a in zip(questions.data, data["answers"])
        ]

        passed = correct == len(questions.data)

        await sio.emit("quiz_result", {
            "correct": correct,
            "total": len(questions.data),
            "points_earned": points_earned,
            "passed": passed,
            "breakdown": breakdown,
        }, to=sid)