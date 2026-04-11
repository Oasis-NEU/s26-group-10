from fastapi import APIRouter, Depends
from db.client import supabase
from utils.auth import require_admin

router = APIRouter(prefix="/admin/analytics", tags=["admin-analytics"])


@router.get("/summary")
async def summary(admin=Depends(require_admin)):
    games = supabase.table("games").select("id, status").execute()
    users = supabase.table("users").select("id").execute()
    scores = supabase.table("score").select("score").execute()

    total_games = len(games.data)
    active_games = sum(1 for g in games.data if g["status"] == "active")
    total_users = len(users.data)
    all_scores = [s["score"] for s in scores.data]
    avg_score = round(sum(all_scores) / len(all_scores), 1) if all_scores else 0

    return {
        "total_games": total_games,
        "active_games": active_games,
        "total_users": total_users,
        "average_score": avg_score,
    }


@router.get("/leaderboard")
async def global_leaderboard(admin=Depends(require_admin)):
    scores = supabase.table("score")\
        .select("score, users(id, name)")\
        .order("score", desc=True)\
        .limit(50)\
        .execute()
    return {"leaderboard": scores.data}
