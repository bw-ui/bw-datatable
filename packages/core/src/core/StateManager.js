/**
 * ============================================================================
 * Black & White UI Engineering
 * BWDataTable - StateManager
 * ============================================================================
 *
 * Single source of truth for all DataTable state.
 *
 * Features:
 * - Immutable public state (predictable, undo-friendly)
 * - Mutable internal processing (performance for large data)
 * - Emits events on state changes
 * - Tracks history for undo/redo (via plugin)
 *
 * State Shape:
 *   data, rows, columns, sort, filters, selection, pagination, edit
 *
 * @module core/StateManager
 * @version 1.0.0
 * @license MIT
 * ============================================================================
 */

import EventBus from './EventBus.js';

/**
 * Default state shape
 * @returns {Object} Fresh default state
 */
function getDefaultState() {
  return {
    // Data
    data: [], // Original data (never mutate)
    rows: [], // Processed rows (after filter/sort)

    // Columns
    columns: [], // Column definitions
    columnOrder: [], // Column display order
    columnWidths: {}, // { columnId: width }
    pinnedLeft: [], // Column IDs pinned left
    pinnedRight: [], // Column IDs pinned right
    hiddenColumns: [], // Hidden column IDs

    // Sort
    sort: [], // [{ column: 'name', dir: 'asc' }]

    // Filter
    filters: {}, // { columnId: filterValue }
    globalFilter: '', // Global search term

    // Selection
    selected: new Set(), // Selected row IDs
    selectionMode: 'multi', // 'single' | 'multi' | 'none'

    // Pagination
    page: 0, // Current page (0-indexed)
    pageSize: 20, // Rows per page
    totalRows: 0, // Total row count

    // Edit
    editingCell: null, // { rowId, columnId } or null
    editingRow: null, // rowId or null

    // UI State
    isLoading: false,
    error: null,
  };
}

export class StateManager {
  /** @type {Object} - Current state */
  #state;

  /** @type {EventBus} - For emitting state changes */
  #eventBus;

  /** @type {Array} - State history for undo (managed by plugin) */
  #history = [];

  /** @type {number} - Max history length */
  #maxHistory = 50;

  /**
   * @param {EventBus} eventBus - EventBus instance for emitting changes
   * @param {Object} initialState - Override default state values
   */
  constructor(eventBus, initialState = {}) {
    this.#eventBus = eventBus;
    this.#state = { ...getDefaultState(), ...initialState };
  }

  /**
   * Get current state (shallow copy for immutability)
   * @returns {Object} Current state
   *
   * @example
   *   const { sort, filters } = state.getState();
   */
  getState() {
    return { ...this.#state };
  }

  /**
   * Get specific state value
   * @param {string} key - State key
   * @returns {*} State value
   *
   * @example
   *   const page = state.get('page');
   */
  get(key) {
    return this.#state[key];
  }

  /**
   * Update state and emit change event
   * @param {Object} updates - Partial state updates
   * @param {Object} options - { silent: boolean, track: boolean }
   *   - silent: Don't emit event (default: false)
   *   - track: Add to history for undo (default: true)
   *
   * @example
   *   state.setState({ page: 2 });
   *   state.setState({ sort: [...] }, { silent: true });
   */
  setState(updates, options = {}) {
    const { silent = false, track = true } = options;

    // Save to history before changing (for undo)
    if (track) {
      this.#pushHistory();
    }

    // Get previous state for diff
    const prevState = this.#state;

    // Apply updates (immutable - create new object)
    this.#state = { ...this.#state, ...updates };

    // Emit change event with diff info
    if (!silent) {
      this.#eventBus.emit('state:change', {
        prev: prevState,
        current: this.#state,
        changes: Object.keys(updates),
      });
    }
  }

  /**
   * Reset state to defaults
   * @param {Object} initialState - Optional new initial state
   */
  reset(initialState = {}) {
    this.#state = { ...getDefaultState(), ...initialState };
    this.#history = [];
    this.#eventBus.emit('state:reset', this.#state);
  }

  /**
   * Push current state to history stack
   * @private
   */
  #pushHistory() {
    // Deep clone for history (excluding Sets - convert to arrays)
    const snapshot = JSON.parse(
      JSON.stringify({
        ...this.#state,
        selected: [...this.#state.selected],
      })
    );

    this.#history.push(snapshot);

    // Limit history size
    if (this.#history.length > this.#maxHistory) {
      this.#history.shift();
    }
  }

  /**
   * Get history for undo plugin
   * @returns {Array} State history
   */
  getHistory() {
    return this.#history;
  }

  /**
   * Restore state from history (used by undo plugin)
   * @param {Object} snapshot - State snapshot to restore
   */
  restore(snapshot) {
    // Convert selected array back to Set
    this.#state = {
      ...snapshot,
      selected: new Set(snapshot.selected),
    };
    this.#eventBus.emit('state:restore', this.#state);
  }

  /**
   * Batch multiple state updates (single event emission)
   * @param {Function} fn - Function that calls setState multiple times
   *
   * @example
   *   state.batch(() => {
   *     state.setState({ page: 0 }, { silent: true });
   *     state.setState({ filters: {} }, { silent: true });
   *   });
   *   // Single state:change event fires after batch
   */
  batch(fn) {
    const prevState = this.#state;
    fn();
    this.#eventBus.emit('state:change', {
      prev: prevState,
      current: this.#state,
      changes: ['batch'],
    });
  }
}

export default StateManager;
