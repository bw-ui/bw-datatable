/**
 * BWDataTable v3 - ClipboardPlugin
 * Copy/Paste with Excel compatibility
 *
 * Features:
 * - Ctrl+C / Cmd+C to copy selected rows
 * - Ctrl+V / Cmd+V to paste
 * - Tab-separated format (Excel compatible)
 */

const DEFAULTS = {
  copyHeaders: true,
  shortcuts: true,
};

export const ClipboardPlugin = {
  name: 'clipboard',

  init(api) {
    const { eventBus, table, options: pluginOptions } = api;

    if (!table) {
      console.error('ClipboardPlugin: table is undefined');
      return;
    }

    const opts = { ...DEFAULTS, ...pluginOptions };
    let keyboardHandler = null;

    // =========================================================================
    // COPY
    // =========================================================================

    function copy(selectedOnly = true) {
      const state = table.getState();
      const columns = state.columns || [];

      let data;
      if (selectedOnly) {
        const selected = table.getSelected ? table.getSelected() : [];
        data = selected;
        console.log('[Clipboard] Copying selected rows:', data.length);
      } else {
        data = table.getFilteredData ? table.getFilteredData() : [];
        console.log('[Clipboard] Copying all rows:', data.length);
      }

      if (!data || data.length === 0) {
        console.warn('[Clipboard] No data to copy - select some rows first!');
        return false;
      }

      const rows = [];

      // Headers
      if (opts.copyHeaders) {
        const headerRow = columns.map((col) => col.header || col.id).join('\t');
        rows.push(headerRow);
      }

      // Data rows
      for (const row of data) {
        const cells = columns.map((col) => {
          const value = row[col.field || col.id];
          if (value === null || value === undefined) return '';
          return String(value).replace(/\t/g, ' ').replace(/\n/g, ' ');
        });
        rows.push(cells.join('\t'));
      }

      const text = rows.join('\n');

      navigator.clipboard
        .writeText(text)
        .then(() => {
          console.log('[Clipboard] Copied to clipboard!');
          if (eventBus && eventBus.emit) {
            eventBus.emit('clipboard:copy', { count: data.length, text });
          }
        })
        .catch((err) => {
          console.error('[Clipboard] Failed to copy:', err);
        });

      return true;
    }

    // =========================================================================
    // PASTE
    // =========================================================================

    function paste() {
      navigator.clipboard
        .readText()
        .then((text) => {
          if (!text || !text.trim()) {
            console.log('[Clipboard] Nothing to paste');
            return;
          }

          const state = table.getState();
          const columns = state.columns || [];

          const lines = text.trim().split('\n');
          const parsedRows = [];

          // Check if first row is headers (matches our columns)
          let startIndex = 0;
          const firstLine = lines[0].split('\t');
          const headerMatch = columns.every((col, i) => {
            const header = col.header || col.id;
            return (
              firstLine[i] &&
              firstLine[i].trim().toLowerCase() === header.toLowerCase()
            );
          });

          if (headerMatch) {
            startIndex = 1; // Skip header row
            console.log('[Clipboard] Detected header row, skipping');
          }

          // Parse data rows
          for (let i = startIndex; i < lines.length; i++) {
            const cells = lines[i].split('\t');
            const rowData = {};

            columns.forEach((col, colIndex) => {
              const field = col.field || col.id;
              let value = cells[colIndex] || '';

              // Type conversion
              if (col.type === 'number') {
                const num = parseFloat(value.replace(/,/g, ''));
                value = isNaN(num) ? 0 : num;
              } else if (col.type === 'boolean') {
                value =
                  value.toLowerCase() === 'true' ||
                  value === '1' ||
                  value === '✓';
              }

              rowData[field] = value;
            });

            // Generate ID if needed
            if (!rowData.id) {
              rowData.id = `pasted_${Date.now()}_${i}`;
            }

            parsedRows.push(rowData);
          }

          console.log('[Clipboard] Parsed rows to paste:', parsedRows.length);

          if (parsedRows.length === 0) {
            console.log('[Clipboard] No valid rows to paste');
            return;
          }

          // Add rows to table
          const currentData = table.getData ? table.getData() : [];
          const newData = [...currentData, ...parsedRows];

          if (table.setData) {
            table.setData(newData);
            console.log(
              '[Clipboard] Added',
              parsedRows.length,
              'rows to table'
            );
          }

          if (eventBus && eventBus.emit) {
            eventBus.emit('clipboard:paste', {
              rows: parsedRows,
              count: parsedRows.length,
              text,
            });
          }
        })
        .catch((err) => {
          console.error('[Clipboard] Failed to paste:', err);
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

        // Ctrl+C / Cmd+C = Copy
        if (key === 'c' && !e.shiftKey) {
          // Allow copy even in inputs for now, but prefer selected rows
          e.preventDefault();
          e.stopPropagation();
          console.log('[Clipboard] Copy triggered');
          copy(true);
          return;
        }

        // Ctrl+V / Cmd+V = Paste
        if (key === 'v' && !e.shiftKey) {
          // Skip paste if in input (let browser handle)
          if (e.target.matches('input, textarea, select, [contenteditable]'))
            return;

          e.preventDefault();
          e.stopPropagation();
          console.log('[Clipboard] Paste triggered');
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
    table.copyAll = () => copy(false);

    // =========================================================================
    // RETURN PLUGIN INSTANCE
    // =========================================================================

    return {
      name: 'clipboard',
      copy,
      paste,
      copyAll: () => copy(false),
      destroy() {
        if (keyboardHandler) {
          document.removeEventListener('keydown', keyboardHandler, true);
        }
        delete table.copy;
        delete table.paste;
        delete table.copyAll;
      },
    };
  },
};

export default ClipboardPlugin;
