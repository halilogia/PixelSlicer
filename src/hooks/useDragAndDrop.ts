/**
 * useDragAndDrop Hook
 * Handles drag and drop interactions for file upload
 */

import { useState, useCallback, useEffect, RefObject } from 'react';

interface DragState {
  isDragging: boolean;
  isOver: boolean;
}

interface UseDragAndDropOptions {
  onDrop?: (files: File[]) => void;
  onDragEnter?: () => void;
  onDragLeave?: () => void;
  acceptedTypes?: string[];
  multiple?: boolean;
}

interface UseDragAndDropReturn {
  dragState: DragState;
  handlers: {
    onDragEnter: (e: React.DragEvent) => void;
    onDragOver: (e: React.DragEvent) => void;
    onDragLeave: (e: React.DragEvent) => void;
    onDrop: (e: React.DragEvent) => void;
  };
  inputProps: {
    type: 'file';
    accept: string;
    multiple: boolean;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    style: React.CSSProperties;
  };
  openFileDialog: () => void;
}

const DEFAULT_ACCEPTED_TYPES = ['video/mp4', 'video/quicktime', '.mp4', '.mov'];

export function useDragAndDrop(
  containerRef: RefObject<HTMLElement>,
  options: UseDragAndDropOptions = {}
): UseDragAndDropReturn {
  const {
    onDrop,
    onDragEnter,
    onDragLeave,
    acceptedTypes = DEFAULT_ACCEPTED_TYPES,
    multiple = true,
  } = options;

  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    isOver: false,
  });

  const [, setInputKey] = useState(0);

  /**
   * Extract files from drag event
   */
  const extractFiles = useCallback((dataTransfer: DataTransfer): File[] => {
    const files: File[] = [];
    
    if (dataTransfer.items) {
      // Use DataTransferItemList interface
      for (let i = 0; i < dataTransfer.items.length; i++) {
        const item = dataTransfer.items[i];
        if (item.kind === 'file') {
          const file = item.getAsFile();
          if (file) {
            files.push(file);
          }
        }
      }
    } else {
      // Use DataTransfer interface (fallback)
      for (let i = 0; i < dataTransfer.files.length; i++) {
        files.push(dataTransfer.files[i]);
      }
    }

    // Filter by accepted types if specified
    if (acceptedTypes.length > 0) {
      return files.filter(file => {
        const isAccepted = acceptedTypes.some(type => {
          if (type.startsWith('.')) {
            // Extension check
            return file.name.toLowerCase().endsWith(type.toLowerCase());
          }
          // MIME type check
          return file.type === type || file.type.startsWith(type.replace('/*', ''));
        });
        return isAccepted;
      });
    }

    return files;
  }, [acceptedTypes]);

  /**
   * Handle drag enter
   */
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Check if files are being dragged
    const hasFiles = Array.from(e.dataTransfer.items).some(
      item => item.kind === 'file'
    );

    if (hasFiles) {
      setDragState(prev => ({ ...prev, isOver: true }));
      onDragEnter?.();
    }
  }, [onDragEnter]);

  /**
   * Handle drag over
   */
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Required for drop to work
    e.dataTransfer.dropEffect = 'copy';
  }, []);

  /**
   * Handle drag leave
   */
  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Only update if leaving the container (not entering a child)
    const rect = containerRef.current?.getBoundingClientRect();
    if (rect) {
      const { clientX, clientY } = e;
      if (
        clientX <= rect.left ||
        clientX >= rect.right ||
        clientY <= rect.top ||
        clientY >= rect.bottom
      ) {
        setDragState(prev => ({ ...prev, isOver: false }));
        onDragLeave?.();
      }
    }
  }, [containerRef, onDragLeave]);

  /**
   * Handle drop
   */
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    setDragState({ isDragging: false, isOver: false });

    const files = extractFiles(e.dataTransfer);
    if (files.length > 0) {
      onDrop?.(multiple ? files : [files[0]]);
    }
  }, [extractFiles, multiple, onDrop]);

  /**
   * Handle file input change
   */
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const fileArray = Array.from(files);
      onDrop?.(multiple ? fileArray : [fileArray[0]]);
    }
    // Reset input to allow selecting same file again
    setInputKey(prev => prev + 1);
  }, [multiple, onDrop]);

  /**
   * Open file dialog programmatically
   */
  const openFileDialog = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = acceptedTypes.join(',');
    input.multiple = multiple;
    input.onchange = (e) => {
      const targetFiles = (e.target as HTMLInputElement).files;
      if (targetFiles && targetFiles.length > 0) {
        onDrop?.(multiple ? Array.from(targetFiles) : [targetFiles[0]]);
      }
    };
    input.click();
  }, [acceptedTypes, multiple, onDrop]);

  /**
   * Global drag state tracking
   */
  useEffect(() => {
    const handleWindowDragEnter = (e: DragEvent) => {
      if (e.dataTransfer?.types.includes('Files')) {
        setDragState(prev => ({ ...prev, isDragging: true }));
      }
    };

    const handleWindowDragOver = (e: DragEvent) => {
      e.preventDefault();
    };

    const handleWindowDrop = (e: DragEvent) => {
      // Prevent dropping files outside the drop zone
      if (!containerRef.current?.contains(e.target as Node)) {
        e.preventDefault();
      }
      setDragState({ isDragging: false, isOver: false });
    };

    const handleWindowDragLeave = (e: DragEvent) => {
      if (e.relatedTarget === null) {
        setDragState({ isDragging: false, isOver: false });
      }
    };

    window.addEventListener('dragenter', handleWindowDragEnter);
    window.addEventListener('dragover', handleWindowDragOver);
    window.addEventListener('drop', handleWindowDrop);
    window.addEventListener('dragleave', handleWindowDragLeave);

    return () => {
      window.removeEventListener('dragenter', handleWindowDragEnter);
      window.removeEventListener('dragover', handleWindowDragOver);
      window.removeEventListener('drop', handleWindowDrop);
      window.removeEventListener('dragleave', handleWindowDragLeave);
    };
  }, [containerRef]);

  return {
    dragState,
    handlers: {
      onDragEnter: handleDragEnter,
      onDragOver: handleDragOver,
      onDragLeave: handleDragLeave,
      onDrop: handleDrop,
    },
    inputProps: {
      type: 'file',
      accept: acceptedTypes.join(','),
      multiple,
      onChange: handleInputChange,
      style: { display: 'none' },
    },
    openFileDialog,
  };
}
