/**
 * BWDataTable Export Plugin - TypeScript Definitions
 * @bw-ui/datatable-export
 */

import { PluginAPI, Plugin, PluginInstance } from '@bw-ui/datatable';

/**
 * Export plugin options
 */
export interface ExportPluginOptions {
  /**
   * Default filename (without extension)
   * @default 'export'
   */
  filename?: string;

  /**
   * Include column headers in export
   * @default true
   */
  includeHeaders?: boolean;
}

/**
 * CSV export options
 */
export interface CSVExportOptions {
  /** Filename (without extension) */
  filename?: string;

  /** Export only selected rows */
  selectedOnly?: boolean;

  /** Include headers */
  includeHeaders?: boolean;

  /** Field separator */
  separator?: string;
}

/**
 * JSON export options
 */
export interface JSONExportOptions {
  /** Filename (without extension) */
  filename?: string;

  /** Export only selected rows */
  selectedOnly?: boolean;

  /** Pretty print with indentation */
  pretty?: boolean;
}

/**
 * Export event data
 */
export interface ExportEventData {
  /** Export format */
  format: 'csv' | 'json';

  /** Filename used */
  filename: string;

  /** Number of rows exported */
  count: number;
}

/**
 * Export plugin instance
 */
export interface ExportPluginInstance extends PluginInstance {
  name: 'export';

  /**
   * Export to CSV file
   * @param filename - Filename without extension
   * @param selectedOnly - Export only selected rows
   */
  exportCSV(filename?: string, selectedOnly?: boolean): void;

  /**
   * Export to JSON file
   * @param filename - Filename without extension
   * @param selectedOnly - Export only selected rows
   */
  exportJSON(filename?: string, selectedOnly?: boolean): void;

  /**
   * Cleanup plugin
   */
  destroy(): void;
}

/**
 * Export Plugin
 *
 * Adds CSV and JSON export functionality to BWDataTable.
 *
 * @example
 * ```typescript
 * import { BWDataTable } from '@bw-ui/datatable';
 * import { ExportPlugin } from '@bw-ui/datatable-export';
 *
 * const table = new BWDataTable('#table', { data })
 *   .use(ExportPlugin, { filename: 'my-data' });
 *
 * // Export all data to CSV
 * table.exportCSV('users');
 *
 * // Export selected rows to JSON
 * table.exportJSON('selected-users', true);
 *
 * // Listen to export events
 * table.on('export:complete', ({ format, filename, count }) => {
 *   console.log(`Exported ${count} rows to ${filename}.${format}`);
 * });
 * ```
 */
export declare const ExportPlugin: Plugin & {
  name: 'export';
  init(api: PluginAPI): ExportPluginInstance;
};

export default ExportPlugin;

/**
 * Extended table interface with Export plugin methods
 */
declare module '@bw-ui/datatable' {
  interface BWDataTable {
    /** Export to CSV file */
    exportCSV(filename?: string, selectedOnly?: boolean): void;

    /** Export to JSON file */
    exportJSON(filename?: string, selectedOnly?: boolean): void;
  }

  interface BWDataTableEvents {
    'export:complete': ExportEventData;
  }
}
