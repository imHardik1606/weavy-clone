'use client';

import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  BackgroundVariant,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { useWorkflowStore } from '../../lib/store/useWorkflowStore';
import TextNode from '../nodes/TextNode';
import ImageNode from '../nodes/ImageNode';
import LLMNode from '../nodes/LLMNode';

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
  } = useWorkflowStore();
  
  return (
    <div className="w-full h-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        fitView
        className="bg-gray-50"
      >
        <Background 
          variant={BackgroundVariant.Dots} 
          gap={20} 
          size={1}
          color="#d1d5db"
        />
        <Controls className="!border !border-gray-300 !rounded-lg !shadow-sm" />
        <MiniMap 
          className="!bg-white !border !border-gray-300 !rounded-lg !shadow-sm"
          nodeStrokeColor="#8B5CF6"
          nodeColor="#EDE9FE"
          maskColor="#E5E7EB"
        />
      </ReactFlow>
    </div>
  );
}