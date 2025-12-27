import { create } from 'zustand';
import { Node, Edge, Connection, addEdge, applyNodeChanges, applyEdgeChanges } from 'reactflow';
import { WorkflowNodeData, Workflow } from '../types/workflow';
import { nanoid } from 'nanoid';

interface WorkflowState {
  nodes: Node<WorkflowNodeData>[];
  edges: Edge[];
  selectedNode: string | null;
  workflows: Workflow[];
  currentWorkflowId: string | null;
  
  // Node operations
  addNode: (type: string, position: { x: number; y: number }) => string;
  updateNode: (id: string, data: Partial<WorkflowNodeData>) => void;
  deleteNode: (id: string) => void;
  setSelectedNode: (id: string | null) => void;
  
  // Edge operations
  onConnect: (connection: Connection) => void;
  onEdgesChange: (changes: any) => void;
  onNodesChange: (changes: any) => void;
  
  // Workflow operations
  saveWorkflow: (name: string) => string;
  loadWorkflow: (id: string) => void;
  deleteWorkflow: (id: string) => void;
  exportWorkflow: () => string;
  importWorkflow: (json: string) => void;
  
  // Undo/Redo
  undo: () => void;
  redo: () => void;
}

export const useWorkflowStore = create<WorkflowState>((set, get) => ({
  nodes: [],
  edges: [],
  selectedNode: null,
  workflows: [],
  currentWorkflowId: null,
  
  addNode: (type, position) => {
    const id = nanoid();
    const nodeDefaults = {
      text: { label: 'Text Node', value: '' },
      image: { label: 'Image Node', image: '' },
      llm: { label: 'LLM Node', model: 'gemini-2.5-flash', systemPrompt: '' }
    };
    
    const newNode: Node<WorkflowNodeData> = {
      id,
      type,
      position,
      data: nodeDefaults[type as keyof typeof nodeDefaults],
    };
    
    set((state) => ({ nodes: [...state.nodes, newNode] }));
    return id;
  },
  
  updateNode: (id, data) => {
    set((state) => ({
      nodes: state.nodes.map((node) =>
        node.id === id ? { ...node, data: { ...node.data, ...data } } : node
      ),
    }));
  },
  
  deleteNode: (id) => {
    set((state) => ({
      nodes: state.nodes.filter((node) => node.id !== id),
      edges: state.edges.filter(
        (edge) => edge.source !== id && edge.target !== id
      ),
    }));
  },
  
  onConnect: (connection) => {
    set((state) => ({
      edges: addEdge(
        {
          ...connection,
          animated: true,
          style: { stroke: '#8B5CF6', strokeWidth: 2 },
        },
        state.edges
      ),
    }));
  },
  
  onEdgesChange: (changes) => {
    set((state) => ({
      edges: applyEdgeChanges(changes, state.edges),
    }));
  },
  
  onNodesChange: (changes) => {
    set((state) => ({
      nodes: applyNodeChanges(changes, state.nodes),
    }));
  },
  
  setSelectedNode: (id) => set({ selectedNode: id }),
  
  saveWorkflow: (name) => {
    const id = nanoid();
    const workflow: Workflow = {
      id,
      name,
      nodes: get().nodes,
      edges: get().edges,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    set((state) => ({
      workflows: [...state.workflows, workflow],
      currentWorkflowId: id,
    }));
    
    // In production: Save to database
    localStorage.setItem(`workflow_${id}`, JSON.stringify(workflow));
    
    return id;
  },
  
  loadWorkflow: (id) => {
    const stored = localStorage.getItem(`workflow_${id}`);
    if (stored) {
      const workflow: Workflow = JSON.parse(stored);
      set({
        nodes: workflow.nodes,
        edges: workflow.edges,
        currentWorkflowId: id,
      });
    }
  },
  
  deleteWorkflow: (id) => {
    set((state) => ({
      workflows: state.workflows.filter((w) => w.id !== id),
    }));
    localStorage.removeItem(`workflow_${id}`);
  },
  
  exportWorkflow: () => {
    const workflow = {
      nodes: get().nodes,
      edges: get().edges,
      metadata: {
        exportedAt: new Date().toISOString(),
        version: '1.0',
      },
    };
    return JSON.stringify(workflow, null, 2);
  },
  
  importWorkflow: (json) => {
    try {
      const data = JSON.parse(json);
      set({
        nodes: data.nodes || [],
        edges: data.edges || [],
        currentWorkflowId: null,
      });
    } catch (error) {
      console.error('Failed to import workflow:', error);
    }
  },
  
  undo: () => {
    // Implementation for undo functionality
    console.log('Undo not implemented yet');
  },
  
  redo: () => {
    // Implementation for redo functionality
    console.log('Redo not implemented yet');
  },
}));