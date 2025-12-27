import { Handle, Position, NodeProps } from 'reactflow';
import { Play, AlertCircle, CheckCircle } from 'lucide-react';
import { WorkflowNodeData } from '../../lib/types/workflow';
import { useWorkflowStore } from '../../lib/store/useWorkflowStore';
import { useState } from 'react';

const MODELS = [
  { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash' },
  { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro' },
  { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash' },
];

export default function LLMNode({ id, data }: NodeProps<WorkflowNodeData>) {
  const updateNode = useWorkflowStore((state) => state.updateNode);
  const [isRunning, setIsRunning] = useState(false);
  
  const handleRun = async () => {
    setIsRunning(true);
    updateNode(id, { isLoading: true, error: undefined });
    
    try {
      // Get connected inputs
      const response = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: data.model,
          systemPrompt: data.systemPrompt,
          userMessage: data.value || '',
          images: data.image ? [data.image] : [],
        }),
      });
      
      const result = await response.json();
      
      if (result.error) {
        updateNode(id, { error: result.error, isLoading: false });
      } else {
        updateNode(id, { response: result.text, isLoading: false });
      }
    } catch (error) {
      updateNode(id, { error: 'Failed to process request', isLoading: false });
    } finally {
      setIsRunning(false);
    }
  };
  
  return (
    <div className="px-4 py-3 shadow-lg rounded-xl bg-white border border-gray-200 min-w-[250px]">
      {/* Input Handles */}
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 bg-purple-500"
        id="system_prompt"
      />
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 bg-blue-500"
        style={{ top: '30%' }}
        id="user_message"
      />
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 bg-green-500"
        style={{ top: '60%' }}
        id="images"
      />
      
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center">
          <div className="w-5 h-5 rounded-md bg-purple-100 flex items-center justify-center mr-2">
            <span className="text-purple-600 text-xs font-bold">AI</span>
          </div>
          <h3 className="text-sm font-semibold text-gray-800">Run Any LLM</h3>
        </div>
        <button
          onClick={handleRun}
          disabled={isRunning || !data.value}
          className={`px-3 py-1 rounded-lg text-sm font-medium flex items-center ${
            isRunning || !data.value
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-purple-600 text-white hover:bg-purple-700'
          }`}
        >
          {isRunning ? (
            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1"></div>
          ) : (
            <Play size={12} className="mr-1" />
          )}
          Run
        </button>
      </div>
      
      <div className="space-y-3">
        <div>
          <label className="text-xs font-medium text-gray-700 mb-1 block">
            Model
          </label>
          <select
            value={data.model}
            onChange={(e) => updateNode(id, { model: e.target.value })}
            className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2"
          >
            {MODELS.map((model) => (
              <option key={model.id} value={model.id}>
                {model.name}
              </option>
            ))}
          </select>
        </div>
        
        <div>
          <label className="text-xs font-medium text-gray-700 mb-1 block">
            System Prompt (Optional)
          </label>
          <textarea
            value={data.systemPrompt || ''}
            onChange={(e) => updateNode(id, { systemPrompt: e.target.value })}
            placeholder="Add system instructions..."
            className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 min-h-[60px]"
            rows={2}
          />
        </div>
        
        {data.error && (
          <div className="p-2 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center text-red-700">
              <AlertCircle size={14} className="mr-1" />
              <span className="text-xs font-medium">Error</span>
            </div>
            <p className="text-xs text-red-600 mt-1">{data.error}</p>
          </div>
        )}
        
        {data.response && !data.isLoading && (
          <div className="p-2 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center text-green-700">
              <CheckCircle size={14} className="mr-1" />
              <span className="text-xs font-medium">Response</span>
            </div>
            <p className="text-xs text-green-600 mt-1">{data.response}</p>
          </div>
        )}
        
        {data.isLoading && (
          <div className="p-2 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center text-blue-700">
              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600 mr-2"></div>
              <span className="text-xs font-medium">Processing...</span>
            </div>
          </div>
        )}
      </div>
      
      {/* Output Handle */}
      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 bg-green-500"
        id="output"
      />
      <div className="text-xs text-gray-500 mt-2">Output: LLM Response</div>
    </div>
  );
}