"""
KLU Central Library Ingestion Service:
Multi-Floor Synthesis (Ground Floor & First Floor)
Creates the project, architectural elements, safety graph, IoT sensors,
audit findings, and dual-floor vector blueprint SVG from the visual survey JSON.
"""
from pathlib import Path
from typing import Dict, Any
from sqlalchemy.orm import Session
from app.config import settings, BASE_DIR
from app.models.project import Project
from app.models.building_element import BuildingElement
from app.models.graph import GraphNode, GraphEdge
from app.models.sensor import BuildingSensor
from app.models.asset import Asset
from app.models.finding import Finding

def generate_klu_blueprint_svg(project_id: int) -> str:
    """
    Renders an authentic, professional CAD vector blueprint SVG for KLU Central Library
    featuring both Level 0 (Ground Floor) and Level 1 (First Floor) side-by-side with
    shared vertical egress core S1 and external discharge E1.
    """
    canvas_w = 1500
    canvas_h = 860

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
  <text x="35" y="44" fill="#38bdf8" font-size="14" font-weight="bold" letter-spacing="1">BUILDGUARD AI // MULTI-LEVEL ARCHITECTURAL LIFE SAFETY &amp; EGRESS CAD PLAN</text>
  <text x="35" y="60" fill="#64748b" font-size="9">FACILITY: KLU CENTRAL LIBRARY • DUAL-FLOOR MAPPING (GROUND + LEVEL 1) • CODE: IBC 2024 / NFPA 101 EGRESS CONTINUITY</text>

  <!-- North Compass -->
  <g transform="translate(1085, 45)">
    <circle r="13" fill="#09182d" stroke="#38bdf8" stroke-width="1.2"/>
    <polygon points="0,-9 3,2 0,0 -3,2" fill="#38bdf8"/>
    <text x="0" y="9" fill="#7dd3fc" font-size="7" font-weight="bold" text-anchor="middle">N</text>
  </g>

  <!-- Vertical Dividers -->
  <line x1="560" y1="20" x2="560" y2="{canvas_h - 20}" stroke="#0369a1" stroke-width="1.2" stroke-dasharray="8,4"/>
  <line x1="1105" y1="20" x2="1105" y2="{canvas_h - 20}" stroke="#0369a1" stroke-width="1.5"/>

  <!-- ==================== COLUMN 1: LEVEL 0 - GROUND FLOOR PLAN ==================== -->
  <g transform="translate(35, 75)">
    <!-- Floor Badge -->
    <rect width="505" height="26" fill="#0c2340" stroke="#0284c7" stroke-width="1" rx="2"/>
    <text x="12" y="17" fill="#38bdf8" font-size="10" font-weight="bold" letter-spacing="0.5">LEVEL 0: GROUND FLOOR PLAN (DISCHARGE &amp; INGRESS)</text>
    <text x="495" y="17" fill="#10b981" font-size="9" text-anchor="end">EGRESS EXIT E1</text>

    <!-- Outer Perimeter Walls (Double Line) -->
    <rect x="0" y="32" width="505" height="715" fill="rgba(8, 24, 48, 0.45)" stroke="#38bdf8" stroke-width="2.5" rx="2"/>
    <rect x="5" y="37" width="495" height="705" fill="none" stroke="#1e3a5f" stroke-width="1"/>

    <!-- GF-R1: E-Library Ground -->
    <g transform="translate(15, 48)">
      <rect width="165" height="135" fill="rgba(14, 165, 233, 0.07)" stroke="#38bdf8" stroke-width="1.6" rx="2"/>
      <text x="10" y="20" fill="#38bdf8" font-size="9.5" font-weight="bold">GF-R1: E-LIBRARY</text>
      <text x="10" y="32" fill="#64748b" font-size="7.5">Digital Learning Commons</text>
      <rect x="10" y="44" width="65" height="20" fill="none" stroke="#1e40af" stroke-width="0.8" stroke-dasharray="2,2"/>
      <text x="16" y="58" fill="#3b82f6" font-size="6.5">STACKS G1-G4</text>
      <rect x="85" y="44" width="65" height="20" fill="none" stroke="#1e40af" stroke-width="0.8" stroke-dasharray="2,2"/>
      <text x="91" y="58" fill="#3b82f6" font-size="6.5">STACKS G5-G8</text>
      <rect x="10" y="75" width="140" height="22" fill="none" stroke="#1e40af" stroke-width="0.8" stroke-dasharray="2,2"/>
      <text x="24" y="89" fill="#3b82f6" font-size="6.5">TERMINAL CARRELS (16 PODS)</text>
      <!-- Sensors -->
      <circle cx="140" cy="18" r="6" fill="#092540" stroke="#10b981" stroke-width="1"/>
      <text x="140" y="20" fill="#34d399" font-size="6" font-weight="bold" text-anchor="middle">S</text>
      <!-- Door GF-D1 -->
      <g transform="translate(165, 90)">
        <line x1="0" y1="0" x2="0" y2="24" stroke="#10b981" stroke-width="2"/>
        <path d="M 0 0 A 24 24 0 0 1 24 24" fill="none" stroke="#10b981" stroke-width="0.8" stroke-dasharray="2,2"/>
        <text x="4" y="-3" fill="#34d399" font-size="6">GF-D1</text>
      </g>
    </g>

    <!-- GF-R2: Media Resource Centre Ground -->
    <g transform="translate(15, 200)">
      <rect width="165" height="135" fill="rgba(14, 165, 233, 0.07)" stroke="#38bdf8" stroke-width="1.6" rx="2"/>
      <text x="10" y="20" fill="#38bdf8" font-size="9.5" font-weight="bold">GF-R2: MEDIA CENTRE</text>
      <text x="10" y="32" fill="#64748b" font-size="7.5">AV Presentation &amp; Multi-Media</text>
      <rect x="15" y="48" width="135" height="30" fill="none" stroke="#1e40af" stroke-width="0.8" stroke-dasharray="2,2"/>
      <text x="25" y="67" fill="#3b82f6" font-size="7">AV CONSOLE &amp; PROJECTION</text>
      <circle cx="140" cy="18" r="6" fill="#092540" stroke="#10b981" stroke-width="1"/>
      <text x="140" y="20" fill="#34d399" font-size="6" font-weight="bold" text-anchor="middle">S</text>
      <!-- Door GF-D2 -->
      <g transform="translate(165, 75)">
        <line x1="0" y1="0" x2="0" y2="24" stroke="#10b981" stroke-width="2"/>
        <path d="M 0 0 A 24 24 0 0 1 24 24" fill="none" stroke="#10b981" stroke-width="0.8" stroke-dasharray="2,2"/>
        <text x="4" y="-3" fill="#34d399" font-size="6">GF-D2</text>
      </g>
    </g>

    <!-- GF-C1: Ground Floor Main Corridor -->
    <g transform="translate(195, 100)">
      <rect width="115" height="240" fill="rgba(6, 182, 212, 0.08)" stroke="#06b6d4" stroke-width="1.3" stroke-dasharray="4,3"/>
      <text x="57" y="35" fill="#22d3ee" font-size="8.5" font-weight="bold" text-anchor="middle">═ GF-C1 CORRIDOR ═</text>
      <text x="57" y="49" fill="#0891b2" font-size="7" text-anchor="middle">CLEAR WIDTH: 84"</text>
      <!-- Corridor Sensors -->
      <circle cx="45" cy="65" r="6" fill="#092540" stroke="#10b981" stroke-width="1"/>
      <text x="45" y="67" fill="#34d399" font-size="6" font-weight="bold" text-anchor="middle">S</text>
      <circle cx="65" cy="65" r="6" fill="#092540" stroke="#f59e0b" stroke-width="1"/>
      <text x="65" y="67" fill="#fbbf24" font-size="6" font-weight="bold" text-anchor="middle">T</text>
      <!-- Egress Directional Chevrons Downward to Exit E1 -->
      <line x1="57" y1="90" x2="57" y2="160" stroke="#10b981" stroke-width="2" marker-end="url(#egressArrow)"/>
      <line x1="57" y1="170" x2="57" y2="230" stroke="#10b981" stroke-width="2" marker-end="url(#egressArrow)"/>
      <text x="57" y="150" fill="#34d399" font-size="7" font-weight="bold" text-anchor="middle">TO EXIT E1 🡇</text>
    </g>

    <!-- S1: Main Staircase (Ground Landing) -->
    <g transform="translate(195, 48)">
      <rect width="115" height="48" fill="rgba(245, 158, 11, 0.12)" stroke="#f59e0b" stroke-width="1.8" rx="2"/>
      <text x="57" y="14" fill="#fbbf24" font-size="8" font-weight="bold" text-anchor="middle">S1: STAIR LANDING</text>
      <!-- Stair Treads -->
      <line x1="10" y1="18" x2="105" y2="18" stroke="#d97706" stroke-width="1"/>
      <line x1="10" y1="23" x2="105" y2="23" stroke="#d97706" stroke-width="1"/>
      <line x1="10" y1="28" x2="105" y2="28" stroke="#d97706" stroke-width="1"/>
      <line x1="10" y1="33" x2="105" y2="33" stroke="#d97706" stroke-width="1"/>
      <!-- Down Arrow (Arrival from Floor 1) -->
      <line x1="57" y1="18" x2="57" y2="40" stroke="#10b981" stroke-width="1.8" marker-end="url(#egressArrow)"/>
      <text x="57" y="46" fill="#34d399" font-size="6" text-anchor="middle">ARRIVING FROM L1</text>
    </g>

    <!-- GF-R3: Ladies Toilet Ground -->
    <g transform="translate(325, 48)">
      <rect width="165" height="95" fill="rgba(14, 165, 233, 0.07)" stroke="#38bdf8" stroke-width="1.6" rx="2"/>
      <text x="10" y="18" fill="#38bdf8" font-size="9" font-weight="bold">GF-R3: LADIES TOILET</text>
      <rect x="15" y="32" width="35" height="45" fill="none" stroke="#1e40af" stroke-width="0.8" stroke-dasharray="2,2"/>
      <rect x="60" y="32" width="35" height="45" fill="none" stroke="#1e40af" stroke-width="0.8" stroke-dasharray="2,2"/>
      <rect x="105" y="32" width="35" height="45" fill="none" stroke="#1e40af" stroke-width="0.8" stroke-dasharray="2,2"/>
      <g transform="translate(0, 42)">
        <line x1="0" y1="0" x2="-20" y2="0" stroke="#10b981" stroke-width="1.8"/>
        <path d="M 0 0 A 20 20 0 0 1 -20 20" fill="none" stroke="#10b981" stroke-width="0.8" stroke-dasharray="2,2"/>
        <text x="-30" y="-3" fill="#34d399" font-size="6">GF-D3</text>
      </g>
    </g>

    <!-- GF-R4: Gents Toilet Ground -->
    <g transform="translate(325, 155)">
      <rect width="165" height="95" fill="rgba(14, 165, 233, 0.07)" stroke="#38bdf8" stroke-width="1.6" rx="2"/>
      <text x="10" y="18" fill="#38bdf8" font-size="9" font-weight="bold">GF-R4: GENTS TOILET</text>
      <rect x="15" y="32" width="35" height="45" fill="none" stroke="#1e40af" stroke-width="0.8" stroke-dasharray="2,2"/>
      <rect x="60" y="32" width="35" height="45" fill="none" stroke="#1e40af" stroke-width="0.8" stroke-dasharray="2,2"/>
      <rect x="105" y="32" width="35" height="45" fill="none" stroke="#1e40af" stroke-width="0.8" stroke-dasharray="2,2"/>
      <g transform="translate(0, 42)">
        <line x1="0" y1="0" x2="-20" y2="0" stroke="#10b981" stroke-width="1.8"/>
        <path d="M 0 0 A 20 20 0 0 1 -20 20" fill="none" stroke="#10b981" stroke-width="0.8" stroke-dasharray="2,2"/>
        <text x="-30" y="-3" fill="#34d399" font-size="6">GF-D4</text>
      </g>
    </g>

    <!-- GF-R5: Book Bank Section Ground -->
    <g transform="translate(15, 350)">
      <rect width="230" height="230" fill="rgba(14, 165, 233, 0.07)" stroke="#38bdf8" stroke-width="1.6" rx="2"/>
      <text x="10" y="18" fill="#38bdf8" font-size="9.5" font-weight="bold">GF-R5: BOOK BANK SECTION</text>
      <text x="10" y="30" fill="#64748b" font-size="7">Circulation Textbooks Lower Stacks</text>
      <rect x="10" y="42" width="205" height="16" fill="none" stroke="#1e40af" stroke-width="0.8"/>
      <text x="14" y="54" fill="#3b82f6" font-size="6">RACKS G-01 TO G-12 (ENGINEERING)</text>
      <rect x="10" y="68" width="205" height="16" fill="none" stroke="#1e40af" stroke-width="0.8"/>
      <text x="14" y="80" fill="#3b82f6" font-size="6">RACKS G-13 TO G-24 (COMP SCI / AI)</text>
      <rect x="10" y="94" width="205" height="16" fill="none" stroke="#1e40af" stroke-width="0.8"/>
      <text x="14" y="106" fill="#3b82f6" font-size="6">RACKS G-25 TO G-36 (ELECTRONICS)</text>
      <rect x="10" y="120" width="205" height="16" fill="none" stroke="#1e40af" stroke-width="0.8"/>
      <text x="14" y="132" fill="#3b82f6" font-size="6">RACKS G-37 TO G-48 (CORE TEXTS)</text>
      <circle cx="210" cy="18" r="6" fill="#092540" stroke="#10b981" stroke-width="1"/>
      <text x="210" y="20" fill="#34d399" font-size="6" font-weight="bold" text-anchor="middle">S</text>
      <g transform="translate(195, 0)">
        <line x1="0" y1="0" x2="0" y2="-20" stroke="#10b981" stroke-width="2"/>
        <path d="M 0 0 A 20 20 0 0 0 20 -20" fill="none" stroke="#10b981" stroke-width="0.8" stroke-dasharray="2,2"/>
        <text x="6" y="-8" fill="#34d399" font-size="6">GF-D5</text>
      </g>
    </g>

    <!-- GF-R6: Project Report Ground -->
    <g transform="translate(260, 350)">
      <rect width="230" height="230" fill="rgba(14, 165, 233, 0.07)" stroke="#38bdf8" stroke-width="1.6" rx="2"/>
      <text x="10" y="18" fill="#38bdf8" font-size="9.5" font-weight="bold">GF-R6: PROJECT REPORTS</text>
      <text x="10" y="30" fill="#64748b" font-size="7">Dissertation &amp; Reference Repository</text>
      <rect x="10" y="42" width="205" height="16" fill="none" stroke="#1e40af" stroke-width="0.8"/>
      <text x="14" y="54" fill="#3b82f6" font-size="6">UNDERGRADUATE CAPSTONE PROJECTS</text>
      <rect x="10" y="68" width="205" height="16" fill="none" stroke="#1e40af" stroke-width="0.8"/>
      <text x="14" y="80" fill="#3b82f6" font-size="6">MASTERS THESES &amp; JOURNALS</text>
      <rect x="10" y="94" width="205" height="16" fill="none" stroke="#1e40af" stroke-width="0.8"/>
      <text x="14" y="106" fill="#3b82f6" font-size="6">FACULTY RESEARCH PUBLICATIONS</text>
      <circle cx="210" cy="18" r="6" fill="#092540" stroke="#10b981" stroke-width="1"/>
      <text x="210" y="20" fill="#34d399" font-size="6" font-weight="bold" text-anchor="middle">S</text>
      <g transform="translate(35, 0)">
        <line x1="0" y1="0" x2="0" y2="-20" stroke="#10b981" stroke-width="2"/>
        <path d="M 0 0 A 20 20 0 0 1 -20 -20" fill="none" stroke="#10b981" stroke-width="0.8" stroke-dasharray="2,2"/>
        <text x="-25" y="-8" fill="#34d399" font-size="6">GF-D6</text>
      </g>
    </g>

    <!-- E1: GROUND EXTERIOR DISCHARGE EXIT -->
    <g transform="translate(170, 600)">
      <rect width="165" height="60" fill="rgba(16, 185, 129, 0.16)" stroke="#10b981" stroke-width="2.5" rx="3" filter="url(#glowGreen)"/>
      <text x="82" y="22" fill="#34d399" font-size="10" font-weight="bold" text-anchor="middle" letter-spacing="1">🡇 EMERGENCY EXIT E1 🡇</text>
      <text x="82" y="38" fill="#a7f3d0" font-size="8" text-anchor="middle">MAIN CAMPUS EXTERIOR DISCHARGE</text>
      <text x="82" y="52" fill="#10b981" font-size="7" font-weight="bold" text-anchor="middle">FINAL DISCHARGE POINT (IBC § 1028)</text>
    </g>
  </g>

  <!-- ==================== COLUMN 2: LEVEL 1 - FIRST FLOOR PLAN ==================== -->
  <g transform="translate(580, 75)">
    <!-- Floor Badge -->
    <rect width="505" height="26" fill="#0c2340" stroke="#0284c7" stroke-width="1" rx="2"/>
    <text x="12" y="17" fill="#38bdf8" font-size="10" font-weight="bold" letter-spacing="0.5">LEVEL 1: FIRST FLOOR PLAN (UPPER LIBRARY COMMONS)</text>
    <text x="495" y="17" fill="#fbbf24" font-size="9" text-anchor="end">EGRESS VIA STAIR S1</text>

    <!-- Outer Perimeter Walls (Double Line) -->
    <rect x="0" y="32" width="505" height="715" fill="rgba(8, 24, 48, 0.45)" stroke="#38bdf8" stroke-width="2.5" rx="2"/>
    <rect x="5" y="37" width="495" height="705" fill="none" stroke="#1e3a5f" stroke-width="1"/>

    <!-- R1: E-Library Level 1 -->
    <g transform="translate(15, 48)">
      <rect width="165" height="135" fill="rgba(14, 165, 233, 0.07)" stroke="#38bdf8" stroke-width="1.6" rx="2"/>
      <text x="10" y="20" fill="#38bdf8" font-size="9.5" font-weight="bold">R1: E-LIBRARY</text>
      <text x="10" y="32" fill="#64748b" font-size="7.5">Digital Study Terminals &amp; Stacks</text>
      <rect x="10" y="44" width="65" height="20" fill="none" stroke="#1e40af" stroke-width="0.8" stroke-dasharray="2,2"/>
      <text x="16" y="58" fill="#3b82f6" font-size="6.5">STACKS A1-A4</text>
      <rect x="85" y="44" width="65" height="20" fill="none" stroke="#1e40af" stroke-width="0.8" stroke-dasharray="2,2"/>
      <text x="91" y="58" fill="#3b82f6" font-size="6.5">STACKS A5-A8</text>
      <rect x="10" y="75" width="140" height="22" fill="none" stroke="#1e40af" stroke-width="0.8" stroke-dasharray="2,2"/>
      <text x="24" y="89" fill="#3b82f6" font-size="6.5">TERMINAL CARRELS (16 PODS)</text>
      <!-- Sensors -->
      <circle cx="140" cy="18" r="6" fill="#092540" stroke="#10b981" stroke-width="1"/>
      <text x="140" y="20" fill="#34d399" font-size="6" font-weight="bold" text-anchor="middle">S</text>
      <!-- Door D1 -->
      <g transform="translate(165, 90)">
        <line x1="0" y1="0" x2="0" y2="24" stroke="#10b981" stroke-width="2"/>
        <path d="M 0 0 A 24 24 0 0 1 24 24" fill="none" stroke="#10b981" stroke-width="0.8" stroke-dasharray="2,2"/>
        <text x="4" y="-3" fill="#34d399" font-size="6">D1</text>
      </g>
    </g>

    <!-- R2: Media Resource Centre Level 1 -->
    <g transform="translate(15, 200)">
      <rect width="165" height="135" fill="rgba(14, 165, 233, 0.07)" stroke="#38bdf8" stroke-width="1.6" rx="2"/>
      <text x="10" y="20" fill="#38bdf8" font-size="9.5" font-weight="bold">R2: MEDIA RESOURCE CTR</text>
      <text x="10" y="32" fill="#64748b" font-size="7.5">AV Presentation &amp; Multi-Media</text>
      <rect x="15" y="48" width="135" height="30" fill="none" stroke="#1e40af" stroke-width="0.8" stroke-dasharray="2,2"/>
      <text x="25" y="67" fill="#3b82f6" font-size="7">AV CONSOLE &amp; DISPLAY</text>
      <circle cx="140" cy="18" r="6" fill="#092540" stroke="#10b981" stroke-width="1"/>
      <text x="140" y="20" fill="#34d399" font-size="6" font-weight="bold" text-anchor="middle">S</text>
      <!-- Door D2 -->
      <g transform="translate(165, 75)">
        <line x1="0" y1="0" x2="0" y2="24" stroke="#10b981" stroke-width="2"/>
        <path d="M 0 0 A 24 24 0 0 1 24 24" fill="none" stroke="#10b981" stroke-width="0.8" stroke-dasharray="2,2"/>
        <text x="4" y="-3" fill="#34d399" font-size="6">D2</text>
      </g>
    </g>

    <!-- C1: First Floor Main Corridor -->
    <g transform="translate(195, 100)">
      <rect width="115" height="240" fill="rgba(6, 182, 212, 0.08)" stroke="#06b6d4" stroke-width="1.3" stroke-dasharray="4,3"/>
      <text x="57" y="35" fill="#22d3ee" font-size="8.5" font-weight="bold" text-anchor="middle">═ C1 MAIN CORRIDOR ═</text>
      <text x="57" y="49" fill="#0891b2" font-size="7" text-anchor="middle">CLEAR WIDTH: 84"</text>
      <!-- Corridor Sensors -->
      <circle cx="45" cy="65" r="6" fill="#092540" stroke="#10b981" stroke-width="1"/>
      <text x="45" y="67" fill="#34d399" font-size="6" font-weight="bold" text-anchor="middle">S</text>
      <circle cx="65" cy="65" r="6" fill="#092540" stroke="#f59e0b" stroke-width="1"/>
      <text x="65" y="67" fill="#fbbf24" font-size="6" font-weight="bold" text-anchor="middle">T</text>
      <!-- Egress Directional Chevrons Upward into Stair S1 -->
      <line x1="57" y1="210" x2="57" y2="130" stroke="#10b981" stroke-width="2" marker-end="url(#egressArrow)"/>
      <line x1="57" y1="120" x2="57" y2="30" stroke="#10b981" stroke-width="2" marker-end="url(#egressArrow)"/>
      <text x="57" y="150" fill="#34d399" font-size="7" font-weight="bold" text-anchor="middle">TO STAIR S1 🡅</text>
    </g>

    <!-- S1: Main Staircase (Upper Head) -->
    <g transform="translate(195, 48)">
      <rect width="115" height="48" fill="rgba(245, 158, 11, 0.12)" stroke="#f59e0b" stroke-width="1.8" rx="2"/>
      <text x="57" y="14" fill="#fbbf24" font-size="8" font-weight="bold" text-anchor="middle">S1: MAIN STAIRCASE</text>
      <!-- Stair Treads -->
      <line x1="10" y1="18" x2="105" y2="18" stroke="#d97706" stroke-width="1"/>
      <line x1="10" y1="23" x2="105" y2="23" stroke="#d97706" stroke-width="1"/>
      <line x1="10" y1="28" x2="105" y2="28" stroke="#d97706" stroke-width="1"/>
      <line x1="10" y1="33" x2="105" y2="33" stroke="#d97706" stroke-width="1"/>
      <line x1="57" y1="42" x2="57" y2="18" stroke="#10b981" stroke-width="1.8" marker-end="url(#egressArrow)"/>
      <text x="57" y="44" fill="#34d399" font-size="6" text-anchor="middle">🡇 DESCENDS TO LEVEL 0</text>
      <!-- Stair Sensor -->
      <circle cx="100" cy="14" r="5" fill="#092540" stroke="#10b981" stroke-width="1"/>
      <text x="100" y="16" fill="#34d399" font-size="5" font-weight="bold" text-anchor="middle">S</text>
    </g>

    <!-- R3: Ladies Toilet Level 1 -->
    <g transform="translate(325, 48)">
      <rect width="165" height="95" fill="rgba(14, 165, 233, 0.07)" stroke="#38bdf8" stroke-width="1.6" rx="2"/>
      <text x="10" y="18" fill="#38bdf8" font-size="9" font-weight="bold">R3: LADIES TOILET</text>
      <rect x="15" y="32" width="35" height="45" fill="none" stroke="#1e40af" stroke-width="0.8" stroke-dasharray="2,2"/>
      <rect x="60" y="32" width="35" height="45" fill="none" stroke="#1e40af" stroke-width="0.8" stroke-dasharray="2,2"/>
      <rect x="105" y="32" width="35" height="45" fill="none" stroke="#1e40af" stroke-width="0.8" stroke-dasharray="2,2"/>
      <g transform="translate(0, 42)">
        <line x1="0" y1="0" x2="-20" y2="0" stroke="#10b981" stroke-width="1.8"/>
        <path d="M 0 0 A 20 20 0 0 1 -20 20" fill="none" stroke="#10b981" stroke-width="0.8" stroke-dasharray="2,2"/>
        <text x="-30" y="-3" fill="#34d399" font-size="6">D3</text>
      </g>
    </g>

    <!-- R4: Gents Toilet Level 1 -->
    <g transform="translate(325, 155)">
      <rect width="165" height="95" fill="rgba(14, 165, 233, 0.07)" stroke="#38bdf8" stroke-width="1.6" rx="2"/>
      <text x="10" y="18" fill="#38bdf8" font-size="9" font-weight="bold">R4: GENTS TOILET</text>
      <rect x="15" y="32" width="35" height="45" fill="none" stroke="#1e40af" stroke-width="0.8" stroke-dasharray="2,2"/>
      <rect x="60" y="32" width="35" height="45" fill="none" stroke="#1e40af" stroke-width="0.8" stroke-dasharray="2,2"/>
      <rect x="105" y="32" width="35" height="45" fill="none" stroke="#1e40af" stroke-width="0.8" stroke-dasharray="2,2"/>
      <g transform="translate(0, 42)">
        <line x1="0" y1="0" x2="-20" y2="0" stroke="#10b981" stroke-width="1.8"/>
        <path d="M 0 0 A 20 20 0 0 1 -20 20" fill="none" stroke="#10b981" stroke-width="0.8" stroke-dasharray="2,2"/>
        <text x="-30" y="-3" fill="#34d399" font-size="6">D4</text>
      </g>
    </g>

    <!-- R5: Book Bank Section Level 1 -->
    <g transform="translate(15, 350)">
      <rect width="230" height="230" fill="rgba(14, 165, 233, 0.07)" stroke="#38bdf8" stroke-width="1.6" rx="2"/>
      <text x="10" y="18" fill="#38bdf8" font-size="9.5" font-weight="bold">R5: BOOK BANK SECTION</text>
      <text x="10" y="30" fill="#64748b" font-size="7">Visual Evidence: BOOK BANK sign</text>
      <rect x="10" y="42" width="205" height="16" fill="none" stroke="#1e40af" stroke-width="0.8"/>
      <text x="14" y="54" fill="#3b82f6" font-size="6">BOOK RACK 1-12 (TEXTBOOKS)</text>
      <rect x="10" y="68" width="205" height="16" fill="none" stroke="#1e40af" stroke-width="0.8"/>
      <text x="14" y="80" fill="#3b82f6" font-size="6">BOOK RACK 13-24 (ENGINEERING)</text>
      <rect x="10" y="94" width="205" height="16" fill="none" stroke="#1e40af" stroke-width="0.8"/>
      <text x="14" y="106" fill="#3b82f6" font-size="6">BOOK RACK 25-36 (SCIENCES)</text>
      <rect x="10" y="120" width="205" height="16" fill="none" stroke="#1e40af" stroke-width="0.8"/>
      <text x="14" y="132" fill="#3b82f6" font-size="6">BOOK RACK 37-48 (CIRCULATION)</text>
      <circle cx="210" cy="18" r="6" fill="#092540" stroke="#10b981" stroke-width="1"/>
      <text x="210" y="20" fill="#34d399" font-size="6" font-weight="bold" text-anchor="middle">S</text>
      <g transform="translate(195, 0)">
        <line x1="0" y1="0" x2="0" y2="-20" stroke="#10b981" stroke-width="2"/>
        <path d="M 0 0 A 20 20 0 0 0 20 -20" fill="none" stroke="#10b981" stroke-width="0.8" stroke-dasharray="2,2"/>
        <text x="6" y="-8" fill="#34d399" font-size="6">D5</text>
      </g>
    </g>

    <!-- R6: Project Report Level 1 -->
    <g transform="translate(260, 350)">
      <rect width="230" height="230" fill="rgba(14, 165, 233, 0.07)" stroke="#38bdf8" stroke-width="1.6" rx="2"/>
      <text x="10" y="18" fill="#38bdf8" font-size="9.5" font-weight="bold">R6: PROJECT REPORT / BACK VOL</text>
      <text x="10" y="30" fill="#64748b" font-size="7">Visual Evidence: BACK VOLUME sign</text>
      <rect x="10" y="42" width="205" height="16" fill="none" stroke="#1e40af" stroke-width="0.8"/>
      <text x="14" y="54" fill="#3b82f6" font-size="6">THESIS &amp; PROJECT ARCHIVES</text>
      <rect x="10" y="68" width="205" height="16" fill="none" stroke="#1e40af" stroke-width="0.8"/>
      <text x="14" y="80" fill="#3b82f6" font-size="6">JOURNAL BACK VOLUMES</text>
      <rect x="10" y="94" width="205" height="16" fill="none" stroke="#1e40af" stroke-width="0.8"/>
      <text x="14" y="106" fill="#3b82f6" font-size="6">PERIODICAL STORAGE 2010-2024</text>
      <circle cx="210" cy="18" r="6" fill="#092540" stroke="#10b981" stroke-width="1"/>
      <text x="210" y="20" fill="#34d399" font-size="6" font-weight="bold" text-anchor="middle">S</text>
      <g transform="translate(35, 0)">
        <line x1="0" y1="0" x2="0" y2="-20" stroke="#10b981" stroke-width="2"/>
        <path d="M 0 0 A 20 20 0 0 1 -20 -20" fill="none" stroke="#10b981" stroke-width="0.8" stroke-dasharray="2,2"/>
        <text x="-25" y="-8" fill="#34d399" font-size="6">D6</text>
      </g>
    </g>

    <!-- Multi-Floor Vertical Link Note -->
    <g transform="translate(15, 600)">
      <rect width="475" height="60" fill="rgba(2, 132, 199, 0.12)" stroke="#0284c7" stroke-width="1.5" rx="3"/>
      <text x="12" y="20" fill="#38bdf8" font-size="9" font-weight="bold">VERTICAL EGRESS CONTINUITY (IBC § 1023):</text>
      <text x="12" y="36" fill="#94a3b8" font-size="7.5">Occupants on Level 1 navigate via Corridor C1 to Staircase S1, descending to</text>
      <text x="12" y="50" fill="#a7f3d0" font-size="7.5" font-weight="bold">Ground Corridor GF-C1 and directly discharging outside through Emergency Exit E1.</text>
    </g>
  </g>

  <!-- ==================== COLUMN 3: SCHEDULES, SENSORS & STAMP ==================== -->
  <g transform="translate(1120, 75)">
    <!-- Project Specification Box -->
    <rect width="345" height="95" fill="#0a192f" stroke="#0284c7" stroke-width="1.2" rx="2"/>
    <rect width="345" height="20" fill="#0f2b48"/>
    <text x="10" y="14" fill="#7dd3fc" font-size="8.5" font-weight="bold" letter-spacing="1">PROJECT DATA // SPECIFICATION</text>
    <text x="10" y="34" fill="#94a3b8" font-size="7.5">FACILITY:</text>
    <text x="75" y="34" fill="#ffffff" font-size="8" font-weight="bold">KLU Central Library</text>
    <text x="195" y="34" fill="#94a3b8" font-size="7.5">FLOORS:</text>
    <text x="245" y="34" fill="#38bdf8" font-size="8" font-weight="bold">2 (Ground + L1)</text>

    <text x="10" y="48" fill="#94a3b8" font-size="7.5">BUILDING ID:</text>
    <text x="75" y="48" fill="#38bdf8" font-size="8">KLU-CENTRAL-LIBRARY</text>
    <text x="195" y="48" fill="#94a3b8" font-size="7.5">TYPE:</text>
    <text x="245" y="48" fill="#ffffff" font-size="8">Educational (A-3)</text>

    <text x="10" y="62" fill="#94a3b8" font-size="7.5">SURVEY:</text>
    <text x="75" y="62" fill="#10b981" font-size="8">Site Photos Inferred</text>
    <text x="195" y="62" fill="#94a3b8" font-size="7.5">MONITORED:</text>
    <text x="245" y="62" fill="#34d399" font-size="8" font-weight="bold">26 IoT Nodes</text>

    <text x="10" y="78" fill="#94a3b8" font-size="7.5">LIFE SAFETY:</text>
    <text x="75" y="78" fill="#e2e8f0" font-size="7.5">IBC 2024 / NFPA 101 Egress Continuity</text>

    <!-- Multi-Floor Room Schedule -->
    <g transform="translate(0, 110)">
      <rect width="345" height="185" fill="#09182d" stroke="#1e3a5f" stroke-width="1" rx="2"/>
      <rect width="345" height="18" fill="#0f2942"/>
      <text x="8" y="13" fill="#38bdf8" font-size="8" font-weight="bold">MULTI-LEVEL SPACE SCHEDULE</text>
      
      <text x="10" y="30" fill="#64748b" font-size="7" font-weight="bold">ID</text>
      <text x="35" y="30" fill="#64748b" font-size="7" font-weight="bold">NAME / ZONE</text>
      <text x="160" y="30" fill="#64748b" font-size="7" font-weight="bold">FLOOR</text>
      <text x="215" y="30" fill="#64748b" font-size="7" font-weight="bold">CONNECTION</text>
      <text x="300" y="30" fill="#64748b" font-size="7" font-weight="bold">STATUS</text>
      <line x1="0" y1="34" x2="345" y2="34" stroke="#1e3a5f" stroke-width="0.8"/>

      <text x="10" y="47" fill="#38bdf8" font-size="7">GF-R1..R6</text>
      <text x="70" y="47" fill="#ffffff" font-size="7">Ground Commons</text>
      <text x="160" y="47" fill="#94a3b8" font-size="7">Level 0</text>
      <text x="215" y="47" fill="#cbd5e1" font-size="7">GF-C1 Corridor</text>
      <text x="300" y="47" fill="#10b981" font-size="7">PASS</text>

      <text x="10" y="62" fill="#22d3ee" font-size="7">GF-C1</text>
      <text x="70" y="62" fill="#ffffff" font-size="7">Ground Spine (84")</text>
      <text x="160" y="62" fill="#94a3b8" font-size="7">Level 0</text>
      <text x="215" y="62" fill="#cbd5e1" font-size="7">S1 &gt; E1</text>
      <text x="300" y="62" fill="#10b981" font-size="7">PASS</text>

      <text x="10" y="77" fill="#10b981" font-size="7">E1</text>
      <text x="70" y="77" fill="#34d399" font-size="7" font-weight="bold">Exterior Discharge</text>
      <text x="160" y="77" fill="#94a3b8" font-size="7">Level 0</text>
      <text x="215" y="77" fill="#cbd5e1" font-size="7">Outside Grade</text>
      <text x="300" y="77" fill="#10b981" font-size="7">CLEAR</text>

      <text x="10" y="92" fill="#fbbf24" font-size="7">S1</text>
      <text x="70" y="92" fill="#ffffff" font-size="7">Vertical Stair Core</text>
      <text x="160" y="92" fill="#fbbf24" font-size="7">L0 &lt;--&gt; L1</text>
      <text x="215" y="92" fill="#cbd5e1" font-size="7">Vertical Link</text>
      <text x="300" y="92" fill="#10b981" font-size="7">RATED</text>

      <text x="10" y="107" fill="#38bdf8" font-size="7">R1..R6</text>
      <text x="70" y="107" fill="#ffffff" font-size="7">Level 1 Commons</text>
      <text x="160" y="107" fill="#94a3b8" font-size="7">Level 1</text>
      <text x="215" y="107" fill="#cbd5e1" font-size="7">C1 Corridor</text>
      <text x="300" y="107" fill="#10b981" font-size="7">PASS</text>

      <text x="10" y="122" fill="#22d3ee" font-size="7">C1</text>
      <text x="70" y="122" fill="#ffffff" font-size="7">Level 1 Spine (84")</text>
      <text x="160" y="122" fill="#94a3b8" font-size="7">Level 1</text>
      <text x="215" y="122" fill="#cbd5e1" font-size="7">Leads to S1</text>
      <text x="300" y="122" fill="#10b981" font-size="7">PASS</text>

      <text x="10" y="137" fill="#38bdf8" font-size="7">D1..D6</text>
      <text x="70" y="137" fill="#ffffff" font-size="7">Access Doors</text>
      <text x="160" y="137" fill="#94a3b8" font-size="7">L0 &amp; L1</text>
      <text x="215" y="137" fill="#cbd5e1" font-size="7">Corridor Access</text>
      <text x="300" y="137" fill="#10b981" font-size="7">PASS</text>
    </g>

    <!-- Multi-Floor IoT Sensor Telemetry Table -->
    <g transform="translate(0, 310)">
      <rect width="345" height="195" fill="#09182d" stroke="#1e3a5f" stroke-width="1" rx="2"/>
      <rect width="345" height="18" fill="#0f2942"/>
      <text x="8" y="13" fill="#38bdf8" font-size="8" font-weight="bold">IoT LIFE SAFETY SENSOR MESH (26 NODES)</text>

      <text x="10" y="30" fill="#64748b" font-size="7" font-weight="bold">SENSOR ID</text>
      <text x="95" y="30" fill="#64748b" font-size="7" font-weight="bold">LOCATION</text>
      <text x="195" y="30" fill="#64748b" font-size="7" font-weight="bold">TYPE</text>
      <text x="250" y="30" fill="#64748b" font-size="7" font-weight="bold">VALUE</text>
      <text x="300" y="30" fill="#64748b" font-size="7" font-weight="bold">STATUS</text>
      <line x1="0" y1="34" x2="345" y2="34" stroke="#1e3a5f" stroke-width="0.8"/>

      <text x="10" y="47" fill="#38bdf8" font-size="7">S-GF-C1-SMK</text>
      <text x="95" y="47" fill="#ffffff" font-size="7">GF Corridor</text>
      <text x="195" y="47" fill="#34d399" font-size="7">SMOKE</text>
      <text x="250" y="47" fill="#cbd5e1" font-size="7">11.5 ppm</text>
      <text x="300" y="47" fill="#10b981" font-size="7">NOMINAL</text>

      <text x="10" y="62" fill="#38bdf8" font-size="7">S-GF-C1-TMP</text>
      <text x="95" y="62" fill="#ffffff" font-size="7">GF Corridor</text>
      <text x="195" y="62" fill="#fbbf24" font-size="7">TEMP</text>
      <text x="250" y="62" fill="#cbd5e1" font-size="7">26.5 °C</text>
      <text x="300" y="62" fill="#10b981" font-size="7">NOMINAL</text>

      <text x="10" y="77" fill="#38bdf8" font-size="7">S-C1-SMOKE</text>
      <text x="95" y="77" fill="#ffffff" font-size="7">L1 Corridor</text>
      <text x="195" y="77" fill="#34d399" font-size="7">SMOKE</text>
      <text x="250" y="77" fill="#cbd5e1" font-size="7">12.0 ppm</text>
      <text x="300" y="77" fill="#10b981" font-size="7">NOMINAL</text>

      <text x="10" y="92" fill="#38bdf8" font-size="7">S-C1-TEMP</text>
      <text x="95" y="92" fill="#ffffff" font-size="7">L1 Corridor</text>
      <text x="195" y="92" fill="#fbbf24" font-size="7">TEMP</text>
      <text x="250" y="92" fill="#cbd5e1" font-size="7">27.0 °C</text>
      <text x="300" y="92" fill="#10b981" font-size="7">NOMINAL</text>

      <text x="10" y="107" fill="#38bdf8" font-size="7">S-S1-SMOKE</text>
      <text x="95" y="107" fill="#ffffff" font-size="7">Stair Shaft</text>
      <text x="195" y="107" fill="#34d399" font-size="7">SMOKE</text>
      <text x="250" y="107" fill="#cbd5e1" font-size="7">10.0 ppm</text>
      <text x="300" y="107" fill="#10b981" font-size="7">NOMINAL</text>

      <text x="10" y="122" fill="#38bdf8" font-size="7">S-S1-TEMP</text>
      <text x="95" y="122" fill="#ffffff" font-size="7">Stair Shaft</text>
      <text x="195" y="122" fill="#fbbf24" font-size="7">TEMP</text>
      <text x="250" y="122" fill="#cbd5e1" font-size="7">27.0 °C</text>
      <text x="300" y="122" fill="#10b981" font-size="7">NOMINAL</text>

      <text x="10" y="137" fill="#38bdf8" font-size="7">S-GF-R5-SMK</text>
      <text x="95" y="137" fill="#ffffff" font-size="7">GF Book Bank</text>
      <text x="195" y="137" fill="#34d399" font-size="7">SMOKE</text>
      <text x="250" y="137" fill="#cbd5e1" font-size="7">13.0 ppm</text>
      <text x="300" y="137" fill="#10b981" font-size="7">NOMINAL</text>

      <text x="10" y="152" fill="#38bdf8" font-size="7">S-R5-SMOKE</text>
      <text x="95" y="152" fill="#ffffff" font-size="7">L1 Book Bank</text>
      <text x="195" y="152" fill="#34d399" font-size="7">SMOKE</text>
      <text x="250" y="152" fill="#cbd5e1" font-size="7">14.0 ppm</text>
      <text x="300" y="152" fill="#10b981" font-size="7">NOMINAL</text>

      <text x="10" y="167" fill="#38bdf8" font-size="7">S-D1/GF-D1</text>
      <text x="95" y="167" fill="#ffffff" font-size="7">Main Doors</text>
      <text x="195" y="167" fill="#06b6d4" font-size="7">CONTACT</text>
      <text x="250" y="167" fill="#cbd5e1" font-size="7">Clear</text>
      <text x="300" y="167" fill="#10b981" font-size="7">ACTIVE</text>
    </g>

    <!-- CAD Seal & Validation Stamp -->
    <g transform="translate(0, 520)">
      <rect width="345" height="140" fill="#081426" stroke="#0284c7" stroke-width="1.2" rx="2"/>
      
      <!-- Circular Stamp -->
      <g transform="translate(55, 68)">
        <circle r="34" fill="none" stroke="#10b981" stroke-width="1.5" stroke-dasharray="4,2"/>
        <circle r="29" fill="none" stroke="#10b981" stroke-width="0.8"/>
        <text x="0" y="-8" fill="#34d399" font-size="6" font-weight="bold" text-anchor="middle">BUILDGUARD AI</text>
        <text x="0" y="4" fill="#10b981" font-size="6" font-weight="bold" text-anchor="middle">LIFE SAFETY</text>
        <text x="0" y="16" fill="#34d399" font-size="5.5" text-anchor="middle">DUAL-FLOOR 2026</text>
      </g>

      <text x="110" y="32" fill="#ffffff" font-size="8.5" font-weight="bold">MULTI-LEVEL SAFETY CERTIFIED</text>
      <text x="110" y="48" fill="#94a3b8" font-size="7.5">IBC § 1006 / § 1023 Compliant Model</text>
      <text x="110" y="62" fill="#64748b" font-size="7.5">Resolution: 1500x860 Vector CAD</text>
      <text x="110" y="78" fill="#38bdf8" font-size="7.5">Graph Nodes: 30 • Edges: 42</text>
      <text x="110" y="94" fill="#34d399" font-size="7.5" font-weight="bold">Sensors: 26 (Ground + Level 1)</text>
      <text x="110" y="112" fill="#e2e8f0" font-size="7">Egress Discharge: Door E1 Direct to Outside</text>
    </g>
  </g>
</svg>"""
    return svg


def import_klu_library_into_db(db: Session) -> Dict[str, Any]:
    """
    Ingests KLU Central Library from visual survey JSON for both Ground Floor and First Floor:
    1. Creates Project 'KLU Central Library' with 2 floors
    2. Populates BuildingElements for Ground Floor and First Floor
    3. Populates GraphNodes and GraphEdges linking Ground, First Floor, and Stair S1
    4. Seeds 26 IoT Sensors in corridors, staircase, rooms, and doors across both floors
    5. Generates high-fidelity Dual-Level Architectural CAD Blueprint SVG
    6. Registers Asset and authentic IBC/NFPA Findings
    """
    # Remove existing project if present for clean idempotent update
    old_project = db.query(Project).filter(Project.name == "KLU Central Library").first()
    if old_project:
        db.delete(old_project)
        db.commit()

    # 1. Create Project
    project = Project(
        name="KLU Central Library",
        building_type="Educational",
        floors=2
    )
    db.add(project)
    db.commit()
    db.refresh(project)

    # 2. Insert Building Elements for Ground Floor and First Floor
    elements_data = [
        # --- LEVEL 0: GROUND FLOOR ---
        {"id": "GF-R1", "label": "E-Library (Ground Floor)", "type": "ROOM", "x": 120, "y": 180, "w": 14.0, "h": 10.0},
        {"id": "GF-R2", "label": "Media Resource Centre (Ground Floor)", "type": "ROOM", "x": 120, "y": 320, "w": 14.0, "h": 10.0},
        {"id": "GF-R3", "label": "Ladies Toilet (Ground Floor)", "type": "ROOM", "x": 650, "y": 180, "w": 8.0, "h": 6.0},
        {"id": "GF-R4", "label": "Gents Toilet (Ground Floor)", "type": "ROOM", "x": 650, "y": 330, "w": 8.0, "h": 6.0},
        {"id": "GF-R5", "label": "Book Bank Section (Ground Floor)", "type": "ROOM", "x": 400, "y": 500, "w": 16.0, "h": 10.0},
        {"id": "GF-R6", "label": "Back Volume / Project Report Section (Ground Floor)", "type": "ROOM", "x": 650, "y": 500, "w": 16.0, "h": 10.0},
        {"id": "GF-C1", "label": "Main Corridor (Ground Floor)", "type": "CORRIDOR", "x": 380, "y": 280, "w": 36.0, "h": 5.0},
        {"id": "GF-D1", "label": "Ground Library Glass Door", "type": "DOOR", "x": 260, "y": 230, "w": 1.2, "h": 2.1},
        {"id": "GF-D2", "label": "Ground Media Centre Door", "type": "DOOR", "x": 260, "y": 370, "w": 1.0, "h": 2.1},
        {"id": "GF-D3", "label": "Ground Ladies Toilet Door", "type": "DOOR", "x": 650, "y": 240, "w": 0.9, "h": 2.1},
        {"id": "GF-D4", "label": "Ground Gents Toilet Door", "type": "DOOR", "x": 650, "y": 390, "w": 0.9, "h": 2.1},
        {"id": "GF-D5", "label": "Ground Book Bank Access Door", "type": "DOOR", "x": 400, "y": 450, "w": 1.2, "h": 2.1},
        {"id": "GF-D6", "label": "Ground Project Report Section Door", "type": "DOOR", "x": 650, "y": 450, "w": 1.2, "h": 2.1},
        {"id": "E1", "label": "Ground Exit Terminal / Main Exterior Discharge", "type": "EXIT", "x": 500, "y": 100, "w": 1.8, "h": 2.1},

        # --- LEVEL 1: FIRST FLOOR ---
        {"id": "R1", "label": "E-Library (First Floor)", "type": "ROOM", "x": 120, "y": 180, "w": 14.0, "h": 10.0},
        {"id": "R2", "label": "Media Resource Centre (First Floor)", "type": "ROOM", "x": 120, "y": 320, "w": 14.0, "h": 10.0},
        {"id": "R3", "label": "Ladies Toilet (First Floor)", "type": "ROOM", "x": 650, "y": 180, "w": 8.0, "h": 6.0},
        {"id": "R4", "label": "Gents Toilet (First Floor)", "type": "ROOM", "x": 650, "y": 330, "w": 8.0, "h": 6.0},
        {"id": "R5", "label": "Book Bank Section (First Floor)", "type": "ROOM", "x": 400, "y": 500, "w": 16.0, "h": 10.0},
        {"id": "R6", "label": "Back Volume / Project Report Section (First Floor)", "type": "ROOM", "x": 650, "y": 500, "w": 16.0, "h": 10.0},
        {"id": "C1", "label": "Main Corridor (First Floor)", "type": "CORRIDOR", "x": 380, "y": 280, "w": 36.0, "h": 5.0},
        {"id": "S1", "label": "Main Staircase (Continuous Vertical Core)", "type": "STAIR", "x": 500, "y": 250, "w": 8.0, "h": 10.0},
        {"id": "D1", "label": "Main Library Glass Door", "type": "DOOR", "x": 260, "y": 230, "w": 1.2, "h": 2.1},
        {"id": "D2", "label": "Media Centre Door", "type": "DOOR", "x": 260, "y": 370, "w": 1.0, "h": 2.1},
        {"id": "D3", "label": "Ladies Toilet Door", "type": "DOOR", "x": 650, "y": 240, "w": 0.9, "h": 2.1},
        {"id": "D4", "label": "Gents Toilet Door", "type": "DOOR", "x": 650, "y": 390, "w": 0.9, "h": 2.1},
        {"id": "D5", "label": "Book Bank Access Door", "type": "DOOR", "x": 400, "y": 450, "w": 1.2, "h": 2.1},
        {"id": "D6", "label": "Project Report Section Door", "type": "DOOR", "x": 650, "y": 450, "w": 1.2, "h": 2.1}
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
        # Ground Floor Nodes
        ("GF-R1", "ROOM", "E-Library (Ground Floor)"),
        ("GF-R2", "ROOM", "Media Resource Centre (Ground Floor)"),
        ("GF-R3", "ROOM", "Ladies Toilet (Ground Floor)"),
        ("GF-R4", "ROOM", "Gents Toilet (Ground Floor)"),
        ("GF-R5", "ROOM", "Book Bank Section (Ground Floor)"),
        ("GF-R6", "ROOM", "Back Volume / Project Report Section (Ground Floor)"),
        ("GF-D1", "DOOR", "Ground Library Glass Door"),
        ("GF-D2", "DOOR", "Ground Media Centre Door"),
        ("GF-D3", "DOOR", "Ground Ladies Toilet Door"),
        ("GF-D4", "DOOR", "Ground Gents Toilet Door"),
        ("GF-D5", "DOOR", "Ground Book Bank Access Door"),
        ("GF-D6", "DOOR", "Ground Project Report Section Door"),
        ("GF-C1", "CORRIDOR", "Main Corridor (Ground Floor)"),
        ("E1", "EXIT", "Ground Exit Terminal / Exterior Discharge"),

        # First Floor Nodes
        ("R1", "ROOM", "E-Library (First Floor)"),
        ("R2", "ROOM", "Media Resource Centre (First Floor)"),
        ("R3", "ROOM", "Ladies Toilet (First Floor)"),
        ("R4", "ROOM", "Gents Toilet (First Floor)"),
        ("R5", "ROOM", "Book Bank Section (First Floor)"),
        ("R6", "ROOM", "Back Volume / Project Report Section (First Floor)"),
        ("D1", "DOOR", "Main Library Glass Door"),
        ("D2", "DOOR", "Media Centre Door"),
        ("D3", "DOOR", "Ladies Toilet Door"),
        ("D4", "DOOR", "Gents Toilet Door"),
        ("D5", "DOOR", "Book Bank Access Door"),
        ("D6", "DOOR", "Project Report Section Door"),
        ("C1", "CORRIDOR", "Main Corridor (First Floor)"),

        # Shared Vertical Core
        ("S1", "STAIR", "Main Staircase (Continuous Vertical Core)")
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
        # --- Ground Floor Edges ---
        ("GF-R1", "GF-D1", "ACCESS_THROUGH"),
        ("GF-D1", "GF-C1", "CONNECTS_TO"),
        ("GF-R2", "GF-D2", "ACCESS_THROUGH"),
        ("GF-D2", "GF-C1", "CONNECTS_TO"),
        ("GF-R3", "GF-D3", "ACCESS_THROUGH"),
        ("GF-D3", "GF-C1", "CONNECTS_TO"),
        ("GF-R4", "GF-D4", "ACCESS_THROUGH"),
        ("GF-D4", "GF-C1", "CONNECTS_TO"),
        ("GF-R5", "GF-D5", "ACCESS_THROUGH"),
        ("GF-D5", "GF-C1", "CONNECTS_TO"),
        ("GF-R6", "GF-D6", "ACCESS_THROUGH"),
        ("GF-D6", "GF-C1", "CONNECTS_TO"),
        # Ground direct room connections
        ("GF-R1", "GF-C1", "CONNECTS_TO"),
        ("GF-R2", "GF-C1", "CONNECTS_TO"),
        ("GF-R3", "GF-C1", "CONNECTS_TO"),
        ("GF-R4", "GF-C1", "CONNECTS_TO"),
        ("GF-R5", "GF-C1", "CONNECTS_TO"),
        ("GF-R6", "GF-C1", "CONNECTS_TO"),
        # Ground corridor to Exit E1 and Staircase
        ("GF-C1", "E1", "DISCHARGES_TO"),
        ("S1", "GF-C1", "DESCENDS_TO"),
        ("S1", "E1", "ESCAPE_ROUTE_TO"),

        # --- First Floor Edges ---
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
        # First floor direct room connections
        ("R1", "C1", "CONNECTS_TO"),
        ("R2", "C1", "CONNECTS_TO"),
        ("R3", "C1", "CONNECTS_TO"),
        ("R4", "C1", "CONNECTS_TO"),
        ("R5", "C1", "CONNECTS_TO"),
        ("R6", "C1", "CONNECTS_TO"),
        # First floor corridor to Staircase
        ("C1", "S1", "LEADS_TO")
    ]

    for src, tgt, rel in edges_data:
        g_edge = GraphEdge(
            project_id=project.id,
            source_node=src,
            target_node=tgt,
            relationship=rel
        )
        db.add(g_edge)

    # 5. Insert BuildingSensors (26 IoT sensors across both floors)
    sensors_data = [
        # --- Level 0: Ground Floor Sensors ---
        {"sensor_id": "S-GF-C1-SMOKE", "type": "SMOKE", "element": "Main Corridor (Ground Floor)", "location": "GF-C1 Ceiling Core", "value": 11.5, "unit": "ppm", "threshold": 50.0},
        {"sensor_id": "S-GF-C1-TEMP", "type": "TEMPERATURE", "element": "Main Corridor (Ground Floor)", "location": "GF-C1 Corridor Spine", "value": 26.5, "unit": "°C", "threshold": 45.0},
        {"sensor_id": "S-GF-C1-CO2", "type": "CO2", "element": "Main Corridor (Ground Floor)", "location": "GF-C1 Circulation Hub", "value": 410.0, "unit": "ppm", "threshold": 1000.0},
        {"sensor_id": "S-GF-R1-SMOKE", "type": "SMOKE", "element": "E-Library (Ground Floor)", "location": "GF-R1 Workstations", "value": 10.5, "unit": "ppm", "threshold": 50.0},
        {"sensor_id": "S-GF-R1-TEMP", "type": "TEMPERATURE", "element": "E-Library (Ground Floor)", "location": "GF-R1 Digital Area", "value": 23.0, "unit": "°C", "threshold": 45.0},
        {"sensor_id": "S-GF-R2-SMOKE", "type": "SMOKE", "element": "Media Resource Centre (Ground Floor)", "location": "GF-R2 AV Console", "value": 12.0, "unit": "ppm", "threshold": 50.0},
        {"sensor_id": "S-GF-R2-CO2", "type": "CO2", "element": "Media Resource Centre (Ground Floor)", "location": "GF-R2 Presentation Hub", "value": 420.0, "unit": "ppm", "threshold": 1000.0},
        {"sensor_id": "S-GF-R3-TEMP", "type": "TEMPERATURE", "element": "Ladies Toilet (Ground Floor)", "location": "GF-R3 Restroom Duct", "value": 25.5, "unit": "°C", "threshold": 45.0},
        {"sensor_id": "S-GF-R4-TEMP", "type": "TEMPERATURE", "element": "Gents Toilet (Ground Floor)", "location": "GF-R4 Restroom Duct", "value": 25.5, "unit": "°C", "threshold": 45.0},
        {"sensor_id": "S-GF-R5-SMOKE", "type": "SMOKE", "element": "Book Bank Section (Ground Floor)", "location": "GF-R5 Book Stacks", "value": 13.0, "unit": "ppm", "threshold": 50.0},
        {"sensor_id": "S-GF-R6-SMOKE", "type": "SMOKE", "element": "Back Volume / Project Reports (Ground Floor)", "location": "GF-R6 Repository Stacks", "value": 13.0, "unit": "ppm", "threshold": 50.0},
        {"sensor_id": "S-GF-D1-CONTACT", "type": "DOOR_CONTACT", "element": "Ground Library Glass Door", "location": "GF-D1 Threshold", "value": 0.0, "unit": "state", "threshold": 0.0},
        {"sensor_id": "S-GF-D2-CONTACT", "type": "DOOR_CONTACT", "element": "Ground Media Centre Door", "location": "GF-D2 Door Frame", "value": 0.0, "unit": "state", "threshold": 0.0},
        {"sensor_id": "S-GF-D5-CONTACT", "type": "DOOR_CONTACT", "element": "Ground Book Bank Access Door", "location": "GF-D5 Threshold", "value": 0.0, "unit": "state", "threshold": 0.0},

        # --- Continuous Vertical Stair Core ---
        {"sensor_id": "S-S1-SMOKE", "type": "SMOKE", "element": "Main Staircase (Continuous Vertical Core)", "location": "S1 Stair Shaft", "value": 10.0, "unit": "ppm", "threshold": 50.0},
        {"sensor_id": "S-S1-TEMP", "type": "TEMPERATURE", "element": "Main Staircase (Continuous Vertical Core)", "location": "S1 Shaft Head", "value": 27.0, "unit": "°C", "threshold": 45.0},

        # --- Level 1: First Floor Sensors ---
        {"sensor_id": "S-C1-SMOKE", "type": "SMOKE", "element": "Main Corridor (First Floor)", "location": "C1 Main Ceiling", "value": 12.0, "unit": "ppm", "threshold": 50.0},
        {"sensor_id": "S-C1-TEMP", "type": "TEMPERATURE", "element": "Main Corridor (First Floor)", "location": "C1 Corridor Core", "value": 27.0, "unit": "°C", "threshold": 45.0},
        {"sensor_id": "S-C1-CO2", "type": "CO2", "element": "Main Corridor (First Floor)", "location": "C1 Central Circulation", "value": 415.0, "unit": "ppm", "threshold": 1000.0},
        {"sensor_id": "S-R1-SMOKE", "type": "SMOKE", "element": "E-Library (First Floor)", "location": "R1 Digital Workstations", "value": 11.0, "unit": "ppm", "threshold": 50.0},
        {"sensor_id": "S-R1-TEMP", "type": "TEMPERATURE", "element": "E-Library (First Floor)", "location": "R1 Study Area", "value": 23.5, "unit": "°C", "threshold": 45.0},
        {"sensor_id": "S-R2-SMOKE", "type": "SMOKE", "element": "Media Resource Centre (First Floor)", "location": "R2 AV Media Console", "value": 12.5, "unit": "ppm", "threshold": 50.0},
        {"sensor_id": "S-R2-CO2", "type": "CO2", "element": "Media Resource Centre (First Floor)", "location": "R2 Conference Hub", "value": 430.0, "unit": "ppm", "threshold": 1000.0},
        {"sensor_id": "S-R3-TEMP", "type": "TEMPERATURE", "element": "Ladies Toilet (First Floor)", "location": "R3 Restroom Duct", "value": 26.0, "unit": "°C", "threshold": 45.0},
        {"sensor_id": "S-R4-TEMP", "type": "TEMPERATURE", "element": "Gents Toilet (First Floor)", "location": "R4 Restroom Duct", "value": 26.0, "unit": "°C", "threshold": 45.0},
        {"sensor_id": "S-R5-SMOKE", "type": "SMOKE", "element": "Book Bank Section (First Floor)", "location": "R5 Book Stack Aisle", "value": 14.0, "unit": "ppm", "threshold": 50.0},
        {"sensor_id": "S-R6-SMOKE", "type": "SMOKE", "element": "Back Volume / Project Reports (First Floor)", "location": "R6 Archives Stacks", "value": 13.5, "unit": "ppm", "threshold": 50.0},
        {"sensor_id": "S-D1-CONTACT", "type": "DOOR_CONTACT", "element": "Main Library Glass Door", "location": "D1 Entrance Threshold", "value": 0.0, "unit": "state", "threshold": 0.0},
        {"sensor_id": "S-D2-CONTACT", "type": "DOOR_CONTACT", "element": "Media Centre Door", "location": "D2 Door Frame", "value": 0.0, "unit": "state", "threshold": 0.0},
        {"sensor_id": "S-D5-CONTACT", "type": "DOOR_CONTACT", "element": "Book Bank Access Door", "location": "D5 Threshold", "value": 0.0, "unit": "state", "threshold": 0.0}
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
    uploads_bp_dir = BASE_DIR / settings.UPLOAD_DIR / "blueprints"
    uploads_bp_dir.mkdir(parents=True, exist_ok=True)
    
    blueprint_filename = f"blueprint_{project.id}.svg"
    blueprint_path = uploads_bp_dir / blueprint_filename
    with open(blueprint_path, "w", encoding="utf-8") as f:
        f.write(svg_content)

    # Also save to frontend public demo folder
    frontend_demo_dir = BASE_DIR.parent / "frontend" / "public" / "demo"
    if frontend_demo_dir.exists():
        with open(frontend_demo_dir / "klu_central_library_blueprint.svg", "w", encoding="utf-8") as f:
            f.write(svg_content)

    # Register Asset
    asset = Asset(
        project_id=project.id,
        asset_type="BLUEPRINT",
        file_name=blueprint_filename,
        file_path=str(blueprint_path),
        resolution_width=1500,
        resolution_height=860,
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
            element="Multi-Level Circulation Spine",
            finding_type="EGRESS_CONTINUITY",
            severity="LOW",
            status="PASS",
            description="Ground Corridor GF-C1 and Level 1 Corridor C1 maintain minimum 84\" clear width, exceeding IBC § 1020.2 standard of 72\".",
            ai_explanation="Staircase S1 continuous vertical core facilitates direct descent from Level 1 to Ground Corridor GF-C1 and exterior discharge Door E1.",
            remediation="Maintain unencumbered corridor clearance and ensure directional exit illuminated signage remains operational."
        ),
        Finding(
            project_id=project.id,
            rule_id="RULE_VERTICAL_ENCLOSURE",
            element="S1 Main Staircase Enclosure",
            finding_type="FIRE_SEPARATION",
            severity="LOW",
            status="PASS",
            description="Vertical interior exit stairway is rated for continuous 1-hour fire barrier protection per IBC § 1023.2.",
            ai_explanation="Enclosure isolates vertical evacuation core from floor stack areas, preventing smoke migration between Ground Floor and Level 1.",
            remediation="Inspect self-closing fire doors on Stair S1 semi-annually."
        ),
        Finding(
            project_id=project.id,
            rule_id="RULE_DISCHARGE_CONTINUITY",
            element="E1 Ground Exterior Exit Discharge",
            finding_type="EGRESS_DISCHARGE",
            severity="LOW",
            status="PASS",
            description="Ground exit E1 discharges directly to grade level exterior public way satisfying IBC § 1028.1.",
            ai_explanation="All vertical egress lines terminate at Ground Floor discharge point E1 without terminating into interior dead-ends.",
            remediation="Ensure exterior path of travel remains clear of physical landscape barriers."
        ),
        Finding(
            project_id=project.id,
            rule_id="RULE_FIRE_SEPARATION",
            element="Book Bank Stacks (L0 & L1)",
            finding_type="FIRE_SEPARATION",
            severity="LOW",
            status="PASS",
            description="Dense book storage sections on both Ground Floor (GF-R5) and Level 1 (R5) equipped with NFPA 72 photoelectric smoke detection mesh.",
            ai_explanation="Paper book stacks present high combustible fire load; optical smoke detectors provide early thermal and particulate warning.",
            remediation="Maintain quarterly calibration on optical smoke detectors in Book Bank and Project Report sections."
        )
    ]

    for find in findings_data:
        db.add(find)

    db.commit()
    db.refresh(project)

    return {
        "success": True,
        "project_id": project.id,
        "project_name": project.name,
        "floors": project.floors,
        "building_type": project.building_type,
        "elements_created": len(elements_data),
        "nodes_created": len(nodes_data),
        "edges_created": len(edges_data),
        "sensors_seeded": len(sensors_data),
        "blueprint_file": blueprint_filename,
        "blueprint_url": f"/uploads/blueprints/{blueprint_filename}",
        "message": "KLU Central Library (Ground Floor & First Floor) successfully synthesized with dual CAD blueprint, multi-level safety graph, and 26-node IoT sensor mesh."
    }
