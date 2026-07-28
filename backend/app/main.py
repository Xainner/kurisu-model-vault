
import os
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, Depends, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.config import settings
from app.database import init_db, get_connection, dict_from_row
from app.auth import hash_password, verify_password, create_token, get_current_user, security
from app.schemas import (LoginRequest, ChangePasswordRequest, DownloadRequest,
                          SearchRequest, HFTokenRequest, VerifyRequest)
from app import hf as hf_module

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(name)s] %(levelname)s: %(message)s")
logger = logging.getLogger("kurisu")

os.makedirs(settings.MODEL_DIR, exist_ok=True)

@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    logger.info(f"Kurisu Model Vault started — models dir: {settings.MODEL_DIR}")
    yield
    logger.info("Kurisu Model Vault shutting down")

app = FastAPI(title="Kurisu Model Vault", version="1.0.0", lifespan=lifespan)

app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True,
                   allow_methods=["*"], allow_headers=["*"])


# ── Auth ──

@app.post("/api/login")
async def login(req: LoginRequest):
    with get_connection() as conn:
        row = conn.execute("SELECT * FROM users WHERE username = ?", (req.username,)).fetchone()
    if not row or not verify_password(req.password, dict_from_row(row)["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    user = dict_from_row(row)
    return {
        "access_token": create_token(user["username"]),
        "token_type": "bearer",
        "must_change_password": bool(user["must_change_password"]),
        "username": user["username"],
    }

@app.post("/api/change-password")
async def change_password(req: ChangePasswordRequest, user=Depends(get_current_user)):
    if not verify_password(req.old_password, user["password_hash"]):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    with get_connection() as conn:
        conn.execute("UPDATE users SET password_hash = ?, must_change_password = FALSE WHERE id = ?",
                      (hash_password(req.new_password), user["id"]))
    return {"success": True}

@app.get("/api/me")
async def me(user=Depends(get_current_user)):
    return {"username": user["username"], "must_change_password": bool(user["must_change_password"])}


# ── HF Token ──

@app.get("/api/hf-token/check")
async def check_hf_token(_=Depends(get_current_user)):
    token = await hf_module.get_hf_token()
    return {"has_token": bool(token)}

@app.post("/api/hf-token")
async def set_hf_token(req: HFTokenRequest, _=Depends(get_current_user)):
    await hf_module.set_hf_token(req.token)
    return {"success": True}


# ── Search ──

@app.post("/api/search")
async def search(req: SearchRequest, _=Depends(get_current_user)):
    results = await hf_module.search_models(req.query, req.limit, req.sort, req.direction)
    return {"results": results, "count": len(results)}


# ── Downloads ──

@app.post("/api/download")
async def start_download(req: DownloadRequest, _=Depends(get_current_user)):
    active = await hf_module.get_active_downloads()
    for d in active:
        if d["model_name"] == req.model_id and d["status"] == "downloading":
            raise HTTPException(status_code=409, detail="Already downloading")
    token = req.token or await hf_module.get_hf_token()
    result = await hf_module.download_model(req.model_id, token)
    if not result["success"]:
        raise HTTPException(status_code=500, detail=result.get("error", "Download failed"))
    return result

@app.get("/api/downloads/active")
async def active_downloads(_=Depends(get_current_user)):
    return await hf_module.get_active_downloads()

@app.get("/api/downloads/history")
async def download_history(_=Depends(get_current_user)):
    return await hf_module.get_download_history()


# ── Models ──

@app.get("/api/models")
async def list_models(_=Depends(get_current_user)):
    return await hf_module.list_local_models()

@app.delete("/api/models/{model_name:path}")
async def delete_model(model_name: str, _=Depends(get_current_user)):
    return await hf_module.delete_model(model_name)

@app.post("/api/models/verify")
async def verify_model(req: VerifyRequest, _=Depends(get_current_user)):
    return await hf_module.verify_model(req.model_name)


# ── System ──

@app.get("/api/system/stats")
async def system_stats(_=Depends(get_current_user)):
    return await hf_module.get_disk_stats()


# ── WebSocket ──

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    hf_module.register_ws(websocket)
    try:
        while True:
            await websocket.receive_text()
    except (WebSocketDisconnect, Exception):
        hf_module.unregister_ws(websocket)


# ── Serve frontend ──

frontend_dist = "/app/frontend/dist"
if os.path.isdir(frontend_dist):
    app.mount("/", StaticFiles(directory=frontend_dist, html=True), name="frontend")
