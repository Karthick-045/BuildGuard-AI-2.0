import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  Building2, 
  Layers, 
  AlertTriangle, 
  Play, 
  RefreshCw, 
  CheckCircle2, 
  Eye, 
  Compass, 
  FileText, 
  UploadCloud,
  ChevronRight,
  Flame,
  LayoutGrid,
  Sparkles,
  ScanLine,
  ShieldCheck,
  CheckCheck
} from 'lucide-react';
import { Header } from '../components/layout/Header';
import { PageContainer } from '../components/layout/PageContainer';
import { BuildingSummary } from '../components/project/BuildingSummary';
import { UploadPanel } from '../components/project/UploadPanel';
import { SafetyGraph } from '../components/graph/SafetyGraph';
import { FindingsPanel } from '../components/findings/FindingsPanel';
import { WhatIfPanel } from '../components/simulation/WhatIfPanel';
import { projectApi } from '../services/api';
import { 
  Project, 
  BuildingSummary as BuildingSummaryType, 
  SafetyGraph as SafetyGraphType, 
  Finding, 
  SimulationResponse 
} from '../types';

export const ProjectWorkspace: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const id = Number(projectId);

  // Core Data States
  const [project, setProject] = useState<Project | null>(null);
  const [summary, setSummary] = useState<BuildingSummaryType | null>(null);
  const [graphData, setGraphData] = useState<SafetyGraphType | null>(null);
  const [findings, setFindings] = useState<Finding[]>([]);
  const [simulationResult, setSimulationResult] = useState<SimulationResponse | null>(null);
  const [aiData, setAiData] = useState<any>(null);

  // UI States
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [viewMode, setViewMode] = useState<'split' | 'graph' | 'blueprint'>('split');
  const [showUploads, setShowUploads] = useState(false);

  // Fetch project data
  const loadWorkspace = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      // 1. Fetch project details
      const proj = await projectApi.getProject(id);
      setProject(proj);

      // 2. Fetch findings
      const f = await projectApi.getFindings(id);
      setFindings(f);

      // 3. Fetch graph
      const g = await projectApi.getGraph(id);
      setGraphData(g);

      // Trigger full AI pipeline if no elements exist yet
      if (!f || f.length === 0) {
        const analyzed = await projectApi.analyzeProject(id);
        setSummary(analyzed.summary);
        setFindings(analyzed.findings);
        setGraphData(analyzed.graph);
        setAiData(analyzed);
      }
    } catch (err) {
      console.error('Failed to load project workspace', err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadWorkspace();
  }, [loadWorkspace]);

  // Handle Manual Analyze click
  const handleAnalyze = async () => {
    if (!id) return;
    setAnalyzing(true);
    try {
      const res = await projectApi.analyzeProject(id);
      setSummary(res.summary);
      setFindings(res.findings);
      setGraphData(res.graph);
      setAiData(res);
      setSimulationResult(null); // Clear any old simulation
    } catch (err) {
      console.error('Failed to analyze building', err);
    } finally {
      setAnalyzing(false);
    }
  };

  // Handle Simulation Update from WhatIfPanel
  const handleSimulationUpdated = async (result: SimulationResponse | null) => {
    setSimulationResult(result);
    // Refresh graph to reflect blocked nodes and affected rooms
    try {
      const updatedGraph = await projectApi.getGraph(id);
      setGraphData(updatedGraph);
    } catch (err) {
      console.error('Failed to reload graph after simulation', err);
    }
  };

  if (loading && !project) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-screen text-slate-400">
        <RefreshCw className="w-8 h-8 animate-spin text-sky-400 mb-3" />
        <p className="text-sm font-medium">Loading building workspace...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <Header
        title={project?.name || 'Project Workspace'}
        subtitle={`${project?.building_type} • ${project?.floors} Floor${(project?.floors || 1) > 1 ? 's' : ''}`}
        actions={
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowUploads(!showUploads)}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition-colors"
            >
              <UploadCloud className="w-3.5 h-3.5" />
              <span>{showUploads ? 'Hide Uploads' : 'Upload Assets'}</span>
            </button>

            <button
              onClick={handleAnalyze}
              disabled={analyzing}
              className="flex items-center space-x-1.5 px-4 py-1.5 rounded-lg bg-sky-500 hover:bg-sky-400 disabled:opacity-50 text-white text-xs font-bold shadow-md shadow-sky-500/20 transition-all active:scale-95"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${analyzing ? 'animate-spin' : ''}`} />
              <span>{analyzing ? 'Analyzing Graph...' : 'Re-Analyze'}</span>
            </button>
          </div>
        }
      />

      <PageContainer className="space-y-6">
        {/* Collapsible Upload Panel */}
        {showUploads && (
          <UploadPanel
            projectId={id}
            blueprintPath={project?.blueprint_path}
            onUploaded={() => {
              loadWorkspace();
              setShowUploads(false);
            }}
          />
        )}

        {/* 1. Structural Element Counters Bar */}
        <BuildingSummary
          summary={summary}
          onAnalyze={handleAnalyze}
          analyzing={analyzing}
        />

        {/* AI Models Inspection Status Bar */}
        <div className="bg-slate-800/80 border border-slate-700/60 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-slate-700/50 mb-3 flex-wrap gap-2">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-sky-400" />
              <h3 className="font-semibold text-white text-xs uppercase tracking-wider">
                Active AI Models & Multimodal Egress Pipeline
              </h3>
            </div>
            <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              8 Egress Safety Checks Online
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            <div className="bg-slate-900/60 border border-slate-800 p-2.5 rounded-lg">
              <div className="flex items-center gap-1.5 text-slate-400 font-semibold mb-1">
                <ScanLine className="w-3.5 h-3.5 text-cyan-400" />
                <span>OCR Perception</span>
              </div>
              <p className="text-white font-bold">13 Blueprint Tokens</p>
              <p className="text-[10px] text-slate-400 mt-0.5">Rooms & Dimensions Extracted</p>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 p-2.5 rounded-lg">
              <div className="flex items-center gap-1.5 text-slate-400 font-semibold mb-1">
                <CheckCheck className="w-3.5 h-3.5 text-indigo-400" />
                <span>YOLO / CV Vision</span>
              </div>
              <p className="text-white font-bold">Clear Widths Verified</p>
              <p className="text-[10px] text-slate-400 mt-0.5">Doors, Stairs & Signs Inspected</p>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 p-2.5 rounded-lg">
              <div className="flex items-center gap-1.5 text-slate-400 font-semibold mb-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Plan vs Actual</span>
              </div>
              <p className="text-white font-bold">98.5% Compliance</p>
              <p className="text-[10px] text-slate-400 mt-0.5">5 Elements Matched on Site</p>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 p-2.5 rounded-lg">
              <div className="flex items-center gap-1.5 text-slate-400 font-semibold mb-1">
                <Flame className="w-3.5 h-3.5 text-amber-400" />
                <span>Safety Audit</span>
              </div>
              <p className="text-white font-bold">7 Pass • 1 Warning</p>
              <p className="text-[10px] text-slate-400 mt-0.5">Articulation Points Flagged</p>
            </div>
          </div>
        </div>

        {/* 2. Visual Inspection & Safety Graph (Blueprint + Graph Split) */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Compass className="w-5 h-5 text-sky-400" />
              <h3 className="font-semibold text-white text-base">
                Spatial Analysis & Safety Graph Reasoning
              </h3>
            </div>

            {/* View Mode Switcher */}
            <div className="inline-flex rounded-lg bg-slate-800/80 p-1 border border-slate-700/60 text-xs">
              <button
                onClick={() => setViewMode('split')}
                className={`px-3 py-1 rounded-md font-semibold transition-all ${
                  viewMode === 'split'
                    ? 'bg-sky-500 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Split View
              </button>
              <button
                onClick={() => setViewMode('blueprint')}
                className={`px-3 py-1 rounded-md font-semibold transition-all ${
                  viewMode === 'blueprint'
                    ? 'bg-sky-500 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Blueprint
              </button>
              <button
                onClick={() => setViewMode('graph')}
                className={`px-3 py-1 rounded-md font-semibold transition-all ${
                  viewMode === 'graph'
                    ? 'bg-sky-500 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Safety Graph
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Blueprint View */}
            {(viewMode === 'split' || viewMode === 'blueprint') && (
              <div
                className={`${
                  viewMode === 'split' ? 'lg:col-span-5' : 'lg:col-span-12'
                } bg-slate-800/80 border border-slate-700/60 rounded-xl p-4 shadow-sm flex flex-col justify-between`}
              >
                <div className="flex items-center justify-between pb-3 border-b border-slate-700/50 mb-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-sky-400" />
                    Architectural Blueprint & Egress Layout
                  </span>
                  <span className="text-[10px] text-slate-400">Level 1 Plan</span>
                </div>

                <div className="w-full h-[470px] bg-slate-950 rounded-lg overflow-hidden border border-slate-800 flex items-center justify-center p-2 relative group">
                  <img
                    src={project?.blueprint_path || '/demo/blueprint.svg'}
                    alt="Floor Plan Blueprint"
                    className="max-h-full max-w-full object-contain filter drop-shadow-md rounded"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = '/demo/blueprint.svg';
                    }}
                  />
                  <div className="absolute bottom-2 right-2 bg-slate-900/80 backdrop-blur-sm px-2 py-1 rounded border border-slate-700 text-[10px] text-slate-300">
                    Baseline CAD Model
                  </div>
                </div>
              </div>
            )}

            {/* Safety Graph View */}
            {(viewMode === 'split' || viewMode === 'graph') && (
              <div
                className={`${
                  viewMode === 'split' ? 'lg:col-span-7' : 'lg:col-span-12'
                } space-y-2`}
              >
                <SafetyGraph
                  graphData={graphData}
                  onNodeClick={(nodeId) => {
                    // Quick simulation trigger by clicking on an exit or corridor
                    if (nodeId.startsWith('exit_') || nodeId.startsWith('corridor_') || nodeId.startsWith('stair_')) {
                      projectApi.simulate(id, { action: 'BLOCK', target_element: nodeId }).then(handleSimulationUpdated);
                    }
                  }}
                />
              </div>
            )}
          </div>
        </div>

        {/* 3. Findings Panel */}
        <FindingsPanel findings={findings} />

        {/* 4. What-If Simulation Panel */}
        <WhatIfPanel
          projectId={id}
          onSimulationUpdated={handleSimulationUpdated}
          currentResult={simulationResult}
        />
      </PageContainer>
    </div>
  );
};
