/**
 * BWDataTable v3 - ExportPlugin
 * Export to CSV/JSON
 * 
 * Features:
 * - Export to CSV with proper escaping
 * - Export to JSON
 * - Export selected rows only or all filtered data
 * - Copy to clipboard
 */

const DEFAULTS = {
  filename: 'export',
  includeHeaders: true,
  selectedOnly: false,
};

export const ExportPlugin = {
  name: 'export',

  init(api) {
    const { eventBus, table, options: pluginOptions } = api;
    
    if (!table) {
      console.error('ExportPlugin: table is undefined');
      return;
    }
    
    const opts = { ...DEFAULTS, ...pluginOptions };

    // =========================================================================
    // HELPERS
    // =========================================================================

    function getExportData(selectedOnly = false) {
      if (selectedOnly) {
        return table.getSelected ? table.getSelected() : [];
      }
      return table.getFilteredData ? table.getFilteredData() : [];
    }

    function getColumns() {
      const state = table.getState();
      return state.columns || [];
    }

    function downloadFile(content, filename, mimeType) {
      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }

    function escapeCSV(value) {
      if (value === null || value === undefined) return '';
      const str = String(value);
      // If contains comma, newline, or quote - wrap in quotes and escape quotes
      if (str.includes(',') || str.includes('\n') || str.includes('"')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    }

    // =========================================================================
    // CSV EXPORT
    // =========================================================================

    function exportCSV(options = {}) {
      const config = { ...opts, ...options };
      const data = getExportData(config.selectedOnly);
      const columns = getColumns();

      if (data.length === 0) {
        console.warn('ExportPlugin: No data to export');
        return false;
      }

      const rows = [];

      // Headers
      if (config.includeHeaders) {
        const headers = columns.map(col => escapeCSV(col.header || col.id));
        rows.push(headers.join(','));
      }

      // Data rows
      for (const row of data) {
        const cells = columns.map(col => {
          const value = row[col.field || col.id];
          return escapeCSV(value);
        });
        rows.push(cells.join(','));
      }

      const csv = rows.join('\n');
      const filename = `${config.filename}.csv`;
      downloadFile(csv, filename, 'text/csv;charset=utf-8;');
      
      if (eventBus && eventBus.emit) {
        eventBus.emit('export:csv', { count: data.length, filename });
      }
      
      return true;
    }

    // =========================================================================
    // JSON EXPORT
    // =========================================================================

    function exportJSON(options = {}) {
      const config = { ...opts, ...options };
      const data = getExportData(config.selectedOnly);

      if (data.length === 0) {
        console.warn('ExportPlugin: No data to export');
        return false;
      }

      const json = JSON.stringify(data, null, 2);
      const filename = `${config.filename}.json`;
      downloadFile(json, filename, 'application/json');
      
      if (eventBus && eventBus.emit) {
        eventBus.emit('export:json', { count: data.length, filename });
      }
      
      return true;
    }

    // =========================================================================
    // CLIPBOARD
    // =========================================================================

    function copyToClipboard(options = {}) {
      const config = { ...opts, ...options };
      const data = getExportData(config.selectedOnly);
      const columns = getColumns();

      if (data.length === 0) {
        console.warn('ExportPlugin: No data to copy');
        return false;
      }

      const rows = [];

      if (config.includeHeaders) {
        rows.push(columns.map(col => col.header || col.id).join('\t'));
      }

      for (const row of data) {
        const cells = columns.map(col => {
          const value = row[col.field || col.id];
          return value === null || value === undefined ? '' : String(value);
        });
        rows.push(cells.join('\t'));
      }

      const text = rows.join('\n');
      
      navigator.clipboard.writeText(text).then(() => {
        if (eventBus && eventBus.emit) {
          eventBus.emit('export:clipboard', { count: data.length });
        }
      }).catch(err => {
        console.error('ExportPlugin: Failed to copy', err);
      });
      
      return true;
    }

    // =========================================================================
    // EXTEND TABLE API
    // =========================================================================

    table.exportCSV = exportCSV;
    table.exportJSON = exportJSON;
    table.copyToClipboard = copyToClipboard;

    // =========================================================================
    // RETURN PLUGIN INSTANCE
    // =========================================================================

    return {
      name: 'export',
      exportCSV,
      exportJSON,
      copyToClipboard,
      destroy() {
        delete table.exportCSV;
        delete table.exportJSON;
        delete table.copyToClipboard;
      },
    };
  },
};

export default ExportPlugin;
