'use client';

import { useState, useEffect } from 'react';
import Sidebar from './components/workflow/Sidebar';
import WorkflowCanvas from '../app/components/workflow/Canvas';
import { Menu, X, Undo2, Redo2, Keyboard, Trash2 } from 'lucide-react';
import { Button } from './components/ui/Button';
import { useWorkflowStore } from './lib/store/useWorkflowStore';
import { useKeyboardShortcuts } from './lib/hooks/useKeyboardShortcuts';


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
  const [showShortcuts, setShowShortcuts] = useState(false);
  const undo = useWorkflowStore((state) => state.undo);
  const redo = useWorkflowStore((state) => state.redo);
  const deleteSelectedNode = useWorkflowStore((state) => state.deleteSelectedNode);
  const selectedNode = useWorkflowStore((state) => state.selectedNode);
  
  // Enable keyboard shortcuts
  useKeyboardShortcuts();
  
  // Pre-built sample workflow
  const createSampleWorkflow = () => {
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
        
        <div className="flex items-center space-x-3">
          {/* Selected Node Info */}
          {selectedNode && (
            <div className="flex items-center space-x-2 px-3 py-1.5 bg-blue-50 rounded-lg border border-blue-200">
              <span className="text-sm text-blue-700 font-medium">
                Node Selected
              </span>
              <Button
                variant="destructive"
                size="sm"
                leftIcon={<Trash2 size={14} />}
                onClick={deleteSelectedNode}
                className="h-7"
              >
                Delete
              </Button>
            </div>
          )}
          
          <Button
            variant="outline"
            size="sm"
            leftIcon={<Keyboard size={14} />}
            onClick={() => setShowShortcuts(!showShortcuts)}
          >
            Shortcuts
          </Button>
          
          <div className="w-px h-6 bg-gray-300" />
          
          <Button
            variant="outline"
            size="sm"
            leftIcon={<Undo2 size={14} />}
            onClick={undo}
          >
            Undo
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            leftIcon={<Redo2 size={14} />}
            onClick={redo}
          >
            Redo
          </Button>
          
          <Button
            variant="default"
            size="sm"
            onClick={createSampleWorkflow}
            className="bg-purple-600 hover:bg-purple-700"
          >
            Load Sample
          </Button>
        </div>
      </header>
      
      {/* Keyboard Shortcuts Modal */}
      {showShortcuts && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-800">Keyboard Shortcuts</h3>
              <button
                onClick={() => setShowShortcuts(false)}
                className="p-1 hover:bg-gray-100 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <span className="text-gray-700">Delete selected node</span>
                <div className="flex items-center gap-1">
                  <kbd className="px-2 py-1 bg-gray-100 rounded text-sm border border-gray-300">Delete</kbd>
                  <span className="text-gray-400 mx-1">or</span>
                  <kbd className="px-2 py-1 bg-gray-100 rounded text-sm border border-gray-300">Backspace</kbd>
                </div>
              </div>
              
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <span className="text-gray-700">Deselect node</span>
                <kbd className="px-2 py-1 bg-gray-100 rounded text-sm border border-gray-300">Escape</kbd>
              </div>
              
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <span className="text-gray-700">Duplicate node</span>
                <div className="flex items-center gap-1">
                  <kbd className="px-2 py-1 bg-gray-100 rounded text-sm border border-gray-300">Ctrl</kbd>
                  <span className="text-gray-400 mx-1">+</span>
                  <kbd className="px-2 py-1 bg-gray-100 rounded text-sm border border-gray-300">D</kbd>
                </div>
              </div>
              
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <span className="text-gray-700">Undo</span>
                <div className="flex items-center gap-1">
                  <kbd className="px-2 py-1 bg-gray-100 rounded text-sm border border-gray-300">Ctrl</kbd>
                  <span className="text-gray-400 mx-1">+</span>
                  <kbd className="px-2 py-1 bg-gray-100 rounded text-sm border border-gray-300">Z</kbd>
                </div>
              </div>
              
              <div className="flex items-center justify-between py-2">
                <span className="text-gray-700">Redo</span>
                <div className="flex items-center gap-1">
                  <kbd className="px-2 py-1 bg-gray-100 rounded text-sm border border-gray-300">Ctrl</kbd>
                  <span className="text-gray-400 mx-1">+</span>
                  <kbd className="px-2 py-1 bg-gray-100 rounded text-sm border border-gray-300">Shift</kbd>
                  <span className="text-gray-400 mx-1">+</span>
                  <kbd className="px-2 py-1 bg-gray-100 rounded text-sm border border-gray-300">Z</kbd>
                </div>
              </div>
            </div>
            
            <div className="mt-6 p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">
                <strong>Note:</strong> Shortcuts are disabled when typing in text fields
              </p>
            </div>
          </div>
        </div>
      )}
      
      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {sidebarOpen && <Sidebar />}
        
        {/* Canvas Area */}
        <div className="flex-1 overflow-hidden relative">
          <WorkflowCanvas />
          
          {/* Selection Info Bar */}
          {selectedNode && (
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 px-4 py-2 bg-white rounded-lg shadow-lg border border-gray-300 flex items-center gap-3">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                <span className="text-sm font-medium text-gray-700">Node Selected</span>
              </div>
              <div className="w-px h-4 bg-gray-300" />
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span>Press</span>
                <kbd className="px-2 py-1 bg-gray-100 rounded border border-gray-300">Delete</kbd>
                <span>to remove</span>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Status Bar */}
      <footer className="bg-white border-t border-gray-200 px-4 py-2 text-sm text-gray-600 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <span>Nodes: {useWorkflowStore((state) => state.nodes.length)}</span>
          <span>Edges: {useWorkflowStore((state) => state.edges.length)}</span>
          {selectedNode && (
            <span className="text-blue-600 font-medium">
              ● Selected: {selectedNode.substring(0, 8)}...
            </span>
          )}
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setShowShortcuts(true)}
            className="text-gray-500 hover:text-gray-700 text-xs flex items-center gap-1"
          >
            <Keyboard size={12} />
            <span>View shortcuts</span>
          </button>
          <div>
            <span className="text-green-600">●</span>
            <span className="ml-1">Connected to Gemini API</span>
          </div>
        </div>
      </footer>
    </div>
  );
}