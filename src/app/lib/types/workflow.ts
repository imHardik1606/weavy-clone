import { Node, Edge, Connection } from 'reactflow';

export interface WorkflowNodeData {
  label?: string;
  value?: string;
  image?: string;
  model?: string;
  systemPrompt?: string;
  isLoading?: boolean;
  error?: string;
  response?: string;
  
  // Add node sizing
  nodeSize?: 'small' | 'medium' | 'large';
  
  // Add any other node-specific data here
  [key: string]: any;
}

export type NodeType = 'text' | 'image' | 'llm';

export interface Workflow {
  id: string;
  name: string;
  nodes: Node<WorkflowNodeData>[];
  edges: Edge[];
  createdAt: Date;
  updatedAt: Date;
}

export interface GeminiRequest {
  model: string;
  systemPrompt?: string;
  userMessage: string;
  images?: string[];
}

export interface GeminiResponse {
  text: string;
  error?: string;
}