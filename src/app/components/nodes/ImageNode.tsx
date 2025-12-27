import { Handle, Position, NodeProps } from 'reactflow';
import { Upload, X } from 'lucide-react';
import { WorkflowNodeData } from '../../lib/types/workflow';
import { useWorkflowStore } from '../..//lib/store/useWorkflowStore';
import { useState } from 'react';

export default function ImageNode({ id, data }: NodeProps<WorkflowNodeData>) {
  const updateNode = useWorkflowStore((state) => state.updateNode);
  const [dragOver, setDragOver] = useState(false);
  
  const handleFileUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      updateNode(id, { image: e.target?.result as string });
    };
    reader.readAsDataURL(file);
  };
  
  return (
    <div className="px-4 py-3 shadow-lg rounded-xl bg-white border border-gray-200 min-w-[200px]">
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 bg-purple-500"
      />
      <div className="flex items-center mb-2">
        <div className="w-5 h-5 rounded-md bg-pink-100 flex items-center justify-center mr-2">
          <span className="text-pink-600 text-xs font-bold">I</span>
        </div>
        <h3 className="text-sm font-semibold text-gray-800">Image Input</h3>
      </div>
      
      {data.image ? (
        <div className="relative">
          <img
            src={data.image}
            alt="Uploaded"
            className="w-full h-32 object-cover rounded-lg"
          />
          <button
            onClick={() => updateNode(id, { image: '' })}
            className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full"
          >
            <X size={14} />
          </button>
        </div>
      ) : (
        <div
          className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors ${
            dragOver ? 'border-purple-500 bg-purple-50' : 'border-gray-300'
          }`}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            const file = e.dataTransfer.files[0];
            if (file && file.type.startsWith('image/')) {
              handleFileUpload(file);
            }
          }}
          onClick={() => document.getElementById(`file-upload-${id}`)?.click()}
        >
          <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-600">Drop image or click to upload</p>
          <input
            id={`file-upload-${id}`}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFileUpload(file);
            }}
          />
        </div>
      )}
      
      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 bg-green-500"
        id="image"
      />
      <div className="text-xs text-gray-500 mt-2">Output: Image Data</div>
    </div>
  );
}