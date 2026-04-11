from fastapi import APIRouter, Depends
from db.client import supabase
from utils.auth import require_admin

router = APIRouter(prefix="/admin/users", tags=["admin-users"])


@router.get("")
async def list_users(search: str = None, admin=Depends(require_admin)):
    query = supabase.table("users").select("*")
    if search:
        query = query.ilike("name", f"%{search}%")
    result = query.execute()
    return {"users": result.data}


@router.get("/{user_id}")
async def get_user(user_id: str, admin=Depends(require_admin)):
    user = supabase.table("users").select("*").eq("id", user_id).maybe_single().execute()
    games = supabase.table("user_game")\
        .select("games(id, code, status, is_over)")\
        .eq("user_id", user_id)\
        .execute()
    return {"user": user.data, "games": games.data}


@router.post("/{user_id}/ban")
async def ban_user(user_id: str, admin=Depends(require_admin)):
    supabase.table("users").update({"is_banned": True}).eq("id", user_id).execute()
    return {"ok": True}


@router.post("/{user_id}/unban")
async def unban_user(user_id: str, admin=Depends(require_admin)):
    supabase.table("users").update({"is_banned": False}).eq("id", user_id).execute()
    return {"ok": True}
