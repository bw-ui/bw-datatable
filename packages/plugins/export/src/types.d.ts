/**
 * @bw-ui/datatable-export - TypeScript Definitions
 */

import { Plugin, PluginAPI, ColumnDefinition } from '@bw-ui/datatable';

export interface ExportPluginOptions {
  /** Base filename for downloads (without extension) */
  filename?: string;
  /** Include column headers in export */
  includeHeaders?: boolean;
  /** Export only selected rows */
  selectedOnly?: boolean;
  /** Export only visible columns */
  visibleOnly?: boolean;
  /** CSV field delimiter */
  csvDelimiter?: string;
  /** CSV quote character */
  csvQuote?: string;
}

export interface ExportData {
  /** Raw row data */
  rows: Record<string, any>[];
  /** Column definitions */
  columns: ColumnDefinition[];
  /** Processed data objects */
  data: Record<string, any>[];
}

export interface ExportBeforeEvent {
  format: 'json' | 'csv' | 'clipboard';
  rows: Record<string, any>[];
  columns: ColumnDefinition[];
  options: ExportPluginOptions;
}

export interface ExportAfterEvent {
  format: 'json' | 'csv' | 'clipboard';
  filename?: string;
  rowCount: number;
}

export interface ExportPluginInstance {
  /** Export as JSON file */
  exportJSON: (options?: ExportPluginOptions) => boolean;
  /** Export as CSV file */
  exportCSV: (options?: ExportPluginOptions) => boolean;
  /** Copy to clipboard */
  copyToClipboard: (options?: ExportPluginOptions) => Promise<boolean>;
  /** Get export data for custom processing */
  getExportData: (options?: ExportPluginOptions) => ExportData;
}

export interface ExportPlugin extends Plugin {
  name: 'export';
  init: (api: PluginAPI) => ExportPluginInstance;
}

export declare const ExportPlugin: ExportPlugin;
export default ExportPlugin;

// Extend BWDataTable interface
declare module '@bw-ui/datatable' {
  interface BWDataTable {
    /** Export as JSON file */
    exportJSON(options?: ExportPluginOptions): boolean;
    /** Export as CSV file */
    exportCSV(options?: ExportPluginOptions): boolean;
    /** Copy to clipboard */
    copyToClipboard(options?: ExportPluginOptions): Promise<boolean>;
    /** Get export data for custom processing */
    getExportData(options?: ExportPluginOptions): ExportData;
  }
}
