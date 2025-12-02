/**
 * BWDataTable History Plugin - TypeScript Definitions
 * @bw-ui/datatable-history
 */

import { PluginAPI, Plugin, PluginInstance } from '@bw-ui/datatable';

/**
 * History plugin options
 */
export interface HistoryPluginOptions {
  /**
   * Maximum number of undo states to keep
   * @default 50
   */
  maxHistory?: number;

  /**
   * Enable keyboard shortcuts (Ctrl+Z, Ctrl+Y, Ctrl+Shift+Z)
   * @default true
   */
  shortcuts?: boolean;
}

/**
 * History state snapshot
 */
export interface HistorySnapshot {
  /** Cloned data array */
  data: any[];

  /** Sort state */
  sort: { column: string | null; direction: 'asc' | 'desc' | null };

  /** Global filter term */
  globalFilter: string;

  /** Selected row IDs */
  selected: string[];

  /** Action description */
  _action: string;

  /** Timestamp */
  _timestamp: number;
}

/**
 * History state info
 */
export interface HistoryState {
  /** Undo stack */
  undoStack: HistorySnapshot[];

  /** Redo stack */
  redoStack: HistorySnapshot[];

  /** Can undo */
  canUndo: boolean;

  /** Can redo */
  canRedo: boolean;
}

/**
 * History change event data
 */
export interface HistoryChangeEvent {
  canUndo: boolean;
  canRedo: boolean;
  undoCount: number;
  redoCount: number;
}

/**
 * History plugin instance
 */
export interface HistoryPluginInstance extends PluginInstance {
  name: 'history';

  /**
   * Undo last action
   * @returns true if undo was performed
   */
  undo(): boolean;

  /**
   * Redo last undone action
   * @returns true if redo was performed
   */
  redo(): boolean;

  /**
   * Check if undo is available
   */
  canUndo(): boolean;

  /**
   * Check if redo is available
   */
  canRedo(): boolean;

  /**
   * Clear all history
   */
  clearHistory(): void;

  /**
   * Get current history state
   */
  getHistory(): HistoryState;

  /**
   * Cleanup plugin
   */
  destroy(): void;
}

/**
 * History Plugin
 *
 * Adds undo/redo functionality to BWDataTable.
 *
 * @example
 * ```typescript
 * import { BWDataTable } from '@bw-ui/datatable';
 * import { HistoryPlugin } from '@bw-ui/datatable-history';
 *
 * const table = new BWDataTable('#table', { data })
 *   .use(HistoryPlugin, { maxHistory: 50, shortcuts: true });
 *
 * // Use undo/redo
 * table.undo();
 * table.redo();
 *
 * // Check state
 * if (table.canUndo()) {
 *   console.log('Can undo');
 * }
 *
 * // Listen to history changes
 * table.on('history:change', ({ canUndo, canRedo, undoCount, redoCount }) => {
 *   console.log(`Undo: ${undoCount}, Redo: ${redoCount}`);
 * });
 * ```
 */
export declare const HistoryPlugin: Plugin & {
  name: 'history';
  init(api: PluginAPI): HistoryPluginInstance;
};

export default HistoryPlugin;

/**
 * Extended table interface with History plugin methods
 */
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

    /** Get history state */
    getHistory(): HistoryState;
  }

  interface BWDataTableEvents {
    'history:change': HistoryChangeEvent;
    'history:undo': { action: string };
    'history:redo': { action: string };
    'history:clear': void;
  }
}
