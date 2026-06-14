"""数据导入导出路由。"""

import json
from datetime import datetime, timezone
from io import StringIO

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

import models
from database import get_db
from models import ListenStatus
from schemas import (
    ExportData,
    ImportMode,
    ImportResponse,
    PodcastExport,
)

router = APIRouter(prefix="/api/data", tags=["数据导入导出"])


def _serialize_podcast_for_export(podcast: models.Podcast) -> dict:
    """将播客及其关联数据序列化为导出格式。"""
    return {
        "name": podcast.name,
        "platform": podcast.platform,
        "theme": podcast.theme,
        "rating": podcast.rating,
        "notes": podcast.notes,
        "subscribe_url": podcast.subscribe_url,
        "is_favorited": podcast.is_favorited,
        "episodes": [
            {
                "title": ep.title,
                "recommendation": ep.recommendation,
                "duration": ep.duration,
                "listen_status": ep.listen_status.value if ep.listen_status else "未收听",
            }
            for ep in podcast.episodes
        ],
        "listening_notes": [
            {
                "content": note.content,
                "created_at": note.created_at.isoformat() if isinstance(note.created_at, datetime)
                else str(note.created_at),
            }
            for note in podcast.listening_notes
        ],
    }


@router.get("/export")
def export_all_data(db: Session = Depends(get_db)):
    """导出全部播客及其下属单集为结构化 JSON 文件。"""
    podcasts = db.query(models.Podcast).order_by(models.Podcast.id).all()

    export_data = ExportData(
        version="1.0",
        exported_at=datetime.now(timezone.utc).isoformat(),
        podcasts=[
            PodcastExport(**_serialize_podcast_for_export(podcast))
            for podcast in podcasts
        ],
    )

    json_str = json.dumps(export_data.model_dump(), ensure_ascii=False, indent=2)
    
    filename = f"podcast_export_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
    
    return StreamingResponse(
        iter([json_str]),
        media_type="application/json",
        headers={
            "Content-Disposition": f"attachment; filename={filename}"
        }
    )


def _validate_import_data(data: dict) -> tuple[bool, str]:
    """校验导入数据格式是否正确。"""
    if not isinstance(data, dict):
        return False, "数据格式错误：根节点必须是对象"
    
    if "version" not in data:
        return False, "缺少必填字段：version"
    
    if "podcasts" not in data or not isinstance(data["podcasts"], list):
        return False, "缺少必填字段：podcasts 必须是数组"
    
    for idx, podcast_data in enumerate(data["podcasts"]):
        if not isinstance(podcast_data, dict):
            return False, f"第 {idx + 1} 条播客数据格式错误"
        
        for field in ["name", "platform", "theme", "rating"]:
            if field not in podcast_data:
                return False, f"第 {idx + 1} 条播客缺少必填字段：{field}"
        
        if not isinstance(podcast_data["name"], str) or len(podcast_data["name"]) == 0 or len(podcast_data["name"]) > 200:
            return False, f"第 {idx + 1} 条播客 name 字段无效"
        
        if not isinstance(podcast_data["platform"], str) or len(podcast_data["platform"]) == 0 or len(podcast_data["platform"]) > 100:
            return False, f"第 {idx + 1} 条播客 platform 字段无效"
        
        if not isinstance(podcast_data["theme"], str) or len(podcast_data["theme"]) == 0 or len(podcast_data["theme"]) > 200:
            return False, f"第 {idx + 1} 条播客 theme 字段无效"
        
        if not isinstance(podcast_data["rating"], (int, float)) or podcast_data["rating"] < 0 or podcast_data["rating"] > 10:
            return False, f"第 {idx + 1} 条播客 rating 字段必须在 0-10 之间"
        
        if "episodes" in podcast_data:
            if not isinstance(podcast_data["episodes"], list):
                return False, f"第 {idx + 1} 条播客 episodes 必须是数组"
            
            for ep_idx, ep_data in enumerate(podcast_data["episodes"]):
                if not isinstance(ep_data, dict):
                    return False, f"第 {idx + 1} 条播客第 {ep_idx + 1} 条单集数据格式错误"
                
                if "title" not in ep_data or not isinstance(ep_data["title"], str) or len(ep_data["title"]) == 0 or len(ep_data["title"]) > 300:
                    return False, f"第 {idx + 1} 条播客第 {ep_idx + 1} 条单集 title 字段无效"
                
                if "listen_status" in ep_data and ep_data["listen_status"] not in ["未收听", "已收听"]:
                    return False, f"第 {idx + 1} 条播客第 {ep_idx + 1} 条单集 listen_status 字段无效"
        
        if "listening_notes" in podcast_data:
            if not isinstance(podcast_data["listening_notes"], list):
                return False, f"第 {idx + 1} 条播客 listening_notes 必须是数组"
            
            for note_idx, note_data in enumerate(podcast_data["listening_notes"]):
                if not isinstance(note_data, dict):
                    return False, f"第 {idx + 1} 条播客第 {note_idx + 1} 条听感笔记数据格式错误"
                
                if "content" not in note_data or not isinstance(note_data["content"], str) or len(note_data["content"]) == 0:
                    return False, f"第 {idx + 1} 条播客第 {note_idx + 1} 条听感笔记 content 字段无效"
    
    return True, "数据格式校验通过"


@router.post("/import", response_model=ImportResponse)
def import_data(
    file: UploadFile = File(...),
    mode: ImportMode = Form(...),
    db: Session = Depends(get_db)):
    """从上传的结构化数据文件批量导入播客数据。"""
    if file.filename and not file.filename.endswith(".json"):
        raise HTTPException(status_code=400, detail="仅支持 JSON 格式文件")
    
    try:
        contents = file.file.read()
        data = json.loads(contents.decode("utf-8"))
    except json.JSONDecodeError as e:
        raise HTTPException(status_code=400, detail=f"JSON 解析失败：{str(e)}")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"文件读取失败：{str(e)}")
    
    is_valid, error_msg = _validate_import_data(data)
    if not is_valid:
        raise HTTPException(status_code=400, detail=error_msg)
    
    imported_podcasts = 0
    imported_episodes = 0
    imported_notes = 0
    
    try:
        if mode == ImportMode.OVERWRITE:
            db.query(models.ListeningNote).delete()
            db.query(models.Episode).delete()
            db.query(models.Podcast).delete()
            db.commit()
        
        for podcast_data in data["podcasts"]:
            podcast = models.Podcast(
                name=podcast_data["name"],
                platform=podcast_data["platform"],
                theme=podcast_data["theme"],
                rating=float(podcast_data["rating"]),
                notes=podcast_data.get("notes"),
                subscribe_url=podcast_data.get("subscribe_url"),
                is_favorited=podcast_data.get("is_favorited", False),
            )
            db.add(podcast)
            db.flush()
            
            imported_podcasts += 1
            
            for ep_data in podcast_data.get("episodes", []):
                listen_status = ep_data.get("listen_status", "未收听")
                episode = models.Episode(
                    podcast_id=podcast.id,
                    title=ep_data["title"],
                    recommendation=ep_data.get("recommendation"),
                    duration=ep_data.get("duration"),
                    listen_status=ListenStatus.LISTENED if listen_status == "已收听" else ListenStatus.UNLISTENED,
                )
                db.add(episode)
                imported_episodes += 1
            
            for note_data in podcast_data.get("listening_notes", []):
                note = models.ListeningNote(
                    podcast_id=podcast.id,
                    content=note_data["content"],
                )
                if "created_at" in note_data and note_data["created_at"]:
                    try:
                        note.created_at = datetime.fromisoformat(note_data["created_at"].replace("Z", "+00:00"))
                    except (ValueError, TypeError):
                        pass
                db.add(note)
                imported_notes += 1
        
        db.commit()
        
        mode_text = "覆盖" if mode == ImportMode.OVERWRITE else "追加"
        
        return ImportResponse(
            success=True,
            message=f"数据{mode_text}导入成功",
            imported_podcasts=imported_podcasts,
            imported_episodes=imported_episodes,
            imported_notes=imported_notes,
        )
    
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"导入失败：{str(e)}")
