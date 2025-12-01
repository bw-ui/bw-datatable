/**
 * ============================================================================
 * Black & White UI Engineering
 * BWDataTable - ExportPlugin
 * ============================================================================
 *
 * Export functionality for DataTable.
 *
 * Features:
 * - Export to JSON
 * - Export to CSV
 * - Copy to clipboard
 * - Selected rows only option
 * - Visible columns only option
 *
 * Events from Core:
 * - Uses table.getData(), table.getSelected(), table.getVisibleColumns()
 *
 * Events Emitted:
 * - export:before  → Before export (can cancel)
 * - export:after   → After export complete
 *
 * @module plugins/export/ExportPlugin
 * @version 1.0.0
 * @license MIT
 * ============================================================================
 */

const DEFAULTS = {
  filename: 'data',
  includeHeaders: true,
  selectedOnly: false,
  visibleOnly: true,
  csvDelimiter: ',',
  csvQuote: '"',
};

export const ExportPlugin = {
  name: 'export',

  init(api) {
    const { eventBus, table, getState, options: pluginOptions } = api;
    const opts = { ...DEFAULTS, ...pluginOptions };

    // =========================================================================
    // HELPER FUNCTIONS
    // =========================================================================

    /**
     * Get rows to export based on options
     * @param {Object} exportOpts - Export options
     * @returns {Array} Rows to export
     */
    function getRows(exportOpts) {
      const useSelected = exportOpts.selectedOnly ?? opts.selectedOnly;
      return useSelected ? table.getSelected() : table.getData();
    }

    /**
     * Get columns to export based on options
     * @param {Object} exportOpts - Export options
     * @returns {Array} Columns to export
     */
    function getColumns(exportOpts) {
      const useVisible = exportOpts.visibleOnly ?? opts.visibleOnly;
      const state = getState();
      
      if (useVisible) {
        return table.getVisibleColumns();
      }
      return state.columns;
    }

    /**
     * Get cell value for export
     * @param {Object} row - Row data
     * @param {Object} column - Column definition
     * @returns {*} Cell value
     */
    function getCellValue(row, column) {
      // Use field path or column id
      const field = column.field || column.id;
      
      if (field.includes('.')) {
        // Nested field
        return field.split('.').reduce((obj, key) => obj?.[key], row);
      }
      
      return row[field];
    }

    /**
     * Download file
     * @param {string} content - File content
     * @param {string} filename - Filename
     * @param {string} mimeType - MIME type
     */
    function downloadFile(content, filename, mimeType) {
      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      
      link.href = url;
      link.download = filename;
      link.style.display = 'none';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      URL.revokeObjectURL(url);
    }

    /**
     * Escape CSV value
     * @param {*} value - Value to escape
     * @param {string} delimiter - CSV delimiter
     * @param {string} quote - Quote character
     * @returns {string} Escaped value
     */
    function escapeCSV(value, delimiter, quote) {
      if (value == null) return '';
      
      const str = String(value);
      
      // Check if escaping needed
      if (str.includes(quote) || str.includes(delimiter) || str.includes('\n') || str.includes('\r')) {
        return quote + str.replace(new RegExp(quote, 'g'), quote + quote) + quote;
      }
      
      return str;
    }

    // =========================================================================
    // EXPORT FUNCTIONS
    // =========================================================================

    /**
     * Export to JSON
     * @param {Object} exportOpts - Override options
     * @returns {boolean} Success
     */
    function exportJSON(exportOpts = {}) {
      const mergedOpts = { ...opts, ...exportOpts };
      const rows = getRows(mergedOpts);
      const columns = getColumns(mergedOpts);
      
      // Emit before event
      const result = eventBus.emit('export:before', {
        format: 'json',
        rows,
        columns,
        options: mergedOpts,
      });
      
      if (result === false) return false;
      
      // Build export data
      const data = rows.map(row => {
        const obj = {};
        columns.forEach(col => {
          obj[col.id] = getCellValue(row, col);
        });
        return obj;
      });
      
      // Download
      const content = JSON.stringify(data, null, 2);
      const filename = `${mergedOpts.filename}.json`;
      downloadFile(content, filename, 'application/json');
      
      // Emit after event
      eventBus.emit('export:after', {
        format: 'json',
        filename,
        rowCount: data.length,
      });
      
      return true;
    }

    /**
     * Export to CSV
     * @param {Object} exportOpts - Override options
     * @returns {boolean} Success
     */
    function exportCSV(exportOpts = {}) {
      const mergedOpts = { ...opts, ...exportOpts };
      const rows = getRows(mergedOpts);
      const columns = getColumns(mergedOpts);
      const delimiter = mergedOpts.csvDelimiter;
      const quote = mergedOpts.csvQuote;
      
      // Emit before event
      const result = eventBus.emit('export:before', {
        format: 'csv',
        rows,
        columns,
        options: mergedOpts,
      });
      
      if (result === false) return false;
      
      // Build CSV lines
      const lines = [];
      
      // Headers
      if (mergedOpts.includeHeaders) {
        const headerRow = columns.map(col => escapeCSV(col.header || col.id, delimiter, quote));
        lines.push(headerRow.join(delimiter));
      }
      
      // Data rows
      rows.forEach(row => {
        const rowData = columns.map(col => escapeCSV(getCellValue(row, col), delimiter, quote));
        lines.push(rowData.join(delimiter));
      });
      
      // Download
      const content = lines.join('\n');
      const filename = `${mergedOpts.filename}.csv`;
      downloadFile(content, filename, 'text/csv;charset=utf-8;');
      
      // Emit after event
      eventBus.emit('export:after', {
        format: 'csv',
        filename,
        rowCount: rows.length,
      });
      
      return true;
    }

    /**
     * Copy to clipboard
     * @param {Object} exportOpts - Override options
     * @returns {Promise<boolean>} Success
     */
    async function copyToClipboard(exportOpts = {}) {
      const mergedOpts = { ...opts, ...exportOpts };
      const rows = getRows(mergedOpts);
      const columns = getColumns(mergedOpts);
      
      // Emit before event
      const result = eventBus.emit('export:before', {
        format: 'clipboard',
        rows,
        columns,
        options: mergedOpts,
      });
      
      if (result === false) return false;
      
      // Build tab-separated text (Excel compatible)
      const lines = [];
      
      // Headers
      if (mergedOpts.includeHeaders) {
        const headerRow = columns.map(col => col.header || col.id);
        lines.push(headerRow.join('\t'));
      }
      
      // Data rows
      rows.forEach(row => {
        const rowData = columns.map(col => {
          const value = getCellValue(row, col);
          return value == null ? '' : String(value);
        });
        lines.push(rowData.join('\t'));
      });
      
      const content = lines.join('\n');
      
      // Copy to clipboard
      try {
        await navigator.clipboard.writeText(content);
        
        // Emit after event
        eventBus.emit('export:after', {
          format: 'clipboard',
          rowCount: rows.length,
        });
        
        return true;
      } catch (err) {
        console.error('Failed to copy to clipboard:', err);
        return false;
      }
    }

    /**
     * Get export data as object (for custom processing)
     * @param {Object} exportOpts - Override options
     * @returns {Object} Export data
     */
    function getExportData(exportOpts = {}) {
      const mergedOpts = { ...opts, ...exportOpts };
      const rows = getRows(mergedOpts);
      const columns = getColumns(mergedOpts);
      
      return {
        rows,
        columns,
        data: rows.map(row => {
          const obj = {};
          columns.forEach(col => {
            obj[col.id] = getCellValue(row, col);
          });
          return obj;
        }),
      };
    }

    // =========================================================================
    // EXTEND TABLE API
    // =========================================================================

    table.exportJSON = exportJSON;
    table.exportCSV = exportCSV;
    table.copyToClipboard = copyToClipboard;
    table.getExportData = getExportData;

    // =========================================================================
    // PLUGIN INSTANCE
    // =========================================================================

    return {
      exportJSON,
      exportCSV,
      copyToClipboard,
      getExportData,
    };
  },

  destroy(instance) {
    // No cleanup needed
  },
};

export default ExportPlugin;
