from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from db.client import supabase
from utils.auth import require_admin

router = APIRouter(prefix="/admin/questions", tags=["admin-questions"])


class QuestionBody(BaseModel):
    body: str
    options: list[str]
    correct_answer: str


@router.get("/location/{location_id}")
async def list_questions(location_id: str, admin=Depends(require_admin)):
    result = supabase.table("questions")\
        .select("*")\
        .eq("location_id", location_id)\
        .execute()
    return {"questions": result.data}


@router.post("/location/{location_id}")
async def create_question(location_id: str, body: QuestionBody, admin=Depends(require_admin)):
    result = supabase.table("questions").insert({
        "location_id": location_id,
        "body": body.body,
        "options": body.options,
        "correct_answer": body.correct_answer,
    }).execute()

    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to create question")
    return result.data[0]


@router.put("/{question_id}")
async def update_question(question_id: str, body: QuestionBody, admin=Depends(require_admin)):
    result = supabase.table("questions").update({
        "body": body.body,
        "options": body.options,
        "correct_answer": body.correct_answer,
    }).eq("id", question_id).execute()

    if not result.data:
        raise HTTPException(status_code=404, detail="Question not found")
    return result.data[0]


@router.delete("/{question_id}")
async def delete_question(question_id: str, admin=Depends(require_admin)):
    supabase.table("questions").delete().eq("id", question_id).execute()
    return {"ok": True}
