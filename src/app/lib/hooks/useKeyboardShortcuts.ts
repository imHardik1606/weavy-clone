import { useEffect } from 'react';
import { useWorkflowStore } from '../../lib/store/useWorkflowStore';

export function useKeyboardShortcuts() {
  const handleKeyDown = useWorkflowStore((state) => state.handleKeyDown);
  const selectedNode = useWorkflowStore((state) => state.selectedNode);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Don't trigger shortcuts when user is typing in inputs/textarea
      const activeElement = document.activeElement;
      const isInputFocused = 
        activeElement?.tagName === 'INPUT' ||
        activeElement?.tagName === 'TEXTAREA' ||
        activeElement?.getAttribute('role') === 'textbox' ||
        activeElement?.getAttribute('contenteditable') === 'true';
      
      if (!isInputFocused) {
        handleKeyDown(e);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => {
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, [handleKeyDown]);
}