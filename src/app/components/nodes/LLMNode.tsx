import { Handle, Position, NodeProps } from 'reactflow';
import { Play, AlertCircle, CheckCircle, Image as ImageIcon, Link, Unlink, Copy, ChevronUp } from 'lucide-react';
import { WorkflowNodeData } from '../../lib/types/workflow';
import { useWorkflowStore } from '../../lib/store/useWorkflowStore';
import { useState, useEffect, useRef } from 'react';
import { Button } from '../../components/ui/Button';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';

// Correct Gemini models for text generation + vision
const MODELS = [
  { 
    id: 'gemini-2.5-flash', 
    name: 'Gemini 2.5 Flash', 
    description: 'Fast, versatile model with vision support',
    supportsVision: true
  },
  { 
    id: 'gemini-2.5-pro', 
    name: 'Gemini 2.5 Pro', 
    description: 'Most capable model with vision',
    supportsVision: true
  },
  { 
    id: 'gemini-2.0-flash', 
    name: 'Gemini 2.0 Flash', 
    description: 'Balanced performance with vision',
    supportsVision: true
  },
  { 
    id: 'gemini-2.5-flash-lite', 
    name: 'Gemini 2.5 Flash Lite', 
    description: 'Lightweight, efficient with vision',
    supportsVision: true
  },
];

export default function LLMNode({ id, data }: NodeProps<WorkflowNodeData>) {
  const updateNode = useWorkflowStore((state) => state.updateNode);
  const edges = useWorkflowStore((state) => state.edges);
  const nodes = useWorkflowStore((state) => state.nodes);
  const [isRunning, setIsRunning] = useState(false);
  const [selectedModel, setSelectedModel] = useState(data.model || 'gemini-2.5-flash');
  const [connectionStatus, setConnectionStatus] = useState({
    hasUserMessage: false,
    hasSystemPrompt: false,
    hasImages: false,
  });
  
  const outputRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  // Check connections whenever edges change
  useEffect(() => {
    const connectedEdges = edges.filter(edge => edge.target === id);
    
    const hasUserMessage = connectedEdges.some(
      edge => edge.targetHandle === 'user_message'
    );
    const hasSystemPrompt = connectedEdges.some(
      edge => edge.targetHandle === 'system_prompt'
    );
    const hasImages = connectedEdges.some(
      edge => edge.targetHandle === 'images'
    );
    
    setConnectionStatus({
      hasUserMessage,
      hasSystemPrompt,
      hasImages,
    });
  }, [edges, id]);
  
  // Prevent scroll propagation to canvas
  useEffect(() => {
    const handleScroll = (e: Event) => {
      e.stopPropagation();
    };
    
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.addEventListener('wheel', handleScroll, { passive: false });
      textarea.addEventListener('touchmove', handleScroll, { passive: false });
      
      return () => {
        textarea.removeEventListener('wheel', handleScroll);
        textarea.removeEventListener('touchmove', handleScroll);
      };
    }
  }, []);
  
  // Check if we can run the LLM
  const canRun = connectionStatus.hasUserMessage;
  
  // Get text from connected text node
  const getConnectedText = () => {
    if (!connectionStatus.hasUserMessage) return '';
    
    const userMessageEdge = edges.find(
      edge => edge.target === id && edge.targetHandle === 'user_message'
    );
    
    if (!userMessageEdge) return '';
    
    const textNode = nodes.find(node => node.id === userMessageEdge.source);
    return textNode?.data.value || '';
  };
  
  // Get system prompt from connected node or local
  const getSystemPrompt = () => {
    if (connectionStatus.hasSystemPrompt) {
      const systemPromptEdge = edges.find(
        edge => edge.target === id && edge.targetHandle === 'system_prompt'
      );
      if (systemPromptEdge) {
        const systemNode = nodes.find(node => node.id === systemPromptEdge.source);
        return systemNode?.data.value || '';
      }
    }
    return data.systemPrompt || '';
  };
  
  // Get images from connected image nodes
  const getConnectedImages = (): string[] => {
    const images: string[] = [];
    
    if (connectionStatus.hasImages) {
      const imageEdges = edges.filter(
        edge => edge.target === id && edge.targetHandle === 'images'
      );
      
      imageEdges.forEach(edge => {
        const imageNode = nodes.find(node => node.id === edge.source);
        if (imageNode?.data.image) {
          images.push(imageNode.data.image);
        }
      });
    }
    
    if (data.image) {
      images.push(data.image);
    }
    
    return images;
  };
  
  const handleRun = async () => {
    if (!canRun) return;
    
    setIsRunning(true);
    updateNode(id, { isLoading: true, error: undefined, response: undefined });
    
    try {
      const userMessage = getConnectedText();
      const systemPrompt = getSystemPrompt();
      const images = getConnectedImages();
      
      const requestData = {
        model: selectedModel,
        systemPrompt: systemPrompt,
        userMessage: userMessage,
        images: images,
      };
      
      const response = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData),
      });
      
      const result = await response.json();
      
      if (result.error) {
        updateNode(id, { 
          error: result.error, 
          isLoading: false,
          response: undefined 
        });
      } else {
        updateNode(id, { 
          response: result.text, 
          isLoading: false,
          error: undefined 
        });
      }
    } catch (error: any) {
      updateNode(id, { 
        error: 'Failed to process request: ' + error.message, 
        isLoading: false,
        response: undefined 
      });
    } finally {
      setIsRunning(false);
    }
  };
  
  const handleCopy = () => {
    if (data.response) {
      navigator.clipboard.writeText(data.response);
      // Optional: Add a toast notification
      updateNode(id, { error: 'Copied to clipboard!' });
      setTimeout(() => updateNode(id, { error: undefined }), 2000);
    }
  };
  
  const currentModel = MODELS.find(m => m.id === selectedModel);
  const hasImageInput = connectionStatus.hasImages || data.image;
  
  // Handle scroll on textarea - stop propagation
  const handleTextareaScroll = (e: React.WheelEvent<HTMLTextAreaElement>) => {
    e.stopPropagation();
    const textarea = e.currentTarget;
    
    // Check if we're at the top or bottom to allow canvas scroll
    const isAtTop = textarea.scrollTop === 0;
    const isAtBottom = textarea.scrollHeight - textarea.scrollTop === textarea.clientHeight;
    
    // Only prevent default if we have more content to scroll
    if (!(isAtTop && e.deltaY < 0) && !(isAtBottom && e.deltaY > 0)) {
      e.preventDefault();
    }
  };
  
  // Handle touch scroll on mobile
  const handleTextareaTouchMove = (e: React.TouchEvent<HTMLTextAreaElement>) => {
    e.stopPropagation();
  };
  
  return (
    <div className="px-4 py-3 shadow-lg rounded-xl bg-white border border-gray-200 w-[380px]">
      {/* Input Handles */}
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 bg-purple-500 border-2 border-white"
        id="system_prompt"
        style={{ top: '30%' }}
      />
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 bg-blue-500 border-2 border-white"
        style={{ top: '50%' }}
        id="user_message"
      />
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 bg-green-500 border-2 border-white"
        style={{ top: '70%' }}
        id="images"
      />
      
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center">
          <div className="w-5 h-5 rounded-md bg-purple-100 flex items-center justify-center mr-2">
            <span className="text-purple-600 text-xs font-bold">AI</span>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-800">Run Any LLM</h3>
            <p className="text-xs text-gray-500">Text generation + vision analysis</p>
          </div>
        </div>
        <Button
          onClick={handleRun}
          disabled={!canRun || isRunning}
          isLoading={isRunning}
          size="sm"
          variant={canRun ? "default" : "secondary"}
          className="min-w-[80px]"
          title={!canRun ? "Connect a Text Node to run" : "Run LLM"}
        >
          {isRunning ? 'Running...' : 'Run'}
        </Button>
      </div>
      
      {/* Connection Status */}
      <div className="mb-3 p-2 bg-gray-50 rounded-lg">
        <div className="grid grid-cols-3 gap-2 text-xs">
          <div className={`flex flex-col items-center p-1 rounded ${connectionStatus.hasUserMessage ? 'bg-blue-50' : 'bg-gray-100'}`}>
            <div className={`w-2 h-2 rounded-full mb-1 ${connectionStatus.hasUserMessage ? 'bg-blue-500' : 'bg-gray-400'}`} />
            <span className={connectionStatus.hasUserMessage ? 'text-blue-700 font-medium' : 'text-gray-500'}>
              {connectionStatus.hasUserMessage ? '✓ Text' : 'No Text'}
            </span>
          </div>
          <div className={`flex flex-col items-center p-1 rounded ${connectionStatus.hasSystemPrompt ? 'bg-purple-50' : 'bg-gray-100'}`}>
            <div className={`w-2 h-2 rounded-full mb-1 ${connectionStatus.hasSystemPrompt ? 'bg-purple-500' : 'bg-gray-400'}`} />
            <span className={connectionStatus.hasSystemPrompt ? 'text-purple-700 font-medium' : 'text-gray-500'}>
              {connectionStatus.hasSystemPrompt ? '✓ System' : 'System'}
            </span>
          </div>
          <div className={`flex flex-col items-center p-1 rounded ${connectionStatus.hasImages ? 'bg-green-50' : 'bg-gray-100'}`}>
            <div className={`w-2 h-2 rounded-full mb-1 ${connectionStatus.hasImages ? 'bg-green-500' : 'bg-gray-400'}`} />
            <span className={connectionStatus.hasImages ? 'text-green-700 font-medium' : 'text-gray-500'}>
              {connectionStatus.hasImages ? '✓ Images' : 'No Images'}
            </span>
          </div>
        </div>
        
        {!connectionStatus.hasUserMessage && (
          <div className="mt-2 p-2 bg-amber-50 border border-amber-100 rounded text-xs text-amber-700">
            <div className="flex items-center">
              <AlertCircle size={12} className="mr-2" />
              <span>Connect a <strong>Text Node</strong> to the <strong className="text-blue-600">blue handle</strong> to run</span>
            </div>
          </div>
        )}
      </div>
      
      {/* Content Area - SCROLLABLE CONTAINER */}
      <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
        {/* Model Selection */}
        <div>
          <label className="text-xs font-medium text-gray-700 mb-1 block">
            Gemini Model
          </label>
          <select
            value={selectedModel}
            onChange={(e) => {
              setSelectedModel(e.target.value);
              updateNode(id, { model: e.target.value });
            }}
            className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {MODELS.map((model) => (
              <option key={model.id} value={model.id}>
                {model.name}
              </option>
            ))}
          </select>
          {currentModel && (
            <p className="text-xs text-gray-500 mt-1">
              {currentModel.description}
            </p>
          )}
        </div>
        
        {/* System Prompt (only show if NOT connected) */}
        {!connectionStatus.hasSystemPrompt && (
          <div>
            <label className="text-xs font-medium text-gray-700 mb-1 block">
              System Prompt (Optional)
            </label>
            <textarea
              value={data.systemPrompt || ''}
              onChange={(e) => updateNode(id, { systemPrompt: e.target.value })}
              placeholder="You are a helpful assistant..."
              className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 min-h-[60px] resize-y focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows={2}
              onWheel={(e) => e.stopPropagation()}
            />
          </div>
        )}
        
        {connectionStatus.hasSystemPrompt && (
          <div className="p-2 bg-purple-50 border border-purple-200 rounded-lg">
            <div className="flex items-center text-purple-700">
              <Link size={14} className="mr-2" />
              <span className="text-xs font-medium">System prompt from connected node</span>
            </div>
          </div>
        )}
        
        {/* Error State */}
        {data.error && (
          <div className="p-2 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center text-red-700">
              <AlertCircle size={14} className="mr-2" />
              <span className="text-xs font-medium">Error</span>
            </div>
            <p className="text-xs text-red-600 mt-1">{data.error}</p>
          </div>
        )}
        
        {/* Loading State */}
        {data.isLoading && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center justify-center">
              <LoadingSpinner size="sm" color="blue" showText text="Processing..." />
            </div>
            <p className="text-xs text-center text-blue-600 mt-2">
              Analyzing {hasImageInput ? 'image and text' : 'text'}...
            </p>
          </div>
        )}
        
        {/* SUCCESS RESPONSE - FULL TEXT DISPLAY */}
        {data.response && !data.isLoading && (
          <div ref={outputRef} className="bg-green-50 border border-green-300 rounded-lg overflow-hidden">
            {/* Response Header */}
            <div className="p-3 border-b border-green-300 bg-green-100 flex items-center justify-between">
              <div className="flex items-center text-green-900">
                <CheckCircle size={16} className="mr-2 text-green-700" />
                <span className="text-sm font-semibold">LLM Response</span>
                <span className="ml-2 text-xs text-green-700 bg-green-200 px-2 py-0.5 rounded-full">
                  {Math.ceil(data.response.length / 4)} tokens
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleCopy}
                  className="flex items-center text-xs text-blue-700 hover:text-blue-900 font-medium bg-blue-100 hover:bg-blue-200 px-2 py-1 rounded-lg transition-colors"
                  title="Copy to clipboard"
                >
                  <Copy size={12} className="mr-1" />
                  Copy
                </button>
              </div>
            </div>
            
            {/* FULL RESPONSE TEXT AREA - NO TRIMMING */}
            <div className="p-3 bg-white">
              <textarea
                ref={textareaRef}
                readOnly
                value={data.response}
                className="w-full text-sm text-gray-800 bg-white border-0 focus:outline-none focus:ring-0 resize-none font-mono leading-relaxed whitespace-pre-wrap scrollbar-thin"
                rows={Math.min(Math.max(data.response.split('\n').length, 3), 20)}
                style={{ 
                  minHeight: '60px',
                  maxHeight: '300px',
                  overflowY: 'auto'
                }}
                onWheel={handleTextareaScroll}
                onTouchMove={handleTextareaTouchMove}
              />
            </div>
            
            {/* Footer Stats */}
            <div className="px-3 py-2 border-t border-green-200 bg-green-50 text-xs text-green-800 flex justify-between items-center">
              <div className="flex items-center space-x-3">
                <div className="flex items-center">
                  <div className="w-2 h-2 rounded-full bg-green-500 mr-1"></div>
                  <span>{data.response.length} characters</span>
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 rounded-full bg-blue-500 mr-1"></div>
                  <span>{data.response.split(' ').length} words</span>
                </div>
              </div>
              <button
                onClick={() => {
                  if (textareaRef.current) {
                    textareaRef.current.scrollTop = 0;
                  }
                }}
                className="text-green-700 hover:text-green-900 flex items-center text-xs"
              >
                <ChevronUp size={12} className="mr-1" />
                Scroll to top
              </button>
            </div>
          </div>
        )}
      </div>
      
      {/* Output Handle */}
      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 bg-green-600 border-2 border-white"
        id="output"
        style={{ top: '50%' }}
      />
      
      {/* Node Footer */}
      <div className="text-xs text-gray-500 mt-2 flex justify-between items-center">
        <div className="flex items-center">
          <div className={`w-2 h-2 rounded-full mr-1 ${canRun ? 'bg-green-500' : 'bg-gray-400'}`} />
          <span>{canRun ? 'Ready to run' : 'Connect text input'}</span>
        </div>
        <div className="text-xs flex items-center">
          {connectionStatus.hasImages && (
            <span className="text-green-600 flex items-center">
              <ImageIcon size={12} className="mr-1" />
              Vision
            </span>
          )}
        </div>
      </div>
    </div>
  );
}