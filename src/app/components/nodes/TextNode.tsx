import { Handle, Position, NodeProps } from "reactflow";
import { WorkflowNodeData } from "../../lib/types/workflow";
import { useWorkflowStore } from "../../lib/store/useWorkflowStore";
import { NodeMenu } from "../../components/ui/NodeMenu";
import { cn } from "../../lib/utils/cn";
import { useEffect, useRef, useState, useCallback } from "react";
import { 
  Type, 
  Maximize2, 
  Minimize2, 
  TextCursor, 
  Hash, 
  Copy, 
  AlignLeft,
  Bold,
  Italic,
  Search,
  Sparkles,
  Move
} from "lucide-react";

// Extend the base type to include nodeSize
type ExtendedWorkflowNodeData = WorkflowNodeData & {
  nodeSize?: 'small' | 'medium' | 'large';
  fontSize?: 'sm' | 'base' | 'lg';
  fontStyle?: 'normal' | 'italic' | 'bold';
  alignment?: 'left' | 'center' | 'right';
};

// Size presets for the node
const SIZE_PRESETS = {
  small: { 
    width: 280, 
    textareaRows: 1,
    fontSize: "sm" as const,
    iconSize: 12,
    padding: "px-3 py-2"
  },
  medium: { 
    width: 360, 
    textareaRows: 2,
    fontSize: "base" as const,
    iconSize: 14,
    padding: "px-4 py-3"
  },
  large: { 
    width: 480, 
    textareaRows: 4,
    fontSize: "lg" as const,
    iconSize: 16,
    padding: "px-5 py-4"
  },
} as const;

type NodeSize = keyof typeof SIZE_PRESETS;

export default function TextNode({ id, data, selected }: NodeProps<ExtendedWorkflowNodeData>) {
  const updateNode = useWorkflowStore((state) => state.updateNode);
  const deleteNode = useWorkflowStore((state) => state.deleteNode);
  const setSelectedNode = useWorkflowStore((state) => state.setSelectedNode);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const nodeRef = useRef<HTMLDivElement>(null);
  const resizeHandleRef = useRef<HTMLDivElement>(null);
  
  const [nodeSize, setNodeSize] = useState<NodeSize>(data.nodeSize || 'medium');
  const [isResizing, setIsResizing] = useState(false);
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0 });
  const [fontStyle, setFontStyle] = useState<'normal' | 'italic' | 'bold'>(data.fontStyle || 'normal');
  const [alignment, setAlignment] = useState<'left' | 'center' | 'right'>(data.alignment || 'left');
  const [isHoveringResize, setIsHoveringResize] = useState(false);

  // Update node size in store
  useEffect(() => {
    if (data.nodeSize !== nodeSize || data.fontStyle !== fontStyle || data.alignment !== alignment) {
      updateNode(id, { ...data, nodeSize, fontStyle, alignment });
    }
  }, [nodeSize, fontStyle, alignment, id, data, updateNode]);

  const handleDelete = () => {
    deleteNode(id);
  };
  
  const handleDuplicate = () => {
    const node = useWorkflowStore.getState().nodes.find(n => n.id === id);
    if (node) {
      const addNode = useWorkflowStore.getState().addNode;
      const newNodeId = addNode(node.type as string, {
        x: node.position.x + 50,
        y: node.position.y + 50
      });
      useWorkflowStore.getState().updateNode(newNodeId, { 
        ...node.data, 
        nodeSize: data.nodeSize,
        fontStyle,
        alignment 
      });
    }
  };
  
  const handleConfigure = () => {
    console.log('Configure node:', id);
  };
  
  // Focus textarea when node is selected
  useEffect(() => {
    if (selected && textareaRef.current) {
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 100);
    }
  }, [selected]);

  // Size control handlers
  const cycleSize = () => {
    const sizes: NodeSize[] = ['small', 'medium', 'large'];
    const currentIndex = sizes.indexOf(nodeSize);
    const nextIndex = (currentIndex + 1) % sizes.length;
    setNodeSize(sizes[nextIndex]);
  };

  // FIXED: Custom resize handler that works with React Flow
  const startResize = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setIsResizing(true);
    setIsHoveringResize(true);
    
    if (nodeRef.current) {
      const rect = nodeRef.current.getBoundingClientRect();
      setResizeStart({
        x: e.clientX,
        y: e.clientY,
        width: rect.width
      });
    }
    
    // Use React Flow's event system
    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!isResizing) return;
      
      const deltaX = moveEvent.clientX - resizeStart.x;
      const newWidth = Math.max(240, Math.min(600, resizeStart.width + deltaX));
      
      // Determine closest preset
      let closestSize: NodeSize = 'medium';
      let minDiff = Infinity;
      
      Object.entries(SIZE_PRESETS).forEach(([size, preset]) => {
        const diff = Math.abs(preset.width - newWidth);
        if (diff < minDiff) {
          minDiff = diff;
          closestSize = size as NodeSize;
        }
      });
      
      if (closestSize !== nodeSize) {
        setNodeSize(closestSize);
        // Update resize start for continuous dragging
        setResizeStart(prev => ({
          ...prev,
          x: moveEvent.clientX,
          width: SIZE_PRESETS[closestSize].width
        }));
      }
    };
    
    const handleMouseUp = () => {
      setIsResizing(false);
      setIsHoveringResize(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [isResizing, resizeStart, nodeSize]);

  // Alternative: Direct resize without drag
  const handleResizeClick = (size: NodeSize) => {
    setNodeSize(size);
  };

  // Text analysis functions
  const getWordCount = () => {
    return data.value?.trim().split(/\s+/).filter(word => word.length > 0).length || 0;
  };

  const getSentenceCount = () => {
    return data.value?.split(/[.!?]+/).filter(s => s.trim().length > 0).length || 0;
  };

  const getEstimatedTokens = () => {
    const chars = data.value?.length || 0;
    return Math.ceil(chars / 4); // Rough estimation
  };

  const currentSize = SIZE_PRESETS[nodeSize];
  const textareaRows = currentSize.textareaRows;
  const paddingClass = currentSize.padding;

  const textStyleClass = {
    'normal': '',
    'italic': 'italic',
    'bold': 'font-semibold'
  }[fontStyle];

  const textAlignClass = {
    'left': 'text-left',
    'center': 'text-center',
    'right': 'text-right'
  }[alignment];

  return (
    <div 
      ref={nodeRef}
      className={cn(
        "shadow-2xl rounded-2xl relative group transition-all duration-300 backdrop-blur-sm overflow-hidden select-none",
        paddingClass,
        selected 
          ? "border-2 border-cyan-500/60 shadow-cyan-500/20 bg-linear-to-br from-gray-900 to-gray-800" 
          : "border border-gray-700/50 hover:border-gray-600/50 bg-linear-to-br from-gray-800 to-gray-900",
        isResizing && "cursor-se-resize"
      )}
      style={{ width: currentSize.width }}
      onClick={(e) => {
        const target = e.target as HTMLElement;
        const isInteractive = 
          target.closest('.node-menu') || 
          target.closest('.textarea-container') ||
          target.closest('.remove-btn') ||
          target.closest('.size-control') ||
          target.closest('.resize-handle') ||
          target.closest('.font-control') ||
          target.closest('.alignment-control') ||
          target.closest('.size-preset-btn');
        
        if (!isInteractive) {
          setSelectedNode(id);
        }
      }}
      onMouseDown={(e) => {
        // Prevent React Flow from handling node drag when resizing
        if (isResizing || (e.target as HTMLElement).closest('.resize-handle')) {
          e.stopPropagation();
        }
      }}
    >
      {/* Background glow effect */}
      {selected && (
        <div className="absolute inset-0 bg-linear-to-br from-cyan-500/10 via-blue-500/5 to-transparent rounded-2xl -z-10" />
      )}

      {/* Border resize indicator */}
      <div 
        className={cn(
          "absolute inset-0 pointer-events-none border-2 border-transparent transition-all duration-300",
          isHoveringResize && "border-cyan-400/30"
        )}
      />

      {/* Node Menu */}
      <div className="node-menu">
        <NodeMenu
          nodeId={id}
          nodeType="text"
          onDelete={handleDelete}
          onDuplicate={handleDuplicate}
          onConfigure={handleConfigure}
          position="top-right"
          className="bg-gray-800/90! border-gray-700/50!"
        />
      </div>
      
      {/* Resize handles at corners - FIXED: Using custom drag handler */}
      <div 
        ref={resizeHandleRef}
        className={cn(
          "resize-handle absolute -bottom-2 -right-2 w-5 h-5 bg-linear-to-br from-cyan-500 to-blue-600 rounded-full cursor-se-resize flex items-center justify-center shadow-lg z-50 transition-all",
          isHoveringResize ? "opacity-100 scale-110" : "opacity-0 group-hover:opacity-100"
        )}
        onMouseDown={startResize}
        onMouseEnter={() => setIsHoveringResize(true)}
        onMouseLeave={() => !isResizing && setIsHoveringResize(false)}
        title="Drag to resize"
      >
        <Maximize2 size={10} className="text-white" />
      </div>
      
      {/* Top-left resize indicator */}
      <div 
        className={cn(
          "resize-handle absolute -top-2 -left-2 w-5 h-5 border-2 border-cyan-400/50 rounded-full pointer-events-none transition-all",
          isHoveringResize ? "opacity-100" : "opacity-0 group-hover:opacity-50"
        )}
      />
      
      {/* Size control with presets */}
      <div className="size-control absolute -top-2 left-1/2 transform -translate-x-1/2 flex items-center gap-1 bg-linear-to-r from-gray-800 to-gray-900 border border-gray-700/50 rounded-full px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity z-20">
        <div className="flex items-center gap-1">
          <button 
            onClick={() => handleResizeClick('small')}
            className={cn(
              "size-preset-btn w-6 h-6 flex items-center justify-center rounded text-xs transition-all",
              nodeSize === 'small' 
                ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30" 
                : "text-gray-400 hover:text-white hover:bg-gray-700/50"
            )}
            title="Small"
          >
            S
          </button>
          <button 
            onClick={() => handleResizeClick('medium')}
            className={cn(
              "size-preset-btn w-6 h-6 flex items-center justify-center rounded text-xs transition-all",
              nodeSize === 'medium' 
                ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30" 
                : "text-gray-400 hover:text-white hover:bg-gray-700/50"
            )}
            title="Medium"
          >
            M
          </button>
          <button 
            onClick={() => handleResizeClick('large')}
            className={cn(
              "size-preset-btn w-6 h-6 flex items-center justify-center rounded text-xs transition-all",
              nodeSize === 'large' 
                ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30" 
                : "text-gray-400 hover:text-white hover:bg-gray-700/50"
            )}
            title="Large"
          >
            L
          </button>
        </div>
      </div>
      
      {/* Input Handle */}
      <Handle
        type="target"
        position={Position.Left}
        className={cn(
          "w-4 h-4 border-2 transition-all duration-300",
          selected 
            ? "border-gray-900 scale-110 shadow-[0_0_15px_rgba(34,211,238,0.7)]" 
            : "border-gray-800"
        )}
        style={{ 
          backgroundColor: '#22d3ee',
          backdropFilter: 'blur(4px)'
        }}
      />
      
      {/* Header with gradient */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center">
          <div className="relative mr-2">
            <div className="absolute inset-0 bg-linear-to-br from-cyan-400 to-blue-500 rounded-lg blur opacity-30" />
            <div className={cn(
              "relative w-8 h-8 rounded-lg flex items-center justify-center",
              selected ? "bg-linear-to-br from-cyan-500 to-blue-600" : "bg-linear-to-br from-cyan-400/90 to-blue-500/90"
            )}>
              <Type size={currentSize.iconSize} className="text-white" />
            </div>
          </div>
          <div>
            <h3 className={cn(
              "font-bold tracking-wide",
              currentSize.fontSize === 'sm' ? 'text-sm' : currentSize.fontSize === 'base' ? 'text-base' : 'text-lg',
              selected 
                ? "bg-linear-to-r from-cyan-300 to-blue-300 bg-clip-text text-transparent" 
                : "text-gray-200"
            )}>
              Text Input
            </h3>
            <p className="text-xs text-gray-400/70 mt-0.5">Raw text for AI processing</p>
          </div>
        </div>
        
        {/* Formatting controls */}
        <div className="flex items-center gap-1 bg-gray-800/50 rounded-lg p-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setFontStyle(fontStyle === 'normal' ? 'italic' : fontStyle === 'italic' ? 'bold' : 'normal');
            }}
            className={cn(
              "p-1.5 rounded hover:bg-gray-700/50 transition-colors",
              fontStyle === 'italic' && "text-cyan-300",
              fontStyle === 'bold' && "text-cyan-400 font-bold"
            )}
            title={fontStyle === 'normal' ? 'Italic' : fontStyle === 'italic' ? 'Bold' : 'Normal'}
          >
            {fontStyle === 'italic' ? <Italic size={12} /> : 
             fontStyle === 'bold' ? <Bold size={12} /> : 
             <TextCursor size={12} className="text-gray-400" />}
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setAlignment(alignment === 'left' ? 'center' : alignment === 'center' ? 'right' : 'left');
            }}
            className="p-1.5 rounded hover:bg-gray-700/50 transition-colors text-gray-400 hover:text-gray-300"
            title={`Align ${alignment}`}
          >
            <AlignLeft size={12} className={cn(
              alignment === 'center' && 'text-center',
              alignment === 'right' && 'text-right'
            )} />
          </button>
        </div>
      </div>
      
      {/* Textarea Container */}
      <div className="textarea-container relative mb-3 group/textarea">
        <div className={cn(
          "relative rounded-xl border overflow-hidden transition-all duration-200",
          selected 
            ? "border-cyan-500/30 bg-gray-900/50" 
            : "border-gray-700/50 bg-gray-900/30 hover:border-gray-600/50"
        )}>
          <textarea
            ref={textareaRef}
            value={data.value || ""}
            onChange={(e) => updateNode(id, { ...data, value: e.target.value })}
            placeholder="Enter your text here... (Markdown supported)"
            className={cn(
              "w-full bg-transparent text-gray-200 placeholder-gray-500 resize-none focus:outline-none focus:ring-0",
              textStyleClass,
              textAlignClass,
              currentSize.fontSize === 'sm' ? 'text-sm p-2' : 
              currentSize.fontSize === 'base' ? 'text-base p-3' : 
              'text-lg p-4',
              "transition-all duration-200"
            )}
            rows={textareaRows}
            onFocus={() => setSelectedNode(id)}
            style={{ minHeight: `${textareaRows * 24}px` }}
          />
          
          {/* Textarea gradient overlay on focus */}
          <div className={cn(
            "absolute inset-0 pointer-events-none bg-linear-to-b from-transparent via-gray-900/10 to-transparent opacity-0 transition-opacity",
            "group-hover/textarea:opacity-100"
          )} />
        </div>
        
        {/* Text stats on hover */}
        <div className="absolute -bottom-8 left-0 right-0 opacity-0 group-hover/textarea:opacity-100 transition-opacity duration-200 pointer-events-none">
          <div className="flex items-center justify-center gap-3">
            <div className="px-2 py-1 bg-gray-900/80 backdrop-blur-sm text-xs text-gray-300 rounded-lg border border-gray-700/50">
              {data.value?.length || 0} chars
            </div>
            <div className="px-2 py-1 bg-cyan-900/20 backdrop-blur-sm text-xs text-cyan-300 rounded-lg border border-cyan-700/30">
              {getWordCount()} words
            </div>
            <div className="px-2 py-1 bg-blue-900/20 backdrop-blur-sm text-xs text-blue-300 rounded-lg border border-blue-700/30">
              ~{getEstimatedTokens()} tokens
            </div>
          </div>
        </div>
      </div>
      
      {/* Character Count & Analysis */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 text-xs text-gray-400">
            <Hash size={10} />
            <span>{data.value?.length || 0} characters</span>
          </div>
          {data.value && (
            <div className="flex items-center gap-1 text-xs text-green-400/70">
              <Search size={10} />
              <span>{getSentenceCount()} sentences</span>
            </div>
          )}
        </div>
        
        {data.value && data.value.length > 100 && (
          <div className="flex items-center gap-1 text-xs">
            <div className="px-2 py-1 bg-linear-to-r from-cyan-500/20 to-blue-500/20 backdrop-blur-sm text-cyan-300 rounded-lg border border-cyan-500/30">
              {Math.ceil(data.value.length / 1000)}k tokens
            </div>
          </div>
        )}
      </div>
      
      {/* Text analysis bar */}
      {data.value && (
        <div className="relative h-1 bg-gray-800/50 rounded-full overflow-hidden mb-3">
          <div 
            className="absolute h-full bg-linear-to-r from-cyan-500 to-blue-500 transition-all duration-500"
            style={{ 
              width: `${Math.min(100, (data.value.length / 5000) * 100)}%` 
            }}
          />
          <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/10 to-transparent animate-shimmer" />
        </div>
      )}
      
      {/* Output Handle */}
      <Handle
        type="source"
        position={Position.Right}
        className={cn(
          "w-4 h-4 border-2 transition-all duration-300",
          selected 
            ? "border-gray-900 scale-110 shadow-[0_0_15px_rgba(16,185,129,0.7)]" 
            : "border-gray-800"
        )}
        style={{ 
          backgroundColor: '#10b981',
          backdropFilter: 'blur(4px)'
        }}
        id="text"
      />
      
      {/* Footer with contextual info */}
      <div className={cn("flex items-center justify-between", 
        currentSize.fontSize === 'sm' ? 'text-xs' : 
        currentSize.fontSize === 'base' ? 'text-sm' : 
        'text-base'
      )}>
        <div className="text-gray-400 flex items-center gap-2">
          <div className="flex items-center gap-1">
            <Type size={currentSize.iconSize} className="text-cyan-400/70" />
            <span>Text Data</span>
          </div>
          {data.value && data.value.trim().length > 0 && (
            <div className="text-green-400/70 flex items-center gap-1">
              <Sparkles size={currentSize.iconSize} />
              <span>LLM Ready</span>
            </div>
          )}
        </div>
        
        {/* Copy button */}
        {data.value && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              navigator.clipboard.writeText(data.value || '');
              const btn = e.currentTarget;
              btn.innerHTML = `<svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>`;
              setTimeout(() => {
                btn.innerHTML = `<svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>`;
              }, 1000);
            }}
            className="p-1 hover:bg-gray-700/50 rounded transition-colors text-gray-400 hover:text-cyan-300"
            title="Copy text"
          >
            <Copy size={currentSize.iconSize} />
          </button>
        )}
      </div>
      
      {/* Processing indicator */}
      {data.value && (
        <div className="mt-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-500">Processing ready</span>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-linear-to-r from-green-400 to-cyan-400 animate-pulse" />
              <span className="text-green-400/90 font-medium">Stream Optimized</span>
            </div>
          </div>
        </div>
      )}

      {/* Delete node button (visible when selected) */}
      {selected && (
        <button
          onClick={handleDelete}
          className="absolute -bottom-3 left-1/2 transform -translate-x-1/2 px-4 py-1.5 bg-linear-to-br from-red-500 to-red-600 text-white text-xs rounded-lg shadow-lg hover:from-red-400 hover:to-red-500 transition-all duration-200 z-10 backdrop-blur-sm border border-red-500/30"
          onMouseDown={(e) => e.stopPropagation()}
        >
          Delete Node
        </button>
      )}

      {/* Resize instructions */}
      {isHoveringResize && !isResizing && (
        <div className="absolute -bottom-8 right-0 bg-gray-900/90 backdrop-blur-sm border border-gray-700/50 rounded-lg px-3 py-1.5 text-xs text-gray-300 whitespace-nowrap z-50">
          ← Drag to resize →
        </div>
      )}

      {/* CSS for animations */}
      <style jsx>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        
        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
        
        .resize-handle:hover {
          transform: scale(1.1);
        }
        
        .resize-handle:active {
          transform: scale(0.95);
        }
        
        textarea::-webkit-scrollbar {
          width: 6px;
        }
        
        textarea::-webkit-scrollbar-track {
          background: rgba(31, 41, 55, 0.3);
          border-radius: 3px;
        }
        
        textarea::-webkit-scrollbar-thumb {
          background: rgba(75, 85, 99, 0.6);
          border-radius: 3px;
        }
        
        textarea::-webkit-scrollbar-thumb:hover {
          background: rgba(107, 114, 128, 0.8);
        }
        
        /* Custom cursor for resizing */
        .cursor-se-resize {
          cursor: se-resize;
        }
      `}</style>
    </div>
  );
}