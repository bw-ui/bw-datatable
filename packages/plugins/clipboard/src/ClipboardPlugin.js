/**
 * ============================================================================
 * Black & White UI Engineering
 * BWDataTable - ClipboardPlugin
 * ============================================================================
 *
 * Copy/Paste functionality for DataTable.
 *
 * Features:
 * - Copy selected rows (Ctrl+C / Cmd+C)
 * - Paste from Excel/Sheets (Ctrl+V / Cmd+V)
 * - Tab-separated format (Excel compatible)
 * - Smart paste (maps to visible columns)
 *
 * Keyboard:
 * - Ctrl+C / Cmd+C → Copy selected rows
 * - Ctrl+V / Cmd+V → Paste clipboard data
 *
 * Events Emitted:
 * - clipboard:copy   → After copy
 * - clipboard:paste  → After paste
 *
 * @module plugins/clipboard/ClipboardPlugin
 * @version 1.0.0
 * @license MIT
 * ============================================================================
 */

const DEFAULTS = {
  shortcuts: true,
  copyHeaders: false,
  pasteMode: 'replace', // 'replace' | 'append'
};

export const ClipboardPlugin = {
  name: 'clipboard',

  init(api) {
    const { eventBus, table, getState, options: pluginOptions } = api;
    const opts = { ...DEFAULTS, ...pluginOptions };

    /** @type {Function|null} - Keyboard handler reference */
    let keyboardHandler = null;

    // =========================================================================
    // HELPER FUNCTIONS
    // =========================================================================

    /**
     * Get cell value for copy
     * @param {Object} row - Row data
     * @param {Object} column - Column definition
     * @returns {string} Cell value as string
     */
    function getCellValue(row, column) {
      const field = column.field || column.id;
      let value;

      if (field.includes('.')) {
        value = field.split('.').reduce((obj, key) => obj?.[key], row);
      } else {
        value = row[field];
      }

      return value == null ? '' : String(value);
    }

    /**
     * Parse clipboard text to rows
     * @param {string} text - Clipboard text
     * @returns {Array<Array<string>>} Parsed rows
     */
    function parseClipboardText(text) {
      const lines = text.trim().split(/\r?\n/);
      return lines.map((line) => line.split('\t'));
    }

    // =========================================================================
    // COPY
    // =========================================================================

    /**
     * Copy selected rows to clipboard
     * @param {Object} copyOpts - Copy options
     * @returns {Promise<boolean>} Success
     */
    async function copy(copyOpts = {}) {
      const mergedOpts = { ...opts, ...copyOpts };
      const selected = table.getSelected();

      if (selected.length === 0) {
        console.warn('ClipboardPlugin: No rows selected');
        return false;
      }

      const columns = table.getVisibleColumns();
      const lines = [];

      // Headers
      if (mergedOpts.copyHeaders) {
        const headerRow = columns.map((col) => col.header || col.id);
        lines.push(headerRow.join('\t'));
      }

      // Data rows
      selected.forEach((row) => {
        const rowData = columns.map((col) => getCellValue(row, col));
        lines.push(rowData.join('\t'));
      });

      const content = lines.join('\n');

      try {
        await navigator.clipboard.writeText(content);

        eventBus.emit('clipboard:copy', {
          rowCount: selected.length,
          content,
        });

        return true;
      } catch (err) {
        console.error('ClipboardPlugin: Copy failed', err);
        return false;
      }
    }

    // =========================================================================
    // PASTE
    // =========================================================================

    /**
     * Paste clipboard data into table
     * @param {Object} pasteOpts - Paste options
     * @returns {Promise<boolean>} Success
     */
    async function paste(pasteOpts = {}) {
      const mergedOpts = { ...opts, ...pasteOpts };

      let text;
      try {
        text = await navigator.clipboard.readText();
      } catch (err) {
        console.error(
          'ClipboardPlugin: Paste failed - clipboard access denied',
          err
        );
        return false;
      }

      if (!text.trim()) {
        console.warn('ClipboardPlugin: Clipboard is empty');
        return false;
      }

      const parsedRows = parseClipboardText(text);
      const columns = table.getVisibleColumns();
      const state = getState();

      // Emit before event (can cancel)
      const result = eventBus.emit('clipboard:before-paste', {
        parsedRows,
        columns,
      });

      if (result === false) return false;

      // Convert parsed rows to data objects
      const newRows = parsedRows.map((cells) => {
        const row = {};
        columns.forEach((col, index) => {
          if (index < cells.length) {
            const field = col.field || col.id;
            let value = cells[index];

            // Type conversion - only if valid
            if (col.type === 'number') {
              const num = parseFloat(value);
              value = isNaN(num) ? value : num;
            } else if (col.type === 'boolean') {
              const lower = value.toLowerCase();
              if (
                lower === 'true' ||
                lower === 'false' ||
                value === '1' ||
                value === '0' ||
                value === '✓'
              ) {
                value = lower === 'true' || value === '1' || value === '✓';
              }
            }

            // Handle nested fields
            if (field.includes('.')) {
              const keys = field.split('.');
              let obj = row;
              for (let i = 0; i < keys.length - 1; i++) {
                obj[keys[i]] = obj[keys[i]] || {};
                obj = obj[keys[i]];
              }
              obj[keys[keys.length - 1]] = value;
            } else {
              row[field] = value;
            }
          }
        });

        // Generate ID if needed
        if (!row.id) {
          row.id = `paste_${Date.now()}_${Math.random()
            .toString(36)
            .slice(2, 9)}`;
        }

        return row;
      });

      // Apply paste
      let updatedData;
      if (mergedOpts.pasteMode === 'append') {
        updatedData = [...state.data, ...newRows];
      } else {
        // Replace mode - replace selected rows or append if none selected
        const selectedIds = new Set(table.getSelectedIds());
        if (selectedIds.size > 0) {
          // Remove selected rows and add new ones
          updatedData = state.data.filter((row) => {
            const rowId = row.id || row.__bw_id;
            return !selectedIds.has(String(rowId));
          });
          updatedData = [...updatedData, ...newRows];
        } else {
          updatedData = [...state.data, ...newRows];
        }
      }

      // Update table
      table.setData(updatedData);

      eventBus.emit('clipboard:paste', {
        rowCount: newRows.length,
        rows: newRows,
        mode: mergedOpts.pasteMode,
      });

      return true;
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

        // Ctrl+C / Cmd+C = Copy
        if (key === 'c' || e.keyCode === 67) {
          e.preventDefault();
          e.stopPropagation();
          setTimeout(() => copy(), 10); // Small delay
          return;
        }

        // Ctrl+V / Cmd+V = Paste
        if (key === 'v' || e.keyCode === 86) {
          e.preventDefault();
          e.stopPropagation();
          paste();
          return;
        }
      };

      document.addEventListener('keydown', keyboardHandler, true);
    }

    // =========================================================================
    // EXTEND TABLE API
    // =========================================================================

    table.copy = copy;
    table.paste = paste;

    // =========================================================================
    // PLUGIN INSTANCE
    // =========================================================================

    return {
      copy,
      paste,
      destroy() {
        if (keyboardHandler) {
          document.removeEventListener('keydown', keyboardHandler, true);
        }
      },
    };
  },

  destroy(instance) {
    if (instance && typeof instance.destroy === 'function') {
      instance.destroy();
    }
  },
};

export default ClipboardPlugin;
