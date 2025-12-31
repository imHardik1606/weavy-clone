import { useWorkflowStore } from "../../lib/store/useWorkflowStore";
import {
  Type,
  Image as ImageIcon,
  Brain,
  Save,
  Download,
  Upload,
} from "lucide-react";
import { useState } from "react";

const NODE_TYPES = [
  {
    id: "text",
    label: "Text Node",
    icon: Type,
    color: "from-cyan-400 to-blue-500",
    accent: "#22d3ee",
  },
  {
    id: "image",
    label: "Image Node",
    icon: ImageIcon,
    color: "from-fuchsia-400 to-purple-500",
    accent: "#e879f9",
  },
  {
    id: "llm",
    label: "LLM Node",
    icon: Brain,
    color: "from-amber-300 to-orange-500",
    accent: "#fbbf24",
  },
];

interface SidebarProps {
  onSaveClick?: () => void;
}

export default function Sidebar({ onSaveClick }: SidebarProps) {
  const addNode = useWorkflowStore((state) => state.addNode);
  const saveWorkflow = useWorkflowStore((state) => state.saveWorkflow);
  const exportWorkflow = useWorkflowStore((state) => state.exportWorkflow);
  const importWorkflow = useWorkflowStore((state) => state.importWorkflow);
  const [workflowName, setWorkflowName] = useState("My Workflow");
  const [activeButton, setActiveButton] = useState<string | null>(null);

  const handleAddNode = (type: string) => {
    const position = {
      x: Math.random() * 400 + 100,
      y: Math.random() * 300 + 100,
    };
    addNode(type, position);

    // Visual feedback
    setActiveButton(type);
    setTimeout(() => setActiveButton(null), 300);
  };

  const handleExport = () => {
    const data = exportWorkflow();
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "workflow.json";
    a.click();
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        importWorkflow(event.target?.result as string);
      };
      reader.readAsText(file);
    }
  };

  const handleSave = () => {
    saveWorkflow(workflowName);
    // Notify parent component about save click
    if (onSaveClick) {
      onSaveClick();
    }
  };

  return (
    <aside
      className="
        w-16
        h-full
        flex flex-col
        bg-[#0b0e14]
        border-r border-white/5
      "
    >
      {/* TOP: Node list */}
      <div className="flex-1 overflow-y-auto py-4">
        <div className="flex flex-col items-center gap-3">
          {NODE_TYPES.map((node) => {
            const Icon = node.icon;
            const isActive = activeButton === node.id;

            return (
              <button
                key={node.id}
                onClick={() => handleAddNode(node.id)}
                title={node.label}
                className={`
                  relative group
                  w-10 h-10
                  flex items-center justify-center
                  rounded-lg
                  bg-[#111521]
                  border border-white/5
                  transition-all duration-200
                  hover:bg-[#171c2e]
                  ${isActive ? "scale-95" : "hover:scale-[1.05]"}
                `}
              >
                <Icon className="w-4 h-4 text-[#9aa3c7] group-hover:text-[#e6e9f2]" />
              </button>
            );
          })}
        </div>
      </div>

      {/* Workflow management */}
      <div
        className="
          py-4
          flex flex-col
          items-center
          gap-3
          border-t border-gray-800/40
          shrink-0
        "
      >
        <button
          onClick={handleSave}
          title="Save"
          className="
            w-10 h-10
            flex items-center justify-center
            rounded-lg
            bg-[#111521]
            border border-white/5
            transition-all duration-200
            hover:bg-[#171c2e] hover:scale-[1.05]
          "
        >
          <Save className="w-4 h-4 text-[#9aa3c7] hover:text-[#e6e9f2]" />
        </button>

        <button 
          onClick={handleExport} 
          title="Export" 
          className="
            w-10 h-10
            flex items-center justify-center
            rounded-lg
            bg-[#111521]
            border border-white/5
            transition-all duration-200
            hover:bg-[#171c2e] hover:scale-[1.05]
          "
        >
          <Download className="w-4 h-4 text-[#9aa3c7] hover:text-[#e6e9f2]" />
        </button>

        <label 
          title="Import" 
          className="
            w-10 h-10
            flex items-center justify-center
            rounded-lg
            bg-[#111521]
            border border-white/5
            transition-all duration-200
            hover:bg-[#171c2e] hover:scale-[1.05]
            cursor-pointer
          "
        >
          <Upload className="w-4 h-4 text-[#9aa3c7] hover:text-[#e6e9f2]" />
          <input
            type="file"
            accept=".json"
            onChange={handleImport}
            className="hidden"
          />
        </label>
      </div>
    </aside>
  );
}