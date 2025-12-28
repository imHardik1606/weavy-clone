import { Handle, Position, NodeProps } from "reactflow";
import { Textarea } from "../../components/ui/textarea";
import { WorkflowNodeData } from "../../lib/types/workflow";
import { useWorkflowStore } from "../../lib/store/useWorkflowStore";
import { NodeMenu } from "../../components/ui/NodeMenu";
import { cn } from "../../lib/utils/cn";
import { useEffect, useRef } from "react";

export default function TextNode({ id, data, selected }: NodeProps<WorkflowNodeData>) {
  const updateNode = useWorkflowStore((state) => state.updateNode);
  const deleteNode = useWorkflowStore((state) => state.deleteNode);
  const setSelectedNode = useWorkflowStore((state) => state.setSelectedNode);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
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
  
  // Focus textarea when node is selected
  useEffect(() => {
    if (selected && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [selected]);

  return (
    <div 
      className={cn(
        "px-4 py-3 shadow-lg rounded-xl bg-white min-w-50 relative group transition-all duration-150",
        selected 
          ? "border-2 border-blue-500 shadow-blue-100" 
          : "border border-gray-200 hover:border-gray-300"
      )}
      onClick={(e) => {
        // Only select if not clicking on the NodeMenu or Textarea
        if ((e.target! as HTMLElement).closest('.node-menu')) {
          setSelectedNode(id);
        }
      }}
    >
      {/* Node Menu */}
      <div className="node-menu">
        <NodeMenu
          nodeId={id}
          nodeType="text"
          onDelete={handleDelete}
          onDuplicate={handleDuplicate}
          onConfigure={handleConfigure}
          position="top-right"
        />
      </div>
      
      {/* Selection indicator */}
      {selected && (
        <div className="absolute -top-2 -right-2 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center z-10">
          <div className="w-1.5 h-1.5 bg-white rounded-full" />
        </div>
      )}
      
      {/* Input Handle */}
      <Handle
        type="target"
        position={Position.Left}
        className={cn(
          "w-3 h-3 border-2! transition-all",
          selected ? "border-white! scale-110" : "border-white"!
        )}
        style={{ backgroundColor: selected ? '#3B82F6' : '#8B5CF6' }}
      />
      
      {/* Header */}
      <div className="flex items-center mb-2">
        <div className={cn(
          "w-5 h-5 rounded-md flex items-center justify-center mr-2",
          selected ? "bg-blue-100" : "bg-blue-50"
        )}>
          <span className={cn(
            "text-xs font-bold",
            selected ? "text-blue-600" : "text-blue-500"
          )}>T</span>
        </div>
        <h3 className={cn(
          "text-sm font-semibold",
          selected ? "text-blue-700" : "text-gray-800"
        )}>Text Input</h3>
      </div>
      
      {/* Textarea */}
      <Textarea
        ref={textareaRef}
        value={data.value || ""}
        onChange={(e) => updateNode(id, { value: e.target.value })}
        placeholder="Enter your text here..."
        className="w-full min-h-20 text-sm focus:ring-2 focus:ring-blue-300"
        rows={3}
        onFocus={() => setSelectedNode(id)}
      />
      
      {/* Character Count */}
      <div className="flex justify-between items-center mt-1">
        <span className="text-xs text-gray-500">
          {data.value?.length || 0} characters
        </span>
        {data.value && data.value.length > 1000 && (
          <span className="text-xs text-amber-600 font-medium">
            {Math.ceil(data.value.length / 1000)}k tokens
          </span>
        )}
      </div>
      
      {/* Output Handle */}
      <Handle
        type="source"
        position={Position.Right}
        className={cn(
          "w-3 h-3 border-2! transition-all",
          selected ? "border-white! scale-110" : "border-white"!
        )}
        style={{ backgroundColor: selected ? '#10B981' : '#10B981' }}
        id="text"
      />
      
      {/* Footer */}
      <div className="flex items-center justify-between mt-2">
        <div className="text-xs text-gray-500">Output: Text</div>
        {selected && (
          <div className="text-xs text-gray-400 flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-xs border border-gray-300">Del</kbd>
            <span>to delete</span>
          </div>
        )}
      </div>
      
      {/* Delete button for touch devices */}
      {selected && (
        <button
          onClick={handleDelete}
          className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 px-3 py-1 bg-red-500 text-white text-xs rounded-lg shadow-lg hover:bg-red-600 transition-colors z-10"
        >
          Delete Node
        </button>
      )}
    </div>
  );
}