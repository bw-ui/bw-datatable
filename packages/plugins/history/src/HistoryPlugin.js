/**
 * ============================================================================
 * Black & White UI Engineering
 * BWDataTable - HistoryPlugin
 * ============================================================================
 *
 * Undo/Redo functionality for DataTable.
 *
 * Architecture Notes:
 * - Core mutates data directly in #updateCellValue (doesn't use setState)
 * - We capture snapshots BEFORE edit happens (edit:before event)
 * - Snapshots include deep clone of data arrays
 * - Restore triggers table.render() to refresh UI
 *
 * Events from Core:
 * - edit:before  → Capture snapshot before mutation
 * - edit:end     → Edit completed (snapshot already saved)
 * - edit:cancel  → Edit cancelled (discard pending snapshot)
 *
 * Keyboard:
 * - Ctrl+Z / Cmd+Z         → Undo
 * - Ctrl+Y / Cmd+Y         → Redo
 * - Ctrl+Shift+Z / Cmd+Shift+Z → Redo
 *
 * @module plugins/history/HistoryPlugin
 * @version 1.1.0
 * @license MIT
 * ============================================================================
 */

const DEFAULTS = {
  maxHistory: 50,
  trackSort: false,
  trackFilter: false,
  trackSelection: false,
  shortcuts: true,
};

export const HistoryPlugin = {
  name: 'history',

  init(api) {
    const { eventBus, stateManager, table, options: pluginOptions } = api;
    const opts = { ...DEFAULTS, ...pluginOptions };

    // =========================================================================
    // STATE
    // =========================================================================

    /** @type {Array<Object>} - Undo stack */
    const undoStack = [];

    /** @type {Array<Object>} - Redo stack */
    const redoStack = [];

    /** @type {Object|null} - Pending snapshot (captured on edit:before) */
    let pendingSnapshot = null;

    /** @type {boolean} - Flag to prevent tracking during restore */
    let isRestoring = false;

    /** @type {Function|null} - Keyboard handler reference */
    let keyboardHandler = null;

    // =========================================================================
    // SNAPSHOT FUNCTIONS
    // =========================================================================

    /**
     * Deep clone data for snapshot
     * @param {Array} data - Data array to clone
     * @returns {Array} Cloned data
     */
    function cloneData(data) {
      return JSON.parse(JSON.stringify(data));
    }

    /**
     * Create a full state snapshot
     * @param {string} action - Description of action
     * @returns {Object} Snapshot
     */
    function createSnapshot(action) {
      const state = stateManager.getState();
      return {
        data: cloneData(state.data),
        rows: cloneData(state.rows),
        sort: [...state.sort],
        filters: { ...state.filters },
        globalFilter: state.globalFilter,
        selected: [...state.selected],
        _action: action,
        _timestamp: Date.now(),
      };
    }

    /**
     * Push snapshot to undo stack
     * @param {Object} snapshot - State snapshot
     */
    function pushToUndo(snapshot) {
      if (isRestoring) return;

      undoStack.push(snapshot);

      // Limit stack size
      if (undoStack.length > opts.maxHistory) {
        undoStack.shift();
      }

      // Clear redo stack on new action
      redoStack.length = 0;

      emitHistoryChange();
    }

    /**
     * Emit history:change event
     */
    function emitHistoryChange() {
      eventBus.emit('history:change', {
        canUndo: undoStack.length > 0,
        canRedo: redoStack.length > 0,
        undoCount: undoStack.length,
        redoCount: redoStack.length,
      });
    }

    /**
     * Restore a snapshot to current state
     * @param {Object} snapshot - Snapshot to restore
     */
    function restoreSnapshot(snapshot) {
      isRestoring = true;

      // Update state with cloned data
      stateManager.setState(
        {
          data: cloneData(snapshot.data),
          rows: cloneData(snapshot.rows),
          sort: [...snapshot.sort],
          filters: { ...snapshot.filters },
          globalFilter: snapshot.globalFilter,
          selected: new Set(snapshot.selected),
        },
        { track: false, silent: true }
      );

      // Re-render table
      table.render();

      isRestoring = false;
    }

    // =========================================================================
    // UNDO / REDO
    // =========================================================================

    /**
     * Undo last action
     * @returns {boolean} Success
     */
    function undo() {
      if (undoStack.length === 0) return false;

      // Save current state to redo stack BEFORE restoring
      const currentSnapshot = createSnapshot('redo-point');
      redoStack.push(currentSnapshot);

      // Pop and restore from undo stack
      const snapshot = undoStack.pop();
      restoreSnapshot(snapshot);

      // Emit events
      eventBus.emit('undo', {
        action: snapshot._action,
        timestamp: snapshot._timestamp,
      });
      emitHistoryChange();

      return true;
    }

    /**
     * Redo last undone action
     * @returns {boolean} Success
     */
    function redo() {
      if (redoStack.length === 0) return false;

      // Save current state to undo stack BEFORE restoring
      const currentSnapshot = createSnapshot('undo-point');
      undoStack.push(currentSnapshot);

      // Pop and restore from redo stack
      const snapshot = redoStack.pop();
      restoreSnapshot(snapshot);

      // Emit events
      eventBus.emit('redo', {
        action: snapshot._action,
        timestamp: snapshot._timestamp,
      });
      emitHistoryChange();

      return true;
    }

    function canUndo() {
      return undoStack.length > 0;
    }

    function canRedo() {
      return redoStack.length > 0;
    }

    function clearHistory() {
      undoStack.length = 0;
      redoStack.length = 0;
      pendingSnapshot = null;
      emitHistoryChange();
      eventBus.emit('history:cleared');
    }

    function getHistory() {
      return {
        undoStack: [...undoStack],
        redoStack: [...redoStack],
        canUndo: canUndo(),
        canRedo: canRedo(),
      };
    }

    // =========================================================================
    // EVENT LISTENERS
    // =========================================================================

    // Capture snapshot BEFORE edit happens
    eventBus.on('edit:before', (data) => {
      if (isRestoring) return;
      pendingSnapshot = createSnapshot(
        `Edit [${data.rowId}][${data.columnId}]`
      );
    });

    // Edit completed - push pending snapshot
    eventBus.on('edit:end', (data) => {
      if (isRestoring) return;
      if (pendingSnapshot && data.value !== data.oldValue) {
        pushToUndo(pendingSnapshot);
      }
      pendingSnapshot = null;
    });

    // Edit cancelled - discard pending snapshot
    eventBus.on('edit:cancel', () => {
      pendingSnapshot = null;
    });

    // Optional: Track sort changes
    if (opts.trackSort) {
      eventBus.on('sort:before', () => {
        if (isRestoring) return;
        pushToUndo(createSnapshot('Sort change'));
      });
    }

    // Optional: Track filter changes
    if (opts.trackFilter) {
      eventBus.on('filter:before', () => {
        if (isRestoring) return;
        pushToUndo(createSnapshot('Filter change'));
      });
    }

    // =========================================================================
    // KEYBOARD SHORTCUTS
    // =========================================================================

    if (opts.shortcuts) {
      keyboardHandler = (e) => {
        // Skip if editing input
        if (e.target.matches('input, textarea, select')) return;

        const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
        const modifier = isMac ? e.metaKey : e.ctrlKey;

        if (!modifier) return;

        const key = e.key.toLowerCase();
        const isZ = key === 'z' || e.keyCode === 90;
        const isY = key === 'y' || e.keyCode === 89;

        // Ctrl+Z / Cmd+Z = Undo (without shift)
        if (isZ && !e.shiftKey) {
          e.preventDefault();
          e.stopPropagation();
          undo();
          return;
        }

        // Ctrl+Y / Cmd+Y = Redo
        if (isY) {
          e.preventDefault();
          e.stopPropagation();
          redo();
          return;
        }

        // Ctrl+Shift+Z / Cmd+Shift+Z = Redo
        if (isZ && e.shiftKey) {
          e.preventDefault();
          e.stopPropagation();
          redo();
          return;
        }
      };

      // Use capture phase to get event before other handlers
      document.addEventListener('keydown', keyboardHandler, true);
    }

    // =========================================================================
    // EXTEND TABLE API
    // =========================================================================

    table.undo = undo;
    table.redo = redo;
    table.canUndo = canUndo;
    table.canRedo = canRedo;
    table.clearHistory = clearHistory;
    table.getHistory = getHistory;

    // =========================================================================
    // PLUGIN INSTANCE
    // =========================================================================

    return {
      undo,
      redo,
      canUndo,
      canRedo,
      clearHistory,
      getHistory,
      destroy() {
        if (keyboardHandler) {
          document.removeEventListener('keydown', keyboardHandler, true);
        }
        undoStack.length = 0;
        redoStack.length = 0;
      },
    };
  },

  destroy(instance) {
    if (instance && typeof instance.destroy === 'function') {
      instance.destroy();
    }
  },
};

export default HistoryPlugin;
