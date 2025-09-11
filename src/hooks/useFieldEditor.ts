// src/hooks/useFieldEditor.ts
import { useState, useCallback } from 'react';
import { EditorField, LabelCanvas, DragState, ResizeDirection } from '@/types/editor';

export function useFieldEditor(initialCanvas: LabelCanvas) {
  const [fields, setFields] = useState<EditorField[]>([]);
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);
  const [canvas, setCanvas] = useState<LabelCanvas>(initialCanvas);
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    isResizing: false,
    draggedFieldId: null,
    startPosition: { x: 0, y: 0 },
    startSize: { width: 0, height: 0 }
  });

  // Добавление нового поля
  const addField = useCallback((type: EditorField['type'], position?: { x: number; y: number }) => {
    const newField: EditorField = {
      id: Date.now().toString(),
      type,
      content: type === 'text' ? 'Новый текст' : type === 'qr' ? 'QR-данные' : 'Содержимое',
      x: position?.x || 50,
      y: position?.y || 50,
      width: type === 'text' ? 120 : 80,
      height: type === 'text' ? 30 : 80,
      fontSize: type === 'text' ? 14 : undefined,
      fontFamily: type === 'text' ? 'Arial' : undefined,
      zIndex: fields.length + 1
    };
    
    setFields(prev => [...prev, newField]);
    setSelectedFieldId(newField.id);
    return newField.id;
  }, [fields.length]);

  // Обновление поля
  const updateField = useCallback((fieldId: string, updates: Partial<EditorField>) => {
    setFields(prev => prev.map(field => 
      field.id === fieldId ? { ...field, ...updates } : field
    ));
  }, []);

  // Удаление поля
  const removeField = useCallback((fieldId: string) => {
    setFields(prev => prev.filter(field => field.id !== fieldId));
    if (selectedFieldId === fieldId) {
      setSelectedFieldId(null);
    }
  }, [selectedFieldId]);

  // Дублирование поля
  const duplicateField = useCallback((fieldId: string) => {
    const fieldToDuplicate = fields.find(f => f.id === fieldId);
    if (!fieldToDuplicate) return;

    const newField: EditorField = {
      ...fieldToDuplicate,
      id: Date.now().toString(),
      x: fieldToDuplicate.x + 20,
      y: fieldToDuplicate.y + 20,
      zIndex: fields.length + 1
    };

    setFields(prev => [...prev, newField]);
    setSelectedFieldId(newField.id);
    return newField.id;
  }, [fields]);

  // Изменение z-index (слои)
  const moveFieldToFront = useCallback((fieldId: string) => {
    const maxZIndex = Math.max(...fields.map(f => f.zIndex || 0));
    updateField(fieldId, { zIndex: maxZIndex + 1 });
  }, [fields, updateField]);

  const moveFieldToBack = useCallback((fieldId: string) => {
    const minZIndex = Math.min(...fields.map(f => f.zIndex || 0));
    updateField(fieldId, { zIndex: minZIndex - 1 });
  }, [fields, updateField]);

  // Выравнивание полей
  const alignFields = useCallback((fieldIds: string[], alignment: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom') => {
    const targetFields = fields.filter(f => fieldIds.includes(f.id));
    if (targetFields.length < 2) return;

    const updates: Array<{ id: string; updates: Partial<EditorField> }> = [];

    switch (alignment) {
      case 'left':
        const leftX = Math.min(...targetFields.map(f => f.x));
        targetFields.forEach(field => {
          updates.push({ id: field.id, updates: { x: leftX } });
        });
        break;
      case 'center':
        const centerX = targetFields.reduce((sum, f) => sum + f.x + f.width / 2, 0) / targetFields.length;
        targetFields.forEach(field => {
          updates.push({ id: field.id, updates: { x: centerX - field.width / 2 } });
        });
        break;
      case 'top':
        const topY = Math.min(...targetFields.map(f => f.y));
        targetFields.forEach(field => {
          updates.push({ id: field.id, updates: { y: topY } });
        });
        break;
      // Добавить остальные случаи...
    }

    updates.forEach(({ id, updates }) => updateField(id, updates));
  }, [fields, updateField]);

  // Очистка всех полей
  const clearFields = useCallback(() => {
    setFields([]);
    setSelectedFieldId(null);
  }, []);

  // Получение выбранного поля
  const selectedField = fields.find(f => f.id === selectedFieldId) || null;

  return {
    fields,
    selectedField,
    selectedFieldId,
    canvas,
    dragState,
    setFields,
    setSelectedFieldId,
    setCanvas,
    setDragState,
    addField,
    updateField,
    removeField,
    duplicateField,
    moveFieldToFront,
    moveFieldToBack,
    alignFields,
    clearFields
  };
}