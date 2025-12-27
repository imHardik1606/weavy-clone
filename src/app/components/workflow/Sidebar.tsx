import { useWorkflowStore } from '../../lib/store/useWorkflowStore';
import { 
  Type, 
  Image as ImageIcon, 
  Brain, 
  Search,
  FolderOpen,
  Save,
  Download,
  Upload
} from 'lucide-react';
import { useState } from 'react';

const NODE_TYPES = [
  { id: 'text', label: 'Text Node', icon: Type, color: 'bg-blue-500' },
  { id: 'image', label: 'Image Node', icon: ImageIcon, color: 'bg-pink-500' },
  { id: 'llm', label: 'Run Any LLM', icon: Brain, color: 'bg-purple-500' },
];

export default function Sidebar() {
  const addNode = useWorkflowStore((state) => state.addNode);
  const saveWorkflow = useWorkflowStore((state) => state.saveWorkflow);
  const exportWorkflow = useWorkflowStore((state) => state.exportWorkflow);
  const importWorkflow = useWorkflowStore((state) => state.importWorkflow);
  const [workflowName, setWorkflowName] = useState('My Workflow');
  const [searchQuery, setSearchQuery] = useState('');
  
  const handleAddNode = (type: string) => {
    const position = {
      x: Math.random() * 400 + 100,
      y: Math.random() * 300 + 100,
    };
    addNode(type, position);
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
    <div className="w-64 bg-gray-900 text-white h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-800">
        <h2 className="text-lg font-bold">Workflow Builder</h2>
        <p className="text-sm text-gray-400">LLM Workflow Canvas</p>
      </div>
      
      {/* Search */}
      <div className="p-4 border-b border-gray-800">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
          <input
            type="text"
            placeholder="Search nodes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm focus:outline-none focus:border-purple-500"
          />
        </div>
      </div>
      
      {/* Quick Access */}
      <div className="p-4 border-b border-gray-800">
        <h3 className="text-sm font-semibold text-gray-300 mb-3">Quick Access</h3>
        <div className="space-y-2">
          {NODE_TYPES.map((node) => (
            <button
              key={node.id}
              onClick={() => handleAddNode(node.id)}
              className="w-full flex items-center px-3 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors group"
            >
              <div className={`w-8 h-8 rounded-lg ${node.color} flex items-center justify-center mr-3`}>
                <node.icon size={16} className="text-white" />
              </div>
              <span className="text-sm font-medium">{node.label}</span>
            </button>
          ))}
        </div>
      </div>
      
      {/* Workflow Management */}
      <div className="p-4 border-b border-gray-800">
        <h3 className="text-sm font-semibold text-gray-300 mb-3">Workflow</h3>
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <input
              type="text"
              value={workflowName}
              onChange={(e) => setWorkflowName(e.target.value)}
              className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm focus:outline-none focus:border-purple-500"
            />
            <button
              onClick={() => saveWorkflow(workflowName)}
              className="p-2 bg-purple-600 hover:bg-purple-700 rounded-lg"
            >
              <Save size={16} />
            </button>
          </div>
          
          <button
            onClick={handleExport}
            className="w-full flex items-center justify-center px-3 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
          >
            <Download size={16} className="mr-2" />
            <span className="text-sm">Export JSON</span>
          </button>
          
          <label className="w-full flex items-center justify-center px-3 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors cursor-pointer">
            <Upload size={16} className="mr-2" />
            <span className="text-sm">Import JSON</span>
            <input
              type="file"
              accept=".json"
              onChange={handleImport}
              className="hidden"
            />
          </label>
          
          <button className="w-full flex items-center justify-center px-3 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors">
            <FolderOpen size={16} className="mr-2" />
            <span className="text-sm">Load Workflow</span>
          </button>
        </div>
      </div>
      
      {/* Sample Workflow */}
      <div className="p-4">
        <h3 className="text-sm font-semibold text-gray-300 mb-3">Sample Workflows</h3>
        <div className="space-y-2">
          <button
            onClick={() => {
              // Pre-built workflow for product listing generator
              // Implementation details in next section
            }}
            className="w-full text-left px-3 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
          >
            <div className="text-sm font-medium">Product Listing Generator</div>
            <div className="text-xs text-gray-400">Generate product descriptions</div>
          </button>
        </div>
      </div>
    </div>
  );
}