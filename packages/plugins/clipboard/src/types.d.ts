/**
 * BWDataTable Clipboard Plugin - TypeScript Definitions
 * @bw-ui/datatable-clipboard
 */

import { PluginAPI, Plugin, PluginInstance } from '@bw-ui/datatable';

/**
 * Clipboard plugin options
 */
export interface ClipboardPluginOptions {
  /**
   * Include column headers when copying
   * @default true
   */
  copyHeaders?: boolean;

  /**
   * Enable keyboard shortcuts (Ctrl+C, Ctrl+V)
   * @default true
   */
  shortcuts?: boolean;
}

/**
 * Copy event data
 */
export interface ClipboardCopyEvent {
  /** Number of rows copied */
  count: number;

  /** Tab-separated text content */
  text: string;
}

/**
 * Paste event data
 */
export interface ClipboardPasteEvent {
  /** Parsed row objects */
  rows: any[];

  /** Number of rows pasted */
  count: number;

  /** Raw clipboard text */
  text: string;
}

/**
 * Clipboard plugin instance
 */
export interface ClipboardPluginInstance extends PluginInstance {
  name: 'clipboard';

  /**
   * Copy rows to clipboard
   * @param selectedOnly - Only copy selected rows (default: true)
   * @returns true if copy was initiated
   */
  copy(selectedOnly?: boolean): boolean;

  /**
   * Copy all visible rows to clipboard
   */
  copyAll(): boolean;

  /**
   * Paste from clipboard and add rows to table
   */
  paste(): void;

  /**
   * Cleanup plugin
   */
  destroy(): void;
}

/**
 * Clipboard Plugin
 *
 * Adds copy/paste functionality with Excel compatibility.
 *
 * @example
 * ```typescript
 * import { BWDataTable } from '@bw-ui/datatable';
 * import { ClipboardPlugin } from '@bw-ui/datatable-clipboard';
 *
 * const table = new BWDataTable('#table', { data })
 *   .use(ClipboardPlugin, { copyHeaders: true, shortcuts: true });
 *
 * // Copy selected rows
 * table.copy();
 *
 * // Copy all rows
 * table.copyAll();
 *
 * // Paste from clipboard
 * table.paste();
 *
 * // Listen to events
 * table.on('clipboard:copy', ({ count }) => {
 *   console.log(`Copied ${count} rows`);
 * });
 * ```
 */
export declare const ClipboardPlugin: Plugin & {
  name: 'clipboard';
  init(api: PluginAPI): ClipboardPluginInstance;
};

export default ClipboardPlugin;

/**
 * Extended table interface with Clipboard plugin methods
 */
declare module '@bw-ui/datatable' {
  interface BWDataTable {
    /** Copy selected rows to clipboard */
    copy(selectedOnly?: boolean): boolean;

    /** Copy all rows to clipboard */
    copyAll(): boolean;

    /** Paste from clipboard */
    paste(): void;
  }

  interface BWDataTableEvents {
    'clipboard:copy': ClipboardCopyEvent;
    'clipboard:paste': ClipboardPasteEvent;
  }
}
