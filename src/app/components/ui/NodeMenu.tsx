import * as React from 'react';
import { 
  MoreVertical, 
  Trash2, 
  Copy, 
  Settings,
  Link,
  Eye,
  EyeOff,
  Download,
  Upload
} from 'lucide-react';
import { cn } from '../../lib/utils/cn';
import { Button } from './Button';

interface NodeMenuProps {
  nodeId: string;
  nodeType: 'text' | 'image' | 'llm';
  onDelete?: (nodeId: string) => void;
  onDuplicate?: (nodeId: string) => void;
  onConfigure?: (nodeId: string) => void;
  onToggleVisibility?: (nodeId: string) => void;
  onExport?: (nodeId: string) => void;
  onImport?: (nodeId: string) => void;
  className?: string;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
}

const NodeMenu = React.forwardRef<HTMLDivElement, NodeMenuProps>(
  ({ 
    nodeId,
    nodeType,
    onDelete,
    onDuplicate,
    onConfigure,
    onToggleVisibility,
    onExport,
    onImport,
    className,
    position = 'top-right'
  }, ref) => {
    
    const [isOpen, setIsOpen] = React.useState(false);
    const menuRef = React.useRef<HTMLDivElement>(null);

    // Close menu when clicking outside
    React.useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
          setIsOpen(false);
        }
      };

      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const positionClasses = {
      'top-right': 'top-2 right-2',
      'top-left': 'top-2 left-2',
      'bottom-right': 'bottom-2 right-2',
      'bottom-left': 'bottom-2 left-2',
    };

    const menuItems = [
      {
        icon: <Settings size={14} />,
        label: 'Configure',
        onClick: () => {
          onConfigure?.(nodeId);
          setIsOpen(false);
        },
        color: 'text-gray-700 hover:bg-gray-100',
      },
      {
        icon: <Copy size={14} />,
        label: 'Duplicate',
        onClick: () => {
          onDuplicate?.(nodeId);
          setIsOpen(false);
        },
        color: 'text-blue-700 hover:bg-blue-50',
      },
      {
        icon: <Eye size={14} />,
        label: 'Toggle Visibility',
        onClick: () => {
          onToggleVisibility?.(nodeId);
          setIsOpen(false);
        },
        color: 'text-green-700 hover:bg-green-50',
      },
      ...(onExport ? [{
        icon: <Download size={14} />,
        label: 'Export Data',
        onClick: () => {
          onExport?.(nodeId);
          setIsOpen(false);
        },
        color: 'text-purple-700 hover:bg-purple-50',
      }] : []),
      ...(onImport ? [{
        icon: <Upload size={14} />,
        label: 'Import Data',
        onClick: () => {
          onImport?.(nodeId);
          setIsOpen(false);
        },
        color: 'text-orange-700 hover:bg-orange-50',
      }] : []),
      {
        icon: <Trash2 size={14} />,
        label: 'Delete',
        onClick: () => {
          onDelete?.(nodeId);
          setIsOpen(false);
        },
        color: 'text-red-700 hover:bg-red-50',
      },
    ];

    return (
      <div 
        ref={ref}
        className={cn(
          "absolute z-10",
          positionClasses[position],
          className
        )}
      >
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsOpen(!isOpen)}
          className="h-8 w-8 bg-white/80 backdrop-blur-sm border border-gray-300 shadow-sm hover:bg-white"
        >
          <MoreVertical size={16} />
        </Button>

        {isOpen && (
          <div
            ref={menuRef}
            className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20"
          >
            <div className="px-3 py-2 border-b border-gray-100">
              <p className="text-xs font-medium text-gray-700">Node: {nodeType}</p>
              <p className="text-xs text-gray-500 truncate">ID: {nodeId.substring(0, 8)}...</p>
            </div>
            
            {menuItems.map((item, index) => (
              <button
                key={index}
                onClick={item.onClick}
                className={cn(
                  "w-full flex items-center px-3 py-2 text-sm",
                  "transition-colors duration-150",
                  item.color
                )}
              >
                <span className="mr-3">{item.icon}</span>
                <span>{item.label}</span>
              </button>
            ))}
            
            <div className="px-3 py-2 border-t border-gray-100">
              <div className="flex items-center text-xs text-gray-500">
                <Link size={12} className="mr-1" />
                <span>Click outside to close</span>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }
);
NodeMenu.displayName = 'NodeMenu';

export { NodeMenu };

// Context menu variant for right-click
export const NodeContextMenu = ({ nodeId, position, onDelete }: {
  nodeId: string;
  position: { x: number; y: number };
  onDelete: (nodeId: string) => void;
}) => {
  return (
    <div
      className="fixed bg-white rounded-lg shadow-xl border border-gray-200 py-1 z-50 min-w-[160px]"
      style={{ left: position.x, top: position.y }}
    >
      <button
        onClick={() => onDelete(nodeId)}
        className="w-full flex items-center px-4 py-2 text-sm text-red-700 hover:bg-red-50 transition-colors"
      >
        <Trash2 size={14} className="mr-3" />
        Delete Node
      </button>
      <div className="border-t border-gray-100 my-1" />
      <div className="px-4 py-2 text-xs text-gray-500">
        Press <kbd className="px-1 py-0.5 bg-gray-100 rounded text-xs">Del</kbd> to delete
      </div>
    </div>
  );
};