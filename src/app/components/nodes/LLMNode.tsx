import { Handle, Position, NodeProps } from "reactflow";
import {
  Play,
  AlertCircle,
  CheckCircle,
  Image as ImageIcon,
  Link,
  Copy,
  ChevronUp,
  Brain,
  Zap,
  Sparkles,
  Cpu,
  Maximize2,
  Minimize2,
  Settings,
  Clock,
  Layers,
  Shield,
} from "lucide-react";
import { WorkflowNodeData } from "../../lib/types/workflow";
import { useWorkflowStore } from "../../lib/store/useWorkflowStore";
import { useState, useEffect, useRef, useCallback } from "react";
import { NodeMenu } from "../../components/ui/NodeMenu";
import { cn } from "../../lib/utils/cn";

const NODE_SIZES = {
  small: { width: 380, padding: "px-4 py-3", maxHeight: "max-h-[350px]" },
  medium: { width: 480, padding: "px-5 py-4", maxHeight: "max-h-[400px]" },
  large: { width: 580, padding: "px-6 py-5", maxHeight: "max-h-[450px]" },
} as const;

type NodeSize = keyof typeof NODE_SIZES;

export default function LLMNode({
  id,
  data,
  selected,
}: NodeProps<WorkflowNodeData>) {
  const updateNode = useWorkflowStore((state) => state.updateNode);
  const deleteNode = useWorkflowStore((state) => state.deleteNode);
  const setSelectedNode = useWorkflowStore((state) => state.setSelectedNode);
  const edges = useWorkflowStore((state) => state.edges);
  const nodes = useWorkflowStore((state) => state.nodes);

  const [isRunning, setIsRunning] = useState(false);
  const [selectedModel, setSelectedModel] = useState(
    data.model || "gemini-2.5-flash"
  );
  const [nodeSize, setNodeSize] = useState<NodeSize>("medium");
  const [isHoveringResize, setIsHoveringResize] = useState(false);

  const [connectionStatus, setConnectionStatus] = useState({
    hasUserMessage: false,
    hasSystemPrompt: false,
    hasImages: false,
  });

  const outputRef = useRef<HTMLDivElement>(null);
  const nodeRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Initialize node size from data
  useEffect(() => {
    if (data.nodeSize && ["small", "medium", "large"].includes(data.nodeSize)) {
      setNodeSize(data.nodeSize as NodeSize);
    }
  }, [data.nodeSize]);

  const handleDelete = () => deleteNode(id);

  const handleDuplicate = () => {
    const node = useWorkflowStore.getState().nodes.find((n) => n.id === id);
    if (node) {
      const addNode = useWorkflowStore.getState().addNode;
      const newNodeId = addNode(node.type as string, {
        x: node.position.x + 50,
        y: node.position.y + 50,
      });
      useWorkflowStore.getState().updateNode(newNodeId, {
        ...node.data,
        nodeSize,
      });
    }
  };

  // Update node size in store when it changes
  useEffect(() => {
    if (data.nodeSize !== nodeSize) {
      updateNode(id, { ...data, nodeSize });
    }
  }, [nodeSize, id, data, updateNode]);

  // Check connections
  useEffect(() => {
    const connectedEdges = edges.filter((edge) => edge.target === id);
    setConnectionStatus({
      hasUserMessage: connectedEdges.some(
        (edge) => edge.targetHandle === "user_message"
      ),
      hasSystemPrompt: connectedEdges.some(
        (edge) => edge.targetHandle === "system_prompt"
      ),
      hasImages: connectedEdges.some((edge) => edge.targetHandle === "images"),
    });
  }, [edges, id]);

  // Handle scroll events within the node
  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    if (!scrollContainer) return;

    const handleWheel = (e: WheelEvent) => {
      // Only handle if we're over the scrollable content
      const isAtTop = scrollContainer.scrollTop === 0;
      const isAtBottom =
        scrollContainer.scrollHeight - scrollContainer.scrollTop <=
        scrollContainer.clientHeight + 1;

      // Prevent React Flow from zooming when we can scroll more
      if (!(isAtTop && e.deltaY < 0) && !(isAtBottom && e.deltaY > 0)) {
        e.stopPropagation();
      }
    };

    const handleTouchStart = (e: TouchEvent) => {
      // Store initial touch position
      const touch = e.touches[0];
      scrollContainer.setAttribute(
        "data-touch-start",
        touch.clientY.toString()
      );
    };

    const handleTouchMove = (e: TouchEvent) => {
      // Only prevent if we have scrollable content
      const isAtTop = scrollContainer.scrollTop === 0;
      const isAtBottom =
        scrollContainer.scrollHeight - scrollContainer.scrollTop <=
        scrollContainer.clientHeight + 1;

      const touch = e.touches[0];
      const startY = parseFloat(
        scrollContainer.getAttribute("data-touch-start") || "0"
      );
      const deltaY = touch.clientY - startY;

      // Only prevent if we're scrolling inside the container
      if (!(isAtTop && deltaY > 0) && !(isAtBottom && deltaY < 0)) {
        e.stopPropagation();
      }
    };

    scrollContainer.addEventListener("wheel", handleWheel, { passive: false });
    scrollContainer.addEventListener("touchstart", handleTouchStart, {
      passive: true,
    });
    scrollContainer.addEventListener("touchmove", handleTouchMove, {
      passive: false,
    });

    return () => {
      scrollContainer.removeEventListener("wheel", handleWheel);
      scrollContainer.removeEventListener("touchstart", handleTouchStart);
      scrollContainer.removeEventListener("touchmove", handleTouchMove);
    };
  }, []);

  // Handle resize
  const handleResizeClick = (size: NodeSize) => {
    setNodeSize(size);
  };

  // Node functions
  const getConnectedText = () => {
    const userMessageEdge = edges.find(
      (edge) => edge.target === id && edge.targetHandle === "user_message"
    );
    if (!userMessageEdge) return "";
    const textNode = nodes.find((node) => node.id === userMessageEdge.source);
    return textNode?.data.value || "";
  };

  const getSystemPrompt = () => {
    if (connectionStatus.hasSystemPrompt) {
      const systemPromptEdge = edges.find(
        (edge) => edge.target === id && edge.targetHandle === "system_prompt"
      );
      if (systemPromptEdge) {
        const systemNode = nodes.find(
          (node) => node.id === systemPromptEdge.source
        );
        return systemNode?.data.value || "";
      }
    }
    return data.systemPrompt || "";
  };

  const getConnectedImages = (): string[] => {
    const images: string[] = [];
    if (connectionStatus.hasImages) {
      edges
        .filter((edge) => edge.target === id && edge.targetHandle === "images")
        .forEach((edge) => {
          const imageNode = nodes.find((node) => node.id === edge.source);
          if (imageNode?.data.image) images.push(imageNode.data.image);
        });
    }
    if (data.image) images.push(data.image);
    return images;
  };

  const handleRun = async () => {
    if (!connectionStatus.hasUserMessage) return;

    setIsRunning(true);
    updateNode(id, { isLoading: true, error: undefined, response: undefined });

    try {
      const userMessage = getConnectedText();
      const systemPrompt = getSystemPrompt();
      const images = getConnectedImages();

      const response = await fetch("/api/gemini", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: selectedModel,
          systemPrompt,
          userMessage,
          images,
        }),
      });

      const result = await response.json();

      if (result.error) {
        updateNode(id, {
          error: result.error,
          isLoading: false,
          response: undefined,
        });
      } else {
        updateNode(id, {
          response: result.text,
          isLoading: false,
          error: undefined,
        });
      }
    } catch (error: any) {
      updateNode(id, {
        error: "Failed to process request: " + error.message,
        isLoading: false,
        response: undefined,
      });
    } finally {
      setIsRunning(false);
    }
  };

  const handleCopy = () => {
    if (data.response) {
      navigator.clipboard.writeText(data.response);
      updateNode(id, { error: "✓ Copied to clipboard" });
      setTimeout(() => updateNode(id, { error: undefined }), 2000);
    }
  };

  // Models
  const MODELS = [
    {
      id: "gemini-2.5-flash",
      name: "Gemini Flash 2.5",
      description: "Ultra-fast inference, multimodal",
      speed: "⚡ 300ms",
      context: "1M tokens",
      supportsVision: true,
      color: "from-cyan-400 to-blue-500",
    },
    {
      id: "gemini-2.5-pro",
      name: "Gemini Pro 2.5",
      description: "Most capable reasoning",
      speed: "⏱️ 2s",
      context: "2M tokens",
      supportsVision: true,
      color: "from-purple-400 to-fuchsia-500",
    },
    {
      id: "gemini-2.0-flash",
      name: "Gemini Flash 2.0",
      description: "Balanced performance",
      speed: "⚡ 400ms",
      context: "1M tokens",
      supportsVision: true,
      color: "from-amber-300 to-orange-500",
    }
  ];

  const currentModel = MODELS.find((m) => m.id === selectedModel);
  const currentSize = NODE_SIZES[nodeSize];
  const canRun = connectionStatus.hasUserMessage;
  const hasImageInput = connectionStatus.hasImages || data.image;

  return (
    <div
      ref={nodeRef}
      className={cn(
        "shadow-2xl rounded-2xl relative group transition-all duration-300 backdrop-blur-sm overflow-hidden",
        currentSize.padding,
        selected
          ? "border-2 border-amber-500/50 shadow-amber-500/20 bg-linear-to-br from-gray-900 to-gray-800"
          : "border border-gray-700/50 hover:border-gray-600/50 bg-linear-to-br from-gray-800 to-gray-900"
      )}
      style={{ width: currentSize.width }}
      onClick={(e) => {
        const target = e.target as HTMLElement;
        if (
          !target.closest(".node-menu") &&
          !target.closest(".resize-handle") &&
          !target.closest(".size-preset-btn")
        ) {
          setSelectedNode(id);
        }
      }}
      onWheel={(e) => {
        // Stop wheel events from propagating to React Flow when we're over the node
        const target = e.target as HTMLElement;
        if (
          target.closest(".scroll-container") ||
          target.closest(".node-content")
        ) {
          e.stopPropagation();
        }
      }}
    >
      {/* Glow effect */}
      {selected && (
        <div className="absolute inset-0 bg-linear-to-br from-amber-500/10 via-orange-500/5 to-transparent rounded-2xl -z-10" />
      )}

      {/* Border resize indicator */}
      <div
        className={cn(
          "absolute inset-0 pointer-events-none border-2 border-transparent transition-all duration-300",
          isHoveringResize && "border-amber-400/30"
        )}
      />

      {/* Resize handle */}
      <div
        className={cn(
          "resize-handle absolute -bottom-2 -right-2 w-5 h-5 bg-linear-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg z-50 transition-all opacity-0 group-hover:opacity-100",
          isHoveringResize && "scale-110"
        )}
        onMouseEnter={() => setIsHoveringResize(true)}
        onMouseLeave={() => setIsHoveringResize(false)}
        title="Click size buttons to resize"
      >
        <Maximize2 size={10} className="text-white" />
      </div>

      {/* Size presets */}
      <div className="size-control absolute -top-2 left-1/2 transform -translate-x-1/2 flex items-center gap-1 bg-linear-to-r from-gray-800 to-gray-900 border border-gray-700/50 rounded-full px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity z-20">
        <div className="flex items-center gap-1">
          {(["small", "medium", "large"] as NodeSize[]).map((size) => (
            <button
              key={size}
              onClick={() => handleResizeClick(size)}
              className={cn(
                "size-preset-btn w-6 h-6 flex items-center justify-center rounded text-xs transition-all",
                nodeSize === size
                  ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                  : "text-gray-400 hover:text-white hover:bg-gray-700/50"
              )}
              title={size.charAt(0).toUpperCase() + size.slice(1)}
            >
              {size.charAt(0).toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Input Handles */}
      <Handle
        type="target"
        position={Position.Left}
        className="w-4 h-4 border-2 border-gray-900 transition-all duration-300 hover:scale-110"
        style={{
          backgroundColor: "#3b82f6",
          backdropFilter: "blur(4px)",
          top: "35%",
        }}
        id="system_prompt"
      />
      <Handle
        type="target"
        position={Position.Left}
        className="w-4 h-4 border-2 border-gray-900 transition-all duration-300 hover:scale-110"
        style={{
          backgroundColor: "#8b5cf6",
          backdropFilter: "blur(4px)",
          top: "50%",
        }}
        id="user_message"
      />
      <Handle
        type="target"
        position={Position.Left}
        className="w-4 h-4 border-2 border-gray-900 transition-all duration-300 hover:scale-110"
        style={{
          backgroundColor: "#10b981",
          backdropFilter: "blur(4px)",
          top: "65%",
        }}
        id="images"
      />

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <div className="relative mr-3">
            <div className="absolute inset-0 bg-linear-to-br from-amber-400 to-orange-500 rounded-xl blur opacity-30" />
            <div
              className={cn(
                "relative w-10 h-10 rounded-xl flex items-center justify-center",
                selected
                  ? "bg-linear-to-br from-amber-500 to-orange-600"
                  : "bg-linear-to-br from-amber-400/90 to-orange-500/90"
              )}
            >
              <Brain size={20} className="text-white" />
            </div>
          </div>
          <div>
            <h3
              className={cn(
                "font-semibold tracking-tight text-lg",
                selected
                  ? "bg-linear-to-r from-amber-300 to-orange-300 bg-clip-text text-transparent"
                  : "text-gray-100"
              )}
            >
              LLM Processor
            </h3>
            <p className="text-md text-gray-200/90 font-mono tracking-wide">
              Multi-modal inference engine
            </p>
          </div>
        </div>

        {/* Run button */}
        <button
          onClick={handleRun}
          disabled={!canRun || isRunning}
          className={cn(
            "relative px-4 py-2 rounded-xl font-medium text-sm transition-all duration-300 gap-2",
            canRun && !isRunning
              ? "bg-linear-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white shadow-lg hover:shadow-amber-500/30"
              : "bg-gray-800/50 border border-gray-700/50 text-gray-400",
            isRunning && "from-amber-600 to-orange-600 cursor-wait"
          )}
        >
          {isRunning ? (
            <span className="flex items-center gap-2">
              <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Processing
            </span>
          ) : (
            <span className="flex w-full items-center text-lg gap-2">
              <Play size={20} />
            </span>
          )}
        </button>
      </div>

      {/* Status indicator */}
      <div className="flex items-center justify-between mb-4 p-3 bg-linear-to-br from-gray-800/40 to-gray-900/40 rounded-xl border border-gray-700/30">
        <div className="flex items-center gap-5">
          {/* Input */}
          <div className="flex items-center gap-2.5">
            <div
              className={cn(
                "w-3.5 h-3.5 rounded-full transition-all duration-300",
                connectionStatus.hasUserMessage
                  ? "bg-emerald-400 animate-pulse"
                  : "bg-gray-600"
              )}
            />
            <span
              className={cn(
                "text-sm font-medium transition-colors",
                connectionStatus.hasUserMessage
                  ? "text-emerald-300"
                  : "text-gray-400"
              )}
            >
              Input
            </span>
          </div>

          {/* System */}
          <div className="flex items-center gap-2.5">
            <div
              className={cn(
                "w-3.5 h-3.5 rounded-full transition-all duration-300",
                connectionStatus.hasSystemPrompt ? "bg-blue-400" : "bg-gray-600"
              )}
            />
            <span
              className={cn(
                "text-sm font-medium transition-colors",
                connectionStatus.hasSystemPrompt
                  ? "text-blue-300"
                  : "text-gray-400"
              )}
            >
              System
            </span>
          </div>

          {/* Vision */}
          <div className="flex items-center gap-2.5">
            <div
              className={cn(
                "w-3.5 h-3.5 rounded-full transition-all duration-300",
                connectionStatus.hasImages ? "bg-fuchsia-400" : "bg-gray-600"
              )}
            />
            <span
              className={cn(
                "text-sm font-medium transition-colors",
                connectionStatus.hasImages
                  ? "text-fuchsia-300"
                  : "text-gray-400"
              )}
            >
              Vision
            </span>
          </div>
        </div>

        {!connectionStatus.hasUserMessage && (
          <div className="text-sm text-amber-400/80 flex items-center gap-1.5">
            <AlertCircle size={14} />
            <span>Connect text input</span>
          </div>
        )}
      </div>

      {/* Main scrollable content - FIXED SCROLLING */}
      <div
        ref={scrollContainerRef}
        className={cn(
          "node-content scroll-container space-y-4 overflow-y-auto pr-1",
          currentSize.maxHeight,
          "hover-scroll" // Custom scroll behavior
        )}
        onWheel={(e) => {
          // Handle scroll propagation
          e.stopPropagation();
        }}
      >
        {/* Model selector */}
        <div className="relative group/model">
          <div className="absolute inset-0 bg-linear-to-br from-gray-800/30 to-transparent rounded-xl opacity-0 group-hover/model:opacity-100 transition-opacity" />
          <div className="relative p-3 bg-linear-to-br from-gray-800/40 to-gray-900/40 rounded-xl border border-gray-700/30">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Cpu size={14} className="text-amber-300" />
                <label className="text-xs font-semibold text-gray-300 uppercase tracking-wider">
                  LLM Model
                </label>
              </div>
            </div>

            <select
              value={selectedModel}
              onChange={(e) => {
                setSelectedModel(e.target.value);
                updateNode(id, { model: e.target.value });
              }}
              className="w-full bg-gray-900/50 border border-gray-700/50 rounded-lg px-3 py-2.5 text-sm text-gray-200 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500/30 transition-all appearance-none"
            >
              {MODELS.map((model) => (
                <option key={model.id} value={model.id} className="bg-gray-900">
                  {model.name}
                </option>
              ))}
            </select>

            {currentModel && (
              <div className="mt-2 flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <span className="text-gray-400">
                    {currentModel.description}
                  </span>
                  <span className="text-amber-300/70 font-mono">
                    {currentModel.speed}
                  </span>
                </div>
                <span className="text-gray-500 font-mono">
                  {currentModel.context}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* System prompt - Only if not connected */}
        {!connectionStatus.hasSystemPrompt && (
          <div className="p-3 bg-linear-to-br from-gray-800/40 to-gray-900/40 rounded-xl border border-gray-700/30">
            <div className="flex items-center gap-2 mb-2">
              <Settings size={14} className="text-blue-300" />
              <label className="text-xs font-semibold text-gray-300 uppercase tracking-wider">
                System Instructions
              </label>
            </div>
            <textarea
              value={data.systemPrompt || ""}
              onChange={(e) => updateNode(id, { systemPrompt: e.target.value })}
              placeholder="Define AI behavior and constraints..."
              className="w-full bg-gray-900/30 border border-gray-700/50 rounded-lg px-3 py-2 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/30 resize-none"
              rows={2}
              onWheel={(e) => e.stopPropagation()}
            />
          </div>
        )}

        {/* Status indicators */}
        {data.error && (
          <div className="p-3 bg-linear-to-br from-red-900/20 to-red-900/10 rounded-xl border border-red-700/30">
            <div className="flex items-center gap-2 text-red-300">
              <AlertCircle size={14} />
              <span className="text-sm font-medium">Error</span>
            </div>
            <p className="text-xs text-red-400/80 mt-1">{data.error}</p>
          </div>
        )}

        {data.isLoading && (
          <div className="p-4 bg-linear-to-br from-gray-800/40 to-gray-900/40 rounded-xl border border-gray-700/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="absolute inset-0 bg-linear-to-r from-amber-500/20 to-orange-500/20 rounded-full blur animate-pulse" />
                  <div className="relative w-8 h-8 border-2 border-amber-500/30 border-t-amber-400 rounded-full animate-spin" />
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-200">
                    Processing
                  </div>
                  <div className="text-xs text-gray-400">
                    Analyzing{" "}
                    {hasImageInput ? "multimodal input" : "text input"}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <Clock size={12} />
                <span>~2s</span>
              </div>
            </div>
            <div className="mt-3 h-1 bg-gray-800/50 rounded-full overflow-hidden">
              <div className="h-full bg-linear-to-r from-amber-500 to-orange-500 animate-pulse" />
            </div>
          </div>
        )}

        {/* Response */}
        {data.response && !data.isLoading && (
          <div className="bg-linear-to-br from-gray-900/40 to-gray-800/40 rounded-xl border border-gray-700/30 overflow-hidden">
            <div className="p-3 border-b border-gray-700/30 bg-linear-to-r from-gray-800/50 to-gray-900/50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-lg font-mono font-semibold text-gray-100">
                  Output
                </span>
                <div className="flex items-center gap-2 text-md">
                  <span className="px-2 py-0.5 bg-emerald-600/90 text-emerald-300 rounded-full border border-emerald-700/30">
                    {Math.ceil(data.response.length / 4)} tokens
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1 px-2 py-1 text-xs text-gray-300 hover:text-white bg-gray-800/50 hover:bg-gray-700/50 rounded-lg border border-gray-700/50 transition-colors"
                >
                  <Copy size={12} />
                  Copy
                </button>
              </div>
            </div>

            <div className="p-4">
              <div
                ref={outputRef}
                className="font-mono text-sm text-gray-300 leading-relaxed whitespace-pre-wrap max-h-50 overflow-y-auto scrollbar-thin"
                style={{ minHeight: "80px" }}
              >
                {data.response}
              </div>
            </div>

            <div className="px-3 py-2 border-t border-gray-700/30 bg-linear-to-r from-gray-900/50 to-gray-800/50 text-xs text-gray-400 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1">
                  <Shield size={12} />
                  <span>Secure inference</span>
                </div>
                <div className="flex items-center gap-1">
                  <Layers size={12} />
                  <span>{data.response.length} chars</span>
                </div>
              </div>
              <button
                onClick={() =>
                  outputRef.current?.scrollTo({ top: 0, behavior: "smooth" })
                }
                className="text-gray-400 hover:text-amber-300 transition-colors"
              >
                <ChevronUp size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Output Handle */}
      <Handle
        type="source"
        position={Position.Right}
        className="w-4 h-4 border-2 border-gray-900 transition-all duration-300 hover:scale-110"
        style={{
          backgroundColor: "#10b981",
          backdropFilter: "blur(4px)",
          top: "50%",
        }}
        id="output"
      />

      {/* Footer */}
      <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-700/30">
        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1">
            <div
              className={cn(
                "w-2 h-2 rounded-full",
                canRun ? "bg-emerald-400 animate-pulse" : "bg-gray-600"
              )}
            />
            <span className={cn(canRun ? "text-emerald-300" : "text-gray-400")}>
              {canRun ? "Ready" : "Awaiting input"}
            </span>
          </div>
          {connectionStatus.hasImages && (
            <div className="flex items-center gap-1 text-fuchsia-300">
              <ImageIcon size={12} />
              <span>Vision enabled</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 text-xs text-gray-500">
          <span className="font-mono">
            AI-{selectedModel.split("-")[2] || "PRO"}
          </span>
          <div className="w-1 h-1 rounded-full bg-gray-600" />
          <span>Multimodal</span>
        </div>
      </div>

      {/* Delete button */}
      {selected && (
        <button
          onClick={handleDelete}
          className="absolute -bottom-3 left-1/2 transform -translate-x-1/2 px-4 py-1.5 bg-linear-to-br from-red-500/20 to-red-600/20 text-red-300 text-xs rounded-xl shadow-lg hover:from-red-500/30 hover:to-red-600/30 hover:text-white transition-all duration-200 z-10 backdrop-blur-sm border border-red-500/30"
          onMouseDown={(e) => e.stopPropagation()}
        >
          Delete Node
        </button>
      )}

      {/* CSS for better scrolling */}
      <style jsx>{`
        .scroll-container {
          scrollbar-width: thin;
          scrollbar-color: rgba(75, 85, 99, 0.5) rgba(31, 41, 55, 0.3);
        }

        .scroll-container::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }

        .scroll-container::-webkit-scrollbar-track {
          background: rgba(31, 41, 55, 0.3);
          border-radius: 3px;
        }

        .scroll-container::-webkit-scrollbar-thumb {
          background: rgba(75, 85, 99, 0.5);
          border-radius: 3px;
          transition: background 0.2s ease;
        }

        .scroll-container::-webkit-scrollbar-thumb:hover {
          background: rgba(107, 114, 128, 0.7);
        }

        .hover-scroll {
          /* Make scrolling smoother */
          scroll-behavior: smooth;
        }

        /* Custom select styling */
        select {
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%239ca3af'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E");
          background-position: right 0.5rem center;
          background-repeat: no-repeat;
          background-size: 1rem;
          padding-right: 2rem;
        }

        /* Disable text selection on scroll handles */
        .scroll-container {
          user-select: none;
        }

        /* Enable text selection in content areas */
        .scroll-container * {
          user-select: text;
        }
      `}</style>
    </div>
  );
}
