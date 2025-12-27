import { Node, NodeTypes } from 'reactflow';
import { WorkflowNodeData } from '../../lib/types/workflow';

// Node type definitions
export const NODE_CONFIG = {
  text: {
    type: 'text' as const,
    name: 'Text Node',
    description: 'Input text data',
    icon: 'T',
    color: 'bg-blue-500',
    bgColor: 'bg-blue-100',
    textColor: 'text-blue-600',
    defaultData: {
      label: 'Text Input',
      value: '',
    },
    handles: {
      sources: [
        { id: 'text', label: 'Text Output', type: 'source', position: 'right' }
      ],
      targets: [
        { id: 'text', label: 'Text Input', type: 'target', position: 'left' }
      ]
    }
  },
  image: {
    type: 'image' as const,
    name: 'Image Node',
    description: 'Input image data',
    icon: 'I',
    color: 'bg-pink-500',
    bgColor: 'bg-pink-100',
    textColor: 'text-pink-600',
    defaultData: {
      label: 'Image Input',
      image: '',
    },
    handles: {
      sources: [
        { id: 'image', label: 'Image Output', type: 'source', position: 'right' }
      ],
      targets: [
        { id: 'image', label: 'Image Input', type: 'target', position: 'left' }
      ]
    }
  },
  llm: {
    type: 'llm' as const,
    name: 'Run Any LLM',
    description: 'Run LLM with connected inputs',
    icon: 'AI',
    color: 'bg-purple-500',
    bgColor: 'bg-purple-100',
    textColor: 'text-purple-600',
    defaultData: {
      label: 'Run Any LLM',
      model: 'gemini-2.5-flash',
      systemPrompt: '',
      isLoading: false,
      error: '',
      response: '',
    },
    handles: {
      sources: [
        { id: 'output', label: 'LLM Response', type: 'source', position: 'right' }
      ],
      targets: [
        { id: 'system_prompt', label: 'System Prompt', type: 'target', position: 'left', offset: 0 },
        { id: 'user_message', label: 'User Message', type: 'target', position: 'left', offset: 30 },
        { id: 'images', label: 'Images', type: 'target', position: 'left', offset: 60 }
      ]
    }
  }
} as const;

// Node factory function
export function createNode(
  type: keyof typeof NODE_CONFIG,
  position: { x: number; y: number },
  id?: string,
  data?: Partial<WorkflowNodeData>
): Node<WorkflowNodeData> {
  const config = NODE_CONFIG[type];
  const nodeId = id || `${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  // Merge data carefully to avoid duplicate properties
  const defaultData = config.defaultData;
  const mergedData = {
    ...defaultData,
    ...data,
  };
  
  // If data.label was provided, use it; otherwise use default label
  mergedData.label = data?.label || defaultData.label;
  
  return {
    id: nodeId,
    type,
    position,
    data: mergedData,
  };
}

// Get node config by type
export function getNodeConfig(type: string) {
  return NODE_CONFIG[type as keyof typeof NODE_CONFIG] || NODE_CONFIG.text;
}

// Validate node connections
export function validateNodeConnection(
  sourceType: string,
  sourceHandle: string,
  targetType: string,
  targetHandle: string
): { valid: boolean; message?: string } {
  
  const connectionRules = {
    'text:text': {
      allowed: ['llm:system_prompt', 'llm:user_message'],
      message: 'Text can connect to LLM system prompt or user message'
    },
    'image:image': {
      allowed: ['llm:images'],
      message: 'Image can connect to LLM images input'
    },
    'llm:output': {
      allowed: ['text:text', 'llm:user_message'],
      message: 'LLM output can connect to text node or another LLM'
    }
  };

  const connectionKey = `${sourceType}:${sourceHandle}`;
  const targetKey = `${targetType}:${targetHandle}`;
  
  if (connectionRules[connectionKey as keyof typeof connectionRules]) {
    const rule = connectionRules[connectionKey as keyof typeof connectionRules];
    if (rule.allowed.includes(targetKey)) {
      return { valid: true };
    }
    return { valid: false, message: rule.message };
  }

  // Default: allow connection
  return { valid: true };
}

// Get node icon
export function getNodeIcon(type: string): string {
  return NODE_CONFIG[type as keyof typeof NODE_CONFIG]?.icon || '?';
}

// Get node color
export function getNodeColor(type: string): string {
  return NODE_CONFIG[type as keyof typeof NODE_CONFIG]?.color || 'bg-gray-500';
}