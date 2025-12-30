'use client';

import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  BackgroundVariant,
  Node,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { useWorkflowStore } from '../../lib/store/useWorkflowStore';
import TextNode from '../../components/nodes/TextNode';
import ImageNode from '../../components/nodes/ImageNode';
import LLMNode from '../../components/nodes/LLMNode';
import { useCallback } from 'react';
import { WorkflowNodeData } from '../../lib/types/workflow';

// Define node types for React Flow
const nodeTypes = {
  text: TextNode,
  image: ImageNode,
  llm: LLMNode,
};

export default function WorkflowCanvas() {
  const {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    selectedNode,
    setSelectedNode,
  } = useWorkflowStore();
  
  // Handle node click
  const onNodeClick = useCallback((event: React.MouseEvent, node: any) => {
    setSelectedNode(node.id);
  }, [setSelectedNode]);
  
  // Handle pane click (deselect)
  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
  }, [setSelectedNode]);

  // Enhanced nodes with selected state
  const enhancedNodes: Node<WorkflowNodeData>[] = nodes.map(node => ({
    ...node,
    type: node.type || 'text',
    position: node.position || { x: 0, y: 0 },
    data: node.data || {
      label: '',
      value: '',
      image: '',
      model: 'gemini-2.5-flash',
      systemPrompt: '',
      isLoading: false,
      error: '',
      response: '',
    },
    selected: node.id === selectedNode,
  }));

  return (
    <div className="w-full h-full relative bg-linear-to-br from-gray-950 via-gray-900 to-gray-950" onClick={onPaneClick}>
      {/* Manual dotted background overlay that will definitely show */}
      <div className="absolute inset-0 pointer-events-none">
        <svg className="w-full h-full opacity-20" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="dot-pattern" x="0" y="0" width="24" height="24" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="1" fill="#4b5563" />
            </pattern>
            <pattern id="cross-pattern" x="0" y="0" width="200" height="200" patternUnits="userSpaceOnUse">
              <path d="M200 0L0 200M0 0L200 200" stroke="#6b7280" strokeWidth="1" fill="none" opacity="0.1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#dot-pattern)" />
          <rect width="100%" height="100%" fill="url(#cross-pattern)" />
        </svg>
      </div>

      {/* Subtle gradient overlays for depth */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-1/3 h-1/3 bg-linear-to-br from-cyan-500/5 via-transparent to-transparent" />
        <div className="absolute bottom-0 right-0 w-1/3 h-1/3 bg-linear-to-tl from-fuchsia-500/5 via-transparent to-transparent" />
        <div className="absolute inset-0 bg-linear-to-b from-transparent via-gray-900/10 to-gray-950/20" />
      </div>

      <ReactFlow
        nodes={enhancedNodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        nodeTypes={nodeTypes}
        fitView
        className="bg-transparent!"
        deleteKeyCode={['Delete', 'Backspace']}
        multiSelectionKeyCode={['Control', 'Meta']}
        selectionKeyCode={['Control', 'Meta']}
        proOptions={{ hideAttribution: true }}
        defaultEdgeOptions={{
          style: {
            stroke: '#8b5cf6',
            strokeWidth: 2,
          },
          animated: true,
          type: 'smoothstep',
        }}
        connectionLineStyle={{
          stroke: '#8b5cf6',
          strokeWidth: 2,
        }}
      >
        {/* Primary dotted background - simpler config */}
        <Background 
          id="main-dots"
          variant={BackgroundVariant.Dots}
          gap={15}
          size={4}
          color="#4b5563"
          style={{ opacity: 0.9 }}
        />
        
        {/* Secondary cross pattern - very subtle */}
        <Background 
          id="cross-pattern"
          variant={BackgroundVariant.Cross}
          gap={180}
          size={1}
          color="#6b7280"
          style={{ opacity: 0.1 }}
        />
        
        {/* Enhanced controls with glass effect */}
        <Controls 
          className="border! border-gray-800/60! rounded-xl! shadow-2xl! backdrop-blur-sm"
          style={{
            backgroundColor: 'rgba(17, 24, 39, 0.7)',
            border: '1px solid rgba(55, 65, 81, 0.5)',
          }}
          showInteractive={false}
          position='top-left'
        />
        
        {/* Custom styled minimap */}
        <MiniMap 
          className="border! border-gray-800/60! rounded-xl! shadow-2xl! backdrop-blur-sm"
          style={{
            backgroundColor: 'rgba(17, 24, 39, 0.8)',
            border: '1px solid rgba(55, 65, 81, 0.5)',
          }}
          nodeStrokeColor={(node: any) => {
            if (node.id === selectedNode) return '#3b82f6';
            return '#4b5563';
          }}
          nodeColor={(node: any) => {
            if (node.id === selectedNode) return '#1d4ed8';
            
            // Color by node type with dark mode variants
            switch (node.type) {
              case 'text':
                return '#0ea5e9';
              case 'image':
                return '#d946ef';
              case 'llm':
                return '#f59e0b';
              default:
                return '#374151';
            }
          }}
          maskColor="rgba(17, 24, 39, 0.6)"
          maskStrokeColor="#4b5563"
          position="bottom-right"
          offsetScale={4}
          zoomable
          pannable
        />
      </ReactFlow>

      {/* Canvas status indicator */}
      <div className="absolute bottom-4 left-4 pointer-events-none">
        <div className="flex items-center gap-2 px-3 py-1.5 bg-linear-to-br from-gray-900/80 to-gray-800/60 backdrop-blur-sm border border-gray-800/50 rounded-lg">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-linear-to-r from-cyan-500 to-blue-500 animate-pulse" />
            <span className="text-xs font-mono text-gray-300 tracking-wider">WORKSPACE</span>
          </div>
          <div className="h-4 w-px bg-gray-700/50 mx-2" />
          <div className="text-xs text-gray-400">
            <span className="font-semibold text-cyan-300">{nodes.length}</span> nodes
          </div>
        </div>
      </div>

      {/* Connection animation indicator */}
      <div className="absolute top-4 right-4 pointer-events-none">
        <div className="px-3 py-1.5 bg-linear-to-br from-gray-900/80 to-gray-800/60 backdrop-blur-sm border border-gray-800/50 rounded-lg">
          <div className="text-xs text-gray-400 font-mono tracking-wide">
            <span className="text-cyan-300">{edges.length}</span> connections
          </div>
        </div>
      </div>

      {/* CSS for animations and styling */}
      <style jsx global>{`
        /* Animated edge flow */
        .react-flow__edge-path {
          stroke-dasharray: 5, 5;
          animation: flow 2s linear infinite;
          stroke: #8b5cf6;
        }
        
        @keyframes flow {
          0% {
            stroke-dashoffset: 0;
          }
          100% {
            stroke-dashoffset: 20;
          }
        }
        
        /* Enhanced node selection */
        .react-flow__node.selected {
          filter: drop-shadow(0 0 20px rgba(59, 130, 246, 0.4));
          z-index: 10;
        }
        
        /* Smooth node transitions */
        .react-flow__node {
          transition: all 0.2s ease;
        }
        
        .react-flow__node:hover {
          transform: translateY(-1px);
        }
        
        /* Custom control buttons */
        .react-flow__controls-button {
          background: rgba(55, 65, 81, 0.7) !important;
          border: 1px solid rgba(75, 85, 99, 0.5) !important;
          color: #9ca3af !important;
          transition: all 0.2s ease !important;
        }
        
        .react-flow__controls-button:hover {
          background: rgba(75, 85, 99, 0.8) !important;
          color: #d1d5db !important;
          transform: translateY(-1px) !important;
        }
        
        .react-flow__controls-button svg {
          fill: currentColor !important;
        }
        
        /* Enhanced handles */
        .react-flow__handle {
          background: #4f46e5 !important;
          border: 2px solid #1f2937 !important;
          width: 10px !important;
          height: 10px !important;
        }
        
        .react-flow__handle:hover {
          background: #8b5cf6 !important;
          transform: scale(1.2);
        }
        
        /* Custom scrollbars for minimap */
        .react-flow__minimap::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        
        .react-flow__minimap::-webkit-scrollbar-track {
          background: rgba(31, 41, 55, 0.3);
          border-radius: 3px;
        }
        
        .react-flow__minimap::-webkit-scrollbar-thumb {
          background: rgba(75, 85, 99, 0.6);
          border-radius: 3px;
        }
        
        /* Canvas background patterns */
        .react-flow__background-pattern-dots circle {
          fill: #4b5563 !important;
        }
        
        .react-flow__background-pattern-cross path {
          stroke: #6b7280 !important;
        }
        
        /* Selection box styling */
        .react-flow__selection {
          background: rgba(59, 130, 246, 0.1);
          border: 1px solid rgba(59, 130, 246, 0.3);
          border-radius: 4px;
        }
        
        /* Edge selection styling */
        .react-flow__edge.selected .react-flow__edge-path {
          stroke: #3b82f6 !important;
          stroke-width: 3 !important;
          filter: drop-shadow(0 0 8px rgba(59, 130, 246, 0.5));
        }
        
        /* Connection line styling */
        .react-flow__connection-path {
          stroke: #8b5cf6;
          stroke-width: 2;
          stroke-dasharray: 5, 5;
          animation: flow 2s linear infinite;
        }
      `}</style>
    </div>
  );
}