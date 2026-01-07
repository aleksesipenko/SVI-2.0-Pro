
import React, { useMemo } from 'react';
import ReactFlow, { 
  Background, 
  Controls, 
  Node, 
  Edge, 
  Handle, 
  Position,
  ConnectionLineType,
  MarkerType
} from 'reactflow';
import { StoryNode } from '../types';
import { Clapperboard, CheckCircle2, Loader2, Lock, GitBranch } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface NarrativeCanvasProps {
  nodes: StoryNode[];
  selectedNodeId: string | null;
  onNodeSelect: (id: string) => void;
}

// Custom Node Component
const VideoNode = ({ data }: { data: { node: StoryNode; isSelected: boolean; isActivePath: boolean; labelPrefix: string } }) => {
  const { node, isSelected, isActivePath, labelPrefix } = data;
  
  return (
    <div className={`w-72 group transition-all duration-500 ${isSelected ? 'scale-105 z-50' : isActivePath ? 'opacity-100 z-10' : 'opacity-40 grayscale hover:opacity-100 hover:grayscale-0'}`}>
      <Handle type="target" position={Position.Left} className={`!w-3 !h-3 !-left-1.5 transition-colors ${isActivePath ? '!bg-purple-500 !border-purple-900' : '!bg-zinc-700 !border-zinc-900'}`} />
      
      <div className={`p-1.5 rounded-[1.25rem] border-2 transition-all shadow-xl ${isSelected ? 'border-purple-500 bg-purple-500/10 shadow-[0_0_40px_rgba(168,85,247,0.2)]' : isActivePath ? 'border-zinc-700 bg-zinc-900' : 'border-zinc-800 bg-black'}`}>
        <div className="bg-zinc-950 rounded-[1rem] overflow-hidden relative">
          
          {/* Header Strip */}
          <div className="h-8 bg-zinc-900/80 flex items-center justify-between px-4 border-b border-white/5">
             <span className={`text-[9px] font-black uppercase tracking-widest ${isActivePath ? 'text-white' : 'text-zinc-600'}`}>{labelPrefix} {node.index + 1}</span>
             {node.status === 'completed' ? (
                <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
             ) : (
                <Loader2 className="w-3 h-3 text-purple-500 animate-spin" />
             )}
          </div>

          <div className="aspect-video relative bg-black flex items-center justify-center">
            {node.assets.videoUrl ? (
              <video 
                src={node.assets.videoUrl} 
                className="w-full h-full object-cover" 
                muted 
                loop 
                onMouseEnter={e => e.currentTarget.play()} 
                onMouseLeave={e => { e.currentTarget.pause(); e.currentTarget.currentTime = 0; }} 
              />
            ) : (
              <div className="flex flex-col items-center gap-2 opacity-20">
                 <Clapperboard className="w-8 h-8 text-zinc-500" />
              </div>
            )}
            
            {node.progress && node.progress < 100 && (
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-zinc-800">
                <div 
                  className="h-full bg-purple-600 transition-all duration-500" 
                  style={{ width: `${node.progress}%` }} 
                />
              </div>
            )}
          </div>
          
          <div className="p-4 bg-gradient-to-b from-zinc-900 to-black">
            <p className={`text-[10px] font-mono leading-relaxed line-clamp-3 ${isActivePath ? 'text-zinc-400' : 'text-zinc-700'}`}>
               <span className="text-purple-500 font-bold">&gt;</span> {node.prompt}
            </p>
          </div>
        </div>
      </div>

      <Handle type="source" position={Position.Right} className={`!w-3 !h-3 !-right-1.5 transition-colors ${isActivePath ? '!bg-purple-500 !border-purple-900' : '!bg-zinc-700 !border-zinc-900'}`} />
    </div>
  );
};

const nodeTypes = {
  videoNode: VideoNode,
};

const NarrativeCanvas: React.FC<NarrativeCanvasProps> = ({ nodes, selectedNodeId, onNodeSelect }) => {
  const { t } = useTranslation();
  
  // Identify the Active Path (Lineage from selected node to root)
  const activePathIds = useMemo(() => {
    const ids = new Set<string>();
    let current = nodes.find(n => n.id === selectedNodeId);
    while (current) {
      ids.add(current.id);
      current = nodes.find(n => n.id === current.parentId);
    }
    return ids;
  }, [nodes, selectedNodeId]);

  const flowData = useMemo(() => {
    const flowNodes: Node[] = [];
    const flowEdges: Edge[] = [];

    // Tree Layout Configuration
    const X_SPACING = 400;
    const Y_SPACING = 200;

    // Determine Y-positions based on branching
    // Group nodes by parentId
    const childrenMap: Record<string, StoryNode[]> = {};
    const rootNodes: StoryNode[] = [];

    nodes.forEach(n => {
      if (!n.parentId) rootNodes.push(n);
      else {
        if (!childrenMap[n.parentId]) childrenMap[n.parentId] = [];
        childrenMap[n.parentId].push(n);
      }
    });

    // Recursive layout function
    const layoutNode = (node: StoryNode, x: number, yOffset: number): number => {
       const isActive = activePathIds.has(node.id);
       
       flowNodes.push({
         id: node.id,
         type: 'videoNode',
         position: { x, y: yOffset * Y_SPACING },
         data: { 
           node, 
           isSelected: node.id === selectedNodeId,
           isActivePath: isActive,
           labelPrefix: t('node')
         },
         // Bring active nodes to front
         zIndex: isActive ? 10 : 1
       });

       const children = childrenMap[node.id] || [];
       if (children.length === 0) return 1; // Leaf node takes 1 unit height

       let totalHeight = 0;
       let currentY = yOffset;

       // Sort children so active path is in the middle or top? 
       // Let's put active path child first for cleaner straight lines
       children.sort((a, b) => (activePathIds.has(b.id) ? 1 : 0) - (activePathIds.has(a.id) ? 1 : 0));

       children.forEach(child => {
          const childHeight = layoutNode(child, x + X_SPACING, currentY);
          
          // Edge creation
          const isEdgeActive = activePathIds.has(node.id) && activePathIds.has(child.id);
          flowEdges.push({
            id: `e-${node.id}-${child.id}`,
            source: node.id,
            target: child.id,
            type: ConnectionLineType.SmoothStep,
            animated: child.status === 'generating',
            style: {
              stroke: isEdgeActive ? '#a855f7' : '#3f3f46',
              strokeWidth: isEdgeActive ? 3 : 1,
              opacity: isEdgeActive ? 1 : 0.3
            },
          });

          currentY += childHeight;
          totalHeight += childHeight;
       });

       return totalHeight;
    };

    // Start layout from roots (centering vertically if multiple roots - rare in SVI)
    let rootY = 0;
    rootNodes.forEach(root => {
       rootY += layoutNode(root, 0, rootY);
    });

    return { nodes: flowNodes, edges: flowEdges };
  }, [nodes, selectedNodeId, activePathIds, t]);

  return (
    <div className="w-full h-full bg-zinc-950 animate-in fade-in duration-500 relative">
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-5 pointer-events-none z-0" />
      
      <ReactFlow
        nodes={flowData.nodes}
        edges={flowData.edges}
        nodeTypes={nodeTypes}
        onNodeClick={(_, node) => onNodeSelect(node.id)}
        fitView
        minZoom={0.1}
        maxZoom={1.5}
        defaultViewport={{ x: 0, y: 0, zoom: 0.8 }}
      >
        <Background color="#27272a" gap={40} size={1} />
        <Controls showInteractive={false} className="!bg-zinc-900 !border-zinc-800 !fill-zinc-400" />
      </ReactFlow>
      
      {/* HUD Info */}
      <div className="absolute top-6 left-6 pointer-events-none z-10">
         <div className="bg-black/80 backdrop-blur-xl border border-zinc-800 p-5 rounded-[1.5rem] shadow-2xl flex items-center gap-5">
            <div className="w-12 h-12 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center">
               <GitBranch className="w-5 h-5 text-purple-500" />
            </div>
            <div>
               <h4 className="text-white font-black text-sm uppercase tracking-widest leading-none mb-1">{t('project_dag')}</h4>
               <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest">
                  {activePathIds.size} {t('narrative_nodes_active')} / {nodes.length} Total
               </p>
            </div>
         </div>
      </div>
    </div>
  );
};

export default NarrativeCanvas;
