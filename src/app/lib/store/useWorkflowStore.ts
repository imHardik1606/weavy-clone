import { create } from 'zustand';
import { Node, Edge, Connection, addEdge, applyNodeChanges, applyEdgeChanges, NodeChange, EdgeChange } from 'reactflow';
import { WorkflowNodeData, Workflow } from '../../lib/types/workflow';
import { nanoid } from 'nanoid';

interface WorkflowState {
  nodes: Node<WorkflowNodeData>[];
  edges: Edge[];
  selectedNode: string | null;
  workflows: Workflow[];
  currentWorkflowId: string | null;
  
  // History for undo/redo
  past: Array<{ nodes: Node<WorkflowNodeData>[]; edges: Edge[]; selectedNode: string | null }>;
  future: Array<{ nodes: Node<WorkflowNodeData>[]; edges: Edge[]; selectedNode: string | null }>;
  
  // Node operations
  addNode: (type: string, position: { x: number; y: number }) => string;
  updateNode: (id: string, data: Partial<WorkflowNodeData>) => void;
  deleteNode: (id: string) => void;
  deleteSelectedNode: () => void;
  setSelectedNode: (id: string | null) => void;
  
  // Edge operations
  onConnect: (connection: Connection) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  onNodesChange: (changes: NodeChange[]) => void;
  
  // Workflow operations
  saveWorkflow: (name: string) => string;
  loadWorkflow: (id: string) => void;
  deleteWorkflow: (id: string) => void;
  exportWorkflow: () => string;
  importWorkflow: (json: string) => void;
  
  // Undo/Redo
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
  saveToHistory: () => void;
  
  // Keyboard shortcuts
  handleKeyDown: (e: KeyboardEvent) => void;
}

// Helper to create a history snapshot
const createSnapshot = (nodes: Node<WorkflowNodeData>[], edges: Edge[], selectedNode: string | null) => ({
  nodes: JSON.parse(JSON.stringify(nodes)),
  edges: JSON.parse(JSON.stringify(edges)),
  selectedNode: selectedNode,
});

// Check if changes contain non-select operations
const hasNonSelectChanges = (changes: any[]): boolean => {
  return changes.some((change: any) => 
    change.type !== 'select' && 
    change.type !== 'dimensions' && 
    change.type !== 'position' && 
    !(change.type === 'position' && change.dragging === true)
  );
};

export const useWorkflowStore = create<WorkflowState>((set, get) => ({
  nodes: [],
  edges: [],
  selectedNode: null,
  workflows: [],
  currentWorkflowId: null,
  
  // Initialize history
  past: [],
  future: [],
  
  addNode: (type, position) => {
    // Save current state to history before making changes
    get().saveToHistory();
    
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
    
    set((state) => ({ 
      nodes: [...state.nodes, newNode],
      selectedNode: id,
      future: [] // Clear future when making new changes
    }));
    return id;
  },
  
  updateNode: (id, data) => {
    const node = get().nodes.find(n => n.id === id);
    if (!node) return;
    
    // Check if data actually changed
    const currentData = JSON.stringify(node.data);
    const newData = JSON.stringify({ ...node.data, ...data });
    
    if (currentData !== newData) {
      get().saveToHistory();
      
      set((state) => ({
        nodes: state.nodes.map((node) =>
          node.id === id ? { ...node, data: { ...node.data, ...data } } : node
        ),
        future: [] // Clear future when making new changes
      }));
    }
  },
  
  deleteNode: (id) => {
    const node = get().nodes.find(n => n.id === id);
    if (!node) return;
    
    get().saveToHistory();
    
    set((state) => ({
      nodes: state.nodes.filter((node) => node.id !== id),
      edges: state.edges.filter(
        (edge) => edge.source !== id && edge.target !== id
      ),
      selectedNode: state.selectedNode === id ? null : state.selectedNode,
      future: [] // Clear future when making new changes
    }));
  },
  
  deleteSelectedNode: () => {
    const { selectedNode } = get();
    if (selectedNode) {
      get().deleteNode(selectedNode);
    }
  },
  
  setSelectedNode: (id) => {
    set({ selectedNode: id });
  },
  
  onConnect: (connection) => {
    get().saveToHistory();
    
    set((state) => ({
      edges: addEdge(
        {
          ...connection,
          animated: true,
          style: { stroke: '#8B5CF6', strokeWidth: 2 },
        },
        state.edges
      ),
      future: [] // Clear future when making new changes
    }));
  },
  
  onEdgesChange: (changes) => {
    // Check if there are any non-select changes
    if (hasNonSelectChanges(changes)) {
      get().saveToHistory();
    }
    
    set((state) => ({
      edges: applyEdgeChanges(changes, state.edges),
      future: hasNonSelectChanges(changes) ? [] : state.future,
    }));
  },
  
  onNodesChange: (changes) => {
    // Track if we need to save to history
    let shouldSave = false;
    
    // Check for specific change types that should trigger history save
    changes.forEach(change => {
      if (change.type === 'remove') {
        shouldSave = true;
      } else if (change.type === 'add') {
        shouldSave = true;
      } else if (change.type === 'reset') {
        shouldSave = true;
      }
    });
    
    if (shouldSave) {
      get().saveToHistory();
    }
    
    const updatedNodes = applyNodeChanges(changes, get().nodes);
    
    // Update selected node based on changes
    let newSelectedNode = get().selectedNode;
    changes.forEach(change => {
      if (change.type === 'select' && change.selected) {
        newSelectedNode = change.id;
      } else if (change.type === 'select' && !change.selected && change.id === newSelectedNode) {
        newSelectedNode = null;
      } else if (change.type === 'remove' && change.id === newSelectedNode) {
        newSelectedNode = null;
      }
    });
    
    set({
      nodes: updatedNodes,
      selectedNode: newSelectedNode,
      future: shouldSave ? [] : get().future,
    });
  },
  
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
    
    localStorage.setItem(`workflow_${id}`, JSON.stringify(workflow));
    return id;
  },
  
  loadWorkflow: (id) => {
    get().saveToHistory();
    
    const stored = localStorage.getItem(`workflow_${id}`);
    if (stored) {
      const workflow: Workflow = JSON.parse(stored);
      set({
        nodes: workflow.nodes,
        edges: workflow.edges,
        currentWorkflowId: id,
        selectedNode: null,
        future: [],
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
    get().saveToHistory();
    
    try {
      const data = JSON.parse(json);
      set({
        nodes: data.nodes || [],
        edges: data.edges || [],
        currentWorkflowId: null,
        selectedNode: null,
        future: [],
      });
    } catch (error) {
      console.error('Failed to import workflow:', error);
    }
  },
  
  // UNDO/REDO IMPLEMENTATION
  saveToHistory: () => {
    const { nodes, edges, selectedNode, past } = get();
    const snapshot = createSnapshot(nodes, edges, selectedNode);
    
    // Limit history to 50 steps
    const newPast = [...past.slice(-49), snapshot];
    
    set({ 
      past: newPast,
      future: [] // Clear future when saving new state
    });
  },
  
  undo: () => {
    const { past, future, nodes, edges, selectedNode } = get();
    
    if (past.length === 0) return;
    
    const previous = past[past.length - 1];
    const newPast = past.slice(0, -1);
    const newFuture = [createSnapshot(nodes, edges, selectedNode), ...future];
    
    set({
      nodes: previous.nodes,
      edges: previous.edges,
      selectedNode: previous.selectedNode,
      past: newPast,
      future: newFuture,
    });
  },
  
  redo: () => {
    const { past, future } = get();
    
    if (future.length === 0) return;
    
    const next = future[0];
    const newFuture = future.slice(1);
    const newPast = [...past, createSnapshot(get().nodes, get().edges, get().selectedNode)];
    
    set({
      nodes: next.nodes,
      edges: next.edges,
      selectedNode: next.selectedNode,
      past: newPast,
      future: newFuture,
    });
  },
  
  canUndo: () => {
    return get().past.length > 0;
  },
  
  canRedo: () => {
    return get().future.length > 0;
  },
  
  handleKeyDown: (e: KeyboardEvent) => {
    const { selectedNode, deleteNode, canUndo, canRedo, undo, redo, saveToHistory } = get();
    
    // Don't trigger shortcuts when typing in inputs/textarea
    const activeElement = document.activeElement;
    const isInputFocused = 
      activeElement?.tagName === 'INPUT' ||
      activeElement?.tagName === 'TEXTAREA' ||
      activeElement?.getAttribute('role') === 'textbox' ||
      activeElement?.getAttribute('contenteditable') === 'true';
    
    if (isInputFocused) return;
    
    // Delete/Backspace: Delete selected node
    if ((e.key === 'Delete' || e.key === 'Backspace') && selectedNode) {
      e.preventDefault();
      deleteNode(selectedNode);
      return;
    }
    
    // Escape: Deselect node
    if (e.key === 'Escape') {
      e.preventDefault();
      set({ selectedNode: null });
      return;
    }
    
    // Ctrl/Cmd + Z: Undo
    if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
      e.preventDefault();
      if (canUndo()) {
        undo();
      }
      return;
    }
    
    // Ctrl/Cmd + Shift + Z or Ctrl/Cmd + Y: Redo
    if (((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'Z') || 
        ((e.ctrlKey || e.metaKey) && e.key === 'y')) {
      e.preventDefault();
      if (canRedo()) {
        redo();
      }
      return;
    }
    
    // Ctrl/Cmd + D: Duplicate selected node
    if ((e.ctrlKey || e.metaKey) && e.key === 'd' && selectedNode) {
      e.preventDefault();
      const node = get().nodes.find(n => n.id === selectedNode);
      if (node) {
        saveToHistory();
        const newNodeId = get().addNode(node.type as string, {
          x: node.position.x + 50,
          y: node.position.y + 50
        });
        get().updateNode(newNodeId, { ...node.data });
      }
      return;
    }
    
    // Ctrl/Cmd + S: Save
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      get().saveWorkflow('Quick Save');
      return;
    }
  },
}));