import { useWorkflowStore } from '../../lib/store/useWorkflowStore';
import { 
  Type, 
  Image as ImageIcon, 
  Brain, 
  Search,
  FolderOpen,
  Save,
  Download,
  Upload,
  Sparkles,
  Plus,
  Layers,
  Palette
} from 'lucide-react';
import { useState } from 'react';

const NODE_TYPES = [
  { 
    id: 'text', 
    label: 'Text Node', 
    icon: Type, 
    color: 'from-cyan-400 to-blue-500',
    accent: '#22d3ee'
  },
  { 
    id: 'image', 
    label: 'Image Node', 
    icon: ImageIcon, 
    color: 'from-fuchsia-400 to-purple-500',
    accent: '#e879f9'
  },
  { 
    id: 'llm', 
    label: 'Run Any LLM', 
    icon: Brain, 
    color: 'from-amber-300 to-orange-500',
    accent: '#fbbf24'
  },
];

export default function Sidebar() {
  const addNode = useWorkflowStore((state) => state.addNode);
  const saveWorkflow = useWorkflowStore((state) => state.saveWorkflow);
  const exportWorkflow = useWorkflowStore((state) => state.exportWorkflow);
  const importWorkflow = useWorkflowStore((state) => state.importWorkflow);
  const [workflowName, setWorkflowName] = useState('My Workflow');
  const [activeButton, setActiveButton] = useState<string | null>(null);
  
  const handleAddNode = (type: string) => {
    const position = {
      x: Math.random() * 400 + 100,
      y: Math.random() * 300 + 100,
    };
    addNode(type, position);
    
    // Visual feedback
    setActiveButton(type);
    setTimeout(() => setActiveButton(null), 300);
  };
  
  const handleExport = () => {
    const data = exportWorkflow();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'workflow.json';
    a.click();
  };
  
  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        importWorkflow(event.target?.result as string);
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="w-68 h-full flex flex-col bg-linear-to-b from-gray-900 via-gray-900/95 to-gray-900/90 backdrop-blur-xl border-r border-gray-800/50 shadow-2xl shadow-black/30">
      {/* Decorative top accent */}
      <div className="h-1 bg-linear-to-r from-cyan-500 via-fuchsia-500 to-amber-500" />
      
      {/* Header - Fixed position */}
      <div className="p-2 text-center border-b border-gray-800/40 bg-linear-to-b from-gray-900 to-gray-900/80 shrink-0">
        <div className="flex items-center space-x-3 mb-2">
          <div className="relative">
            <div className="absolute inset-0 bg-linear-to-br from-cyan-500 to-blue-600 rounded-xl blur opacity-30" />
            <Sparkles className="relative w-6 h-6 text-cyan-300" />
          </div>
          <h2 className="text-xl font-bold bg-linear-to-r from-cyan-300 via-blue-200 to-gray-100 bg-clip-text text-transparent">
            FlowGen
          </h2>
        </div>
        <p className="text-sm text-gray-400/80 font-light tracking-wide">
          Drag & drop AI workflow builder
        </p>
      </div>
      
      {/* Scrollable content area */}
      <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700/50 scrollbar-track-transparent hover:scrollbar-thumb-gray-600/50">
        {/* Quick Access */}
        <div className="p-4 border-b border-gray-800/30">
          <div className="flex items-center mb-4">
            <Palette className="w-4 h-4 mr-2 text-cyan-300" />
            <h3 className="text-sm font-semibold text-gray-300/90 tracking-wide">Quick Access</h3>
          </div>
          <div className="space-y-3">
            {NODE_TYPES.map((node) => (
              <button
                key={node.id}
                onClick={() => handleAddNode(node.id)}
                className={`w-full flex items-center p-3 bg-gray-900/80 border border-gray-700/50 hover:border-${node.id === 'text' ? 'cyan' : node.id === 'image' ? 'fuchsia' : 'amber'}-400/50 rounded-xl transition-all duration-200 group hover:bg-gray-900 ${
                  activeButton === node.id ? 'scale-95' : 'hover:scale-[1.02]'
                }`}
              >
                <div className={`relative w-10 h-10 rounded-lg bg-linear-to-br ${node.color} flex items-center justify-center mr-3`}>
                  <div className="absolute inset-0 bg-linear-to-br from-white/20 to-transparent rounded-lg" />
                  <node.icon className="relative w-5 h-5 text-white" />
                </div>
                <div className="flex-1 text-left">
                  <div className="text-sm font-semibold text-gray-100">{node.label}</div>
                  <div className="text-xs text-gray-400/70">Click to add</div>
                </div>
                <Plus className="w-4 h-4 text-gray-400/70 group-hover:text-gray-200 transition-colors" />
              </button>
            ))}
          </div>
        </div>
        
        {/* Workflow Management */}
        <div className="p-4 border-b border-gray-800/30">
          <div className="flex items-center mb-4">
            <Layers className="w-4 h-4 mr-2 text-fuchsia-300" />
            <h3 className="text-sm font-semibold text-gray-300/90 tracking-wide">Workflow</h3>
          </div>
          
          <div className="space-y-3">
            <div className="relative group">
              <input
                type="text"
                value={workflowName}
                onChange={(e) => setWorkflowName(e.target.value)}
                className="w-full px-4 py-3 bg-gray-900/60 border border-gray-700/50 rounded-xl text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-fuchsia-400/50 focus:ring-2 focus:ring-fuchsia-500/20 backdrop-blur-sm transition-all duration-200"
                placeholder="Workflow name"
              />
              <button
                onClick={() => saveWorkflow(workflowName)}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 bg-linear-to-br from-fuchsia-500 to-purple-600 hover:from-fuchsia-400 hover:to-purple-500 rounded-lg transition-all duration-200 shadow-lg hover:shadow-fuchsia-500/25"
              >
                <Save className="w-4 h-4 text-white" />
              </button>
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handleExport}
                className="flex items-center justify-center px-3 py-2.5 bg-gray-800/60 hover:bg-cyan-900/30 border border-gray-700/50 hover:border-cyan-400/50 rounded-xl transition-all duration-200 group"
              >
                <Download className="w-4 h-4 mr-2 text-cyan-300" />
                <span className="text-xs font-medium text-gray-200">Export</span>
              </button>
              
              <label className="flex items-center justify-center px-3 py-2.5 bg-gray-800/60 hover:bg-fuchsia-900/30 border border-gray-700/50 hover:border-fuchsia-400/50 rounded-xl transition-all duration-200 group cursor-pointer">
                <Upload className="w-4 h-4 mr-2 text-fuchsia-300" />
                <span className="text-xs font-medium text-gray-200">Import</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImport}
                  className="hidden"
                />
              </label>
            </div>
            
            <button className="w-full flex items-center justify-center px-3 py-2.5 bg-gray-800/60 hover:bg-gray-700/50 border border-gray-700/50 hover:border-gray-600/50 rounded-xl transition-all duration-200">
              <FolderOpen className="w-4 h-4 mr-2 text-gray-400" />
              <span className="text-sm font-medium text-gray-200">Load Workflow</span>
            </button>
          </div>
        </div>
        
        {/* Help Section */}
        <div className="p-4">
          <div className="p-3 bg-linear-to-br from-gray-900/50 to-gray-800/30 border border-gray-700/30 rounded-xl">
            <div className="text-xs text-gray-400/70 mb-2">💡 Quick Tips</div>
            <ul className="text-xs text-gray-500 space-y-1">
              <li className="flex items-start">
                <div className="w-1 h-1 bg-cyan-400 rounded-full mt-1.5 mr-2"></div>
                Click nodes to add them to canvas
              </li>
              <li className="flex items-start">
                <div className="w-1 h-1 bg-fuchsia-400 rounded-full mt-1.5 mr-2"></div>
                Drag connections between nodes
              </li>
              <li className="flex items-start">
                <div className="w-1 h-1 bg-amber-400 rounded-full mt-1.5 mr-2"></div>
                Export your workflow as JSON
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}