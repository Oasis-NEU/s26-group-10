from fastapi import Header, HTTPException
from db.client import supabase


async def require_admin(x_admin_user_id: str = Header(...)):
    user = supabase.table("users").select("id, role").eq("id", x_admin_user_id).maybe_single().execute()
    if not user.data or user.data.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return user.data
