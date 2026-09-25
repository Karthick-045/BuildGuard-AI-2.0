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
  Ban
} from 'lucide-react';
import { SafetyGraph as SafetyGraphType } from '../../types';
import { GraphLegend } from './GraphLegend';

interface SafetyGraphProps {
  graphData: SafetyGraphType | null;
  onNodeClick?: (nodeId: string) => void;
}

// Custom Node Component
const SafetyNodeComponent = ({ data }: { data: any }) => {
  const { label, type, is_blocked, is_affected, is_bottleneck } = data;

  const getTypeStyle = () => {
    switch (type) {
      case 'ROOM':
        return {
          border: 'border-sky-500/80',
          bg: is_affected ? 'bg-rose-950/90 border-rose-500 shadow-rose-500/30' : 'bg-slate-900/90 shadow-sky-500/10',
          text: is_affected ? 'text-rose-200' : 'text-sky-300',
          badge: is_affected ? 'bg-rose-500 text-white' : 'bg-sky-500/20 text-sky-400 border-sky-500/30',
          icon: DoorClosed,
        };
      case 'DOOR':
        return {
          border: 'border-indigo-500/60',
          bg: 'bg-slate-900/90 shadow-indigo-500/10',
          text: 'text-indigo-300',
          badge: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
          icon: DoorOpen,
        };
      case 'CORRIDOR':
        return {
          border: is_blocked ? 'border-rose-500' : 'border-cyan-500/80',
          bg: is_blocked ? 'bg-rose-950/90' : 'bg-slate-900/90 shadow-cyan-500/10',
          text: is_blocked ? 'text-rose-200' : 'text-cyan-300',
          badge: is_blocked ? 'bg-rose-500 text-white' : 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
          icon: GitFork,
        };
      case 'STAIR':
        return {
          border: is_blocked ? 'border-rose-500' : 'border-amber-500/80',
          bg: is_blocked ? 'bg-rose-950/90' : 'bg-slate-900/90 shadow-amber-500/10',
          text: is_blocked ? 'text-rose-200' : 'text-amber-300',
          badge: is_blocked ? 'bg-rose-500 text-white' : 'bg-amber-500/20 text-amber-400 border-amber-500/30',
          icon: ArrowUpRight,
        };
      case 'RAMP':
        return {
          border: 'border-purple-500/80',
          bg: 'bg-slate-900/90 shadow-purple-500/10',
          text: 'text-purple-300',
          badge: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
          icon: Accessibility,
        };
      case 'EXIT':
        return {
          border: is_blocked ? 'border-rose-600 shadow-rose-500/50' : 'border-emerald-500 shadow-emerald-500/20',
          bg: is_blocked ? 'bg-rose-950/95' : 'bg-emerald-950/80',
          text: is_blocked ? 'text-rose-300' : 'text-emerald-300',
          badge: is_blocked ? 'bg-rose-600 text-white' : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
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
      className={`px-3 py-2 rounded-xl border-2 shadow-lg backdrop-blur-sm transition-all min-w-[120px] text-center relative ${style.border} ${style.bg}`}
    >
      <Handle type="target" position={Position.Top} className="!bg-slate-400 !w-2 !h-2" />
      <Handle type="target" position={Position.Left} className="!bg-slate-400 !w-2 !h-2" />
      <Handle type="source" position={Position.Right} className="!bg-slate-400 !w-2 !h-2" />
      <Handle type="source" position={Position.Bottom} className="!bg-slate-400 !w-2 !h-2" />

      {/* Floating Badges */}
      {is_blocked && (
        <span className="absolute -top-2.5 -right-2 px-1.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-rose-600 text-white flex items-center gap-0.5 shadow-md">
          <Ban className="w-2.5 h-2.5" /> BLOCKED
        </span>
      )}

      {is_affected && !is_blocked && (
        <span className="absolute -top-2.5 -right-2 px-1.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-rose-500 text-white flex items-center gap-0.5 shadow-md animate-pulse">
          <AlertTriangle className="w-2.5 h-2.5" /> NO EGRESS
        </span>
      )}

      {is_bottleneck && !is_blocked && !is_affected && (
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

export const SafetyGraph: React.FC<SafetyGraphProps> = ({ graphData, onNodeClick }) => {
  const nodeTypes = useMemo(() => ({ safetyNode: SafetyNodeComponent }), []);

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
      },
    }));
  }, [graphData]);

  // Transform backend graph edges into React Flow Edges
  const initialEdges: Edge[] = useMemo(() => {
    if (!graphData?.edges) return [];

    return graphData.edges.map((e, index) => {
      const isAffected = e.is_affected;
      return {
        id: `e-${e.source}-${e.target}-${index}`,
        source: e.source,
        target: e.target,
        animated: !isAffected,
        style: {
          stroke: isAffected ? '#f43f5e' : '#38bdf8',
          strokeWidth: isAffected ? 3 : 2,
          strokeDasharray: isAffected ? '4,4' : undefined,
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: isAffected ? '#f43f5e' : '#38bdf8',
          width: 16,
          height: 16,
        },
        label: e.relationship !== 'CONNECTS_TO' ? e.relationship : undefined,
        labelStyle: { fill: '#94a3b8', fontSize: 9, fontWeight: 600 },
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
      if (onNodeClick) {
        onNodeClick(node.id);
      }
    },
    [onNodeClick]
  );

  return (
    <div className="w-full h-[520px] bg-slate-950/80 rounded-xl border border-slate-700/60 relative overflow-hidden flex flex-col">
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
    </div>
  );
};
