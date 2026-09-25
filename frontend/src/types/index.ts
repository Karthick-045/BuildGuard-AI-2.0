export interface Project {
  id: number;
  name: string;
  building_type: string;
  floors: number;
  created_at: string;
  total_findings?: number;
  critical_findings?: number;
  total_elements?: number;
  blueprint_path?: string | null;
  site_photos_count?: number;
}

export interface ProjectListResponse {
  total_projects: number;
  total_findings: number;
  critical_findings: number;
  buildings_analyzed: number;
  projects: Project[];
}

export interface BuildingElement {
  id: number;
  project_id: number;
  element_type: 'ROOM' | 'DOOR' | 'CORRIDOR' | 'STAIR' | 'RAMP' | 'EXIT';
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
  confidence: number;
  created_at?: string;
}

export interface BuildingSummary {
  rooms: number;
  doors: number;
  corridors: number;
  stairs: number;
  exits: number;
  ramps: number;
  total_elements: number;
  elements: BuildingElement[];
}

export interface GraphNodeData {
  id: string;
  type: string;
  label: string;
  is_blocked?: boolean;
  is_affected?: boolean;
  is_bottleneck?: boolean;
  position?: { x: number; y: number };
}

export interface GraphEdgeData {
  source: string;
  target: string;
  relationship: string;
  animated?: boolean;
  is_affected?: boolean;
}

export interface ConnectivityStatus {
  room: string;
  room_id?: string;
  connected_to_exit: boolean;
  nearest_exit?: string | null;
  path?: string[];
}

export interface SafetyGraph {
  nodes: GraphNodeData[];
  edges: GraphEdgeData[];
  connectivity?: ConnectivityStatus[];
  articulation_points?: string[];
  all_rooms_safe?: boolean;
}

export type SeverityType = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
export type StatusType = 'PASS' | 'WARNING' | 'FAIL' | 'REQUIRES_REVIEW' | 'REQUIRES REVIEW';

export interface Finding {
  id: number;
  project_id: number;
  element: string;
  finding_type: string;
  severity: SeverityType;
  status: StatusType;
  description: string;
  rule_id?: string;
  ai_explanation?: string;
  remediation?: string;
  affected_elements?: string[];
  detection_confidence: number;
  measurement_confidence: number;
  rule_applicability: number;
  evidence_quality: number;
  created_at: string;
}

export interface SimulationRequest {
  action: 'BLOCK' | 'RESTORE' | 'DISABLE' | 'block' | 'restore';
  target_element?: string;
  element_id?: string;
}

export interface SimulationResponse {
  success: boolean;
  target: string;
  action: string;
  lost_connectivity: boolean;
  affected_rooms: string[];
  message: string;
  articulation_points?: string[];
  simulation_run_id?: number;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'agent';
  content: string;
  timestamp: string;
  provider_used?: string;
  isGrounded?: boolean;
}

export interface ChatResponse {
  success: boolean;
  reply: string;
  provider_used: string;
  has_api_key: boolean;
  context_summary?: {
    project_id: number;
    total_elements: number;
    total_findings: number;
    articulation_points_count: number;
  };
}

export interface ChatStatus {
  gemini_configured: boolean;
  openai_configured: boolean;
  supported_providers: string[];
  default_provider: string;
}

