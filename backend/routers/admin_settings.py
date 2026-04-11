from fastapi import APIRouter, Depends
from pydantic import BaseModel
from db.client import supabase
from utils.auth import require_admin

router = APIRouter(prefix="/admin/settings", tags=["admin-settings"])


class SettingUpdate(BaseModel):
    value: str


@router.get("")
async def list_settings(admin=Depends(require_admin)):
    result = supabase.table("settings").select("*").execute()
    return {"settings": result.data}


@router.put("/{key}")
async def update_setting(key: str, body: SettingUpdate, admin=Depends(require_admin)):
    result = supabase.table("settings").update({
        "value": body.value,
    }).eq("key", key).execute()
    return {"setting": result.data[0] if result.data else None}
