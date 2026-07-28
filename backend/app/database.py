import os
import sqlite3
from contextlib import contextmanager
from app.config import settings

def init_db():
    os.makedirs(settings.data_dir, exist_ok=True)
    with get_connection() as conn:
        conn.executescript("""
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                must_change_password BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            CREATE TABLE IF NOT EXISTS models (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT UNIQUE NOT NULL,
                local_path TEXT NOT NULL,
                size_bytes BIGINT DEFAULT 0,
                downloaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                source TEXT DEFAULT 'huggingface',
                status TEXT DEFAULT 'completed',
                sha256_hash TEXT,
                files_count INTEGER DEFAULT 0
            );
            CREATE TABLE IF NOT EXISTS downloads (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                model_name TEXT NOT NULL,
                status TEXT DEFAULT 'pending',
                progress REAL DEFAULT 0,
                speed TEXT,
                eta TEXT,
                current_file TEXT,
                total_files INTEGER DEFAULT 0,
                completed_files INTEGER DEFAULT 0,
                error TEXT,
                started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                completed_at TIMESTAMP
            );
            CREATE TABLE IF NOT EXISTS settings_kv (
                key TEXT PRIMARY KEY,
                value TEXT
            );
        """)
        from app.auth import hash_password
        existing = conn.execute(
            "SELECT id FROM users WHERE username = ?", (settings.DEFAULT_USER,)
        ).fetchone()
        if not existing:
            conn.execute(
                "INSERT INTO users (username, password_hash, must_change_password) VALUES (?, ?, TRUE)",
                (settings.DEFAULT_USER, hash_password(settings.DEFAULT_PASS))
            )
        conn.commit()

@contextmanager
def get_connection():
    conn = sqlite3.connect(settings.DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    try:
        yield conn
        conn.commit()
    finally:
        conn.close()

def dict_from_row(row):
    if row is None:
        return None
    return dict(row)
