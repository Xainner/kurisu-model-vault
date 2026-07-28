# 🧠 Kurisu Model Vault

AI Model backup & management system with a professional web interface. Download, verify, and manage models from HuggingFace with real-time progress tracking.

## Features

- 🔐 **Auth** — Login with default `admin`/`admin`, forced password change on first login
- 🔍 **Search** — Search HuggingFace models directly from the UI
- ⬇️ **Download** — Download models with token authentication
- 📊 **Real-time progress** — WebSocket-based download tracking
- 📦 **Model management** — List, verify integrity, and delete local models
- 💾 **Disk monitoring** — Storage indicators and usage statistics
- 🖥️ **CLI** — Terminal operations for quick tasks
- 🎨 **UI** — Dark mode, animations, responsive design, micro-interactions
- 🐳 **Docker** — Full containerization with docker-compose

## Quick Start

```bash
# Clone and configure
git clone https://github.com/Xainner/kurisu-model-vault.git
cd kurisu-model-vault
cp .env.example .env
# Edit .env with your HF_TOKEN

# Deploy
docker compose up -d --build
```

Access at `http://your-server:17012`

## CLI Usage

```bash
docker exec kurisu-backend cli search llama
docker exec kurisu-backend cli download meta-llama/Llama-3.1-8B
docker exec kurisu-backend cli list
docker exec kurisu-backend cli verify meta-llama/Llama-3.1-8B
docker exec kurisu-backend cli stats
docker exec kurisu-backend cli token set hf_...
```

## Stack

| Layer | Tech |
|-------|------|
| Backend | FastAPI + Python 3.10 |
| Frontend | React + Vite + Tailwind + Framer Motion |
| DB | SQLite |
| Auth | JWT + bcrypt |
| Real-time | WebSocket |
| Deploy | Docker Compose |

## Default Credentials

- **Username:** `admin`
- **Password:** `admin`
- ⚠️ You **must** change the password on first login

## License

MIT