# SDLC Brain

## AI-Powered Software Development Lifecycle Assistant

SDLC Brain is an AI Engineering Copilot that transforms a Statement of Work (SOW) into a living software project. It assists engineers throughout planning, architecture, development, testing, code review, deployment, and production support — while keeping humans in control through review, approval, versioning, and persistent project memory.

---

## 🧠 Core Modules

| Module | Description | AI Model |
|:---|:---|:---|
| **Agile Assist** | SOW → Requirements → Epics → Features → Stories | DeepSeek-R1 |
| **Architecture Assist** | System design, APIs, DB schema, Mermaid diagrams | DeepSeek-R1 |
| **Development Assist** | Code generation with repository understanding | Qwen3-Coder |
| **QA Assist** | Test cases, edge cases, automation suggestions | Qwen3-Coder |
| **Knowledge Management** | Search across all project artifacts | Qwen3-Coder |
| **Code Review Assist** | Bug detection, security, code smells | Qwen3-Coder |
| **DevOps Assist** | Dockerfile, CI/CD, release notes | Qwen3-Coder |
| **Production Support** | Log analysis, RCA, suggested fixes | DeepSeek-R1 |

---

## 🔄 Workflow

Every stage follows the Human-in-the-Loop pattern:

```
Generate → Human Review → Feedback → AI Refine → Approve → Continue
```

Nothing is final until approved. Approved artifacts become project memory.

---

## 🛠️ Tech Stack

| Layer | Technology |
|:---|:---|
| Frontend | Next.js 15, React 19, TypeScript, Tailwind CSS, shadcn/ui |
| Backend | Python 3.12, FastAPI, SQLAlchemy 2.0, Alembic |
| AI | LiteLLM, LangGraph, NVIDIA NIM |
| Database | PostgreSQL 16 |
| Deployment | Docker Compose |

---

## 🚀 Quick Start

### Prerequisites
- Node.js 20+
- Python 3.12+
- PostgreSQL 16+ (or Docker)

### Using Docker Compose

```bash
# Clone the repository
git clone <repo-url>
cd SDLC_Brain

# Copy environment config
cp backend/.env.example backend/.env
# Edit backend/.env with your NVIDIA NIM API key

# Start all services
docker compose up -d
```

### Manual Setup

#### Backend

```bash
cd backend
cp .env.example .env
# Edit .env with your configuration

# Create virtual environment
python -m venv venv
source venv/bin/activate  # or venv\Scripts\activate on Windows

# Install dependencies
pip install -e ".[dev]"

# Start the server
uvicorn app.main:app --reload
```

#### Frontend

```bash
cd frontend
npm install
npm run dev
```

### Access

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/api/docs

---

## 📁 Project Structure

```
SDLC_Brain/
├── frontend/              # Next.js 15 application
├── backend/               # FastAPI application
│   ├── app/
│   │   ├── core/          # Config, database, exceptions
│   │   ├── ai/            # AI orchestrator, providers, memory
│   │   ├── modules/       # Feature-based SDLC modules
│   │   ├── repository/    # Local repo understanding
│   │   └── utils/         # Shared utilities
│   ├── workspace/         # Per-project workspaces
│   └── ai_config.yaml     # AI routing configuration
└── docker-compose.yml     # Development environment
```

---

## ⚙️ AI Configuration

The AI layer uses **LiteLLM** for provider-agnostic LLM access. Configuration is in `backend/ai_config.yaml`:

- **DeepSeek-R1** → Reasoning tasks (Agile, Architecture, PM, RCA)
- **Qwen3-Coder** → Engineering tasks (Development, QA, Code Review)
- **NVIDIA NIM** → Default inference provider

Switch providers or models via the AI Configuration page in the UI or by editing `ai_config.yaml`.

---

## 📄 License

MIT
