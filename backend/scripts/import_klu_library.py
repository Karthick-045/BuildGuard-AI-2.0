"""
Import and synthesize KLU Central Library from visual survey JSON:
Dual-Floor Architecture (Ground Floor & First Floor)
- Creates Project 'KLU Central Library' with 2 floors
- Populates BuildingElements for Ground Floor and First Floor
- Populates GraphNodes and GraphEdges for Multi-Level Safety Graph
- Seeds 26 IoT Sensors in corridors, stairs, rooms, and doors across both floors
- Generates high-fidelity Dual-Level Architectural CAD Blueprint SVG
- Creates Asset and Findings records
"""
import sys
import os
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BACKEND_DIR))

from app.database import SessionLocal
from app.services.klu_library_service import import_klu_library_into_db

def run_import():
    print("=" * 60)
    print("Starting multi-level ingestion of KLU Central Library (Ground + 1st Floor)...")
    print("=" * 60)
    db = SessionLocal()
    try:
        res = import_klu_library_into_db(db)
        print("Import successful!")
        for k, v in res.items():
            print(f"  {k}: {v}")
    finally:
        db.close()

if __name__ == "__main__":
    run_import()
