import React, { useMemo, useCallback, useState, useEffect } from 'react';
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
  RotateCcw,
  LayoutGrid,
  Radio
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

/**
 * Normalizes graph nodes into spacious, non-overlapping architectural tiers
 * with generous horizontal channels (340px-360px) and 160px vertical pitch.
 */
export const computeSparseLayout = (inputNodes: Node[], inputEdges: Edge[]): Node[] => {
  if (!inputNodes || inputNodes.length === 0) return [];

  // Identify exit nodes and exit doors
  const exitNodeIds = new Set(
    inputNodes.filter((n) => (n.data?.type || '').toUpperCase() === 'EXIT').map((n) => n.id)
  );

  const exitDoorIds = new Set<string>();
  inputEdges.forEach((e) => {
    if (exitNodeIds.has(e.target)) exitDoorIds.add(e.source);
    if (exitNodeIds.has(e.source)) exitDoorIds.add(e.target);
  });

  const columns: { [key: number]: Node[] } = {
    0: [], // Rooms (Origin Compartments)
    1: [], // Interior Doors
    2: [], // Circulation Spines & Corridors
    3: [], // Stairs & ADA Ramps
    4: [], // Exit Doors
    5: [], // Final Emergency Exits
    6: [], // Other / Equipment
  };

  inputNodes.forEach((node) => {
    const type = (node.data?.type || '').toUpperCase();
    const lbl = (node.data?.label || '').toLowerCase();
    const isExitDoor = type === 'DOOR' && (exitDoorIds.has(node.id) || lbl.includes('exit'));

    if (type === 'ROOM') {
      columns[0].push(node);
    } else if (isExitDoor) {
      columns[4].push(node);
    } else if (type === 'DOOR') {
      columns[1].push(node);
    } else if (type === 'CORRIDOR') {
      columns[2].push(node);
    } else if (type === 'STAIR' || type === 'RAMP') {
      columns[3].push(node);
    } else if (type === 'EXIT') {
      columns[5].push(node);
    } else {
      columns[6].push(node);
    }
  });

  const tierX: { [key: number]: number } = {
    0: 80,
    1: 440,
    2: 800,
    3: 1160,
    4: 1520,
    5: 1880,
    6: 1160,
  };

  const VERTICAL_GAP = 160;
  const TOP_PADDING = 80;

  const maxRows = Math.max(...Object.values(columns).map((c) => c.length), 1);
  const totalHeight = maxRows * VERTICAL_GAP;

  const resultNodes: Node[] = [];

  Object.entries(columns).forEach(([tierStr, colNodes]) => {
    const tier = Number(tierStr);
    const count = colNodes.length;
    if (count === 0) return;

    const colHeight = count * VERTICAL_GAP;
    // Vertically center smaller columns relative to the tallest column
    const startY = TOP_PADDING + Math.max(0, (totalHeight - colHeight) / 2);

    colNodes.forEach((node, index) => {
      resultNodes.push({
        ...node,
        position: {
          x: tierX[tier] || 80,
          y: startY + index * VERTICAL_GAP,
        },
      });
    });
  });

  return resultNodes;
};

// Custom Node Component with Harmonious Architectural Color Palette
const SafetyNodeComponent = ({ data }: { data: any }) => {
  const { label, type, is_blocked, is_affected, is_bottleneck, is_hazard, hazard_type, sensor_reading } = data;

  const getStyle = () => {
    // 1. Extreme Active Sensor Hazard (Flame / Smoke / Gas alarm)
    if (is_hazard) {
      return {
        card: 'bg-rose-950/95 border-2 border-rose-500 shadow-2xl shadow-rose-600/70 ring-4 ring-rose-500/50 text-rose-100 animate-pulse',
        badge: 'bg-rose-600 text-white border-rose-400 font-bold',
        iconColor: 'text-rose-400',
        textColor: 'text-rose-100 font-semibold',
        icon: Flame,
      };
    }

    // 2. Direct Egress Blockage (Jammed fire door / collapsed path)
    if (is_blocked) {
      return {
        card: 'bg-rose-950/90 border-rose-500 text-rose-200 shadow-lg shadow-rose-950/40 ring-1 ring-rose-500/30',
        badge: 'bg-rose-700 text-white border-rose-600 font-bold',
        iconColor: 'text-rose-400',
        textColor: 'text-rose-100 font-semibold',
        icon: Ban,
      };
    }

    // 3. Isolated / Trapped Room (No viable route to any exit)
    if (is_affected) {
      return {
        card: 'bg-slate-900/95 border-rose-500/80 text-rose-200 shadow-md shadow-rose-950/30',
        badge: 'bg-rose-950 text-rose-300 border-rose-700/80 font-semibold',
        iconColor: 'text-rose-400',
        textColor: 'text-rose-200 font-medium',
        icon: AlertTriangle,
      };
    }

    // 4. Bottleneck warning
    if (is_bottleneck) {
      return {
        card: 'bg-slate-900/95 border-amber-600/70 text-amber-200 shadow-md shadow-amber-950/20',
        badge: 'bg-amber-950/70 text-amber-300 border-amber-800/80 font-semibold',
        iconColor: 'text-amber-400',
        textColor: 'text-amber-100 font-medium',
        icon: GitFork,
      };
    }

    // 5. Architectural Baseline Types:
    switch (type) {
      case 'ROOM':
        return {
          card: 'bg-slate-900/95 border-slate-700/80 hover:border-slate-500 hover:shadow-lg hover:shadow-slate-800/30',
          badge: 'bg-slate-800/90 text-slate-300 border-slate-700',
          iconColor: 'text-slate-400',
          textColor: 'text-slate-100 font-medium',
          icon: DoorClosed,
        };
      case 'DOOR':
        return {
          card: 'bg-slate-900/95 border-slate-700/70 hover:border-slate-500 hover:shadow-md hover:shadow-slate-800/20',
          badge: 'bg-slate-800/80 text-slate-400 border-slate-700/60',
          iconColor: 'text-slate-400',
          textColor: 'text-slate-200 font-medium',
          icon: DoorOpen,
        };
      case 'CORRIDOR':
        return {
          card: 'bg-slate-900/95 border-teal-800/60 hover:border-teal-600/80 hover:shadow-teal-950/30',
          badge: 'bg-teal-950/70 text-teal-300 border-teal-800/60',
          iconColor: 'text-teal-400',
          textColor: 'text-teal-100 font-medium',
          icon: GitFork,
        };
      case 'STAIR':
        return {
          card: 'bg-slate-900/95 border-amber-800/60 hover:border-amber-600/80 hover:shadow-amber-950/30',
          badge: 'bg-amber-950/70 text-amber-300 border-amber-800/60',
          iconColor: 'text-amber-400',
          textColor: 'text-amber-100 font-medium',
          icon: ArrowUpRight,
        };
      case 'RAMP':
        return {
          card: 'bg-slate-900/95 border-amber-800/60 hover:border-amber-600/80 hover:shadow-amber-950/30',
          badge: 'bg-amber-950/70 text-amber-300 border-amber-800/60',
          iconColor: 'text-amber-400',
          textColor: 'text-amber-100 font-medium',
          icon: Accessibility,
        };
      case 'EXIT':
        return {
          card: 'bg-emerald-950/50 border-2 border-emerald-500 hover:border-emerald-400 shadow-xl shadow-emerald-950/50',
          badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 font-bold',
          iconColor: 'text-emerald-400',
          textColor: 'text-emerald-100 font-bold',
          icon: LogOut,
        };
      default:
        return {
          card: 'bg-slate-900/95 border-slate-700/70 hover:border-slate-500',
          badge: 'bg-slate-800 text-slate-400 border-slate-700',
          iconColor: 'text-slate-400',
          textColor: 'text-slate-200',
          icon: DoorClosed,
        };
    }
  };

  const style = getStyle();
  const Icon = style.icon;

  return (
    <div
      className={`px-3.5 py-2.5 rounded-xl border shadow-md backdrop-blur-md transition-all duration-150 min-w-[140px] max-w-[175px] text-center relative cursor-pointer select-none group ${style.card}`}
    >
      <Handle type="target" position={Position.Top} className="!bg-slate-500 !w-2 !h-2 !border !border-slate-800" />
      <Handle type="target" position={Position.Left} className="!bg-slate-500 !w-2 !h-2 !border !border-slate-800" />
      <Handle type="source" position={Position.Right} className="!bg-slate-500 !w-2 !h-2 !border !border-slate-800" />
      <Handle type="source" position={Position.Bottom} className="!bg-slate-500 !w-2 !h-2 !border !border-slate-800" />

      {/* Floating Badges */}
      {is_hazard && (
        <span className="absolute -top-3.5 -right-2 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-rose-600 text-white flex items-center gap-1 shadow-xl shadow-rose-600/50 animate-bounce ring-2 ring-rose-300 z-20">
          🔥 SENSOR ALARM: {sensor_reading || hazard_type || 'HAZARD'}
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

      {/* Live IoT Sensor Monitored Indicator */}
      {!is_hazard && !is_blocked && (
        <span className="absolute -bottom-2 inset-x-2 mx-auto px-1.5 py-0.2 rounded-full text-[8px] font-mono tracking-tight bg-slate-900/95 border border-emerald-500/40 text-emerald-300 flex items-center justify-center gap-1 shadow-sm opacity-90 group-hover:opacity-100">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>IoT Monitored</span>
        </span>
      )}

      <div className="flex items-center justify-center space-x-1.5 mb-1.5">
        <Icon className={`w-3.5 h-3.5 shrink-0 ${style.iconColor}`} />
        <span className={`text-xs tracking-wide truncate ${style.textColor}`}>
          {label}
        </span>
      </div>

      <div className="flex justify-center">
        <span className={`text-[10px] px-2 py-0.5 rounded-full border uppercase tracking-wider ${style.badge}`}>
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

  // Transform backend graph edges into React Flow Edges with architectural styling
  const initialEdges: Edge[] = useMemo(() => {
    if (!graphData?.edges) return [];

    return graphData.edges.map((e, index) => {
      const isAffected = e.is_affected;
      const isEgress = e.is_egress;
      return {
        id: `e-${e.source}-${e.target}-${index}`,
        source: e.source,
        target: e.target,
        type: 'smoothstep',
        animated: isEgress,
        style: {
          stroke: isAffected ? '#f43f5e' : (isEgress ? '#10b981' : '#475569'),
          strokeWidth: isAffected ? 2 : (isEgress ? 2.5 : 1.5),
          strokeDasharray: isAffected ? '5,5' : undefined,
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: isAffected ? '#f43f5e' : (isEgress ? '#10b981' : '#475569'),
          width: 14,
          height: 14,
        },
        label: e.relationship !== 'CONNECTS_TO' ? e.relationship : undefined,
        labelStyle: { fill: isEgress ? '#34d399' : '#94a3b8', fontSize: 9, fontWeight: 500 },
        labelBgStyle: { fill: '#0a0f1d', fillOpacity: 0.85 },
      };
    });
  }, [graphData]);

  // Transform backend graph nodes into React Flow Nodes with Sparse Layout Normalization
  const initialNodes: Node[] = useMemo(() => {
    if (!graphData?.nodes) return [];

    const rawNodes: Node[] = graphData.nodes.map((n) => ({
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

    // Detect if nodes are too close to each other (e.g. CAD room coords or compressed layout)
    const hasDenseOverlap = rawNodes.some((n1, i) =>
      rawNodes.some((n2, j) => {
        if (i >= j) return false;
        const dx = Math.abs(n1.position.x - n2.position.x);
        const dy = Math.abs(n1.position.y - n2.position.y);
        return dx < 240 && dy < 120;
      })
    );

    if (hasDenseOverlap) {
      return computeSparseLayout(rawNodes, initialEdges);
    }

    return rawNodes;
  }, [graphData, initialEdges]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Sync state whenever graphData updates
  useEffect(() => {
    setNodes(initialNodes);
    setEdges(initialEdges);
  }, [initialNodes, initialEdges, setNodes, setEdges]);

  const handleAutoSpace = useCallback(() => {
    setNodes((currentNodes) => computeSparseLayout(currentNodes, edges));
  }, [edges, setNodes]);

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
    <div className="w-full h-[560px] bg-slate-950 rounded-xl border border-slate-800 relative overflow-hidden flex flex-col">
      {/* Dynamic Safety State Header & Recalculation Toolbar */}
      <div className="px-4 py-2.5 bg-slate-900/95 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs z-10">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-300 flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-teal-400" />
            Dynamic Safety State:
          </span>
          <span
            className={`px-2.5 py-0.5 rounded-full font-bold text-[11px] border flex items-center gap-1 ${
              graphData?.dynamic_safety_state === 'SAFE'
                ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                : graphData?.dynamic_safety_state === 'WARNING'
                ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
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
            <span className="px-2 py-0.5 rounded-full font-semibold text-[10px] bg-rose-950 text-rose-300 border border-rose-800">
              Disconnected: {graphData.isolated_rooms.join(', ')}
            </span>
          )}
        </div>

        {/* Quick Toolbar: Sparse Layout + Highlighted IoT Sensor Controls */}
        <div className="flex items-center gap-2 overflow-x-auto">
          <button
            onClick={handleAutoSpace}
            className="px-2.5 py-1 rounded bg-slate-800/90 hover:bg-slate-700 text-[11px] text-slate-200 border border-slate-700 hover:border-slate-600 flex items-center gap-1.5 transition-all shadow-sm shrink-0"
            title="Rearrange graph into a sparse, expansive non-overlapping architectural layout"
          >
            <LayoutGrid className="w-3 h-3 text-sky-400" />
            <span>Sparse Layout</span>
          </button>

          {projectId && (
            <div className="flex items-center gap-1.5 bg-slate-900/90 border border-emerald-500/30 rounded-lg px-2 py-1 shadow-inner shrink-0">
              <div className="flex items-center gap-1.5 pr-2 border-r border-slate-700">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <Radio className="w-3 h-3 text-emerald-400" />
                <span className="text-[10px] font-semibold text-emerald-300 uppercase tracking-wider">IoT Mesh</span>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={handleSimulateCorridorSmoke}
                  disabled={actionLoading}
                  className="px-2 py-0.5 rounded bg-rose-500/10 hover:bg-rose-500/20 text-[11px] font-medium text-rose-300 border border-rose-500/30 hover:border-rose-400 flex items-center gap-1 transition-all disabled:opacity-50 active:scale-95"
                  title="Simulate 85 ppm smoke alarm in Corridor C (triggers dynamic graph recalculation)"
                >
                  <Flame className="w-3 h-3 text-rose-400 animate-pulse" />
                  <span>Smoke Alarm</span>
                </button>
                <button
                  onClick={handleSimulateExitBlock}
                  disabled={actionLoading}
                  className="px-2 py-0.5 rounded bg-amber-500/10 hover:bg-amber-500/20 text-[11px] font-medium text-amber-300 border border-amber-500/30 hover:border-amber-400 flex items-center gap-1 transition-all disabled:opacity-50 active:scale-95"
                  title="Simulate door obstruction on Exit B (forces egress recalculation)"
                >
                  <Ban className="w-3 h-3 text-amber-400" />
                  <span>Jam Exit</span>
                </button>
                <button
                  onClick={handleResetSensors}
                  disabled={actionLoading}
                  className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-[11px] font-medium text-emerald-300 border border-emerald-500/20 hover:border-emerald-400 flex items-center gap-1 transition-all disabled:opacity-50 active:scale-95"
                  title="Reset all IoT sensors to normal baselines"
                >
                  <RotateCcw className="w-3 h-3 text-emerald-400" />
                  <span>Reset</span>
                </button>
              </div>
            </div>
          )}
        </div>
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
          fitViewOptions={{ padding: 0.25 }}
          minZoom={0.15}
          maxZoom={1.5}
        >
          <Background color="#334155" gap={24} size={1} />
          <Controls className="!bg-slate-900 !border-slate-800 !text-slate-300" />
          <MiniMap
            nodeColor={(node) => {
              if (node.data?.is_hazard) return '#e11d48';
              if (node.data?.is_blocked) return '#f43f5e';
              if (node.data?.is_affected) return '#fb7185';
              if (node.data?.type === 'EXIT') return '#10b981';
              if (node.data?.type === 'CORRIDOR') return '#14b8a6';
              if (node.data?.type === 'STAIR' || node.data?.type === 'RAMP') return '#f59e0b';
              return '#475569';
            }}
            maskColor="rgba(10, 15, 29, 0.75)"
            className="!bg-slate-900 !border-slate-800"
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
