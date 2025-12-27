'use client';

import { useState } from 'react';
import Sidebar from './components/workflow/Sidebar';
import WorkflowCanvas from '../app/components/workflow/Canvas';
import { Menu, X, Undo2, Redo2 } from 'lucide-react';
import { useWorkflowStore } from './lib/store/useWorkflowStore';


const createProductListingWorkflow = () => {
  // Clear existing nodes
  const clearAll = useWorkflowStore.getState();
  clearAll.nodes = [];
  clearAll.edges = [];
  
  // Create sample nodes
  const addNode = useWorkflowStore.getState().addNode;
  
  // Product details node
  const productNodeId = addNode('text', { x: 100, y: 100 });
  useWorkflowStore.getState().updateNode(productNodeId, {
    value: 'Product: Wireless Bluetooth Headphones\nFeatures: Noise cancellation, 30hr battery, foldable design\nTarget audience: Students, professionals, travelers\nPrice range: $99-$149',
  });
  
  // Image node (placeholder)
  const imageNodeId = addNode('image', { x: 100, y: 250 });
  
  // LLM Node
  const llmNodeId = addNode('llm', { x: 400, y: 175 });
  useWorkflowStore.getState().updateNode(llmNodeId, {
    systemPrompt: 'You are a professional e-commerce copywriter. Generate compelling product descriptions that highlight features and benefits.',
  });
  
  // Create connections
  useWorkflowStore.getState().onConnect({
    source: productNodeId,
    sourceHandle: 'text',
    target: llmNodeId,
    targetHandle: 'user_message',
  });
  
  useWorkflowStore.getState().onConnect({
    source: imageNodeId,
    sourceHandle: 'image',
    target: llmNodeId,
    targetHandle: 'images',
  });
};

export default function Home() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const undo = useWorkflowStore((state) => state.undo);
  const redo = useWorkflowStore((state) => state.redo);
  
  // Pre-built sample workflow
  const createSampleWorkflow = () => {
    // This would create a pre-built workflow for product listing generation
    console.log('Creating sample workflow...');
  };
  
  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Top Navigation */}
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <h1 className="text-xl font-bold text-gray-800">Weavy.ai Workflow Builder</h1>
          <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs font-medium rounded">
            LLM Workflows
          </span>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={undo}
            className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 flex items-center"
          >
            <Undo2 size={16} className="mr-1" />
            Undo
          </button>
          <button
            onClick={redo}
            className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 flex items-center"
          >
            <Redo2 size={16} className="mr-1" />
            Redo
          </button>
          <button
            onClick={createSampleWorkflow}
            className="px-4 py-1.5 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700"
          >
            Load Sample
          </button>
        </div>
      </header>
      
      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {sidebarOpen && <Sidebar />}
        
        {/* Canvas Area */}
        <div className="flex-1 overflow-hidden">
          <WorkflowCanvas />
        </div>
      </div>
      
      {/* Status Bar */}
      <footer className="bg-white border-t border-gray-200 px-4 py-2 text-sm text-gray-600 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <span>Nodes: {useWorkflowStore((state) => state.nodes.length)}</span>
          <span>Edges: {useWorkflowStore((state) => state.edges.length)}</span>
        </div>
        <div>
          <span className="text-green-600">●</span>
          <span className="ml-1">Connected to Gemini API</span>
        </div>
      </footer>
    </div>
  );
}