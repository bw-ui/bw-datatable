/**
 * @bw-ui/datatable-history - TypeScript Definitions
 */

import { Plugin, PluginAPI } from '@bw-ui/datatable';

export interface HistoryPluginOptions {
  /** Maximum number of undo steps */
  maxHistory?: number;
  /** Track sort changes in history */
  trackSort?: boolean;
  /** Track filter changes in history */
  trackFilter?: boolean;
  /** Track selection changes in history */
  trackSelection?: boolean;
  /** Enable keyboard shortcuts (Ctrl+Z, Ctrl+Y) */
  shortcuts?: boolean;
}

export interface HistorySnapshot {
  data: Record<string, any>[];
  rows: Record<string, any>[];
  sort: { column: string; dir: 'asc' | 'desc' }[];
  filters: Record<string, any>;
  globalFilter: string;
  selected: string[];
  _action: string;
  _timestamp: number;
}

export interface HistoryInfo {
  undoStack: HistorySnapshot[];
  redoStack: HistorySnapshot[];
  canUndo: boolean;
  canRedo: boolean;
}

export interface HistoryChangeEvent {
  canUndo: boolean;
  canRedo: boolean;
  undoCount: number;
  redoCount: number;
}

export interface UndoRedoEvent {
  action: string;
  timestamp: number;
}

export interface HistoryPluginInstance {
  /** Undo last action */
  undo: () => boolean;
  /** Redo last undone action */
  redo: () => boolean;
  /** Check if undo is available */
  canUndo: () => boolean;
  /** Check if redo is available */
  canRedo: () => boolean;
  /** Clear all history */
  clearHistory: () => void;
  /** Get history info */
  getHistory: () => HistoryInfo;
  /** Cleanup */
  destroy: () => void;
}

export interface HistoryPlugin extends Plugin {
  name: 'history';
  init: (api: PluginAPI) => HistoryPluginInstance;
}

export declare const HistoryPlugin: HistoryPlugin;
export default HistoryPlugin;

// Extend BWDataTable interface
declare module '@bw-ui/datatable' {
  interface BWDataTable {
    /** Undo last action */
    undo(): boolean;
    /** Redo last undone action */
    redo(): boolean;
    /** Check if undo is available */
    canUndo(): boolean;
    /** Check if redo is available */
    canRedo(): boolean;
    /** Clear all history */
    clearHistory(): void;
    /** Get history info */
    getHistory(): HistoryInfo;
  }
}
