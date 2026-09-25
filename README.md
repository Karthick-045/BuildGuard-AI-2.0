# BuildGuard AI (Phase 1)

> Automated Architectural Safety, Egress Graph Reasoning, and Evacuation Bottleneck Simulation.

Phase 1 is completely built using **React + Vite + TypeScript + Tailwind CSS** on the frontend, and **FastAPI + SQLAlchemy + MySQL + NetworkX** on the backend.

**Zero External AI Dependencies:** Phase 1 uses pure graph theory (`networkx.articulation_points()`) and deterministic building spatial models to verify egress safety and simulate obstructions.

---

## 🏗️ Architecture Overview

```text
             ┌────────────────────────────┐
             │   React + Vite             │
             │   TypeScript + Tailwind    │
             │   React Flow               │
             └─────────────┬──────────────┘
                           │
                         Axios
                           │
                           ▼
             ┌────────────────────────────┐
             │       FastAPI              │
             ├────────────────────────────┤
             │ Project APIs               │
             │ Upload APIs                │
             │ Building Elements (29)     │
             │ Safety Graph Reasoning     │
             │ Articulation Points        │
             │ Bottleneck Detection       │
             │ What-If Simulation Engine  │
             └─────────────┬──────────────┘
                           │
                      SQLAlchemy
                           │
                           ▼
             ┌────────────────────────────┐
             │          MySQL             │
             │        buildguard          │
             └────────────────────────────┘
```

---

## 🚀 Quick Start Guide

### 1. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate (Windows)
venv\Scripts\activate
# Or Linux/macOS:
# source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

#### MySQL Database Configuration
Make sure MySQL is running and create the database:
```sql
CREATE DATABASE IF NOT EXISTS buildguard;
```

Configure `backend/.env`:
```env
DATABASE_URL=mysql+pymysql://root@localhost:3306/buildguard
# Or if password is set:
# DATABASE_URL=mysql+pymysql://root:YOUR_PASSWORD@localhost:3306/buildguard
UPLOAD_DIR=uploads
CORS_ORIGIN=http://localhost:5173
```
*(Note: If MySQL service is offline, the backend seamlessly falls back to local SQLite `buildguard.db` to prevent crashes during demos)*

#### Start Backend
```bash
uvicorn app.main:app --reload --port 8000
```
- Swagger API Docs: `http://localhost:8000/docs`
- Health check: `http://localhost:8000/api/health`

---

### 2. Frontend Setup

In a new terminal:
```bash
cd frontend

# Install packages
npm install

# Start Vite dev server
npm run dev
```
- Access application: `http://localhost:5173`

---

## 🎯 3-Minute Demo Walkthrough

1. **Dashboard (`http://localhost:5173`)**:
   - View top-level stat metrics: Projects, Findings, Critical Bottlenecks, Analyzed Facilities.
   - Click **"Create Project"** or **"Load Demo Building"**.

2. **Create Project**:
   - Enter building details (e.g. *Westfield Commercial Center*).
   - Click **"Load Sample Blueprint"** and **"Load Sample Photos"** to attach instant inspection assets.
   - Click **"Create & Launch Workspace"**.

3. **Spatial Workspace**:
   - Review detected building elements: **8 Rooms, 12 Doors, 4 Corridors, 2 Stairs, 2 Emergency Exits, 1 Ramp**.
   - Compare architectural blueprint CAD overlay against the interactive **Safety Graph**.
   - Review **Findings Panel** showing articulation point alerts and confidence breakdowns:
     - Detection Confidence: `95%`
     - Measurement Confidence: `90%`
     - Rule Match: `85%`
     - Evidence Quality: `88%`

4. **What-If Simulation**:
   - Click **"Block Exit B"**:
     - Graph recalculates escape paths via NetworkX.
     - **3 rooms (Room A, Room B, Room C)** lose evacuation connectivity!
     - Escape connectivity status switches to **FAILED**.
     - Safety graph highlights Exit B as **BLOCKED** and affected rooms in red/amber.
   - Click **"Reset Simulation"** to restore full egress operation.

---

## 📂 Repository Layout

```text
BuildGuard-AI/
├── frontend/
│   ├── public/demo/        # Sample blueprint & site photos
│   ├── src/
│   │   ├── components/
│   │   │   ├── layout/     # Sidebar, Header, PageContainer
│   │   │   ├── dashboard/  # StatCard, ProjectCard
│   │   │   ├── project/    # UploadPanel, BuildingSummary
│   │   │   ├── graph/      # SafetyGraph (ReactFlow), GraphLegend
│   │   │   ├── findings/   # FindingsPanel, FindingCard
│   │   │   └── simulation/ # WhatIfPanel, SimulationResult
│   │   ├── pages/          # Dashboard, NewProject, ProjectWorkspace
│   │   ├── services/       # Axios API client
│   │   └── types/          # TypeScript interfaces
│   ├── package.json
│   ├── vite.config.ts
│   └── tailwind.config.js
│
└── backend/
    ├── app/
    │   ├── core/           # NetworkX SafetyGraphEngine, RuleEngine
    │   ├── models/         # SQLAlchemy MySQL models
    │   ├── routes/         # FastAPI endpoints (Projects, Uploads, Analysis, Graph, Findings, Simulation)
    │   ├── schemas/        # Pydantic schemas
    │   ├── services/       # Business logic & graph reasoning
    │   └── utils/          # File upload & serialization helpers
    ├── requirements.txt
    └── .env.example
```
