import { Handle, Position, NodeProps } from "reactflow";
import { Upload, X, Image as ImageIcon } from "lucide-react";
import { cn } from "../../lib/utils/cn";
import { NodeMenu } from "../../components/ui/NodeMenu";
import { WorkflowNodeData } from "../../lib/types/workflow";
import { useWorkflowStore } from "../../lib/store/useWorkflowStore";
import { useState, useEffect, useRef } from "react";

export default function ImageNode({ id, data, selected }: NodeProps<WorkflowNodeData>) {
  const updateNode = useWorkflowStore((state) => state.updateNode);
  const deleteNode = useWorkflowStore((state) => state.deleteNode);
  const setSelectedNode = useWorkflowStore((state) => state.setSelectedNode);
  const [dragOver, setDragOver] = useState(false);
  const [imageDimensions, setImageDimensions] = useState<{width: number, height: number} | null>(null);
  
  // Use refs for file input
  const inputRef = useRef<HTMLInputElement>(null);
  const nodeRef = useRef<HTMLDivElement>(null);

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
      useWorkflowStore.getState().updateNode(newNodeId, { ...node.data });
    }
  };

  const handleConfigure = () => {
    console.log('Configure node:', id);
  };

  const handleFileUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      updateNode(id, { image: base64 });
      
      // Get image dimensions
      const img = new Image();
      img.onload = () => {
        setImageDimensions({ width: img.width, height: img.height });
      };
      img.src = base64;
    };
    reader.readAsDataURL(file);
  };

  // DIRECT FILE INPUT TRIGGER - Most reliable approach
  const triggerFileInput = () => {
    // First select the node
    setSelectedNode(id);
    
    // Create and trigger a file input programmatically
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
      // Clean up
      document.body.removeChild(input);
    };
    
    // Add to body and trigger click
    document.body.appendChild(input);
    input.click();
  };

  // Handle drop event - MUST stop all propagation
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
    
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) {
      handleFileUpload(file);
    }
  };

  // Handle drag over - MUST stop all propagation
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(true);
  };

  // Handle drag leave
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
  };

  // Handle click on upload area - NEW APPROACH
  const handleUploadAreaClick = (e: React.MouseEvent) => {
    // IMPORTANT: Use setTimeout to bypass React Flow event handling
    e.stopPropagation();
    e.preventDefault();
    
    // Store current target
    const target = e.currentTarget;
    
    // Use setTimeout to trigger after React Flow processes the event
    setTimeout(() => {
      triggerFileInput();
    }, 0);
    
    return false;
  };

  // Reset dimensions when image is cleared
  useEffect(() => {
    if (!data.image) {
      setImageDimensions(null);
    }
  }, [data.image]);

  return (
    <div 
      ref={nodeRef}
      className={cn(
        "px-4 py-3 shadow-lg rounded-xl bg-white min-w-50 relative group transition-all duration-150",
        selected 
          ? "border-2 border-pink-500 shadow-pink-100" 
          : "border border-gray-200 hover:border-gray-300"
      )}
      onClick={(e) => {
        // Only select if not clicking on interactive elements
        const target = e.target as HTMLElement;
        const isInteractive = 
          target.closest('.node-menu') || 
          target.closest('.upload-area') ||
          target.closest('.remove-btn') ||
          target.closest('.file-input-trigger');
        
        if (!isInteractive) {
          setSelectedNode(id);
        }
      }}
      // Prevent React Flow from handling drag events on this node
      onDragStart={(e) => {
        e.stopPropagation();
      }}
      onDragOver={(e) => {
        e.stopPropagation();
      }}
    >
      {/* Node Menu */}
      <div className="node-menu">
        <NodeMenu
          nodeId={id}
          nodeType="image"
          onDelete={handleDelete}
          onDuplicate={handleDuplicate}
          onConfigure={handleConfigure}
          position="top-right"
        />
      </div>
      
      {/* Selection indicator */}
      {selected && (
        <div className="absolute -top-2 -right-2 w-4 h-4 bg-pink-500 rounded-full flex items-center justify-center z-10">
          <div className="w-1.5 h-1.5 bg-white rounded-full" />
        </div>
      )}
      
      {/* Input Handle */}
      <Handle
        type="target"
        position={Position.Left}
        className={cn(
          "w-3 h-3 border-21 transition-all",
          selected ? "border-white! scale-110" : "border-white!"
        )}
        style={{ backgroundColor: selected ? '#EC4899' : '#8B5CF6' }}
      />
      
      {/* Header */}
      <div className="flex items-center mb-2">
        <div className={cn(
          "w-5 h-5 rounded-md flex items-center justify-center mr-2",
          selected ? "bg-pink-100" : "bg-pink-50"
        )}>
          <span className={cn(
            "text-xs font-bold",
            selected ? "text-pink-600" : "text-pink-500"
          )}>I</span>
        </div>
        <h3 className={cn(
          "text-sm font-semibold",
          selected ? "text-pink-700" : "text-gray-800"
        )}>Image Input</h3>
      </div>

      {data.image ? (
        <div className="relative mb-2">
          <img
            src={data.image}
            alt="Uploaded"
            className="w-full h-32 object-cover rounded-lg border border-gray-200"
          />
          <button
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              updateNode(id, { image: "" });
            }}
            className="remove-btn absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-sm"
            title="Remove image"
          >
            <X size={14} />
          </button>
          
          {/* Image Info */}
          {imageDimensions && (
            <div className="absolute bottom-1 left-1 bg-black/70 text-white text-xs px-2 py-1 rounded">
              {imageDimensions.width} × {imageDimensions.height}
            </div>
          )}
        </div>
      ) : (
        <div
          className={cn(
            "upload-area border-2 border-dashed rounded-lg p-4 text-center transition-colors mb-2",
            dragOver 
              ? "border-purple-500 bg-purple-50" 
              : "border-gray-300 hover:border-gray-400 hover:bg-gray-50",
            selected && "border-pink-300"
          )}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={handleUploadAreaClick}
          onMouseDown={(e) => {
            e.stopPropagation();
            e.preventDefault();
          }}
          // Add these to completely disable React Flow interactions
          onContextMenu={(e) => e.preventDefault()}
          style={{ cursor: 'pointer' }}
        >
          <Upload className={cn(
            "w-8 h-8 mx-auto mb-2",
            dragOver ? "text-purple-500" : "text-gray-400"
          )} />
          <p className={cn(
            "text-sm",
            dragOver ? "text-purple-600" : "text-gray-600"
          )}>
            Drop image or click to upload
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Supports JPG, PNG, WebP, GIF
          </p>
          
          {/* Hidden file input as backup */}
          <input
            ref={inputRef}
            id={`file-upload-${id}`}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFileUpload(file);
              e.target.value = ''; // Reset
            }}
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      {/* Output Handle */}
      <Handle
        type="source"
        position={Position.Right}
        className={cn(
          "w-3 h-3 border-2! transition-all",
          selected ? "border-white! scale-110" : "border-white!"
        )}
        style={{ backgroundColor: selected ? '#10B981' : '#10B981' }}
        id="image"
      />
      
      {/* Footer */}
      <div className="flex items-center justify-between mt-2">
        <div className="text-xs text-gray-500 flex items-center">
          <ImageIcon size={12} className="mr-1" />
          Output: Image Data
        </div>
        {selected && (
          <div className="text-xs text-gray-400 flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-xs border border-gray-300">Del</kbd>
            <span>to delete</span>
          </div>
        )}
      </div>
      
      {/* Image Stats */}
      {data.image && (
        <div className="mt-2 text-xs text-gray-500 flex justify-between">
          <span className="truncate max-w-30">
            Size: {Math.round((data.image.length * 3) / 4 / 1024)}KB
          </span>
          <span className="text-green-600 font-medium">
            ✓ Ready for LLM
          </span>
        </div>
      )}
      
      {/* Delete button for touch devices */}
      {selected && (
        <button
          onClick={handleDelete}
          className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 px-3 py-1 bg-red-500 text-white text-xs rounded-lg shadow-lg hover:bg-red-600 transition-colors z-10"
          onMouseDown={(e) => e.stopPropagation()}
        >
          Delete Node
        </button>
      )}
    </div>
  );
}