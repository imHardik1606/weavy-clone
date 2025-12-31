'use client';

import { useState, useEffect, useRef } from 'react';
import Sidebar from './components/workflow/Sidebar';
import WorkflowCanvas from '../app/components/workflow/Canvas';
import { 
  Menu, 
  X, 
  Undo2, 
  Redo2, 
  Keyboard, 
  Trash2, 
  Sparkles, 
  Zap, 
  Globe, 
  Terminal,
  Cpu,
  GitBranch,
  Layers,
  Shield,
  Download,
  Upload,
  Sliders,
  Code,
  Check,
  Edit2
} from 'lucide-react';
import { useWorkflowStore } from './lib/store/useWorkflowStore';
import { useKeyboardShortcuts } from './lib/hooks/useKeyboardShortcuts';

// Dark mode terminal theme
const SHORTCUTS = [
  { key: 'Del', action: 'Delete selected node', icon: <Trash2 className="w-4 h-4" /> },
  { key: 'Esc', action: 'Deselect node', icon: <X className="w-4 h-4" /> },
  { key: '⌘+D', action: 'Duplicate node', icon: <GitBranch className="w-4 h-4" /> },
  { key: '⌘+Z', action: 'Undo', icon: <Undo2 className="w-4 h-4" /> },
  { key: '⌘+⇧+Z', action: 'Redo', icon: <Redo2 className="w-4 h-4" /> },
  { key: '⌘+S', action: 'Save workflow', icon: <Download className="w-4 h-4" /> },
  { key: '⌘+O', action: 'Load workflow', icon: <Upload className="w-4 h-4" /> },
  { key: 'Space', action: 'Quick search', icon: <Terminal className="w-4 h-4" /> },
];

const createProductListingWorkflow = () => {
  const store = useWorkflowStore.getState();
  
  // Clear existing nodes
  store.nodes = [];
  store.edges = [];
  
  // Create sample nodes
  const productNodeId = store.addNode('text', { x: 150, y: 120 });
  store.updateNode(productNodeId, {
    value: 'Product: Wireless Bluetooth Headphones\nFeatures: Noise cancellation, 30hr battery, foldable design\nTarget audience: Students, professionals, travelers\nPrice range: $99-$149',
    nodeSize: 'medium'
  });
  
  const imageNodeId = store.addNode('image', { x: 150, y: 320 });
  store.updateNode(imageNodeId, { nodeSize: 'medium' });
  
  const llmNodeId = store.addNode('llm', { x: 450, y: 200 });
  store.updateNode(llmNodeId, {
    systemPrompt: 'You are a professional e-commerce copywriter. Generate compelling product descriptions that highlight features and benefits.',
    nodeSize: 'medium'
  });
  
  // Create connections
  store.onConnect({
    source: productNodeId,
    sourceHandle: 'text',
    target: llmNodeId,
    targetHandle: 'user_message',
  });
  
  store.onConnect({
    source: imageNodeId,
    sourceHandle: 'image',
    target: llmNodeId,
    targetHandle: 'images',
  });
};

export default function Home() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showSavePopup, setShowSavePopup] = useState(false);
  const [workflowName, setWorkflowName] = useState('My Workflow');
  const [isEditingName, setIsEditingName] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // CORRECT UNDO/REDO HOOKS
  const undo = useWorkflowStore((state) => state.undo); // Function to call
  const redo = useWorkflowStore((state) => state.redo); // Function to call
  const canUndo = useWorkflowStore((state) => state.canUndo()); // Boolean - note the ()
  const canRedo = useWorkflowStore((state) => state.canRedo()); // Boolean - note the ()
  const deleteSelectedNode = useWorkflowStore((state) => state.deleteSelectedNode);
  const selectedNode = useWorkflowStore((state) => state.selectedNode);
  const saveWorkflow = useWorkflowStore((state) => state.saveWorkflow);
  const nodes = useWorkflowStore((state) => state.nodes);
  const edges = useWorkflowStore((state) => state.edges);
  const past = useWorkflowStore((state) => state.past); // Get history arrays
  const future = useWorkflowStore((state) => state.future);
  
  // Enable keyboard shortcuts
  useKeyboardShortcuts();
  
  const handleCreateSample = () => {
    createProductListingWorkflow();
  };

  const handleQuickSave = () => {
    setIsSaving(true);
    saveWorkflow('my-workflow');
    setTimeout(() => setIsSaving(false), 1000);
  };

  // Handle save from sidebar
  const handleSidebarSave = () => {
    setShowSavePopup(true);
  };

  const handleSaveConfirm = () => {
    if (workflowName.trim()) {
      setIsEditingName(false);
      
      // Save the workflow
      saveWorkflow(workflowName);
      
      // Show success animation
      setTimeout(() => {
        setShowSavePopup(false);
      }, 1500);
    }
  };

  const handleSaveCancel = () => {
    setShowSavePopup(false);
    setIsEditingName(false);
    setWorkflowName('My Workflow');
  };

  const handleEditName = () => {
    setIsEditingName(true);
    setTimeout(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    }, 100);
  };

  // Close save popup on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showSavePopup) {
        handleSaveCancel();
      }
      if (e.key === 'Enter' && showSavePopup && isEditingName) {
        handleSaveConfirm();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showSavePopup, isEditingName]);

  return (
    <div className="h-screen flex flex-col bg-linear-to-br from-gray-950 via-gray-900 to-gray-950 overflow-hidden">
      {/* Top Navigation - Glassmorphism */}
      <header className="relative bg-linear-to-b from-gray-900/95 to-gray-900/90 backdrop-blur-xl border-b border-gray-800/50 px-5 py-3.5 flex items-center justify-between z-30">
        {/* Left side */}
        <div className="flex items-center space-x-4">
          
          <div className="flex items-center gap-3">
            <div>
              <h1 className="text-xl font-bold bg-linear-to-r from-cyan-300 via-blue-200 to-gray-100 bg-clip-text text-transparent tracking-tight">
                FlowGen Canvas
              </h1>
            </div>
          </div>
        </div>
        
        {/* Right side */}
        <div className="flex items-center space-x-2">
          <button
            onClick={handleQuickSave}
            disabled={isSaving}
            className={cn(
              "px-4 py-2 rounded-xl font-medium text-sm transition-all duration-300 flex items-center gap-2",
              isSaving 
                ? "bg-linear-to-r from-amber-600 to-orange-600 cursor-wait" 
                : "bg-linear-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-lg hover:shadow-cyan-500/30"
            )}
          >
            {isSaving ? (
              <>
                <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Download size={14} />
                <span>Save</span>
              </>
            )}
          </button>
          
          <button
            onClick={() => setShowShortcuts(true)}
            className="p-2.5 hover:bg-gray-800/50 rounded-xl transition-all duration-300 group"
          >
            <div className="relative">
              <div className="absolute inset-0 bg-linear-to-br from-fuchsia-500/20 to-purple-500/20 rounded-lg blur opacity-0 group-hover:opacity-100 transition-opacity" />
              <Keyboard className="relative w-5 h-5 text-gray-300 group-hover:text-fuchsia-300" />
            </div>
          </button>
          
          <div className="w-px h-6 bg-gray-700/50 mx-2" />
          
          {/* FIXED UNDO BUTTON */}
          <button
            onClick={undo}
            disabled={!canUndo}
            className={cn(
              "p-2.5 rounded-xl transition-all duration-300 group",
              canUndo 
                ? "hover:bg-gray-800/50 text-gray-300 group-hover:text-cyan-300" 
                : "opacity-40 cursor-not-allowed text-gray-600"
            )}
            title={`Undo (⌘+Z) ${canUndo ? '' : '(disabled)'}`}
          >
            <Undo2 className="w-5 h-5" />
          </button>
          
          {/* FIXED REDO BUTTON */}
          <button
            onClick={redo}
            disabled={!canRedo}
            className={cn(
              "p-2.5 rounded-xl transition-all duration-300 group",
              canRedo 
                ? "hover:bg-gray-800/50 text-gray-300 group-hover:text-blue-300" 
                : "opacity-40 cursor-not-allowed text-gray-600"
            )}
            title={`Redo (⌘+⇧+Z) ${canRedo ? '' : '(disabled)'}`}
          >
            <Redo2 className="w-5 h-5" />
          </button>
          
          <div className="w-px h-6 bg-gray-700/50 mx-2" />
          
          <button
            onClick={handleCreateSample}
            className="px-4 py-2.5 bg-linear-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white rounded-xl font-medium text-sm transition-all duration-300 shadow-lg hover:shadow-amber-500/30 flex items-center gap-2"
          >
            <Zap size={14} />
            <span>Load Template</span>
          </button>
        </div>
      </header>
      
      {/* Keyboard Shortcuts Modal - Terminal style */}
      {showShortcuts && (
        <div 
          className="fixed inset-0 bg-gray-950/80 backdrop-blur-xl flex items-center justify-center z-50"
          onClick={() => setShowShortcuts(false)}
        >
          <div 
            className="bg-linear-to-br from-gray-900 to-gray-800 rounded-2xl border border-gray-700/50 shadow-2xl shadow-black/40 w-full max-w-2xl mx-4 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal header */}
            <div className="p-6 border-b border-gray-700/50 bg-linear-to-r from-gray-900/50 to-gray-800/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="absolute inset-0 bg-linear-to-br from-fuchsia-500 to-purple-500 rounded-lg blur opacity-30" />
                    <Terminal className="relative w-6 h-6 text-fuchsia-300" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-100">Command Palette</h3>
                </div>
                <button
                  onClick={() => setShowShortcuts(false)}
                  className="p-2 hover:bg-gray-800/50 rounded-xl transition-colors text-gray-400 hover:text-white"
                >
                  <X size={20} />
                </button>
              </div>
              <p className="text-sm text-gray-400 mt-2">Quick access to all keyboard shortcuts</p>
            </div>
            
            {/* Shortcuts grid */}
            <div className="p-6">
              <div className="grid grid-cols-2 gap-3">
                {SHORTCUTS.map((shortcut, index) => (
                  <div 
                    key={index}
                    className="p-4 bg-linear-to-br from-gray-800/40 to-gray-900/40 rounded-xl border border-gray-700/30 hover:border-gray-600/50 transition-all duration-300 hover:scale-[1.02] group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="text-fuchsia-300/70 group-hover:text-fuchsia-300 transition-colors">
                          {shortcut.icon}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-200">{shortcut.action}</div>
                          <div className="text-xs text-gray-400 mt-0.5">Press key combination</div>
                        </div>
                      </div>
                      <kbd className="px-3 py-1.5 bg-gray-800/60 text-gray-300 text-sm font-mono rounded-lg border border-gray-700/50 group-hover:border-gray-600/50 transition-colors">
                        {shortcut.key}
                      </kbd>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Note */}
              <div className="mt-6 p-4 bg-linear-to-br from-gray-800/20 to-gray-900/20 rounded-xl border border-gray-700/30">
                <div className="flex items-start gap-3">
                  <Code className="w-5 h-5 text-cyan-300 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-300">Shortcuts are context-aware</p>
                    <p className="text-xs text-gray-400 mt-1">
                      Commands are disabled when typing in text fields. Use <code className="px-1.5 py-0.5 bg-gray-800/50 text-gray-300 rounded text-xs font-mono">Tab</code> to navigate between elements.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Modal footer */}
            <div className="px-6 py-4 border-t border-gray-700/50 bg-linear-to-r from-gray-900/50 to-gray-800/50 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <Shield size={12} />
                <span>All shortcuts are client-side and secure</span>
              </div>
              <button
                onClick={() => setShowShortcuts(false)}
                className="px-4 py-2 bg-linear-to-r from-gray-800 to-gray-900 hover:from-gray-700 hover:to-gray-800 text-gray-300 rounded-lg text-sm font-medium transition-all duration-300 border border-gray-700/50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Save Workflow Popup */}
      {showSavePopup && (
        <div 
          className="fixed inset-0 bg-gray-950/80 backdrop-blur-xl flex items-center justify-center z-40 animate-fade-in"
          onClick={handleSaveCancel}
        >
          <div 
            className="bg-linear-to-br from-gray-900 to-gray-800 rounded-2xl border border-gray-700/50 shadow-2xl shadow-black/40 w-full max-w-md mx-4 overflow-hidden transform transition-all duration-300 scale-100"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal header */}
            <div className="p-6 border-b border-gray-700/50 bg-linear-to-r from-gray-900/50 to-gray-800/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="absolute inset-0 bg-linear-to-br from-cyan-500 to-blue-500 rounded-lg blur opacity-30" />
                    <Download className="relative w-6 h-6 text-cyan-300" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-100">
                    {isEditingName ? 'Edit Workflow Name' : 'Workflow Saved!'}
                  </h3>
                </div>
                {!isEditingName && (
                  <button
                    onClick={handleSaveCancel}
                    className="p-2 hover:bg-gray-800/50 rounded-xl transition-colors text-gray-400 hover:text-white"
                  >
                    <X size={20} />
                  </button>
                )}
              </div>
            </div>
            
            {/* Modal content */}
            <div className="p-6">
              {isEditingName ? (
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Workflow Name
                    </label>
                    <input
                      ref={inputRef}
                      type="text"
                      value={workflowName}
                      onChange={(e) => setWorkflowName(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700/50 rounded-xl text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all"
                      placeholder="Enter workflow name"
                      autoFocus
                    />
                  </div>
                  
                  <div className="flex gap-3">
                    <button
                      onClick={handleSaveCancel}
                      className="flex-1 px-4 py-3 bg-linear-to-r from-gray-800 to-gray-900 hover:from-gray-700 hover:to-gray-800 text-gray-300 rounded-xl text-sm font-medium transition-all duration-300 border border-gray-700/50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveConfirm}
                      disabled={!workflowName.trim()}
                      className={cn(
                        "flex-1 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 flex items-center justify-center gap-2",
                        workflowName.trim()
                          ? "bg-linear-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-lg hover:shadow-cyan-500/30"
                          : "bg-linear-to-r from-gray-700 to-gray-800 text-gray-500 cursor-not-allowed"
                      )}
                    >
                      <Download size={14} />
                      <span>Save</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="py-8">
                  {/* Success animation */}
                  <div className="flex flex-col items-center justify-center">
                    <div className="relative mb-6">
                      {/* Animated rings */}
                      <div className="absolute inset-0 bg-linear-to-br from-emerald-500/20 to-green-500/20 rounded-full blur animate-pulse" />
                      
                      {/* Outer ring animation */}
                      <div className="absolute -inset-2 border-2 border-emerald-500/30 rounded-full animate-ping opacity-75" />
                      
                      {/* Checkmark icon with animation */}
                      <div className="w-20 h-20 rounded-full bg-linear-to-br from-emerald-500 to-green-600 flex items-center justify-center relative animate-scale-in">
                        <Check className="w-10 h-10 text-white animate-checkmark" />
                      </div>
                    </div>
                    
                    <h4 className="text-xl font-bold text-gray-100 mb-2 animate-fade-in-up">
                      Workflow Saved!
                    </h4>
                    
                    <div className="flex items-center gap-3 mb-6 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                      <p className="text-gray-400">Saved as:</p>
                      <div className="flex items-center gap-2 group">
                        <p className="text-cyan-300 font-medium px-3 py-1.5 bg-gray-800/50 rounded-lg border border-gray-700/50">
                          {workflowName}
                        </p>
                        <button
                          onClick={handleEditName}
                          className="p-1.5 hover:bg-gray-800/50 rounded-lg transition-colors text-gray-400 hover:text-cyan-300 opacity-0 group-hover:opacity-100"
                        >
                          <Edit2 size={14} />
                        </button>
                      </div>
                    </div>
                    
                    <button
                      onClick={handleSaveCancel}
                      className="px-6 py-2.5 bg-linear-to-r from-gray-800 to-gray-900 hover:from-gray-700 hover:to-gray-800 text-gray-300 rounded-xl text-sm font-medium transition-all duration-300 border border-gray-700/50 animate-fade-in-up"
                      style={{ animationDelay: '0.3s' }}
                    >
                      Close
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {sidebarOpen && <Sidebar onSaveClick={handleSidebarSave} />}
        
        {/* Canvas Area */}
        <div className="flex-1 overflow-hidden relative">
          <WorkflowCanvas />
          
          {/* Floating selection indicator */}
          {selectedNode && (
            <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 px-4 py-2.5 bg-linear-to-br from-gray-900/90 to-gray-800/90 backdrop-blur-xl rounded-xl shadow-2xl shadow-black/30 border border-gray-700/50 flex items-center gap-4 z-20 animate-fade-in">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-linear-to-r from-cyan-400 to-blue-500 animate-pulse" />
                <span className="text-sm font-medium text-gray-200">Node Selected</span>
                <div className="text-xs text-gray-400 font-mono bg-gray-800/50 px-2 py-1 rounded">
                  {selectedNode}
                </div>
              </div>
              <div className="w-px h-4 bg-gray-700/50" />
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <span>Press</span>
                <kbd className="px-2 py-1 bg-gray-800/60 text-gray-300 rounded border border-gray-700/50">Delete</kbd>
                <span>to remove</span>
              </div>
            </div>
          )}
          
          {/* Floating stats */}
          <div className="absolute top-4 right-4 flex items-center gap-3 border-4 border-cyan-500 rounded-xl">
            <div className="px-3 py-2 bg-linear-to-br from-gray-900/80 to-gray-800/60 backdrop-blur-xl rounded-xl border border-gray-700/50 shadow-lg">
              <div className="flex items-center gap-3">
                <div className="text-center">
                  <div className="text-lg font-bold text-cyan-300">{nodes.length}</div>
                  <div className="text-xs text-gray-400">Nodes</div>
                </div>
                <div className="w-px h-8 bg-gray-700/50" />
                <div className="text-center">
                  <div className="text-lg font-bold text-fuchsia-300">{edges.length}</div>
                  <div className="text-xs text-gray-400">Connections</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Status Bar - Minimal */}
      <footer className="bg-linear-to-b from-gray-900/95 to-gray-900/90 backdrop-blur-xl border-t border-gray-800/50 px-5 py-2.5 text-sm text-gray-400 flex items-center justify-end">
        
        <div className="flex text-end items-center gap-4">
          <button
            onClick={() => setShowShortcuts(true)}
            className="text-gray-500 hover:text-cyan-300 text-xs flex items-center gap-1.5 transition-colors"
          >
            <Keyboard size={18} className='text-md text-gray-200 font-mono'/>
            <span className='text-md text-gray-200 font-mono'>Shortcuts</span>
          </button>
          <div className="text-md text-gray-200 font-mono">
            v1.0.0 • {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
      </footer>

      {/* Add CSS animations */}
      <style jsx>{`
        @keyframes scale-in {
          0% {
            transform: scale(0);
            opacity: 0;
          }
          70% {
            transform: scale(1.1);
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }
        
        @keyframes checkmark {
          0% {
            stroke-dashoffset: 100;
            opacity: 0;
            transform: scale(0.5);
          }
          70% {
            transform: scale(1.2);
          }
          100% {
            stroke-dashoffset: 0;
            opacity: 1;
            transform: scale(1);
          }
        }
        
        @keyframes fade-in-up {
          0% {
            opacity: 0;
            transform: translateY(10px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes fade-in {
          0% {
            opacity: 0;
          }
          100% {
            opacity: 1;
          }
        }
        
        .animate-scale-in {
          animation: scale-in 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
        
        .animate-checkmark {
          animation: checkmark 0.8s ease-out forwards;
        }
        
        .animate-fade-in-up {
          animation: fade-in-up 0.5s ease-out forwards;
        }
        
        .animate-fade-in {
          animation: fade-in 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
}

// Utility function
function cn(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}