/**
 * ============================================================================
 * Black & White UI Engineering
 * @bw-ui/datatable - Core
 * ============================================================================
 *
 * Production-ready data table with layered architecture.
 * Handles 100k+ rows smoothly. Zero dependencies.
 *
 * Architecture:
 * - DataEngine: Async data operations (sort/filter)
 * - ViewEngine: Viewport calculations (virtual scroll)
 * - DOMRenderer: Pure DOM rendering
 * - BWDataTable: Orchestrator
 *
 * Usage:
 *   import { BWDataTable } from '@bw-ui/datatable';
 *
 *   const table = new BWDataTable('#table', {
 *     data: [...],  // Even 100k rows!
 *   });
 *
 * @version 2.0.0
 * @license MIT
 * ============================================================================
 */

export { BWDataTable } from './core/BWDataTable.js';
export { EventBus } from './core/EventBus.js';
export { StateManager } from './core/StateManager.js';
export { PluginSystem } from './core/PluginSystem.js';

export { BWDataTable as default } from './core/BWDataTable.js';
