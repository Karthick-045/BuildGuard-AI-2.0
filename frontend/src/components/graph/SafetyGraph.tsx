import React, { useMemo, useCallback } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  Node,
  Edge,
  MarkerType,
  Handle,
  Position,
  useNodesState,
  useEdgesState,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { 
  DoorClosed, 
  DoorOpen, 
  GitFork, 
  ArrowUpRight, 
  Accessibility, 
  LogOut, 
  AlertTriangle,
  Ban,
  Activity,
  Flame,
  RotateCcw
} from 'lucide-react';
import { SafetyGraph as SafetyGraphType } from '../../types';
import { GraphLegend } from './GraphLegend';
import { projectApi } from '../../services/api';
import { SensorAlertPopup, SensorAlertInfo } from '../sensors/SensorAlertPopup';

interface SafetyGraphProps {
  graphData: SafetyGraphType | null;
  projectId?: number | string;
  onNodeClick?: (nodeId: string) => void;
  onRefreshGraph?: () => void;
  onAlertTriggered?: (alert: SensorAlertInfo) => void;
}

// Custom Node Component
const SafetyNodeComponent = ({ data }: { data: any }) => {
  const { label, type, is_blocked, is_affected, is_bottleneck, is_hazard, hazard_type, sensor_reading } = data;

  const getTypeStyle = () => {
    switch (type) {
      case 'ROOM':
        return {
          border: is_hazard ? 'border-rose-500 ring-2 ring-rose-500/40' : 'border-sky-500/80',
          bg: is_hazard ? 'bg-rose-950/90' : (is_affected ? 'bg-rose-950/90 border-rose-500 shadow-rose-500/30' : 'bg-slate-900/90 shadow-sky-500/10'),
          text: is_hazard ? 'text-rose-300' : (is_affected ? 'text-rose-200' : 'text-sky-300'),
          badge: is_hazard ? 'bg-rose-600 text-white' : (is_affected ? 'bg-rose-500 text-white' : 'bg-sky-500/20 text-sky-400 border-sky-500/30'),
          icon: DoorClosed,
        };
      case 'DOOR':
        return {
          border: is_hazard ? 'border-rose-500 ring-2 ring-rose-500/40' : 'border-indigo-500/60',
          bg: is_hazard ? 'bg-rose-950/90' : 'bg-slate-900/90 shadow-indigo-500/10',
          text: is_hazard ? 'text-rose-300' : 'text-indigo-300',
          badge: is_hazard ? 'bg-rose-600 text-white' : 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
          icon: DoorOpen,
        };
      case 'CORRIDOR':
        return {
          border: (is_blocked || is_hazard) ? 'border-rose-500 ring-4 ring-rose-500/30 animate-pulse' : 'border-cyan-500/80',
          bg: (is_blocked || is_hazard) ? 'bg-rose-950/90' : 'bg-slate-900/90 shadow-cyan-500/10',
          text: (is_blocked || is_hazard) ? 'text-rose-200' : 'text-cyan-300',
          badge: (is_blocked || is_hazard) ? 'bg-rose-600 text-white' : 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
          icon: GitFork,
        };
      case 'STAIR':
        return {
          border: (is_blocked || is_hazard) ? 'border-rose-500 ring-4 ring-rose-500/30 animate-pulse' : 'border-amber-500/80',
          bg: (is_blocked || is_hazard) ? 'bg-rose-950/90' : 'bg-slate-900/90 shadow-amber-500/10',
          text: (is_blocked || is_hazard) ? 'text-rose-200' : 'text-amber-300',
          badge: (is_blocked || is_hazard) ? 'bg-rose-600 text-white' : 'bg-amber-500/20 text-amber-400 border-amber-500/30',
          icon: ArrowUpRight,
        };
      case 'RAMP':
        return {
          border: is_hazard ? 'border-rose-500 ring-2 ring-rose-500/40' : 'border-purple-500/80',
          bg: is_hazard ? 'bg-rose-950/90' : 'bg-slate-900/90 shadow-purple-500/10',
          text: is_hazard ? 'text-rose-300' : 'text-purple-300',
          badge: is_hazard ? 'bg-rose-600 text-white' : 'bg-purple-500/20 text-purple-400 border-purple-500/30',
          icon: Accessibility,
        };
      case 'EXIT':
        return {
          border: (is_blocked || is_hazard) ? 'border-rose-600 ring-4 ring-rose-600/40 shadow-rose-500/50 animate-pulse' : 'border-emerald-500 shadow-emerald-500/20',
          bg: (is_blocked || is_hazard) ? 'bg-rose-950/95' : 'bg-emerald-950/80',
          text: (is_blocked || is_hazard) ? 'text-rose-300' : 'text-emerald-300',
          badge: (is_blocked || is_hazard) ? 'bg-rose-600 text-white' : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
          icon: LogOut,
        };
      default:
        return {
          border: 'border-slate-600',
          bg: 'bg-slate-900/90',
          text: 'text-slate-300',
          badge: 'bg-slate-800 text-slate-400 border-slate-700',
          icon: DoorClosed,
        };
    }
  };

  const style = getTypeStyle();
  const Icon = style.icon;

  return (
    <div
      className={`px-3 py-2 rounded-xl border-2 shadow-lg backdrop-blur-sm transition-all min-w-[125px] text-center relative ${style.border} ${style.bg}`}
    >
      <Handle type="target" position={Position.Top} className="!bg-slate-400 !w-2 !h-2" />
      <Handle type="target" position={Position.Left} className="!bg-slate-400 !w-2 !h-2" />
      <Handle type="source" position={Position.Right} className="!bg-slate-400 !w-2 !h-2" />
      <Handle type="source" position={Position.Bottom} className="!bg-slate-400 !w-2 !h-2" />

      {/* Floating Badges */}
      {is_hazard && (
        <span className="absolute -top-3 -right-2 px-1.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-rose-600 text-white flex items-center gap-0.5 shadow-md animate-bounce ring-2 ring-rose-400">
          🔥 {sensor_reading || hazard_type || 'HAZARD'}
        </span>
      )}

      {is_blocked && !is_hazard && (
        <span className="absolute -top-2.5 -right-2 px-1.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-rose-600 text-white flex items-center gap-0.5 shadow-md">
          <Ban className="w-2.5 h-2.5" /> BLOCKED
        </span>
      )}

      {is_affected && !is_blocked && !is_hazard && (
        <span className="absolute -top-2.5 -right-2 px-1.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-rose-500 text-white flex items-center gap-0.5 shadow-md animate-pulse">
          <AlertTriangle className="w-2.5 h-2.5" /> NO EGRESS
        </span>
      )}

      {is_bottleneck && !is_blocked && !is_affected && !is_hazard && (
        <span className="absolute -top-2.5 -left-2 px-1.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-amber-500/20 border border-amber-500/40 text-amber-300">
          BOTTLENECK
        </span>
      )}

      <div className="flex items-center justify-center space-x-1.5 mb-1">
        <Icon className={`w-3.5 h-3.5 ${style.text}`} />
        <span className="text-xs font-bold text-white tracking-wide truncate max-w-[130px]">
          {label}
        </span>
      </div>

      <div className="flex justify-center">
        <span className={`text-[10px] px-1.5 py-0.2 rounded border font-semibold uppercase ${style.badge}`}>
          {type}
        </span>
      </div>
    </div>
  );
};

export const SafetyGraph: React.FC<SafetyGraphProps> = ({ graphData, projectId, onNodeClick, onRefreshGraph, onAlertTriggered }) => {
  const nodeTypes = useMemo(() => ({ safetyNode: SafetyNodeComponent }), []);
  const [actionLoading, setActionLoading] = React.useState(false);
  const [popupAlert, setPopupAlert] = React.useState<SensorAlertInfo | null>(null);
  const [showPopup, setShowPopup] = React.useState(false);

  const handleSimulateCorridorSmoke = async () => {
    if (!projectId) return;
    setActionLoading(true);
    try {
      await projectApi.triggerSensorAlert(projectId, {
        sensor_id: 'SENSOR_SMOKE_CORR_C',
        value: 85.0,
        status: 'CRITICAL_ALERT',
        alert_message: 'Corridor C heavy smoke alarm triggered'
      });
      const alertInfo: SensorAlertInfo = {
        sensor_id: 'SENSOR_SMOKE_CORR_C',
        sensor_type: 'SMOKE',
        element_label: 'Corridor C',
        location: 'Corridor C Ceiling Detector',
        status: 'CRITICAL_ALERT',
        current_value: 85.0,
        threshold: 50.0,
        unit: 'ppm',
        alert_message: 'Corridor C heavy smoke alarm triggered (85.0 ppm > 50.0 ppm safety limit)'
      };
      setPopupAlert(alertInfo);
      setShowPopup(true);
      if (onAlertTriggered) onAlertTriggered(alertInfo);
      if (onRefreshGraph) onRefreshGraph();
    } catch (e) {
      console.error('Failed to trigger smoke alert', e);
    } finally {
      setActionLoading(false);
    }
  };

  const handleSimulateExitBlock = async () => {
    if (!projectId) return;
    setActionLoading(true);
    try {
      await projectApi.triggerSensorAlert(projectId, {
        sensor_id: 'SENSOR_DOOR_EXIT_B',
        value: 0.0,
        status: 'CRITICAL_ALERT',
        alert_message: 'Exit B latch obstruction fault'
      });
      await projectApi.simulate(projectId, { action: 'BLOCK', target_element: 'exit_b' });
      const alertInfo: SensorAlertInfo = {
        sensor_id: 'SENSOR_DOOR_EXIT_B',
        sensor_type: 'DOOR_CONTACT',
        element_label: 'Exit Door B',
        location: 'Exit Door B Threshold & Panic Bar',
        status: 'CRITICAL_ALERT',
        current_value: 0.0,
        threshold: 0.0,
        unit: 'state',
        alert_message: 'Exit B latch obstruction fault / emergency exit blocked'
      };
      setPopupAlert(alertInfo);
      setShowPopup(true);
      if (onAlertTriggered) onAlertTriggered(alertInfo);
      if (onRefreshGraph) onRefreshGraph();
    } catch (e) {
      console.error('Failed to block exit', e);
    } finally {
      setActionLoading(false);
    }
  };

  const handleResetSensors = async () => {
    if (!projectId) return;
    setActionLoading(true);
    try {
      await projectApi.resetSensors(projectId);
      await projectApi.resetSimulation(projectId);
      setShowPopup(false);
      setPopupAlert(null);
      if (onRefreshGraph) onRefreshGraph();
    } catch (e) {
      console.error('Failed to reset sensors', e);
    } finally {
      setActionLoading(false);
    }
  };

  // Transform backend graph nodes into React Flow Nodes
  const initialNodes: Node[] = useMemo(() => {
    if (!graphData?.nodes) return [];

    return graphData.nodes.map((n) => ({
      id: n.id,
      type: 'safetyNode',
      position: n.position || { x: 100, y: 100 },
      data: {
        id: n.id,
        label: n.label,
        type: n.type,
        is_blocked: n.is_blocked,
        is_affected: n.is_affected,
        is_bottleneck: n.is_bottleneck,
        is_hazard: n.is_hazard,
        hazard_type: n.hazard_type,
        sensor_reading: n.sensor_reading,
        sensor_id: n.sensor_id,
        hazard_message: n.hazard_message,
      },
    }));
  }, [graphData]);

  // Transform backend graph edges into React Flow Edges
  const initialEdges: Edge[] = useMemo(() => {
    if (!graphData?.edges) return [];

    return graphData.edges.map((e, index) => {
      const isAffected = e.is_affected;
      const isEgress = e.is_egress;
      return {
        id: `e-${e.source}-${e.target}-${index}`,
        source: e.source,
        target: e.target,
        animated: isEgress || !isAffected,
        style: {
          stroke: isAffected ? '#f43f5e' : (isEgress ? '#10b981' : '#38bdf8'),
          strokeWidth: isAffected ? 3 : (isEgress ? 3 : 2),
          strokeDasharray: isAffected ? '4,4' : undefined,
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: isAffected ? '#f43f5e' : (isEgress ? '#10b981' : '#38bdf8'),
          width: 16,
          height: 16,
        },
        label: e.relationship !== 'CONNECTS_TO' ? e.relationship : undefined,
        labelStyle: { fill: isEgress ? '#34d399' : '#94a3b8', fontSize: 9, fontWeight: 600 },
        labelBgStyle: { fill: '#0f172a', fillOpacity: 0.8 },
      };
    });
  }, [graphData]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Sync state whenever graphData updates
  React.useEffect(() => {
    setNodes(initialNodes);
    setEdges(initialEdges);
  }, [initialNodes, initialEdges, setNodes, setEdges]);

  const handleNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      if (node.data?.is_hazard) {
        const alertInfo: SensorAlertInfo = {
          sensor_id: node.data.sensor_id || `SENSOR_${node.id.toUpperCase()}`,
          sensor_type: node.data.hazard_type || 'SMOKE',
          element_label: node.data.label,
          location: `${node.data.label} Safety Zone`,
          status: 'CRITICAL_ALERT',
          current_value: parseFloat(node.data.sensor_reading || '85.0') || 85.0,
          threshold: 50.0,
          unit: node.data.hazard_type === 'DOOR_BLOCKED' ? 'state' : 'ppm',
          alert_message: node.data.hazard_message || `Active hazard detected at ${node.data.label}`
        };
        setPopupAlert(alertInfo);
        setShowPopup(true);
      }
      if (onNodeClick) {
        onNodeClick(node.id);
      }
    },
    [onNodeClick]
  );

  return (
    <div className="w-full h-[560px] bg-slate-950/80 rounded-xl border border-slate-700/60 relative overflow-hidden flex flex-col">
      {/* Dynamic Safety State Header & Recalculation Toolbar */}
      <div className="px-4 py-2.5 bg-slate-900/95 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs z-10">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-300 flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-cyan-400" />
            Dynamic Safety State:
          </span>
          <span
            className={`px-2.5 py-0.5 rounded-full font-bold text-[11px] border flex items-center gap-1 ${
              graphData?.dynamic_safety_state === 'SAFE'
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                : graphData?.dynamic_safety_state === 'WARNING'
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                : 'bg-rose-500/20 text-rose-300 border-rose-500/30 animate-pulse'
            }`}
          >
            {graphData?.dynamic_safety_state || 'SAFE'}
            {Boolean(graphData?.active_hazard_count) && (
              <span className="ml-1 text-[10px] opacity-90">
                ({graphData?.active_hazard_count} active alarm)
              </span>
            )}
          </span>
          {graphData?.isolated_rooms && graphData.isolated_rooms.length > 0 && (
            <span className="px-2 py-0.5 rounded-full font-bold text-[10px] bg-rose-950 text-rose-300 border border-rose-800">
              Disconnected: {graphData.isolated_rooms.join(', ')}
            </span>
          )}
        </div>

        {/* Quick Sensor Recalculation Toolbar */}
        {projectId && (
          <div className="flex items-center gap-1.5 overflow-x-auto">
            <span className="text-[10px] text-slate-400 shrink-0 font-medium">Recalculate:</span>
            <button
              onClick={handleSimulateCorridorSmoke}
              disabled={actionLoading}
              className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[11px] text-rose-300 border border-rose-500/30 hover:border-rose-500 flex items-center gap-1 transition-all disabled:opacity-50"
              title="Simulate 85 ppm smoke alarm in Corridor C"
            >
              <Flame className="w-3 h-3 text-rose-400" /> Smoke Corridor C
            </button>
            <button
              onClick={handleSimulateExitBlock}
              disabled={actionLoading}
              className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[11px] text-amber-300 border border-amber-500/30 hover:border-amber-500 flex items-center gap-1 transition-all disabled:opacity-50"
              title="Simulate door obstruction on Exit B"
            >
              <Ban className="w-3 h-3 text-amber-400" /> Jam Exit B
            </button>
            <button
              onClick={handleResetSensors}
              disabled={actionLoading}
              className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[11px] text-emerald-300 border border-emerald-500/30 hover:border-emerald-500 flex items-center gap-1 transition-all disabled:opacity-50"
              title="Reset sensors to normal baseline"
            >
              <RotateCcw className="w-3 h-3 text-emerald-400" /> Restore
            </button>
          </div>
        )}
      </div>

      <div className="flex-1 relative">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={handleNodeClick}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          minZoom={0.2}
          maxZoom={1.5}
        >
          <Background color="#1e293b" gap={20} size={1} />
          <Controls className="!bg-slate-800 !border-slate-700 !text-white fill-white" />
          <MiniMap
            nodeColor={(node) => {
              if (node.data?.is_hazard) return '#dc2626';
              if (node.data?.is_blocked) return '#ef4444';
              if (node.data?.is_affected) return '#f43f5e';
              if (node.data?.type === 'EXIT') return '#10b981';
              return '#0284c7';
            }}
            maskColor="rgba(15, 23, 42, 0.7)"
            className="!bg-slate-900 !border-slate-700"
          />
        </ReactFlow>
      </div>

      {/* Legend Footer */}
      <div className="p-3 border-t border-slate-800 bg-slate-900/90 z-10 flex items-center justify-between">
        <GraphLegend />
        <div className="text-[11px] text-slate-400 hidden sm:block">
          Interactive: Drag nodes • Scroll to Zoom
        </div>
      </div>

      {/* Sensor Threshold Breach Modal Popup */}
      <SensorAlertPopup
        isOpen={showPopup}
        alert={popupAlert}
        onClose={() => setShowPopup(false)}
        onResetSensors={handleResetSensors}
      />
    </div>
  );
};
