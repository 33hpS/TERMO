// src/hooks/useDragAndDrop.ts
import { useCallback, useRef } from 'react';
import { EditorField, DragState, ResizeDirection } from '@/types/editor';

interface UseDragAndDropProps {
  fields: EditorField[];
  canvas: { width: number; height: number };
  dragState: DragState;
  setDragState: (state: DragState) => void;
  updateField: (fieldId: string, updates: Partial<EditorField>) => void;
  setSelectedFieldId: (id: string | null) => void;
}

export function useDragAndDrop({
  fields,
  canvas,
  dragState,
  setDragState,
  updateField,
  setSelectedFieldId
}: UseDragAndDropProps) {
  const canvasRef = useRef<HTMLDivElement>(null);

  // Начало перетаскивания/изменения размера
  const handleMouseDown = useCallback((
    e: React.MouseEvent,
    fieldId: string,
    action: 'move' | 'resize',
    resizeDirection?: ResizeDirection
  ) => {
    e.preventDefault();
    e.stopPropagation();

    const field = fields.find(f => f.id === fieldId);
    if (!field) return;

    setSelectedFieldId(fieldId);
    setDragState({
      isDragging: action === 'move',
      isResizing: action === 'resize',
      draggedFieldId: fieldId,
      startPosition: { x: e.clientX, y: e.clientY },
      startSize: { width: field.width, height: field.height },
      resizeDirection
    });
  }, [fields, setSelectedFieldId, setDragState]);

  // Перемещение мыши
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!dragState.draggedFieldId || (!dragState.isDragging && !dragState.isResizing)) return;

    const field = fields.find(f => f.id === dragState.draggedFieldId);
    if (!field || !canvasRef.current) return;

    const canvasRect = canvasRef.current.getBoundingClientRect();
    const scaleX = canvas.width / canvasRect.width;
    const scaleY = canvas.height / canvasRect.height;

    const deltaX = (e.clientX - dragState.startPosition.x) * scaleX;
    const deltaY = (e.clientY - dragState.startPosition.y) * scaleY;

    if (dragState.isDragging) {
      // Перемещение
      const newX = Math.max(0, Math.min(field.x + deltaX, canvas.width - field.width));
      const newY = Math.max(0, Math.min(field.y + deltaY, canvas.height - field.height));
      
      updateField(field.id, { x: newX, y: newY });
      
      setDragState({
        ...dragState,
        startPosition: { x: e.clientX, y: e.clientY }
      });
    } else if (dragState.isResizing) {
      // Изменение размера
      let newWidth = field.width;
      let newHeight = field.height;
      let newX = field.x;
      let newY = field.y;

      switch (dragState.resizeDirection) {
        case 'se':
          newWidth = Math.max(20, dragState.startSize.width + deltaX);
          newHeight = Math.max(20, dragState.startSize.height + deltaY);
          break;
        case 'sw':
          newWidth = Math.max(20, dragState.startSize.width - deltaX);
          newHeight = Math.max(20, dragState.startSize.height + deltaY);
          newX = field.x - (newWidth - field.width);
          break;
        case 'ne':
          newWidth = Math.max(20, dragState.startSize.width + deltaX);
          newHeight = Math.max(20, dragState.startSize.height - deltaY);
          newY = field.y - (newHeight - field.height);
          break;
        case 'nw':
          newWidth = Math.max(20, dragState.startSize.width - deltaX);
          newHeight = Math.max(20, dragState.startSize.height - deltaY);
          newX = field.x - (newWidth - field.width);
          newY = field.y - (newHeight - field.height);
          break;
        case 'e':
          newWidth = Math.max(20, dragState.startSize.width + deltaX);
          break;
        case 'w':
          newWidth = Math.max(20, dragState.startSize.width - deltaX);
          newX = field.x - (newWidth - field.width);
          break;
        case 'n':
          newHeight = Math.max(20, dragState.startSize.height - deltaY);
          newY = field.y - (newHeight - field.height);
          break;
        case 's':
          newHeight = Math.max(20, dragState.startSize.height + deltaY);
          break;
      }

      // Ограничения по границам холста
      newX = Math.max(0, Math.min(newX, canvas.width - newWidth));
      newY = Math.max(0, Math.min(newY, canvas.height - newHeight));
      newWidth = Math.min(newWidth, canvas.width - newX);
      newHeight = Math.min(newHeight, canvas.height - newY);

      updateField(field.id, { x: newX, y: newY, width: newWidth, height: newHeight });
    }
  }, [dragState, fields, canvas, updateField, setDragState]);

  // Окончание перетаскивания
  const handleMouseUp = useCallback(() => {
    setDragState({
      isDragging: false,
      isResizing: false,
      draggedFieldId: null,
      startPosition: { x: 0, y: 0 },
      startSize: { width: 0, height: 0 }
    });
  }, [setDragState]);

  return {
    canvasRef,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp
  };
}