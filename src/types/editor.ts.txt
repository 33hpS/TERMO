// src/types/editor.ts
export interface EditorField {
  id: string;
  type: 'text' | 'qr' | 'image' | 'barcode';
  content: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fontSize?: number;
  fontFamily?: string;
  rotation?: 0 | 90 | 180 | 270;
  alignment?: 'left' | 'center' | 'right';
  zIndex?: number;
}

export interface LabelCanvas {
  width: number;
  height: number;
  unit: 'mm' | 'px';
  dpi: number;
  backgroundColor: string;
  gridEnabled: boolean;
  gridSize: number;
}

export interface DragState {
  isDragging: boolean;
  isResizing: boolean;
  draggedFieldId: string | null;
  startPosition: { x: number; y: number };
  startSize: { width: number; height: number };
  resizeDirection?: ResizeDirection;
}

export type ResizeDirection = 'nw' | 'ne' | 'sw' | 'se' | 'n' | 's' | 'e' | 'w';

// src/types/printer.ts
export interface ThermalPrinterConfig {
  type: 'zebra' | 'citizen' | 'tsc' | 'generic';
  connectionType: 'usb' | 'network' | 'bluetooth';
  ipAddress?: string;
  port?: number;
  dpi: 203 | 300 | 600;
  labelWidth: number;
  labelHeight: number;
  speed: number;
  darkness: number;
  orientation: 'portrait' | 'landscape';
}

export interface PrintJob {
  id: string;
  labelId: string;
  printerConfig: ThermalPrinterConfig;
  status: 'pending' | 'printing' | 'completed' | 'failed';
  createdAt: Date;
  completedAt?: Date;
  errorMessage?: string;
}

// src/types/label.ts - Обновленные типы этикеток
export interface EnhancedLabelTemplate {
  id: string;
  name: string;
  fields: EditorField[];
  canvas: LabelCanvas;
  createdAt: Date;
  updatedAt: Date;
  isTemplate?: boolean;
  templateCategory?: string;
  printSettings?: ThermalPrinterConfig;
  thumbnail?: string; // base64 thumbnail
}