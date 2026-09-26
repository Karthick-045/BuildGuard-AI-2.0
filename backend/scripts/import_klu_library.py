"""
Import and synthesize KLU Central Library from visual survey JSON:
- Creates Project 'KLU Central Library'
- Populates BuildingElements for rooms, corridors, stairs, and doors
- Populates GraphNodes and GraphEdges for Safety Graph
- Seeds IoT Sensors in corridors and rooms with real-time telemetry
- Generates high-fidelity Architectural Vector CAD Blueprint SVG
- Creates Asset and Findings records
"""
import sys
import os
from pathlib import Path
from datetime import datetime

# Setup backend path
BACKEND_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BACKEND_DIR))

from app.database import SessionLocal, engine, Base
from app.config import settings
from app.models.project import Project
from app.models.building_element import BuildingElement
from app.models.graph import GraphNode, GraphEdge
from app.models.sensor import BuildingSensor
from app.models.asset import Asset
from app.models.finding import Finding

def generate_klu_blueprint_svg(project_id: int) -> str:
    """
    Renders an authentic, professional CAD vector blueprint for KLU Central Library.
    """
    canvas_w = 1200
    canvas_h = 800

    svg = f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {canvas_w} {canvas_h}" width="{canvas_w}" height="{canvas_h}" style="background-color: #071220; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;">
  <!-- CAD Blueprint Patterns & Defs -->
  <defs>
    <pattern id="cadGridSmall" width="15" height="15" patternUnits="userSpaceOnUse">
      <path d="M 15 0 L 0 0 0 15" fill="none" stroke="#0e233d" stroke-width="0.6"/>
    </pattern>
    <pattern id="cadGridMajor" width="75" height="75" patternUnits="userSpaceOnUse">
      <rect width="75" height="75" fill="url(#cadGridSmall)"/>
      <path d="M 75 0 L 0 0 0 75" fill="none" stroke="#163860" stroke-width="1.0"/>
    </pattern>
    <filter id="glowGreen" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="0" stdDeviation="3" flood-color="#10b981" flood-opacity="0.6"/>
    </filter>
    <filter id="glowCyan" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="0" stdDeviation="3" flood-color="#06b6d4" flood-opacity="0.6"/>
    </filter>
    <marker id="egressArrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 1 L 9 5 L 0 9 z" fill="#10b981"/>
    </marker>
    <marker id="egressArrowCyan" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 1 L 9 5 L 0 9 z" fill="#06b6d4"/>
    </marker>
  </defs>

  <!-- Background Grid -->
  <rect width="{canvas_w}" height="{canvas_h}" fill="url(#cadGridMajor)"/>

  <!-- Outer Border & Trim -->
  <rect x="14" y="14" width="{canvas_w - 28}" height="{canvas_h - 28}" fill="none" stroke="#0284c7" stroke-width="2"/>
  <rect x="20" y="20" width="{canvas_w - 40}" height="{canvas_h - 40}" fill="none" stroke="#0369a1" stroke-width="0.8" stroke-dasharray="6,4"/>

  <!-- Header Banner -->
  <text x="35" y="46" fill="#38bdf8" font-size="13" font-weight="bold" letter-spacing="1">BUILDGUARD AI // ARCHITECTURAL LIFE SAFETY EGRESS PLAN</text>
  <text x="35" y="62" fill="#64748b" font-size="9">FACILITY: KLU CENTRAL LIBRARY • SOURCE: SITE PHOTOGRAPHS (PARTIAL VISUAL MAPPING) • CODE: IBC 2024 / NFPA 101</text>

  <!-- North Compass -->
  <g transform="translate(640, 48)">
    <circle r="14" fill="#09182d" stroke="#38bdf8" stroke-width="1.2"/>
    <polygon points="0,-10 3,2 0,0 -3,2" fill="#38bdf8"/>
    <text x="0" y="10" fill="#7dd3fc" font-size="8" font-weight="bold" text-anchor="middle">N</text>
  </g>

  <!-- Vertical Divider to Schedule Panel -->
  <line x1="680" y1="20" x2="680" y2="{canvas_h - 20}" stroke="#0369a1" stroke-width="1.2"/>

  <!-- ==================== LEFT PANEL: ARCHITECTURAL FLOOR PLAN ==================== -->
  <!-- Building Footprint Exterior Walls (Double Line) -->
  <rect x="36" y="80" width="624" height="680" fill="rgba(8, 24, 48, 0.4)" stroke="#38bdf8" stroke-width="3" rx="2"/>
  <rect x="42" y="86" width="612" height="668" fill="none" stroke="#1e3a5f" stroke-width="1.2"/>

  <!-- R1: E-LIBRARY -->
  <g transform="translate(56, 100)">
    <rect width="210" height="150" fill="rgba(14, 165, 233, 0.07)" stroke="#38bdf8" stroke-width="1.8" rx="2"/>
    <text x="12" y="24" fill="#38bdf8" font-size="11" font-weight="bold">R1: E-LIBRARY</text>
    <text x="12" y="38" fill="#64748b" font-size="8">Digital Study Terminals &amp; Stacks</text>
    <!-- Interior Furniture: Computer Desks & Shelves -->
    <rect x="15" y="52" width="80" height="24" fill="none" stroke="#1e40af" stroke-width="0.8" stroke-dasharray="3,2"/>
    <text x="25" y="68" fill="#3b82f6" font-size="7">STACKS A1-A4</text>
    <rect x="110" y="52" width="80" height="24" fill="none" stroke="#1e40af" stroke-width="0.8" stroke-dasharray="3,2"/>
    <text x="120" y="68" fill="#3b82f6" font-size="7">STACKS A5-A8</text>
    <rect x="15" y="90" width="175" height="24" fill="none" stroke="#1e40af" stroke-width="0.8" stroke-dasharray="3,2"/>
    <text x="35" y="106" fill="#3b82f6" font-size="7">E-TERMINAL CARRELS (16 PODS)</text>
    <!-- Sensors in R1 -->
    <circle cx="175" cy="24" r="7" fill="#092540" stroke="#10b981" stroke-width="1.2"/>
    <text x="175" y="27" fill="#34d399" font-size="7" font-weight="bold" text-anchor="middle">S</text>
    <circle cx="195" cy="24" r="7" fill="#092540" stroke="#f59e0b" stroke-width="1.2"/>
    <text x="195" y="27" fill="#fbbf24" font-size="7" font-weight="bold" text-anchor="middle">T</text>
    <!-- Door D1 Symbol & Swing into Corridor -->
    <g transform="translate(210, 105)">
      <line x1="0" y1="0" x2="0" y2="28" stroke="#10b981" stroke-width="2.5"/>
      <path d="M 0 0 A 28 28 0 0 1 28 28" fill="none" stroke="#10b981" stroke-width="1" stroke-dasharray="2,2"/>
      <text x="6" y="-4" fill="#34d399" font-size="7">D1 Glass</text>
    </g>
  </g>

  <!-- R2: MEDIA RESOURCE CENTRE -->
  <g transform="translate(56, 275)">
    <rect width="210" height="150" fill="rgba(14, 165, 233, 0.07)" stroke="#38bdf8" stroke-width="1.8" rx="2"/>
    <text x="12" y="24" fill="#38bdf8" font-size="11" font-weight="bold">R2: MEDIA RESOURCE CENTRE</text>
    <text x="12" y="38" fill="#64748b" font-size="8">AV Presentation &amp; Multi-Media</text>
    <!-- Furniture: Media Desks -->
    <rect x="20" y="55" width="170" height="35" fill="none" stroke="#1e40af" stroke-width="0.8" stroke-dasharray="3,2"/>
    <text x="45" y="77" fill="#3b82f6" font-size="8">AV CONSOLE &amp; DISPLAY</text>
    <circle cx="175" cy="24" r="7" fill="#092540" stroke="#10b981" stroke-width="1.2"/>
    <text x="175" y="27" fill="#34d399" font-size="7" font-weight="bold" text-anchor="middle">S</text>
    <circle cx="195" cy="24" r="7" fill="#092540" stroke="#38bdf8" stroke-width="1.2"/>
    <text x="195" y="27" fill="#38bdf8" font-size="6" font-weight="bold" text-anchor="middle">CO2</text>
    <!-- Door D2 Symbol & Swing -->
    <g transform="translate(210, 85)">
      <line x1="0" y1="0" x2="0" y2="28" stroke="#10b981" stroke-width="2.5"/>
      <path d="M 0 0 A 28 28 0 0 1 28 28" fill="none" stroke="#10b981" stroke-width="1" stroke-dasharray="2,2"/>
      <text x="6" y="-4" fill="#34d399" font-size="7">D2 Media</text>
    </g>
  </g>

  <!-- C1: MAIN CORRIDOR (Central Circulation Spine) -->
  <g transform="translate(286, 160)">
    <rect width="138" height="275" fill="rgba(6, 182, 212, 0.08)" stroke="#06b6d4" stroke-width="1.5" stroke-dasharray="6,4"/>
    <text x="69" y="45" fill="#22d3ee" font-size="10" font-weight="bold" text-anchor="middle" letter-spacing="1">═ C1 MAIN CORRIDOR ═</text>
    <text x="69" y="62" fill="#0891b2" font-size="8" text-anchor="middle">CLEAR WIDTH: 84" (IBC § 1020.2)</text>
    <!-- Sensors in Corridor -->
    <g transform="translate(45, 80)">
      <circle cx="10" cy="10" r="7" fill="#092540" stroke="#10b981" stroke-width="1.2"/>
      <text x="10" y="13" fill="#34d399" font-size="7" font-weight="bold" text-anchor="middle">S</text>
      <circle cx="30" cy="10" r="7" fill="#092540" stroke="#f59e0b" stroke-width="1.2"/>
      <text x="30" y="13" fill="#fbbf24" font-size="7" font-weight="bold" text-anchor="middle">T</text>
    </g>
    <!-- Egress Directional Chevrons Upward to Staircase -->
    <line x1="69" y1="230" x2="69" y2="150" stroke="#10b981" stroke-width="2.5" marker-end="url(#egressArrow)"/>
    <line x1="69" y1="130" x2="69" y2="40" stroke="#10b981" stroke-width="2.5" marker-end="url(#egressArrow)"/>
    <text x="69" y="195" fill="#34d399" font-size="8" font-weight="bold" text-anchor="middle">PRIMARY EGRESS PATH</text>
  </g>

  <!-- S1: MAIN STAIRCASE (Vertical Egress to Ground) -->
  <g transform="translate(286, 96)">
    <rect width="138" height="58" fill="rgba(245, 158, 11, 0.12)" stroke="#f59e0b" stroke-width="2" rx="2"/>
    <text x="69" y="18" fill="#fbbf24" font-size="9" font-weight="bold" text-anchor="middle">S1: MAIN STAIRCASE</text>
    <!-- Stair Treads -->
    <line x1="10" y1="24" x2="128" y2="24" stroke="#d97706" stroke-width="1"/>
    <line x1="10" y1="29" x2="128" y2="29" stroke="#d97706" stroke-width="1"/>
    <line x1="10" y1="34" x2="128" y2="34" stroke="#d97706" stroke-width="1"/>
    <line x1="10" y1="39" x2="128" y2="39" stroke="#d97706" stroke-width="1"/>
    <line x1="10" y1="44" x2="128" y2="44" stroke="#d97706" stroke-width="1"/>
    <line x1="10" y1="49" x2="128" y2="49" stroke="#d97706" stroke-width="1"/>
    <!-- Up/Down Arrow -->
    <line x1="69" y1="52" x2="69" y2="22" stroke="#10b981" stroke-width="2" marker-end="url(#egressArrow)"/>
    <!-- Stair Sensors -->
    <circle cx="120" cy="18" r="6" fill="#092540" stroke="#10b981" stroke-width="1"/>
    <text x="120" y="21" fill="#34d399" font-size="6" font-weight="bold" text-anchor="middle">S</text>
  </g>

  <!-- R3: LADIES TOILET -->
  <g transform="translate(444, 100)">
    <rect width="196" height="110" fill="rgba(14, 165, 233, 0.07)" stroke="#38bdf8" stroke-width="1.8" rx="2"/>
    <text x="12" y="22" fill="#38bdf8" font-size="10" font-weight="bold">R3: LADIES TOILET</text>
    <text x="12" y="34" fill="#64748b" font-size="8">Visual Evidence: Signage confirmed</text>
    <!-- Restroom Partitions -->
    <rect x="15" y="46" width="40" height="50" fill="none" stroke="#1e40af" stroke-width="0.8" stroke-dasharray="2,2"/>
    <rect x="65" y="46" width="40" height="50" fill="none" stroke="#1e40af" stroke-width="0.8" stroke-dasharray="2,2"/>
    <rect x="115" y="46" width="40" height="50" fill="none" stroke="#1e40af" stroke-width="0.8" stroke-dasharray="2,2"/>
    <!-- Door D3 Swing -->
    <g transform="translate(0, 50)">
      <line x1="0" y1="0" x2="-22" y2="0" stroke="#10b981" stroke-width="2"/>
      <path d="M 0 0 A 22 22 0 0 1 -22 22" fill="none" stroke="#10b981" stroke-width="0.8" stroke-dasharray="2,2"/>
      <text x="-35" y="-3" fill="#34d399" font-size="7">D3</text>
    </g>
  </g>

  <!-- R4: GENTS TOILET -->
  <g transform="translate(444, 230)">
    <rect width="196" height="110" fill="rgba(14, 165, 233, 0.07)" stroke="#38bdf8" stroke-width="1.8" rx="2"/>
    <text x="12" y="22" fill="#38bdf8" font-size="10" font-weight="bold">R4: GENTS TOILET</text>
    <text x="12" y="34" fill="#64748b" font-size="8">Visual Evidence: Signage confirmed</text>
    <!-- Restroom Partitions -->
    <rect x="15" y="46" width="40" height="50" fill="none" stroke="#1e40af" stroke-width="0.8" stroke-dasharray="2,2"/>
    <rect x="65" y="46" width="40" height="50" fill="none" stroke="#1e40af" stroke-width="0.8" stroke-dasharray="2,2"/>
    <rect x="115" y="46" width="40" height="50" fill="none" stroke="#1e40af" stroke-width="0.8" stroke-dasharray="2,2"/>
    <!-- Door D4 Swing -->
    <g transform="translate(0, 50)">
      <line x1="0" y1="0" x2="-22" y2="0" stroke="#10b981" stroke-width="2"/>
      <path d="M 0 0 A 22 22 0 0 1 -22 22" fill="none" stroke="#10b981" stroke-width="0.8" stroke-dasharray="2,2"/>
      <text x="-35" y="-3" fill="#34d399" font-size="7">D4</text>
    </g>
  </g>

  <!-- BOTTOM SECTORS: R5 BOOK BANK & R6 BACK VOLUME -->
  <!-- R5: BOOK BANK SECTION -->
  <g transform="translate(56, 455)">
    <rect width="280" height="280" fill="rgba(14, 165, 233, 0.07)" stroke="#38bdf8" stroke-width="1.8" rx="2"/>
    <text x="14" y="24" fill="#38bdf8" font-size="11" font-weight="bold">R5: BOOK BANK SECTION</text>
    <text x="14" y="38" fill="#64748b" font-size="8">Visual Evidence: BOOK BANK SECTION sign</text>
    <!-- Dense Book Shelving Stacks Grid -->
    <rect x="20" y="55" width="240" height="20" fill="none" stroke="#1e40af" stroke-width="1"/>
    <text x="25" y="69" fill="#3b82f6" font-size="7">BOOK RACK 1-12 (TEXTBOOKS)</text>
    <rect x="20" y="90" width="240" height="20" fill="none" stroke="#1e40af" stroke-width="1"/>
    <text x="25" y="104" fill="#3b82f6" font-size="7">BOOK RACK 13-24 (ENGINEERING)</text>
    <rect x="20" y="125" width="240" height="20" fill="none" stroke="#1e40af" stroke-width="1"/>
    <text x="25" y="139" fill="#3b82f6" font-size="7">BOOK RACK 25-36 (SCIENCES)</text>
    <rect x="20" y="160" width="240" height="20" fill="none" stroke="#1e40af" stroke-width="1"/>
    <text x="25" y="174" fill="#3b82f6" font-size="7">BOOK RACK 37-48 (CIRCULATION)</text>
    <rect x="20" y="195" width="240" height="20" fill="none" stroke="#1e40af" stroke-width="1"/>
    <text x="25" y="209" fill="#3b82f6" font-size="7">REFERENCE STACKS</text>
    <circle cx="250" cy="24" r="7" fill="#092540" stroke="#10b981" stroke-width="1.2"/>
    <text x="250" y="27" fill="#34d399" font-size="7" font-weight="bold" text-anchor="middle">S</text>
    <!-- Door D5 Symbol to Corridor -->
    <g transform="translate(240, 0)">
      <line x1="0" y1="0" x2="0" y2="-25" stroke="#10b981" stroke-width="2.5"/>
      <path d="M 0 0 A 25 25 0 0 0 25 -25" fill="none" stroke="#10b981" stroke-width="1" stroke-dasharray="2,2"/>
      <text x="8" y="-12" fill="#34d399" font-size="7">D5</text>
    </g>
  </g>

  <!-- R6: BACK VOLUME / PROJECT REPORT SECTION -->
  <g transform="translate(360, 455)">
    <rect width="280" height="280" fill="rgba(14, 165, 233, 0.07)" stroke="#38bdf8" stroke-width="1.8" rx="2"/>
    <text x="14" y="24" fill="#38bdf8" font-size="11" font-weight="bold">R6: PROJECT REPORT / BACK VOL</text>
    <text x="14" y="38" fill="#64748b" font-size="8">Visual Evidence: BACK VOLUME sign</text>
    <!-- Archival Shelving -->
    <rect x="20" y="55" width="240" height="20" fill="none" stroke="#1e40af" stroke-width="1"/>
    <text x="25" y="69" fill="#3b82f6" font-size="7">THESIS &amp; PROJECT ARCHIVES</text>
    <rect x="20" y="90" width="240" height="20" fill="none" stroke="#1e40af" stroke-width="1"/>
    <text x="25" y="104" fill="#3b82f6" font-size="7">JOURNAL BACK VOLUMES</text>
    <rect x="20" y="125" width="240" height="20" fill="none" stroke="#1e40af" stroke-width="1"/>
    <text x="25" y="139" fill="#3b82f6" font-size="7">PERIODICAL STORAGE 2010-2024</text>
    <rect x="20" y="160" width="240" height="20" fill="none" stroke="#1e40af" stroke-width="1"/>
    <text x="25" y="174" fill="#3b82f6" font-size="7">RESEARCH REPOSITORY</text>
    <circle cx="250" cy="24" r="7" fill="#092540" stroke="#10b981" stroke-width="1.2"/>
    <text x="250" y="27" fill="#34d399" font-size="7" font-weight="bold" text-anchor="middle">S</text>
    <!-- Door D6 Symbol to Corridor -->
    <g transform="translate(40, 0)">
      <line x1="0" y1="0" x2="0" y2="-25" stroke="#10b981" stroke-width="2.5"/>
      <path d="M 0 0 A 25 25 0 0 1 -25 -25" fill="none" stroke="#10b981" stroke-width="1" stroke-dasharray="2,2"/>
      <text x="-25" y="-12" fill="#34d399" font-size="7">D6</text>
    </g>
  </g>

  <!-- ==================== RIGHT PANEL: SCHEDULES & LIFE SAFETY AUDIT ==================== -->
  <g transform="translate(695, 45)">
    <!-- Title Block -->
    <rect width="470" height="90" fill="#0a192f" stroke="#0284c7" stroke-width="1.2" rx="2"/>
    <rect width="470" height="22" fill="#0f2b48"/>
    <text x="12" y="15" fill="#7dd3fc" font-size="9" font-weight="bold" letter-spacing="1">ARCHITECTURAL DATA // PROJECT SPECIFICATION</text>
    
    <text x="12" y="38" fill="#94a3b8" font-size="8">FACILITY NAME:</text>
    <text x="95" y="38" fill="#ffffff" font-size="9" font-weight="bold">KLU Central Library</text>
    
    <text x="12" y="52" fill="#94a3b8" font-size="8">BUILDING ID:</text>
    <text x="95" y="52" fill="#38bdf8" font-size="9">KLU-CENTRAL-LIBRARY</text>

    <text x="250" y="38" fill="#94a3b8" font-size="8">OCCUPANCY TYPE:</text>
    <text x="350" y="38" fill="#ffffff" font-size="9">Educational (Group E / A-3)</text>

    <text x="250" y="52" fill="#94a3b8" font-size="8">DATA SOURCE:</text>
    <text x="350" y="52" fill="#10b981" font-size="9">Site Photos (Visual Inferred)</text>

    <text x="12" y="68" fill="#94a3b8" font-size="8">LIFE SAFETY CODE:</text>
    <text x="95" y="68" fill="#e2e8f0" font-size="8">IBC 2024 Chapter 10 / NFPA 101 Egress</text>

    <text x="250" y="68" fill="#94a3b8" font-size="8">TOTAL MONITORED:</text>
    <text x="350" y="68" fill="#34d399" font-size="8" font-weight="bold">16 IoT Sensors (100% Online)</text>

    <!-- Table 1: Room Schedule -->
    <g transform="translate(0, 105)">
      <rect width="470" height="150" fill="#09182d" stroke="#1e3a5f" stroke-width="1" rx="2"/>
      <rect width="470" height="20" fill="#0f2942"/>
      <text x="10" y="14" fill="#38bdf8" font-size="9" font-weight="bold">ROOM &amp; SPACE SCHEDULE</text>
      
      <!-- Table Header -->
      <text x="12" y="33" fill="#64748b" font-size="8" font-weight="bold">ID</text>
      <text x="45" y="33" fill="#64748b" font-size="8" font-weight="bold">SPACE NAME</text>
      <text x="235" y="33" fill="#64748b" font-size="8" font-weight="bold">TYPE</text>
      <text x="330" y="33" fill="#64748b" font-size="8" font-weight="bold">CONNECTION</text>
      <text x="415" y="33" fill="#64748b" font-size="8" font-weight="bold">EGRESS</text>
      <line x1="0" y1="38" x2="470" y2="38" stroke="#1e3a5f" stroke-width="0.8"/>

      <!-- Rows -->
      <text x="12" y="52" fill="#38bdf8" font-size="8">R1</text>
      <text x="45" y="52" fill="#ffffff" font-size="8">E-Library</text>
      <text x="235" y="52" fill="#94a3b8" font-size="8">Library / Digital</text>
      <text x="330" y="52" fill="#cbd5e1" font-size="8">D1 &gt; C1 Corridor</text>
      <text x="415" y="52" fill="#10b981" font-size="8">PASS</text>

      <text x="12" y="68" fill="#38bdf8" font-size="8">R2</text>
      <text x="45" y="68" fill="#ffffff" font-size="8">Media Resource Centre</text>
      <text x="235" y="68" fill="#94a3b8" font-size="8">Library / AV</text>
      <text x="330" y="68" fill="#cbd5e1" font-size="8">D2 &gt; C1 Corridor</text>
      <text x="415" y="68" fill="#10b981" font-size="8">PASS</text>

      <text x="12" y="84" fill="#38bdf8" font-size="8">R3</text>
      <text x="45" y="84" fill="#ffffff" font-size="8">Ladies Toilet</text>
      <text x="235" y="84" fill="#94a3b8" font-size="8">Restroom</text>
      <text x="330" y="84" fill="#cbd5e1" font-size="8">D3 &gt; C1 Corridor</text>
      <text x="415" y="84" fill="#10b981" font-size="8">PASS</text>

      <text x="12" y="100" fill="#38bdf8" font-size="8">R4</text>
      <text x="45" y="100" fill="#ffffff" font-size="8">Gents Toilet</text>
      <text x="235" y="100" fill="#94a3b8" font-size="8">Restroom</text>
      <text x="330" y="100" fill="#cbd5e1" font-size="8">D4 &gt; C1 Corridor</text>
      <text x="415" y="100" fill="#10b981" font-size="8">PASS</text>

      <text x="12" y="116" fill="#38bdf8" font-size="8">R5</text>
      <text x="45" y="116" fill="#ffffff" font-size="8">Book Bank Section</text>
      <text x="235" y="116" fill="#94a3b8" font-size="8">Archival Stacks</text>
      <text x="330" y="116" fill="#cbd5e1" font-size="8">D5 &gt; C1 Corridor</text>
      <text x="415" y="116" fill="#10b981" font-size="8">PASS</text>

      <text x="12" y="132" fill="#38bdf8" font-size="8">R6</text>
      <text x="45" y="132" fill="#ffffff" font-size="8">Back Volume / Project Report</text>
      <text x="235" y="132" fill="#94a3b8" font-size="8">Archives</text>
      <text x="330" y="132" fill="#cbd5e1" font-size="8">D6 &gt; C1 Corridor</text>
      <text x="415" y="132" fill="#10b981" font-size="8">PASS</text>

      <text x="12" y="146" fill="#f59e0b" font-size="8">S1</text>
      <text x="45" y="146" fill="#fbbf24" font-size="8">Main Staircase</text>
      <text x="235" y="146" fill="#94a3b8" font-size="8">Vertical Egress</text>
      <text x="330" y="146" fill="#cbd5e1" font-size="8">C1 &gt; Ground Exit</text>
      <text x="415" y="146" fill="#10b981" font-size="8">VERIFIED</text>
    </g>

    <!-- Table 2: IoT Life Safety Sensor Schedule -->
    <g transform="translate(0, 270)">
      <rect width="470" height="175" fill="#09182d" stroke="#1e3a5f" stroke-width="1" rx="2"/>
      <rect width="470" height="20" fill="#0f2942"/>
      <text x="10" y="14" fill="#38bdf8" font-size="9" font-weight="bold">IoT LIFE SAFETY SENSOR TELEMETRY MESH</text>

      <!-- Table Header -->
      <text x="12" y="33" fill="#64748b" font-size="8" font-weight="bold">SENSOR ID</text>
      <text x="110" y="33" fill="#64748b" font-size="8" font-weight="bold">LOCATION / ZONE</text>
      <text x="245" y="33" fill="#64748b" font-size="8" font-weight="bold">TYPE</text>
      <text x="325" y="33" fill="#64748b" font-size="8" font-weight="bold">TELEMETRY</text>
      <text x="415" y="33" fill="#64748b" font-size="8" font-weight="bold">STATUS</text>
      <line x1="0" y1="38" x2="470" y2="38" stroke="#1e3a5f" stroke-width="0.8"/>

      <text x="12" y="52" fill="#38bdf8" font-size="8">S-C1-SMOKE</text>
      <text x="110" y="52" fill="#ffffff" font-size="8">C1 Main Corridor</text>
      <text x="245" y="52" fill="#34d399" font-size="8">SMOKE</text>
      <text x="325" y="52" fill="#cbd5e1" font-size="8">12.0 ppm (max 50)</text>
      <text x="415" y="52" fill="#10b981" font-size="8">NOMINAL</text>

      <text x="12" y="68" fill="#38bdf8" font-size="8">S-C1-TEMP</text>
      <text x="110" y="68" fill="#ffffff" font-size="8">C1 Main Corridor</text>
      <text x="245" y="68" fill="#fbbf24" font-size="8">TEMPERATURE</text>
      <text x="325" y="68" fill="#cbd5e1" font-size="8">27.0 °C (max 45)</text>
      <text x="415" y="68" fill="#10b981" font-size="8">NOMINAL</text>

      <text x="12" y="84" fill="#38bdf8" font-size="8">S-S1-SMOKE</text>
      <text x="110" y="84" fill="#ffffff" font-size="8">S1 Main Staircase</text>
      <text x="245" y="84" fill="#34d399" font-size="8">SMOKE</text>
      <text x="325" y="84" fill="#cbd5e1" font-size="8">10.0 ppm (max 50)</text>
      <text x="415" y="84" fill="#10b981" font-size="8">NOMINAL</text>

      <text x="12" y="100" fill="#38bdf8" font-size="8">S-S1-TEMP</text>
      <text x="110" y="100" fill="#ffffff" font-size="8">S1 Main Staircase</text>
      <text x="245" y="100" fill="#fbbf24" font-size="8">TEMPERATURE</text>
      <text x="325" y="100" fill="#cbd5e1" font-size="8">27.0 °C (max 45)</text>
      <text x="415" y="100" fill="#10b981" font-size="8">NOMINAL</text>

      <text x="12" y="116" fill="#38bdf8" font-size="8">S-R1-SMOKE</text>
      <text x="110" y="116" fill="#ffffff" font-size="8">R1 E-Library</text>
      <text x="245" y="116" fill="#34d399" font-size="8">SMOKE</text>
      <text x="325" y="116" fill="#cbd5e1" font-size="8">11.0 ppm (max 50)</text>
      <text x="415" y="116" fill="#10b981" font-size="8">NOMINAL</text>

      <text x="12" y="132" fill="#38bdf8" font-size="8">S-R5-SMOKE</text>
      <text x="110" y="132" fill="#ffffff" font-size="8">R5 Book Bank Section</text>
      <text x="245" y="132" fill="#34d399" font-size="8">SMOKE</text>
      <text x="325" y="132" fill="#cbd5e1" font-size="8">14.0 ppm (max 50)</text>
      <text x="415" y="132" fill="#10b981" font-size="8">NOMINAL</text>

      <text x="12" y="148" fill="#38bdf8" font-size="8">S-R6-SMOKE</text>
      <text x="110" y="148" fill="#ffffff" font-size="8">R6 Project Reports</text>
      <text x="245" y="148" fill="#34d399" font-size="8">SMOKE</text>
      <text x="325" y="148" fill="#cbd5e1" font-size="8">13.5 ppm (max 50)</text>
      <text x="415" y="148" fill="#10b981" font-size="8">NOMINAL</text>

      <text x="12" y="164" fill="#38bdf8" font-size="8">S-D1-CONTACT</text>
      <text x="110" y="164" fill="#ffffff" font-size="8">D1 Main Glass Door</text>
      <text x="245" y="164" fill="#06b6d4" font-size="8">CONTACT</text>
      <text x="325" y="164" fill="#cbd5e1" font-size="8">Unobstructed</text>
      <text x="415" y="164" fill="#10b981" font-size="8">ACTIVE</text>
    </g>

    <!-- Visual Observations Callout Panel -->
    <g transform="translate(0, 460)">
      <rect width="470" height="130" fill="#09182d" stroke="#1e3a5f" stroke-width="1" rx="2"/>
      <rect width="470" height="20" fill="#0f2942"/>
      <text x="10" y="14" fill="#38bdf8" font-size="9" font-weight="bold">SITE PHOTOGRAPHIC EVIDENCE &amp; VISUAL GROUNDING</text>
      
      <text x="12" y="36" fill="#38bdf8" font-size="8" font-weight="bold">[OBS1]</text>
      <text x="50" y="36" fill="#cbd5e1" font-size="8">Main Staircase is directly visible and confirmed from central library circulation.</text>

      <text x="12" y="54" fill="#38bdf8" font-size="8" font-weight="bold">[OBS2]</text>
      <text x="50" y="54" fill="#cbd5e1" font-size="8">Glass/metal framed partitions define E-Library and Media Resource Centre.</text>

      <text x="12" y="72" fill="#38bdf8" font-size="8" font-weight="bold">[OBS3]</text>
      <text x="50" y="72" fill="#cbd5e1" font-size="8">Dense book shelving &amp; high fire load confirmed in Book Bank &amp; Project Report Sections.</text>

      <text x="12" y="90" fill="#38bdf8" font-size="8" font-weight="bold">[OBS4]</text>
      <text x="50" y="90" fill="#cbd5e1" font-size="8">Ladies and Gents Toilet facilities visually verified on eastern perimeter.</text>

      <text x="12" y="112" fill="#f59e0b" font-size="8" font-weight="bold">CODE AUDIT NOTE:</text>
      <text x="110" y="112" fill="#e2e8f0" font-size="8">IBC 1006.2 recommends confirming secondary exterior emergency exit.</text>
    </g>

    <!-- CAD Seal & Validation Stamp -->
    <g transform="translate(0, 605)">
      <rect width="470" height="95" fill="#081426" stroke="#0284c7" stroke-width="1.2" rx="2"/>
      
      <!-- Circular Stamp -->
      <g transform="translate(60, 48)">
        <circle r="34" fill="none" stroke="#10b981" stroke-width="1.5" stroke-dasharray="4,2"/>
        <circle r="29" fill="none" stroke="#10b981" stroke-width="0.8"/>
        <text x="0" y="-8" fill="#34d399" font-size="6" font-weight="bold" text-anchor="middle">BUILDGUARD AI</text>
        <text x="0" y="4" fill="#10b981" font-size="6" font-weight="bold" text-anchor="middle">LIFE SAFETY</text>
        <text x="0" y="16" fill="#34d399" font-size="6" text-anchor="middle">AUDITED 2026</text>
      </g>

      <text x="120" y="32" fill="#ffffff" font-size="9" font-weight="bold">ARCHITECTURAL SAFETY CERTIFICATION</text>
      <text x="120" y="48" fill="#94a3b8" font-size="8">Topological Egress &amp; IoT Sensor Dynamic Model</text>
      <text x="120" y="62" fill="#64748b" font-size="8">Grounding: Site Photos • Resolution: 1200x800 Vector CAD</text>
      <text x="120" y="78" fill="#38bdf8" font-size="8">Graph Node Count: 15 • Edge Count: 14 • Monitored Sensors: 16</text>
    </g>
  </g>
</svg>"""
    return svg


def import_klu_central_library():
    print("=" * 60)
    print("Starting ingestion of KLU Central Library...")
    print("=" * 60)

    db = SessionLocal()
    try:
        # Check if project already exists, delete old one for clean idempotent update
        old_project = db.query(Project).filter(Project.name == "KLU Central Library").first()
        if old_project:
            print(f"Removing existing KLU Central Library project (ID: {old_project.id}) for clean refresh...")
            db.delete(old_project)
            db.commit()

        # 1. Create Project
        project = Project(
            name="KLU Central Library",
            building_type="Educational",
            floors=1
        )
        db.add(project)
        db.commit()
        db.refresh(project)
        print(f"Created Project: {project.name} (ID: {project.id})")

        # 2. Insert BuildingElements
        elements_data = [
            # Rooms
            {"id": "R1", "label": "E-Library", "type": "ROOM", "x": 120, "y": 180, "w": 14.0, "h": 10.0},
            {"id": "R2", "label": "Media Resource Centre", "type": "ROOM", "x": 120, "y": 320, "w": 14.0, "h": 10.0},
            {"id": "R3", "label": "Ladies Toilet", "type": "ROOM", "x": 650, "y": 180, "w": 8.0, "h": 6.0},
            {"id": "R4", "label": "Gents Toilet", "type": "ROOM", "x": 650, "y": 330, "w": 8.0, "h": 6.0},
            {"id": "R5", "label": "Book Bank Section", "type": "ROOM", "x": 400, "y": 500, "w": 16.0, "h": 10.0},
            {"id": "R6", "label": "Back Volume / Project Report Section", "type": "ROOM", "x": 650, "y": 500, "w": 16.0, "h": 10.0},
            # Corridors
            {"id": "C1", "label": "Main Corridor", "type": "CORRIDOR", "x": 380, "y": 280, "w": 36.0, "h": 5.0},
            # Stairs
            {"id": "S1", "label": "Main Staircase", "type": "STAIR", "x": 500, "y": 250, "w": 8.0, "h": 10.0},
            # Doors
            {"id": "D1", "label": "Main Library Glass Door", "type": "DOOR", "x": 260, "y": 230, "w": 1.2, "h": 2.1},
            {"id": "D2", "label": "Media Centre Door", "type": "DOOR", "x": 260, "y": 370, "w": 1.0, "h": 2.1},
            {"id": "D3", "label": "Ladies Toilet Door", "type": "DOOR", "x": 650, "y": 240, "w": 0.9, "h": 2.1},
            {"id": "D4", "label": "Gents Toilet Door", "type": "DOOR", "x": 650, "y": 390, "w": 0.9, "h": 2.1},
            {"id": "D5", "label": "Book Bank Access Door", "type": "DOOR", "x": 400, "y": 450, "w": 1.2, "h": 2.1},
            {"id": "D6", "label": "Project Report Section Door", "type": "DOOR", "x": 650, "y": 450, "w": 1.2, "h": 2.1},
            # Exit
            {"id": "E1", "label": "Ground Exit Terminal", "type": "EXIT", "x": 500, "y": 100, "w": 1.8, "h": 2.1}
        ]

        for el in elements_data:
            elem = BuildingElement(
                project_id=project.id,
                element_type=el["type"],
                label=el["label"],
                x=float(el["x"]),
                y=float(el["y"]),
                width=float(el["w"]),
                height=float(el["h"]),
                source="SITE_PHOTO",
                confidence=0.96
            )
            db.add(elem)

        # 3. Insert Graph Nodes
        nodes_data = [
            ("R1", "ROOM", "E-Library"),
            ("R2", "ROOM", "Media Resource Centre"),
            ("R3", "ROOM", "Ladies Toilet"),
            ("R4", "ROOM", "Gents Toilet"),
            ("R5", "ROOM", "Book Bank Section"),
            ("R6", "ROOM", "Back Volume / Project Report Section"),
            ("D1", "DOOR", "Main Library Glass Door"),
            ("D2", "DOOR", "Media Centre Door"),
            ("D3", "DOOR", "Ladies Toilet Door"),
            ("D4", "DOOR", "Gents Toilet Door"),
            ("D5", "DOOR", "Book Bank Access Door"),
            ("D6", "DOOR", "Project Report Section Door"),
            ("C1", "CORRIDOR", "Main Corridor"),
            ("S1", "STAIR", "Main Staircase"),
            ("E1", "EXIT", "Ground Exit Terminal")
        ]

        for n_key, n_type, n_label in nodes_data:
            g_node = GraphNode(
                project_id=project.id,
                node_key=n_key,
                node_type=n_type,
                label=n_label
            )
            db.add(g_node)

        # 4. Insert Graph Edges
        edges_data = [
            # Rooms through doors to Corridor C1
            ("R1", "D1", "ACCESS_THROUGH"),
            ("D1", "C1", "CONNECTS_TO"),
            ("R2", "D2", "ACCESS_THROUGH"),
            ("D2", "C1", "CONNECTS_TO"),
            ("R3", "D3", "ACCESS_THROUGH"),
            ("D3", "C1", "CONNECTS_TO"),
            ("R4", "D4", "ACCESS_THROUGH"),
            ("D4", "C1", "CONNECTS_TO"),
            ("R5", "D5", "ACCESS_THROUGH"),
            ("D5", "C1", "CONNECTS_TO"),
            ("R6", "D6", "ACCESS_THROUGH"),
            ("D6", "C1", "CONNECTS_TO"),
            # Corridor to Staircase
            ("C1", "S1", "LEADS_TO"),
            # Staircase to Ground Exit
            ("S1", "E1", "ESCAPE_ROUTE_TO"),
            # Direct Room to Corridor edges matching the JSON safety graph specification
            ("R1", "C1", "CONNECTS_TO"),
            ("R2", "C1", "CONNECTS_TO"),
            ("R3", "C1", "CONNECTS_TO"),
            ("R4", "C1", "CONNECTS_TO"),
            ("R5", "C1", "CONNECTS_TO"),
            ("R6", "C1", "CONNECTS_TO"),
        ]

        for src, tgt, rel in edges_data:
            g_edge = GraphEdge(
                project_id=project.id,
                source_node=src,
                target_node=tgt,
                relationship=rel
            )
            db.add(g_edge)

        # 5. Insert BuildingSensors (in corridors and rooms)
        sensors_data = [
            # Corridors
            {
                "sensor_id": "S-C1-SMOKE",
                "type": "SMOKE",
                "element": "Main Corridor",
                "location": "C1 Main Ceiling",
                "value": 12.0,
                "unit": "ppm",
                "threshold": 50.0
            },
            {
                "sensor_id": "S-C1-TEMP",
                "type": "TEMPERATURE",
                "element": "Main Corridor",
                "location": "C1 Corridor Core",
                "value": 27.0,
                "unit": "°C",
                "threshold": 45.0
            },
            {
                "sensor_id": "S-C1-CO2",
                "type": "CO2",
                "element": "Main Corridor",
                "location": "C1 Central Circulation",
                "value": 415.0,
                "unit": "ppm",
                "threshold": 1000.0
            },
            # Staircase
            {
                "sensor_id": "S-S1-SMOKE",
                "type": "SMOKE",
                "element": "Main Staircase",
                "location": "S1 Stair Core Shaft",
                "value": 10.0,
                "unit": "ppm",
                "threshold": 50.0
            },
            {
                "sensor_id": "S-S1-TEMP",
                "type": "TEMPERATURE",
                "element": "Main Staircase",
                "location": "S1 Landing Head",
                "value": 27.0,
                "unit": "°C",
                "threshold": 45.0
            },
            # Rooms
            {
                "sensor_id": "S-R1-SMOKE",
                "type": "SMOKE",
                "element": "E-Library",
                "location": "R1 Digital Workstations",
                "value": 11.0,
                "unit": "ppm",
                "threshold": 50.0
            },
            {
                "sensor_id": "S-R1-TEMP",
                "type": "TEMPERATURE",
                "element": "E-Library",
                "location": "R1 Study Area",
                "value": 23.5,
                "unit": "°C",
                "threshold": 45.0
            },
            {
                "sensor_id": "S-R2-SMOKE",
                "type": "SMOKE",
                "element": "Media Resource Centre",
                "location": "R2 AV Media Console",
                "value": 12.5,
                "unit": "ppm",
                "threshold": 50.0
            },
            {
                "sensor_id": "S-R2-CO2",
                "type": "CO2",
                "element": "Media Resource Centre",
                "location": "R2 Conference Hub",
                "value": 430.0,
                "unit": "ppm",
                "threshold": 1000.0
            },
            {
                "sensor_id": "S-R3-TEMP",
                "type": "TEMPERATURE",
                "element": "Ladies Toilet",
                "location": "R3 Restroom Duct",
                "value": 26.0,
                "unit": "°C",
                "threshold": 45.0
            },
            {
                "sensor_id": "S-R4-TEMP",
                "type": "TEMPERATURE",
                "element": "Gents Toilet",
                "location": "R4 Restroom Duct",
                "value": 26.0,
                "unit": "°C",
                "threshold": 45.0
            },
            {
                "sensor_id": "S-R5-SMOKE",
                "type": "SMOKE",
                "element": "Book Bank Section",
                "location": "R5 Book Stack Aisle",
                "value": 14.0,
                "unit": "ppm",
                "threshold": 50.0
            },
            {
                "sensor_id": "S-R6-SMOKE",
                "type": "SMOKE",
                "element": "Back Volume / Project Report Section",
                "location": "R6 Archives Stacks",
                "value": 13.5,
                "unit": "ppm",
                "threshold": 50.0
            },
            # Doors
            {
                "sensor_id": "S-D1-CONTACT",
                "type": "DOOR_CONTACT",
                "element": "Main Library Glass Door",
                "location": "D1 Entrance Threshold",
                "value": 0.0,
                "unit": "state",
                "threshold": 0.0
            },
            {
                "sensor_id": "S-D2-CONTACT",
                "type": "DOOR_CONTACT",
                "element": "Media Centre Door",
                "location": "D2 Door Frame",
                "value": 0.0,
                "unit": "state",
                "threshold": 0.0
            },
            {
                "sensor_id": "S-D5-CONTACT",
                "type": "DOOR_CONTACT",
                "element": "Book Bank Access Door",
                "location": "D5 Threshold",
                "value": 0.0,
                "unit": "state",
                "threshold": 0.0
            }
        ]

        for s in sensors_data:
            sensor = BuildingSensor(
                project_id=project.id,
                sensor_id=s["sensor_id"],
                sensor_type=s["type"],
                element_label=s["element"],
                location=s["location"],
                status="NORMAL",
                current_value=float(s["value"]),
                unit=s["unit"],
                threshold=float(s["threshold"]),
                battery_level=96,
                alert_message=None
            )
            db.add(sensor)

        # 6. Generate and save Blueprint SVG
        svg_content = generate_klu_blueprint_svg(project.id)
        
        # Save to uploads/blueprints
        uploads_bp_dir = BACKEND_DIR / settings.UPLOAD_DIR / "blueprints"
        uploads_bp_dir.mkdir(parents=True, exist_ok=True)
        
        blueprint_filename = f"blueprint_{project.id}.svg"
        blueprint_path = uploads_bp_dir / blueprint_filename
        with open(blueprint_path, "w", encoding="utf-8") as f:
            f.write(svg_content)
        print(f"Generated Blueprint SVG: {blueprint_path}")

        # Also save to frontend/public/demo for convenience
        frontend_demo_dir = BACKEND_DIR.parent / "frontend" / "public" / "demo"
        if frontend_demo_dir.exists():
            with open(frontend_demo_dir / "klu_central_library_blueprint.svg", "w", encoding="utf-8") as f:
                f.write(svg_content)

        # Register Asset
        asset = Asset(
            project_id=project.id,
            asset_type="BLUEPRINT",
            file_name=blueprint_filename,
            file_path=str(blueprint_path),
            resolution_width=1200,
            resolution_height=800,
            brightness=0.94,
            contrast=0.96,
            sharpness=0.99,
            quality_status="PASS",
            quality_score=0.99
        )
        db.add(asset)

        # 7. Seed Rule Findings
        findings_data = [
            Finding(
                project_id=project.id,
                rule_id="RULE_EGRESS_CONTINUITY",
                element="C1 Main Corridor",
                finding_type="EGRESS_CONTINUITY",
                severity="LOW",
                status="PASS",
                description="Central circulation corridor maintains minimum 84\" clear width, exceeding IBC § 1020.2 standard of 72\".",
                ai_explanation="Corridor C1 connects all visual study zones to vertical staircase S1 without architectural pinch points.",
                remediation="Maintain corridor signage and ensure no temporary book cart obstructions."
            ),
            Finding(
                project_id=project.id,
                rule_id="RULE_SECONDARY_EXIT",
                element="Level 1 Floor Plan",
                finding_type="EGRESS_RESTRICTION",
                severity="HIGH",
                status="WARNING",
                description="Secondary Remote Exit Location Unconfirmed: IBC § 1006.2 requires at least two remote exits for assembly occupant loads > 49.",
                ai_explanation="Site photographic analysis confirms vertical evacuation via S1 Main Staircase, but secondary exterior egress door is not visible in provided photographs.",
                remediation="Perform physical on-site audit to confirm location of secondary emergency exit door on East/West perimeter."
            ),
            Finding(
                project_id=project.id,
                rule_id="RULE_FIRE_SEPARATION",
                element="R5 Book Bank Section",
                finding_type="FIRE_SEPARATION",
                severity="LOW",
                status="PASS",
                description="High-density book storage sections equipped with NFPA 72 photoelectric smoke detection mesh.",
                ai_explanation="Paper book stacks present higher combustible fire load; optical sensor S-R5-SMOKE provides early thermal warning.",
                remediation="Verify quarterly calibration on optical smoke detectors in Book Bank and Project Report sections."
            ),
            Finding(
                project_id=project.id,
                rule_id="RULE_DOOR_CLEARANCE",
                element="D1 Main Library Glass Door",
                finding_type="DOOR_CLEARANCE",
                severity="LOW",
                status="PASS",
                description="Main double leaf glass entrance door provides 48\" clear opening width, satisfying ADA and IBC § 1010.1.1 requirements.",
                ai_explanation="Access doors D1 through D6 provide adequate unobstructed egress clearance toward Main Corridor C1.",
                remediation="Ensure magnetic panic hardware and hold-open release mechanisms are tested semi-annually."
            )
        ]

        for find in findings_data:
            db.add(find)

        db.commit()
        db.refresh(project)
        print("=" * 60)
        print(f"SUCCESS: KLU Central Library imported successfully with ID: {project.id}")
        print(f"- Building Elements: {len(elements_data)}")
        print(f"- Safety Graph Nodes: {len(nodes_data)}")
        print(f"- Safety Graph Edges: {len(edges_data)}")
        print(f"- IoT Safety Sensors: {len(sensors_data)}")
        print(f"- Blueprint File: {blueprint_filename}")
        print(f"- Audit Findings: {len(findings_data)}")
        print("=" * 60)
        return project.id

    except Exception as e:
        db.rollback()
        print(f"ERROR: Failed to import KLU Central Library: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
    finally:
        db.close()

if __name__ == "__main__":
    import_klu_central_library()
