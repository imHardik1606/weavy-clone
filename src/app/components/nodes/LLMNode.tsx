import { Handle, Position, NodeProps } from "reactflow";
import { Play, AlertCircle, CheckCircle, Link } from "lucide-react";
import { WorkflowNodeData } from "../../lib/types/workflow";
import { useWorkflowStore } from "../../lib/store/useWorkflowStore";
import { useState, useMemo } from "react";

const MODELS = [
  { id: "gemini-2.5-flash", name: "Gemini 2.5 Flash" },
  { id: "gemini-2.5-pro", name: "Gemini 2.5 Pro" },
  { id: "gemini-2.0-flash", name: "Gemini 2.0 Flash" },
];

export default function LLMNode({ id, data }: NodeProps<WorkflowNodeData>) {
  const updateNode = useWorkflowStore((state) => state.updateNode);
  const nodes = useWorkflowStore((state) => state.nodes);
  const edges = useWorkflowStore((state) => state.edges);
  const [isRunning, setIsRunning] = useState(false);

  // Get connected text from Text Node
  const connectedText = useMemo(() => {
    // Find edges connected to this node's user_message handle
    const userMessageEdge = edges.find(
      (edge) => edge.target === id && edge.targetHandle === "user_message"
    );
    
    if (!userMessageEdge) return "";
    
    // Find the source Text Node
    const textNode = nodes.find((node) => node.id === userMessageEdge.source);
    return textNode?.data.value || "";
  }, [edges, nodes, id]);

  // Get connected system prompt
  const connectedSystemPrompt = useMemo(() => {
    const systemPromptEdge = edges.find(
      (edge) => edge.target === id && edge.targetHandle === "system_prompt"
    );
    
    if (!systemPromptEdge) return "";
    
    const textNode = nodes.find((node) => node.id === systemPromptEdge.source);
    return textNode?.data.value || "";
  }, [edges, nodes, id]);

  // Check if we can run
  const canRun = useMemo(() => {
    return connectedText.trim().length > 0 && !isRunning;
  }, [connectedText, isRunning]);

  const handleRun = async () => {
    if (!canRun) return;
    
    setIsRunning(true);
    updateNode(id, { isLoading: true, error: undefined });

    try {
      console.log("Sending to Gemini:", {
        model: data.model,
        systemPrompt: connectedSystemPrompt || data.systemPrompt || "",
        userMessage: connectedText,
        textLength: connectedText.length
      });

      // Use connected text, not data.value
      const response = await fetch("/api/gemini", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: data.model || "gemini-2.5-flash",
          systemPrompt: connectedSystemPrompt || data.systemPrompt || "",
          userMessage: connectedText,
          images: data.image ? [data.image] : [],
        }),
      });

      const result = await response.json();
      console.log("Gemini response:", result);

      if (result.error) {
        updateNode(id, { error: result.error, isLoading: false });
      } else {
        updateNode(id, { response: result.text, isLoading: false });
      }
    } catch (error: any) {
      console.error("LLM Node error:", error);
      updateNode(id, { 
        error: error.message || "Failed to process request", 
        isLoading: false 
      });
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="px-4 py-3 shadow-lg rounded-xl bg-white border border-gray-200 min-w-[280px]">
      {/* Input Handles */}
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 !bg-purple-500 !border-2 !border-white"
        id="system_prompt"
        style={{ top: "20%" }}
      />
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 !bg-blue-500 !border-2 !border-white"
        style={{ top: "40%" }}
        id="user_message"
      />
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 !bg-green-500 !border-2 !border-white"
        style={{ top: "60%" }}
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
            <p className="text-xs text-gray-500">
              {MODELS.find(m => m.id === data.model)?.name || 'Select model'}
            </p>
          </div>
        </div>
        
        <button
          onClick={handleRun}
          disabled={!canRun}
          className={`px-3 py-1 rounded-lg text-sm font-medium flex items-center ${
            !canRun
              ? "bg-gray-100 text-gray-400 cursor-not-allowed"
              : "bg-purple-600 text-white hover:bg-purple-700"
          }`}
          title={!canRun ? "Connect a Text Node with text" : "Run LLM"}
        >
          {isRunning ? (
            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1"></div>
          ) : (
            <Play size={12} className="mr-1" />
          )}
          Run
        </button>
      </div>

      {/* CONNECTION STATUS - VISIBLE TEXT DISPLAY */}
      <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center">
            {connectedText ? (
              <Link size={14} className="text-green-600 mr-2" />
            ) : (
              <Link size={14} className="text-red-600 mr-2" />
            )}
            <span className="text-sm font-medium text-gray-700">
              Text Input
            </span>
          </div>
          <span className={`text-xs px-2 py-1 rounded-full ${
            connectedText ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            {connectedText ? 'Connected' : 'Not Connected'}
          </span>
        </div>
        
        {connectedText ? (
          <div>
            <div className="p-2 bg-white border border-gray-300 rounded text-sm text-gray-800 whitespace-pre-wrap">
              {connectedText}
            </div>
            <div className="flex justify-between items-center mt-2">
              <span className="text-xs text-gray-500">
                From connected Text Node
              </span>
              <span className="text-xs text-gray-500">
                {connectedText.length} chars
              </span>
            </div>
          </div>
        ) : (
          <div className="text-xs text-amber-600 p-2">
            ⚠️ Connect a Text Node to the <span className="font-semibold">blue handle</span> above
          </div>
        )}
      </div>

      {/* Configuration */}
      <div className="space-y-3">
        <div>
          <label className="text-xs font-medium text-gray-700 mb-1 block">
            Model
          </label>
          <select
            value={data.model || "gemini-2.5-flash"}
            onChange={(e) => updateNode(id, { model: e.target.value })}
            className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            disabled={isRunning}
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
            value={data.systemPrompt || ""}
            onChange={(e) => updateNode(id, { systemPrompt: e.target.value })}
            placeholder="Add system instructions..."
            className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 min-h-[60px] resize-y focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            rows={2}
            disabled={isRunning}
          />
          {connectedSystemPrompt && (
            <div className="text-xs text-gray-500 mt-1 p-1 bg-blue-50 rounded">
              📝 Also using connected system prompt
            </div>
          )}
        </div>

        {/* Status Messages */}
        {data.error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center text-red-700">
              <AlertCircle size={16} className="mr-2" />
              <span className="text-sm font-medium">Error</span>
            </div>
            <p className="text-sm text-red-600 mt-1">{data.error}</p>
          </div>
        )}

        {data.response && !data.isLoading && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center text-green-700">
              <CheckCircle size={16} className="mr-2" />
              <span className="text-sm font-medium">Response</span>
            </div>
            <p className="text-sm text-green-800 mt-1 whitespace-pre-wrap">{data.response}</p>
          </div>
        )}

        {data.isLoading && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mr-3"></div>
              <span className="text-sm font-medium text-blue-700">Processing with Gemini...</span>
            </div>
          </div>
        )}
      </div>

      {/* Output Handle */}
      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 !bg-green-500 !border-2 !border-white"
        id="output"
      />
      
      {/* Footer */}
      <div className="text-xs text-gray-500 mt-3 flex justify-between items-center">
        <span>Output: LLM Response</span>
        <span className={`px-2 py-1 rounded ${canRun ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
          {canRun ? 'Ready to run' : 'Waiting for input'}
        </span>
      </div>
    </div>
  );
}