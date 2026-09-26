import axios from "axios";
import {
  Project,
  ProjectListResponse,
  BuildingSummary,
  SafetyGraph,
  Finding,
  SimulationRequest,
  SimulationResponse,
  ChatResponse,
  ChatStatus,
  BuildingSensor,
  SensorListResponse,
  DynamicRouteResponse,
  VoiceBuildResponse,
  VoiceCommandResponse
} from "../types";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:8000/api",
  headers: {
    "Content-Type": "application/json",
  },
});

export const projectApi = {
  // Get all projects with summary stats
  getProjects: async (): Promise<ProjectListResponse> => {
    const response = await api.get<ProjectListResponse>("/projects");
    return response.data;
  },

  // Create a new project
  createProject: async (data: { name: string; building_type: string; floors: number }): Promise<Project> => {
    const response = await api.post<Project>("/projects", data);
    return response.data;
  },

  // Get project by ID
  getProject: async (id: number | string): Promise<Project> => {
    const response = await api.get<Project>(`/projects/${id}`);
    return response.data;
  },

  // Get building elements summary and category counts
  getSummary: async (id: number | string): Promise<BuildingSummary> => {
    const response = await api.get<BuildingSummary>(`/projects/${id}/summary`);
    return response.data;
  },

  // Delete project by ID
  deleteProject: async (id: number | string): Promise<{ success: boolean; message: string }> => {
    const response = await api.delete(`/projects/${id}`);
    return response.data;
  },

  // Upload blueprint
  uploadBlueprint: async (id: number | string, file: File): Promise<any> => {
    const formData = new FormData();
    formData.append("file", file);
    const response = await api.post(`/projects/${id}/blueprint`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  },

  // Upload site photos
  uploadPhotos: async (id: number | string, files: File[]): Promise<any> => {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append("files", file);
    });
    const response = await api.post(`/projects/${id}/photos`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  },

  // Run structure and egress safety analysis
  analyzeProject: async (id: number | string): Promise<{
    success: boolean;
    summary: BuildingSummary;
    findings: Finding[];
    graph: SafetyGraph;
    building_info?: any;
    ocr_results?: any[];
    cv_detections?: any[];
    evidence_quality?: any;
    plan_vs_actual?: any;
    checks_summary?: any;
  }> => {
    const response = await api.post(`/projects/${id}/analyze`);
    return response.data;
  },

  // Get project findings
  getFindings: async (id: number | string): Promise<Finding[]> => {
    const response = await api.get<Finding[]>(`/projects/${id}/findings`);
    return response.data;
  },

  // Get project safety graph
  getGraph: async (id: number | string): Promise<SafetyGraph> => {
    const response = await api.get<SafetyGraph>(`/projects/${id}/graph`);
    return response.data;
  },

  // Run what-if obstruction simulation
  simulate: async (id: number | string, request: SimulationRequest): Promise<SimulationResponse> => {
    const response = await api.post<SimulationResponse>(`/projects/${id}/simulate`, request);
    return response.data;
  },

  // Reset simulation to baseline
  resetSimulation: async (id: number | string): Promise<{ success: boolean; message: string }> => {
    const response = await api.post(`/projects/${id}/reset-simulation`);
    return response.data;
  },

  // Chat with AI Agent grounded in project backend data
  chatWithAgent: async (
    projectId: number | string,
    message: string,
    apiKey?: string,
    provider: string = "gemini",
    history: { role: string; content: string }[] = []
  ): Promise<ChatResponse> => {
    const response = await api.post<ChatResponse>(`/projects/${projectId}/chat`, {
      message,
      api_key: apiKey || undefined,
      provider,
      history,
    });
    return response.data;
  },

  // Get server-side chat status & configuration
  getChatStatus: async (): Promise<ChatStatus> => {
    const response = await api.get<ChatStatus>("/chat/status");
    return response.data;
  },

  // Get project IoT sensors telemetry
  getSensors: async (projectId: number | string): Promise<SensorListResponse> => {
    const response = await api.get<SensorListResponse>(`/projects/${projectId}/sensors`);
    return response.data;
  },

  // Trigger simulated hazard on a sensor
  triggerSensorAlert: async (
    projectId: number | string,
    data: { sensor_id: string; value: number; status?: string; alert_message?: string }
  ): Promise<BuildingSensor> => {
    const response = await api.post<BuildingSensor>(`/projects/${projectId}/sensors/trigger-alert`, data);
    return response.data;
  },

  // Reset sensors telemetry to baseline
  resetSensors: async (projectId: number | string): Promise<{ success: boolean; message: string }> => {
    const response = await api.post(`/projects/${projectId}/sensors/reset`);
    return response.data;
  },

  // Calculate dynamic evacuation route with sensor validation
  findDynamicRoute: async (
    projectId: number | string,
    data: { start_room: string; avoid_elements?: string[]; use_sensor_alerts?: boolean }
  ): Promise<DynamicRouteResponse> => {
    const response = await api.post<DynamicRouteResponse>(`/projects/${projectId}/routes/dynamic-find`, data);
    return response.data;
  },

  // Build a project and safety graph directly from natural speech input
  buildProjectFromVoice: async (
    speechTranscript: string,
    buildingName?: string
  ): Promise<VoiceBuildResponse> => {
    const response = await api.post<VoiceBuildResponse>("/voice/build-project", {
      speech_transcript: speechTranscript,
      building_name: buildingName,
    });
    return response.data;
  },

  // Execute spoken command on a project
  executeVoiceCommand: async (
    projectId: number | string,
    command: string
  ): Promise<VoiceCommandResponse> => {
    const response = await api.post<VoiceCommandResponse>("/voice/command", {
      project_id: projectId,
      command,
    });
    return response.data;
  },

  // Create or retrieve designated Sample IoT Sensor Workspace
  createSampleSensorWorkspace: async (): Promise<{
    success: boolean;
    project_id: number;
    project_name: string;
    message: string;
    graph: SafetyGraph;
  }> => {
    const response = await api.post("/projects/sample-sensor-workspace");
    return response.data;
  },
};
