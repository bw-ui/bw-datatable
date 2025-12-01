/**
 * ============================================================================
 * Black & White UI Engineering
 * @bw-ui/datatable-url-state
 * ============================================================================
 *
 * URL state sync plugin for BWDataTable.
 *
 * Usage:
 *   import { BWDataTable } from '@bw-ui/datatable';
 *   import { UrlStatePlugin } from '@bw-ui/datatable-url-state';
 *
 *   const table = new BWDataTable('#table', { data: [...] });
 *   table.use(UrlStatePlugin);
 *
 *   // URL auto-syncs: ?page=2&sort=name:asc&search=john
 *
 * @version 1.0.0
 * @license MIT
 * ============================================================================
 */

export { UrlStatePlugin, UrlStatePlugin as default } from './UrlStatePlugin.js';
