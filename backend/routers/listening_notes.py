from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

import models
from database import get_db
from schemas import (
    ListeningNoteCreate,
    ListeningNoteResponse,
    ListeningNoteUpdate,
)

router = APIRouter(tags=["听感笔记"])


@router.get(
    "/api/podcasts/{podcast_id}/listening-notes",
    response_model=list[ListeningNoteResponse],
)
def list_listening_notes(
    podcast_id: int,
    db: Session = Depends(get_db),
):
    podcast = db.query(models.Podcast).filter(models.Podcast.id == podcast_id).first()
    if not podcast:
        raise HTTPException(status_code=404, detail="播客不存在")
    query = (
        db.query(models.ListeningNote)
        .filter(models.ListeningNote.podcast_id == podcast_id)
        .order_by(models.ListeningNote.id.desc())
    )
    return query.all()


@router.post(
    "/api/podcasts/{podcast_id}/listening-notes",
    response_model=ListeningNoteResponse,
    status_code=201,
)
def create_listening_note(
    podcast_id: int,
    payload: ListeningNoteCreate,
    db: Session = Depends(get_db),
):
    podcast = db.query(models.Podcast).filter(models.Podcast.id == podcast_id).first()
    if not podcast:
        raise HTTPException(status_code=404, detail="播客不存在")

    note = models.ListeningNote(podcast_id=podcast_id, **payload.model_dump())
    db.add(note)
    db.commit()
    db.refresh(note)
    return note


@router.put(
    "/api/listening-notes/{note_id}",
    response_model=ListeningNoteResponse,
)
def update_listening_note(
    note_id: int,
    payload: ListeningNoteUpdate,
    db: Session = Depends(get_db),
):
    note = (
        db.query(models.ListeningNote)
        .filter(models.ListeningNote.id == note_id)
        .first()
    )
    if not note:
        raise HTTPException(status_code=404, detail="听感笔记不存在")

    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(note, key, value)

    db.commit()
    db.refresh(note)
    return note


@router.delete("/api/listening-notes/{note_id}", status_code=204)
def delete_listening_note(note_id: int, db: Session = Depends(get_db)):
    note = (
        db.query(models.ListeningNote)
        .filter(models.ListeningNote.id == note_id)
        .first()
    )
    if not note:
        raise HTTPException(status_code=404, detail="听感笔记不存在")
    db.delete(note)
    db.commit()
