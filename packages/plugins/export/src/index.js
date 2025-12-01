/**
 * ============================================================================
 * Black & White UI Engineering
 * @bw-ui/datatable-export
 * ============================================================================
 *
 * Export plugin for BWDataTable.
 *
 * Usage:
 *   import { BWDataTable } from '@bw-ui/datatable';
 *   import { ExportPlugin } from '@bw-ui/datatable-export';
 *
 *   const table = new BWDataTable('#table', { data: [...] });
 *   table.use(ExportPlugin);
 *
 *   table.exportJSON();
 *   table.exportCSV();
 *   table.copyToClipboard();
 *
 * @version 1.0.0
 * @license MIT
 * ============================================================================
 */

export { ExportPlugin, ExportPlugin as default } from './ExportPlugin.js';
