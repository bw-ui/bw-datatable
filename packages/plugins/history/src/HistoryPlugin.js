/**
 * BWDataTable v3 - HistoryPlugin
 * Undo/Redo functionality
 *
 * Features:
 * - Ctrl+Z / Cmd+Z to undo
 * - Ctrl+Y / Cmd+Y to redo
 * - Ctrl+Shift+Z / Cmd+Shift+Z to redo
 * - Configurable history limit
 */

const DEFAULTS = {
  maxHistory: 50,
  shortcuts: true,
};

export const HistoryPlugin = {
  name: 'history',

  init(api) {
    const { eventBus, table, options: pluginOptions } = api;

    if (!table) {
      console.error('HistoryPlugin: table is undefined');
      return;
    }

    const opts = { ...DEFAULTS, ...pluginOptions };

    // State
    const undoStack = [];
    const redoStack = [];
    let isRestoring = false;
    let keyboardHandler = null;

    // =========================================================================
    // SNAPSHOT FUNCTIONS
    // =========================================================================

    function cloneData(data) {
      try {
        return JSON.parse(JSON.stringify(data));
      } catch (e) {
        console.error('HistoryPlugin: Failed to clone data', e);
        return data;
      }
    }

    function createSnapshot(action) {
      const state = table.getState();
      return {
        data: cloneData(state.data),
        sort: state.sort
          ? { ...state.sort }
          : { column: null, direction: null },
        globalFilter: state.globalFilter || '',
        selected: [...(state.selected || [])],
        _action: action,
        _timestamp: Date.now(),
      };
    }

    function pushToUndo(snapshot) {
      if (isRestoring) return;

      undoStack.push(snapshot);

      if (undoStack.length > opts.maxHistory) {
        undoStack.shift();
      }

      // Clear redo stack on new action
      redoStack.length = 0;
      emitHistoryChange();
    }

    function emitHistoryChange() {
      if (eventBus && eventBus.emit) {
        eventBus.emit('history:change', {
          canUndo: undoStack.length > 0,
          canRedo: redoStack.length > 0,
          undoCount: undoStack.length,
          redoCount: redoStack.length,
        });
      }
    }

    function restoreSnapshot(snapshot) {
      isRestoring = true;

      try {
        // Restore data
        if (table.setData) {
          table.setData(cloneData(snapshot.data));
        }

        // Restore sort if exists
        if (snapshot.sort && snapshot.sort.column && table.sort) {
          table.sort(snapshot.sort.column, snapshot.sort.direction);
        }

        // Restore filter
        if (snapshot.globalFilter && table.filter) {
          table.filter(snapshot.globalFilter);
        }
      } catch (e) {
        console.error('HistoryPlugin: Failed to restore snapshot', e);
      }

      isRestoring = false;
    }

    // =========================================================================
    // UNDO / REDO
    // =========================================================================

    function undo() {
      if (undoStack.length === 0) return false;

      // Save current state to redo stack
      const currentSnapshot = createSnapshot('redo-point');
      redoStack.push(currentSnapshot);

      // Pop and restore from undo stack
      const snapshot = undoStack.pop();
      restoreSnapshot(snapshot);

      if (eventBus && eventBus.emit) {
        eventBus.emit('history:undo', { action: snapshot._action });
      }
      emitHistoryChange();

      return true;
    }

    function redo() {
      if (redoStack.length === 0) return false;

      // Save current state to undo stack
      const currentSnapshot = createSnapshot('undo-point');
      undoStack.push(currentSnapshot);

      // Pop and restore from redo stack
      const snapshot = redoStack.pop();
      restoreSnapshot(snapshot);

      if (eventBus && eventBus.emit) {
        eventBus.emit('history:redo', { action: snapshot._action });
      }
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
      emitHistoryChange();

      if (eventBus && eventBus.emit) {
        eventBus.emit('history:clear');
      }
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
    // EVENT LISTENERS - Capture snapshots before changes
    // =========================================================================

    if (eventBus && eventBus.on) {
      // Listen for cell edits
      eventBus.on('cell:edit:start', (data) => {
        if (isRestoring) return;
        console.log(
          '[History] cell:edit:start - pushing snapshot for:',
          data.columnId
        );
        pushToUndo(createSnapshot(`Edit ${data.columnId}`));
      });

      // Listen for selection changes
      eventBus.on('selection:change', (data) => {
        if (isRestoring) return;
        // Only track if significant change (not just clicking same row)
        if (data.count !== undefined) {
          console.log(
            '[History] selection:change - pushing snapshot, count:',
            data.count
          );
          pushToUndo(createSnapshot(`Selection (${data.count} rows)`));
        }
      });

      // Legacy event support
      eventBus.on('edit:before', (data) => {
        if (isRestoring) return;
        console.log('[History] edit:before - pushing snapshot');
        pushToUndo(createSnapshot(`Edit cell`));
      });

      // Listen for row updates
      eventBus.on('row:update', (data) => {
        // Snapshot already pushed before edit started
      });
    }

    // =========================================================================
    // KEYBOARD SHORTCUTS
    // =========================================================================

    if (opts.shortcuts) {
      keyboardHandler = (e) => {
        const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
        const modifier = isMac ? e.metaKey : e.ctrlKey;

        if (!modifier) return;

        const key = e.key.toLowerCase();

        // Ctrl+Z / Cmd+Z = Undo (without shift)
        if (key === 'z' && !e.shiftKey) {
          e.preventDefault();
          e.stopPropagation();
          console.log(
            '[History] Undo triggered, stack size:',
            undoStack.length
          );
          const result = undo();
          console.log('[History] Undo result:', result);
          return;
        }

        // Ctrl+Y / Cmd+Y = Redo
        if (key === 'y') {
          e.preventDefault();
          e.stopPropagation();
          console.log(
            '[History] Redo (Y) triggered, stack size:',
            redoStack.length
          );
          redo();
          return;
        }

        // Ctrl+Shift+Z / Cmd+Shift+Z = Redo
        if (key === 'z' && e.shiftKey) {
          e.preventDefault();
          e.stopPropagation();
          console.log(
            '[History] Redo (Shift+Z) triggered, stack size:',
            redoStack.length
          );
          redo();
          return;
        }
      };

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
    // RETURN PLUGIN INSTANCE
    // =========================================================================

    return {
      name: 'history',
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
        delete table.undo;
        delete table.redo;
        delete table.canUndo;
        delete table.canRedo;
        delete table.clearHistory;
        delete table.getHistory;
      },
    };
  },
};

export default HistoryPlugin;
