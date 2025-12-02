/**
 * ============================================================================
 * Black & White UI Engineering
 * @bw-ui/datatable-command
 * ============================================================================
 *
 * Command palette plugin for BWDataTable.
 *
 * Usage:
 *   import { BWDataTable } from '@bw-ui/datatable';
 *   import { CommandPlugin } from '@bw-ui/datatable-command';
 *
 *   const table = new BWDataTable('#table', { data: [...] });
 *   table.use(CommandPlugin);
 *
 *   // Press Cmd+K or Ctrl+K to open command palette
 *
 * @version 1.0.0
 * @license MIT
 * ============================================================================
 */

export { CommandPlugin, CommandPlugin as default } from './CommandPlugin.js';
