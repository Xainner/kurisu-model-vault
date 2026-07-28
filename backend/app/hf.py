
import os
import asyncio
import hashlib
import json
import logging
import shutil
from typing import Optional, List

from huggingface_hub import HfApi, snapshot_download
from huggingface_hub.utils import RepositoryNotFoundError

from app.config import settings
from app.database import get_connection, dict_from_row

logger = logging.getLogger("kurisu.hf")

_ws_clients = set()

def register_ws(client):
    _ws_clients.add(client)

def unregister_ws(client):
    _ws_clients.discard(client)

async def broadcast(msg: dict):
    dead = set()
    for client in _ws_clients:
        try:
            await client.send(json.dumps(msg))
        except Exception:
            dead.add(client)
    for c in dead:
        unregister_ws(c)
    _ws_clients -= dead


async def search_models(query: str, limit: int = 20, sort: str = "downloads", direction: int = -1) -> List[dict]:
    loop = asyncio.get_event_loop()
    api = HfApi()
    try:
        results = await loop.run_in_executor(
            None,
            lambda: list(api.list_models(search=query, sort=sort, direction=direction, limit=limit)),
        )
        return [
            {
                "id": m.id, "author": m.author, "tags": m.tags or [],
                "downloads": m.downloads, "likes": m.likes,
                "lastModified": str(m.lastModified) if m.lastModified else None,
                "pipeline_tag": m.pipeline_tag,
            }
            for m in results
        ]
    except Exception as e:
        logger.error(f"Search failed: {e}")
        return []


async def download_model(model_id: str, token: Optional[str] = None, progress_cb=None) -> dict:
    token = token or settings.HF_TOKEN
    loop = asyncio.get_event_loop()

    with get_connection() as conn:
        conn.execute("INSERT INTO downloads (model_name, status) VALUES (?, 'downloading')", (model_id,))
        download_id = conn.lastrowid

    def _do_download():
        local_dir = os.path.join(settings.MODEL_DIR, model_id.replace("/", "__"))
        try:
            result = snapshot_download(
                repo_id=model_id, local_dir=local_dir,
                token=token if token else None,
                local_dir_use_symlinks=False,
            )
            return result
        except RepositoryNotFoundError:
            raise ValueError(f"Model '{model_id}' not found on HuggingFace (or requires auth)")
        except Exception as e:
            raise ValueError(str(e))

    try:
        await loop.run_in_executor(None, _do_download)

        local_dir = os.path.join(settings.MODEL_DIR, model_id.replace("/", "__"))
        total_size = 0
        file_count = 0
        sha256 = hashlib.sha256()
        for root, dirs, files in os.walk(local_dir):
            for f in files:
                fp = os.path.join(root, f)
                try:
                    sz = os.path.getsize(fp)
                    total_size += sz
                    file_count += 1
                    with open(fp, "rb") as fh:
                        for chunk in iter(lambda: fh.read(8192), b""):
                            sha256.update(chunk)
                except OSError:
                    pass

        model_hash = sha256.hexdigest()[:16]

        with get_connection() as conn:
            conn.execute(
                """INSERT INTO models (name, local_path, size_bytes, sha256_hash, files_count, status)
                   VALUES (?, ?, ?, ?, ?, 'completed')
                   ON CONFLICT(name) DO UPDATE SET
                       size_bytes=excluded.size_bytes, sha256_hash=excluded.sha256_hash,
                       files_count=excluded.files_count, status='completed',
                       downloaded_at=CURRENT_TIMESTAMP""",
                (model_id, local_dir, total_size, model_hash, file_count),
            )
            conn.execute("UPDATE downloads SET status='completed', completed_at=CURRENT_TIMESTAMP WHERE id=?", (download_id,))

        await broadcast({
            "type": "download_complete", "download_id": download_id,
            "model_name": model_id, "local_path": local_dir,
            "size_bytes": total_size, "files_count": file_count,
        })

        return {"success": True, "model_name": model_id, "local_path": local_dir,
                "size_bytes": total_size, "files_count": file_count}

    except Exception as e:
        error_msg = str(e)
        with get_connection() as conn:
            conn.execute("UPDATE downloads SET status='failed', error=? WHERE id=?", (error_msg, download_id))
        await broadcast({"type": "download_error", "download_id": download_id,
                         "model_name": model_id, "error": error_msg})
        return {"success": False, "model_name": model_id, "error": error_msg}


async def list_local_models() -> List[dict]:
    with get_connection() as conn:
        rows = conn.execute("SELECT * FROM models ORDER BY downloaded_at DESC").fetchall()
        models = [dict_from_row(r) for r in rows]

    if os.path.isdir(settings.MODEL_DIR):
        for entry in os.scandir(settings.MODEL_DIR):
            if entry.is_dir():
                name = entry.name.replace("__", "/")
                if not any(m["name"] == name for m in models):
                    total_size = 0
                    file_count = 0
                    for root, dirs, files in os.walk(entry.path):
                        for f in files:
                            try:
                                total_size += os.path.getsize(os.path.join(root, f))
                                file_count += 1
                            except OSError:
                                pass
                    models.append({
                        "id": None, "name": name, "local_path": entry.path,
                        "size_bytes": total_size, "downloaded_at": None,
                        "source": "local", "status": "completed",
                        "sha256_hash": None, "files_count": file_count,
                    })
    return models


async def get_active_downloads() -> List[dict]:
    with get_connection() as conn:
        rows = conn.execute(
            "SELECT * FROM downloads WHERE status IN ('pending', 'downloading') ORDER BY started_at DESC"
        ).fetchall()
        return [dict_from_row(r) for r in rows]


async def get_download_history(limit: int = 50) -> List[dict]:
    with get_connection() as conn:
        rows = conn.execute("SELECT * FROM downloads ORDER BY started_at DESC LIMIT ?", (limit,)).fetchall()
        return [dict_from_row(r) for r in rows]


async def delete_model(model_name: str) -> dict:
    local_path = None
    with get_connection() as conn:
        row = conn.execute("SELECT local_path FROM models WHERE name = ?", (model_name,)).fetchone()
        if row:
            local_path = dict_from_row(row)["local_path"]
    if local_path and os.path.isdir(local_path):
        shutil.rmtree(local_path, ignore_errors=True)
    with get_connection() as conn:
        conn.execute("DELETE FROM models WHERE name = ?", (model_name,))
    return {"success": True, "model_name": model_name}


async def verify_model(model_name: str) -> dict:
    local_path = None
    stored_hash = None
    with get_connection() as conn:
        row = conn.execute("SELECT local_path, sha256_hash FROM models WHERE name = ?", (model_name,)).fetchone()
        if row:
            d = dict_from_row(row)
            local_path = d["local_path"]
            stored_hash = d["sha256_hash"]

    if not local_path or not os.path.isdir(local_path):
        alt_path = os.path.join(settings.MODEL_DIR, model_name.replace("/", "__"))
        if os.path.isdir(alt_path):
            local_path = alt_path
        else:
            return {"valid": False, "error": f"Model directory not found: {model_name}"}

    sha256 = hashlib.sha256()
    total_size = 0
    file_count = 0
    missing_files = []
    for root, dirs, files in os.walk(local_path):
        for f in files:
            fp = os.path.join(root, f)
            try:
                sz = os.path.getsize(fp)
                total_size += sz
                file_count += 1
                with open(fp, "rb") as fh:
                    for chunk in iter(lambda: fh.read(65536), b""):
                        sha256.update(chunk)
            except OSError as e:
                missing_files.append(f"{f}: {e}")

    current_hash = sha256.hexdigest()[:16]
    hash_match = not stored_hash or stored_hash == current_hash

    hf_files = []
    try:
        api = HfApi()
        hf_files = api.list_repo_files(model_name, token=settings.HF_TOKEN or None)
    except Exception:
        pass

    local_files = set()
    for root, dirs, files in os.walk(local_path):
        for f in files:
            local_files.add(os.path.relpath(os.path.join(root, f), local_path))

    missing_from_disk = set(hf_files) - local_files if hf_files else set()

    return {
        "valid": hash_match and not missing_files and not missing_from_disk,
        "model_name": model_name, "local_path": local_path,
        "size_bytes": total_size, "files_count": file_count,
        "hash_match": hash_match, "stored_hash": stored_hash, "current_hash": current_hash,
        "missing_files": missing_files,
        "missing_from_disk": list(missing_from_disk)[:50],
        "hf_files_count": len(hf_files), "local_files_count": len(local_files),
    }


async def get_disk_stats() -> dict:
    stats = {}
    for mount_point in [settings.MODEL_DIR, "/"]:
        try:
            st = shutil.disk_usage(mount_point)
            stats[mount_point] = {
                "total": st.total, "used": st.used, "free": st.free,
                "percent": round((st.used / st.total) * 100, 1) if st.total else 0,
            }
        except (OSError, TypeError):
            pass

    total_models_size = 0
    total_models_count = 0
    with get_connection() as conn:
        row = conn.execute("SELECT COALESCE(SUM(size_bytes), 0) as total, COUNT(*) as cnt FROM models").fetchone()
        if row:
            d = dict_from_row(row)
            total_models_size = d["total"]
            total_models_count = d["cnt"]

    return {"disk": stats, "models_total_size": total_models_size, "models_count": total_models_count}


async def get_setting(key: str) -> Optional[str]:
    with get_connection() as conn:
        row = conn.execute("SELECT value FROM settings_kv WHERE key = ?", (key,)).fetchone()
        return dict_from_row(row)["value"] if row else None

async def set_setting(key: str, value: str):
    with get_connection() as conn:
        conn.execute("INSERT OR REPLACE INTO settings_kv (key, value) VALUES (?, ?)", (key, value))

async def get_hf_token() -> Optional[str]:
    db_token = await get_setting("hf_token")
    return db_token or (settings.HF_TOKEN if settings.HF_TOKEN else None)

async def set_hf_token(token: str):
    await set_setting("hf_token", token)
