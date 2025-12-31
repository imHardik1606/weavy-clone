import { Handle, Position, NodeProps } from "reactflow";
import { Upload, X, Image as ImageIcon, Maximize2, Minimize2, ImageUp, Trash2Icon, Eye, Crop, Trash } from "lucide-react";
import { cn } from "../../lib/utils/cn";
import { WorkflowNodeData } from "../../lib/types/workflow";
import { useWorkflowStore } from "../../lib/store/useWorkflowStore";
import { useState, useEffect, useRef, useCallback } from "react";

// Extend the base type to include nodeSize
type ExtendedWorkflowNodeData = WorkflowNodeData & {
  nodeSize?: 'small' | 'medium' | 'large';
};

// Size presets for the node
const SIZE_PRESETS = {
  small: { width: 320, fontSize: "sm", iconSize: 14, imageHeight: 120 },
  medium: { width: 400, fontSize: "base", iconSize: 16, imageHeight: 160 },
  large: { width: 500, fontSize: "lg", iconSize: 18, imageHeight: 200 },
} as const;

type NodeSize = keyof typeof SIZE_PRESETS;

export default function ImageNode({ id, data, selected }: NodeProps<ExtendedWorkflowNodeData>) {
  const updateNode = useWorkflowStore((state) => state.updateNode);
  const deleteNode = useWorkflowStore((state) => state.deleteNode);
  const setSelectedNode = useWorkflowStore((state) => state.setSelectedNode);
  const [dragOver, setDragOver] = useState(false);
  const [imageDimensions, setImageDimensions] = useState<{width: number, height: number} | null>(null);
  const [nodeSize, setNodeSize] = useState<NodeSize>(data.nodeSize || 'medium');
  const [isResizing, setIsResizing] = useState(false);
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const nodeRef = useRef<HTMLDivElement>(null);
  const resizeHandleRef = useRef<HTMLDivElement>(null);
  const imageContainerRef = useRef<HTMLDivElement>(null);

  // Update node size in store
  useEffect(() => {
    if (data.nodeSize !== nodeSize) {
      updateNode(id, { ...data, nodeSize });
    }
  }, [nodeSize, id, data, updateNode]);

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
      useWorkflowStore.getState().updateNode(newNodeId, { ...node.data, nodeSize: data.nodeSize });
    }
  };

  const handleConfigure = () => {
    console.log('Configure node:', id);
  };

  const handleFileUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      updateNode(id, { ...data, image: base64 });
      
      const img = new Image();
      img.onload = () => {
        setImageDimensions({ width: img.width, height: img.height });
      };
      img.src = base64;
    };
    reader.readAsDataURL(file);
  };

  const triggerFileInput = () => {
    setSelectedNode(id);
    
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.style.display = 'none';
    
    input.onchange = (e: Event) => {
      const target = e.target as HTMLInputElement;
      const file = target.files?.[0];
      if (file && file.type.startsWith("image/")) {
        handleFileUpload(file);
      }
      document.body.removeChild(input);
    };
    
    document.body.appendChild(input);
    input.click();
  };

  // Size control handlers
  const cycleSize = () => {
    const sizes: NodeSize[] = ['small', 'medium', 'large'];
    const currentIndex = sizes.indexOf(nodeSize);
    const nextIndex = (currentIndex + 1) % sizes.length;
    setNodeSize(sizes[nextIndex]);
  };

  const startResize = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setIsResizing(true);
    if (nodeRef.current) {
      const rect = nodeRef.current.getBoundingClientRect();
      setResizeStart({
        x: e.clientX,
        y: e.clientY,
        width: rect.width,
        height: rect.height
      });
    }
    document.addEventListener('mousemove', handleResize);
    document.addEventListener('mouseup', stopResize);
  }, []);

  const handleResize = useCallback((e: MouseEvent) => {
    if (!isResizing || !nodeRef.current) return;
    
    const deltaX = e.clientX - resizeStart.x;
    const deltaY = e.clientY - resizeStart.y;
    
    // Calculate new width (minimum 280px, maximum 600px)
    const newWidth = Math.max(280, Math.min(600, resizeStart.width + deltaX));
    
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
    }
  }, [isResizing, resizeStart, nodeSize]);

  const stopResize = useCallback(() => {
    setIsResizing(false);
    document.removeEventListener('mousemove', handleResize);
    document.removeEventListener('mouseup', stopResize);
  }, []);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
    
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) {
      handleFileUpload(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
  };

  const handleUploadAreaClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    
    setTimeout(() => {
      triggerFileInput();
    }, 0);
    
    return false;
  };

  const toggleFullscreen = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsFullscreen(!isFullscreen);
  };

  useEffect(() => {
    if (!data.image) {
      setImageDimensions(null);
      setIsFullscreen(false);
    }
  }, [data.image]);

  const currentSize = SIZE_PRESETS[nodeSize];
  const fontSizeClass = {
    'sm': 'text-md',
    'base': 'text-lg',
    'lg': 'text-xl'
  }[currentSize.fontSize];

  return (
    <>
      {/* Fullscreen overlay */}
      {isFullscreen && data.image && (
        <div 
          className="fixed inset-0 bg-gray-950/95 backdrop-blur-xl z-50 flex items-center justify-center p-8"
          onClick={() => setIsFullscreen(false)}
        >
          <div className="relative max-w-7xl max-h-[90vh]">
            <img
              src={data.image}
              alt="Fullscreen preview"
              className="max-w-full max-h-[85vh] object-contain rounded-2xl shadow-2xl"
            />
            <div className="absolute top-4 right-4 flex gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsFullscreen(false);
                }}
                className="p-3 bg-gray-900/80 backdrop-blur-sm border border-gray-700/50 rounded-xl text-gray-300 hover:text-white hover:bg-gray-800/80 transition-all"
              >
                <X size={20} />
              </button>
              {imageDimensions && (
                <div className="px-4 py-3 bg-gray-900/80 backdrop-blur-sm border border-gray-700/50 rounded-xl text-sm text-gray-300">
                  {imageDimensions.width} × {imageDimensions.height}px
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div 
        ref={nodeRef}
        className={cn(
          "px-5 py-4 shadow-2xl rounded-2xl relative group transition-all duration-300 backdrop-blur-sm",
          selected 
            ? "border-2 border-red-500/60 shadow-red-500/20 bg-linear-to-br from-gray-900 to-gray-800" 
            : "border border-gray-700/50 hover:border-gray-600/50 bg-linear-to-br from-gray-800 to-gray-900"
        )}
        style={{ width: currentSize.width }}
        onClick={(e) => {
          const target = e.target as HTMLElement;
          const isInteractive = 
            target.closest('.node-menu') || 
            target.closest('.upload-area') ||
            target.closest('.remove-btn') ||
            target.closest('.file-input-trigger') ||
            target.closest('.size-control') ||
            target.closest('.resize-handle') ||
            target.closest('.fullscreen-btn');
          
          if (!isInteractive) {
            setSelectedNode(id);
          }
        }}
        onDragStart={(e) => e.stopPropagation()}
        onDragOver={(e) => e.stopPropagation()}
      >
        {/* Background glow effect */}
        {selected && (
          <div className="absolute inset-0 bg-linear-to-br from-red-500/10 via-orange-500/5 to-transparent rounded-2xl -z-10" />
        )}
        
        {/* Resize handle */}
        <div 
          ref={resizeHandleRef}
          className="resize-handle absolute -bottom-2 -right-2 w-5 h-5 bg-linear-to-br from-cyan-500 to-blue-600 rounded-full cursor-se-resize flex items-center justify-center shadow-lg z-20 opacity-0 group-hover:opacity-100 transition-opacity"
          onMouseDown={startResize}
          title="Drag to resize"
        >
          <Maximize2 size={10} className="text-white" />
        </div>
        
        {/* Size control */}
        <div className="size-control absolute -top-2 left-1/2 transform -translate-x-1/2 flex items-center gap-1 bg-linear-to-r from-gray-800 to-gray-900 border border-gray-700/50 rounded-full px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity z-20">
          <button 
            onClick={cycleSize}
            className="text-xs text-gray-300 hover:text-white transition-colors flex items-center gap-1"
            title={`Size: ${nodeSize} (click to cycle)`}
          >
            {nodeSize === 'small' && <Minimize2 size={10} />}
            {nodeSize === 'medium' && <Maximize2 size={10} />}
            {nodeSize === 'large' && <Maximize2 size={12} />}
            <span className="uppercase font-mono">{nodeSize.charAt(0)}</span>
          </button>
        </div>
        
        {/* Input Handle */}
        <Handle
          type="target"
          position={Position.Left}
          className={cn(
            "w-4 h-4 border-2 transition-all duration-300",
            selected 
              ? "border-gray-900 scale-110 shadow-[0_0_15px_rgba(232,121,249,0.7)]" 
              : "border-gray-800"
          )}
          style={{ 
            backgroundColor: '#e879f9',
            backdropFilter: 'blur(4px)'
          }}
        />
        
        {/* Header with gradient */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center">
            <div className="relative mr-2">
              <div className="absolute inset-0 bg-linear-to-br from-red-400 to-orange-500 rounded-lg blur opacity-30" />
              <div className={cn(
                "relative w-8 h-8 rounded-lg flex items-center justify-center",
                selected ? "bg-linear-to-br from-red-500 to-orange-600" : "bg-linear-to-br from-red-400/90 to-orange-500/90"
              )}>
                <ImageUp size={currentSize.iconSize} className="text-white" />
              </div>
            </div>
            <div>
              <h2 className={cn(
                "font-bold tracking-wide",
                fontSizeClass,
                selected 
                  ? "bg-linear-to-r from-red-300 to-cyan-300 bg-clip-text text-transparent" 
                  : "text-gray-200"
              )}>
                Vision Input
              </h2>
              <p className="text-md font-mono text-gray-200/90 mt-0.5">Process images with AI</p>
            </div>
          </div>
        </div>

        {data.image ? (
          <div className="relative mb-3 group/image" ref={imageContainerRef}>
            <div className="relative overflow-hidden rounded-xl border border-gray-700/50 bg-gray-900/50">
              <div 
                className="w-full"
                style={{ 
                  height: `${currentSize.imageHeight}px`,
                  overflow: 'hidden',
                  position: 'relative'
                }}
              >
                <img
                  src={data.image}
                  alt="Uploaded"
                  className="w-full h-full object-contain"
                  style={{ 
                    objectFit: 'contain',
                    maxHeight: '100%',
                    maxWidth: '100%'
                  }}
                />
                <div className="absolute inset-0 bg-linear-to-t from-gray-900/60 via-transparent to-transparent opacity-0 group-hover/image:opacity-100 transition-opacity" />
                
                {/* Hover overlay */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/image:opacity-100 transition-opacity bg-gray-900/80 backdrop-blur-sm">
                  <div className="flex gap-2">
                    <button
                      onClick={toggleFullscreen}
                      className="px-4 py-2 bg-linear-to-br from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 rounded-lg flex items-center gap-2 transition-all"
                    >
                      <Eye size={14} />
                      <span className="text-sm font-medium">View Full</span>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        updateNode(id, { ...data, image: "" });
                      }}
                      className="px-4 py-2 bg-linear-to-br from-red-500 to-red-600 hover:from-red-400 hover:to-red-500 rounded-lg flex items-center gap-2 transition-all"
                    >
                      <X size={14} />
                      <span className="text-sm font-medium">Remove</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Image metadata badge */}
            <div className="flex flex-wrap gap-2 mt-2">
              {imageDimensions && (
                <div className="px-2 py-1 bg-gray-900/90 backdrop-blur-sm text-xs text-gray-300 rounded-lg border border-gray-700/50 flex items-center gap-1">
                  <Crop size={10} />
                  <span>{imageDimensions.width} × {imageDimensions.height}</span>
                </div>
              )}
              <div className="px-2 py-1 bg-linear-to-r from-blue-500/20 to-cyan-500/20 backdrop-blur-sm text-md text-cyan-300 rounded-lg border border-cyan-500/30 flex items-center gap-1">
                <ImageIcon size={16} />
                <span>{(data.image.length * 3) / 4 / 1024 > 1024 
                  ? `${((data.image.length * 3) / 4 / 1024 / 1024).toFixed(2)} MB` 
                  : `${Math.round((data.image.length * 3) / 4 / 1024)} KB`}
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div
            className={cn(
              "upload-area border-2 border-dashed rounded-xl p-6 text-center transition-all duration-300 mb-3",
              dragOver 
                ? "border-red-400 bg-linear-to-br from-red-500/10 to-orange-500/10" 
                : "border-gray-700/50 hover:border-red-400/50 hover:bg-gray-800/30",
              selected && "border-red-300/50"
            )}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={handleUploadAreaClick}
            onMouseDown={(e) => {
              e.stopPropagation();
              e.preventDefault();
            }}
            onContextMenu={(e) => e.preventDefault()}
            style={{ cursor: 'pointer' }}
          >
            <div className="relative mb-3">
              <div className="absolute inset-0 bg-linear-to-br from-red-500/20 to-cyan-500/20 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative w-12 h-12 mx-auto mb-3 bg-linear-to-br from-gray-800 to-gray-900 border border-gray-700/50 rounded-xl flex items-center justify-center">
                <Upload className={cn(
                  "transition-colors duration-300",
                  dragOver ? "text-red-300" : "text-gray-400 group-hover:text-red-300"
                )} size={20} />
              </div>
            </div>
            <p className={cn(
              "font-medium mb-1",
              fontSizeClass,
              dragOver ? "text-red-300" : "text-gray-300"
            )}>
              {dragOver ? "Drop image here" : "Drag & drop or click to upload"}
            </p>
            <p className={cn("text-gray-500", fontSizeClass)}>
              Supports JPG, PNG, WebP, GIF, SVG
            </p>
            
            {/* Format badges */}
            <div className="flex justify-center gap-1 mt-3">
              {['JPEG', 'PNG', 'WebP', 'GIF'].map(format => (
                <span key={format} className="px-2 py-0.5 bg-gray-800/50 text-xs text-gray-400 rounded-md">
                  {format}
                </span>
              ))}
            </div>
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
          id="image"
        />

        {/* Delete node button (visible when selected) */}
        {selected && (
          <button
            onClick={handleDelete}
            className="absolute -bottom-3 left-1/2 transform -translate-x-1/2 px-4 py-1.5 bg-linear-to-br from-red-500 to-red-600 text-white text-xs rounded-lg shadow-lg hover:from-red-400 hover:to-red-500 transition-all duration-200 z-10 backdrop-blur-sm border border-red-500/30"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <Trash2Icon size={18} className="inline-block mr-1 font-extrabold" />
          </button>
        )}
      </div>
    </>
  );
}