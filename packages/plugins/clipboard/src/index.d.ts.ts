/**
 * @bw-ui/datatable-clipboard - TypeScript Definitions
 */

import { Plugin, PluginAPI, ColumnDefinition } from '@bw-ui/datatable';

export interface ClipboardPluginOptions {
  /** Enable keyboard shortcuts (Ctrl+C, Ctrl+V) */
  shortcuts?: boolean;
  /** Include column headers when copying */
  copyHeaders?: boolean;
  /** Paste mode: 'append' adds rows, 'replace' replaces selected */
  pasteMode?: 'append' | 'replace';
}

export interface ClipboardCopyEvent {
  rowCount: number;
  content: string;
}

export interface ClipboardBeforePasteEvent {
  parsedRows: string[][];
  columns: ColumnDefinition[];
}

export interface ClipboardPasteEvent {
  rowCount: number;
  rows: Record<string, any>[];
  mode: 'append' | 'replace';
}

export interface ClipboardPluginInstance {
  /** Copy selected rows to clipboard */
  copy: (options?: ClipboardPluginOptions) => Promise<boolean>;
  /** Paste from clipboard */
  paste: (options?: ClipboardPluginOptions) => Promise<boolean>;
  /** Cleanup */
  destroy: () => void;
}

export interface ClipboardPlugin extends Plugin {
  name: 'clipboard';
  init: (api: PluginAPI) => ClipboardPluginInstance;
}

export declare const ClipboardPlugin: ClipboardPlugin;
export default ClipboardPlugin;

// Extend BWDataTable interface
declare module '@bw-ui/datatable' {
  interface BWDataTable {
    /** Copy selected rows to clipboard */
    copy(options?: ClipboardPluginOptions): Promise<boolean>;
    /** Paste from clipboard */
    paste(options?: ClipboardPluginOptions): Promise<boolean>;
  }
}
