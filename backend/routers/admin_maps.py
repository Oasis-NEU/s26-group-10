from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from db.client import supabase
from utils.auth import require_admin

router = APIRouter(prefix="/admin/maps", tags=["admin-maps"])


class LocationBody(BaseModel):
    name: str
    info: str = ""
    point_value: int = 100
    lat: float
    lng: float


@router.get("")
async def list_maps(admin=Depends(require_admin)):
    maps = supabase.table("map_location").select("map_id").execute()
    map_ids = list({row["map_id"] for row in maps.data})
    return {"maps": map_ids}


@router.get("/{map_id}/locations")
async def list_locations(map_id: str, admin=Depends(require_admin)):
    rows = supabase.table("map_location")\
        .select("locations(*)")\
        .eq("map_id", map_id)\
        .execute()
    locations = [row["locations"] for row in rows.data if row.get("locations")]
    return {"locations": locations}


@router.post("/{map_id}/locations")
async def create_location(map_id: str, body: LocationBody, admin=Depends(require_admin)):
    location = supabase.table("locations").insert({
        "name": body.name,
        "info": body.info,
        "point_value": body.point_value,
        "coords": f"POINT({body.lng} {body.lat})",
    }).execute()

    if not location.data:
        raise HTTPException(status_code=500, detail="Failed to create location")

    loc_id = location.data[0]["id"]
    supabase.table("map_location").insert({
        "map_id": map_id,
        "location_id": loc_id,
    }).execute()

    return location.data[0]


@router.put("/locations/{location_id}")
async def update_location(location_id: str, body: LocationBody, admin=Depends(require_admin)):
    result = supabase.table("locations").update({
        "name": body.name,
        "info": body.info,
        "point_value": body.point_value,
        "coords": f"POINT({body.lng} {body.lat})",
    }).eq("id", location_id).execute()

    if not result.data:
        raise HTTPException(status_code=404, detail="Location not found")
    return result.data[0]


@router.delete("/locations/{location_id}")
async def delete_location(location_id: str, admin=Depends(require_admin)):
    supabase.table("map_location").delete().eq("location_id", location_id).execute()
    supabase.table("questions").delete().eq("location_id", location_id).execute()
    supabase.table("locations").delete().eq("id", location_id).execute()
    return {"ok": True}
