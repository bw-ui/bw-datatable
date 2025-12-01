/**
 * ============================================================================
 * Black & White UI Engineering
 * @bw-ui/datatable - Core
 * ============================================================================
 *
 * Production-ready data table with plugin architecture.
 * Zero dependencies. Works everywhere.
 *
 * Usage:
 *   import { BWDataTable } from '@bw-ui/datatable';
 *
 *   const table = new BWDataTable('#table', {
 *     data: [...],
 *   });
 *
 * @version 1.0.0
 * @license MIT
 * ============================================================================
 */

export { BWDataTable } from './core/BWDataTable.js';
export { EventBus } from './core/EventBus.js';
export { StateManager } from './core/StateManager.js';
export { PluginSystem } from './core/PluginSystem.js';

export { BWDataTable as default } from './core/BWDataTable.js';
