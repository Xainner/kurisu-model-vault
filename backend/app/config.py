import os

class Settings:
    PORT: int = int(os.getenv("PORT", "8000"))
    MODEL_DIR: str = os.getenv("MODEL_DIR", "/mnt/cloud1/modelos")
    HF_TOKEN: str = os.getenv("HF_TOKEN", "")
    JWT_SECRET: str = os.getenv("JWT_SECRET", "kurisu-vault-secret-change-in-prod")
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRE_HOURS: int = 168
    DEFAULT_USER: str = "admin"
    DEFAULT_PASS: str = "admin"
    DB_PATH: str = os.getenv("DB_PATH", "/app/data/db.sqlite")

    @property
    def data_dir(self) -> str:
        return os.path.dirname(self.DB_PATH)

settings = Settings()
