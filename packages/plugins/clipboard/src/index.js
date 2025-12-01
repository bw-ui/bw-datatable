/**
 * ============================================================================
 * Black & White UI Engineering
 * @bw-ui/datatable-clipboard
 * ============================================================================
 *
 * Copy/Paste plugin for BWDataTable.
 *
 * Usage:
 *   import { BWDataTable } from '@bw-ui/datatable';
 *   import { ClipboardPlugin } from '@bw-ui/datatable-clipboard';
 *
 *   const table = new BWDataTable('#table', { data: [...] });
 *   table.use(ClipboardPlugin);
 *
 *   // Ctrl+C to copy selected rows
 *   // Ctrl+V to paste from Excel/Sheets
 *
 * @version 1.0.0
 * @license MIT
 * ============================================================================
 */

export {
  ClipboardPlugin,
  ClipboardPlugin as default,
} from './ClipboardPlugin.js';
