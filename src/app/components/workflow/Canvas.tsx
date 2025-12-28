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

// Type for our custom nodes
interface CustomNode {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: any;
  selected?: boolean;
}

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
  
  // Handle node click - cast to any to avoid TypeScript issues
  const onNodeClick = useCallback((event: React.MouseEvent, node: any) => {
    setSelectedNode(node.id);
  }, [setSelectedNode]);
  
  // Handle pane click (deselect)
  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
  }, [setSelectedNode]);
  
  // Enhance nodes with selected state
  const enhancedNodes: Node<WorkflowNodeData>[] = nodes.map(node => {
    // Ensure node has all required properties
    const enhancedNode: Node<WorkflowNodeData> = {
      ...node,
      // Ensure type is always a string
      type: node.type || 'text',
      // Ensure position exists
      position: node.position || { x: 0, y: 0 },
      // Ensure data exists
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
      // Add selected property
      selected: node.id === selectedNode,
    };
    
    return enhancedNode;
  });


  return (
    <div className="w-full h-full" onClick={onPaneClick}>
      <ReactFlow
        nodes={enhancedNodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        nodeTypes={nodeTypes}
        fitView
        className="bg-gray-50"
        deleteKeyCode={['Delete', 'Backspace']}
        multiSelectionKeyCode={['Control', 'Meta']}
        selectionKeyCode={['Control', 'Meta']}
      >
        <Background 
          variant={BackgroundVariant.Dots} 
          gap={20} 
          size={1}
          color="#d1d5db"
        />
        <Controls className="border! border-gray-300! rounded-lg! shadow-sm" />
        <MiniMap 
          className="bg-white! border! border-gray-300! rounded-lg! shadow-sm"
          nodeStrokeColor="#8B5CF6"
          nodeColor={(node: any) => {
            return node.id === selectedNode ? '#3B82F6' : '#EDE9FE';
          }}
          maskColor="#E5E7EB"
        />
      </ReactFlow>
    </div>
  );
}