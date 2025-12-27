import { Handle, Position, NodeProps } from 'reactflow';
// import { Textarea } from '@/components/ui/textarea';
import { Textarea } from '../../components/ui/textarea';
import { WorkflowNodeData } from '../../lib/types/workflow';
import { useWorkflowStore } from '../../lib/store/useWorkflowStore';

export default function TextNode({ id, data }: NodeProps<WorkflowNodeData>) {
  const updateNode = useWorkflowStore((state) => state.updateNode);
  
  return (
    <div className="px-4 py-3 shadow-lg rounded-xl bg-white border border-gray-200 min-w-[200px]">
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 bg-purple-500"
      />
      <div className="flex items-center mb-2">
        <div className="w-5 h-5 rounded-md bg-blue-100 flex items-center justify-center mr-2">
          <span className="text-blue-600 text-xs font-bold">T</span>
        </div>
        <h3 className="text-sm font-semibold text-gray-800">Text Input</h3>
      </div>
      <Textarea
        value={data.value || ''}
        onChange={(e) => updateNode(id, { value: e.target.value })}
        placeholder="Enter your text here..."
        className="w-full min-h-[80px] text-sm"
        rows={3}
      />
      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 bg-green-500"
        id="text"
      />
      <div className="text-xs text-gray-500 mt-2">Output: Text</div>
    </div>
  );
}