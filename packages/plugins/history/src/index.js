/**
 * ============================================================================
 * Black & White UI Engineering
 * @bw-ui/datatable-history
 * ============================================================================
 *
 * Undo/Redo plugin for BWDataTable.
 *
 * Usage:
 *   import { BWDataTable } from '@bw-ui/datatable';
 *   import { HistoryPlugin } from '@bw-ui/datatable-history';
 *
 *   const table = new BWDataTable('#table', { data: [...] });
 *   table.use(HistoryPlugin, { maxHistory: 50 });
 *
 *   table.undo();
 *   table.redo();
 *
 * @version 1.0.0
 * @license MIT
 * ============================================================================
 */

export { HistoryPlugin, HistoryPlugin as default } from './HistoryPlugin.js';
