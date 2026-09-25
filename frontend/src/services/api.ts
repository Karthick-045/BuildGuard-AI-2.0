import axios from "axios";
import {
  Project,
  ProjectListResponse,
  BuildingSummary,
  SafetyGraph,
  Finding,
  SimulationRequest,
  SimulationResponse
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
};
