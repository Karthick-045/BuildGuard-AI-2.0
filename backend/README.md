# BuildGuard AI — Backend (Phase 1)

FastAPI + SQLAlchemy + MySQL + NetworkX safety egress graph reasoning engine.

## Features
- **Project Management**: Create, list, retrieve architectural projects.
- **Asset Uploads**: Blueprint and multi-photo site verification storage.
- **Deterministic Building Modeling**: 8 Rooms, 12 Doors, 4 Corridors, 2 Stairs, 2 Exits, 1 Ramp.
- **Safety Graph Reasoning**: Powered by NetworkX. Computes escape paths and reachability for all rooms to emergency exits.
- **Bottleneck Detection**: Uses `networkx.articulation_points()` to pinpoint single points of failure in egress routes.
- **What-If Simulation Engine**: Simulates blocking exits, corridors, or stairs. Real-time path recalculation, affected room isolation detection, and one-click reset.

## Prerequisites
- Python 3.11+
- MySQL Server (optional: automatically falls back to SQLite `buildguard.db` if MySQL is not active)

## Setup & Running

1. **Virtual Environment**:
   ```bash
   python -m venv venv
   # On Windows:
   venv\Scripts\activate
   # On Linux/macOS:
   source venv/bin/activate
   ```

2. **Install Dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

3. **MySQL Configuration**:
   Create the database in MySQL:
   ```sql
   CREATE DATABASE IF NOT EXISTS buildguard;
   ```
   Edit `.env` if you have a password:
   ```env
   DATABASE_URL=mysql+pymysql://root:YOUR_PASSWORD@localhost:3306/buildguard
   ```

4. **Start the API Server**:
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```

5. **API Documentation**:
   - Interactive Swagger UI: `http://localhost:8000/docs`
   - ReDoc: `http://localhost:8000/redoc`
