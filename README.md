<div align="center">
  <img src="logo.png" alt="Kurisu Model Vault" width="512" />
  <p align="center">
    <em>AI Model backup & management system — search, download, verify, and manage models from HuggingFace with a single professional interface.</em>
  </p>

  <p align="center">
    <a href="https://github.com/Xainner/kurisu-model-vault/stargazers">
      <img src="https://img.shields.io/github/stars/Xainner/kurisu-model-vault?style=for-the-badge&logo=github&color=8B1A1A" alt="Stars" />
    </a>
    <a href="https://github.com/Xainner/kurisu-model-vault/network/members">
      <img src="https://img.shields.io/github/forks/Xainner/kurisu-model-vault?style=for-the-badge&logo=github&color=4ECDC4" alt="Forks" />
    </a>
    <a href="https://github.com/Xainner/kurisu-model-vault/issues">
      <img src="https://img.shields.io/github/issues/Xainner/kurisu-model-vault?style=for-the-badge&color=F5F0E6" alt="Issues" />
    </a>
    <img src="https://img.shields.io/badge/docker-ready-2496ED?style=for-the-badge&logo=docker" alt="Docker" />
    <img src="https://img.shields.io/badge/python-3.10-3776AB?style=for-the-badge&logo=python" alt="Python" />
    <img src="https://img.shields.io/badge/react-18.3-61DAFB?style=for-the-badge&logo=react" alt="React" />
    <a href="LICENSE">
      <img src="https://img.shields.io/badge/license-MIT-F5F0E6?style=for-the-badge" alt="License" />
    </a>
  </p>
</div>

---

## 🤔 The Problem

Managing AI models across servers is a pain. You have models scattered in random directories, no central view of what's downloaded, no integrity checks, and downloading from HuggingFace means juggling CLI commands, tokens, and progress tracking manually. When you have multiple GPUs, multiple servers, and terabytes of models, you need a proper system — not a shell script.

## 💡 What Kurisu Model Vault Does

**Kurisu Model Vault** is a self-hosted web application that gives you a single, beautiful interface to:

- 🔍 **Search** the entire HuggingFace Hub directly from your dashboard
- ⬇️ **Download** models with real-time progress tracking via WebSocket
- ✅ **Verify** model integrity with SHA-256 hash checks against the original repo
- 📦 **Manage** your local model library — list, inspect, and delete with one click
- 💾 **Monitor** disk usage across your storage mounts with visual indicators
- 🔐 **Secure** access with JWT authentication and forced password change on first login
- ⚡ **CLI** for headless operations — search, download, verify from the terminal

## 🚀 How It Solves It

| Pain Point | Kurisu's Solution |
|---|---|
| Models scattered across directories | Centralized view of all models in `/mnt/cloud1/modelos` (configurable) |
| No idea what's downloaded | Dashboard with model list, sizes, file counts, and download dates |
| Corrupted downloads go unnoticed | SHA-256 integrity verification against HuggingFace repo manifests |
| Manual HF CLI + token juggling | Built-in HF token management, one-click download from search results |
| No progress visibility | Real-time WebSocket updates during downloads |
| No access control | JWT auth, password enforcement, session management |
| Hard to automate | Full CLI (`kurisu search`, `download`, `verify`, `stats`) |

## 🛠️ Tech Stack

```
┌─────────────────────────────────────────────────────┐
│  Frontend (React + Vite + Tailwind + Framer Motion) │
│  ── Dark mode · Animations · Responsive · Real-time │
├─────────────────────────────────────────────────────┤
│  Backend (FastAPI + Python 3.10 + SQLite)           │
│  ── JWT Auth · WebSocket · HuggingFace Hub SDK      │
├─────────────────────────────────────────────────────┤
│  Docker Compose (2 containers: backend + nginx)     │
│  ── Zero-config deploy · Hot-reload ready           │
└─────────────────────────────────────────────────────┘
```

## 📦 Quick Start

```bash
# 1. Clone and configure
git clone https://github.com/Xainner/kurisu-model-vault.git
cd kurisu-model-vault
cp .env.example .env
# Edit .env — at minimum set your HF_TOKEN

# 2. Deploy
docker compose up -d --build

# 3. Open http://your-server:17012
#    Default login: admin / admin (you'll be forced to change it)
```

## 🔧 CLI Usage

```bash
# Search models
docker exec kurisu-backend cli search llama

# Download a model
docker exec kurisu-backend cli download meta-llama/Llama-3.1-8B

# List local models
docker exec kurisu-backend cli list

# Verify integrity
docker exec kurisu-backend cli verify meta-llama/Llama-3.1-8B

# Disk stats
docker exec kurisu-backend cli stats

# Manage HF token
docker exec kurisu-backend cli token set hf_...
docker exec kurisu-backend cli token get
```

## ⚙️ Configuration

| Variable | Default | Description |
|---|---|---|
| `APP_PORT` | `17012` | Public port for the web interface |
| `BACKEND_PORT` | `8000` | Internal backend port |
| `MODEL_DIR` | `/mnt/cloud1/modelos` | Where models are stored on disk |
| `HF_TOKEN` | *(empty)* | HuggingFace access token |
| `JWT_SECRET` | *(random)* | Secret key for JWT sessions |

## 🖥️ Screenshots

<div align="center">
  <p><em>Login · Dashboard · Model Search · Downloads · Settings</em></p>
  <p>Dark theme with burgundy/cyan accent colors, glass morphism cards, smooth Framer Motion transitions, and real-time WebSocket updates.</p>
</div>

## 📄 License

MIT — do whatever you want with it.

<div align="center">
  <img src="logo.png" alt="Kurisu" width="64" />
  <p><em>Built with ❤️ for the AI community</em></p>
</div>