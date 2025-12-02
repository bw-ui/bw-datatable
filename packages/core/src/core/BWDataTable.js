/**
 * BWDataTable v3.0
 *
 * Simple, fast, virtual scrolling data table.
 *
 * Architecture:
 * - Data: Plain array in memory (100k rows = ~10MB, fine)
 * - DOM: Only renders visible rows + buffer (~70 rows)
 * - Scroll: Recalculate window, update DOM
 * - Sort/Filter: Direct array operations, then re-render window
 */

class BWDataTable {
  // ==========================================================================
  // PRIVATE FIELDS
  // ==========================================================================

  /** @type {HTMLElement} */
  #container = null;

  /** @type {Array} Raw data array */
  #data = [];

  /** @type {Array} Filtered/sorted view (indices into #data) */
  #view = [];

  /** @type {Array} Column definitions */
  #columns = [];

  /** @type {Object} Options */
  #options = {};

  /** @type {Set<string>} Selected row IDs */
  #selected = new Set();

  /** @type {Object} Current sort state */
  #sort = { column: null, direction: null };

  /** @type {string} Current global filter */
  #globalFilter = '';

  /** @type {Object} Column filters */
  #columnFilters = {};

  // Scroll state
  #scrollTop = 0;
  #viewportHeight = 0;
  #rowHeight = 40;
  #bufferSize = 20;

  // DOM references
  #wrapper = null;
  #table = null;
  #thead = null;
  #tbody = null;
  #scrollContainer = null;
  #heightSpacer = null;

  // Current render range
  #renderedRange = { start: 0, end: 0 };

  // Event callbacks
  #eventHandlers = {};

  // Plugins
  #plugins = [];

  // ==========================================================================
  // CONSTRUCTOR
  // ==========================================================================

  /**
   * @param {string|HTMLElement} selector - Container selector or element
   * @param {Object} options - Configuration options
   */
  constructor(selector, options = {}) {
    // Get container
    this.#container =
      typeof selector === 'string'
        ? document.querySelector(selector)
        : selector;

    if (!this.#container) {
      throw new Error(`BWDataTable: Container "${selector}" not found`);
    }

    // Default options
    this.#options = {
      data: [],
      columns: null, // Auto-detect if not provided
      rowHeight: 40, // Fixed row height in pixels
      bufferSize: 20, // Extra rows above/below viewport
      rowId: 'id', // Field to use as row ID
      sortable: true,
      filterable: true,
      selectable: true,
      editable: true, // Enable inline cell editing
      resizable: true,
      ...options,
    };

    this.#rowHeight = this.#options.rowHeight;
    this.#bufferSize = this.#options.bufferSize;

    // Editing state
    this.#editingCell = null; // { rowId, columnId, rowIndex, colIndex }
    this.#focusedCell = null; // { rowIndex, colIndex }

    // Initialize
    this.#init();
  }

  // Editing state
  #editingCell = null;
  #focusedCell = null;
  #skipBlurSave = false;

  // Column resizing state
  #columnWidths = new Map();
  #resizing = null; // { columnId, startX, startWidth }

  // Threshold for showing loader
  #loaderThreshold = 10000;

  // Loader element
  #loader = null;

  // ==========================================================================
  // LOADER
  // ==========================================================================

  #createLoader() {
    this.#loader = document.createElement('div');
    this.#loader.className = 'bw-datatable__loading';
    this.#loader.innerHTML = '<div class="bw-datatable__spinner"></div>';
    this.#wrapper.appendChild(this.#loader);
  }

  #showLoader() {
    if (this.#loader) {
      this.#loader.classList.add('bw-datatable__loading--visible');
    }
  }

  #hideLoader() {
    if (this.#loader) {
      this.#loader.classList.remove('bw-datatable__loading--visible');
    }
  }

  /**
   * Execute operation with loader if data is large
   * @param {Function} operation - The operation to run
   */
  #withLoader(operation) {
    const needsLoader = this.#data.length > this.#loaderThreshold;

    if (needsLoader) {
      this.#showLoader();
      // Use setTimeout to let loader paint first
      setTimeout(() => {
        operation();
        this.#hideLoader();
      }, 10);
    } else {
      // Small data - just run directly
      operation();
    }
  }

  // ==========================================================================
  // INITIALIZATION
  // ==========================================================================

  #init() {
    // 1. Load data
    this.#data = this.#options.data || [];

    // 2. Create initial view (all rows, original order)
    this.#view = this.#data.map((_, i) => i);

    // 3. Auto-detect columns if not provided
    this.#columns = this.#options.columns || this.#autoDetectColumns();

    // 4. Create DOM structure
    this.#createDOM();

    // 5. Create loader
    this.#createLoader();

    // 6. Bind events
    this.#bindEvents();

    // 7. Initial render
    this.#calculateViewport();
    this.#render(true);
  }

  #autoDetectColumns() {
    if (this.#data.length === 0) return [];

    const firstRow = this.#data[0];
    return Object.keys(firstRow).map((key) => ({
      id: key,
      field: key,
      header: this.#formatHeader(key),
      type: this.#detectType(firstRow[key]),
      sortable: true,
      filterable: true,
    }));
  }

  #formatHeader(key) {
    return key
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, (s) => s.toUpperCase())
      .replace(/_/g, ' ')
      .trim();
  }

  #detectType(value) {
    if (typeof value === 'number') return 'number';
    if (typeof value === 'boolean') return 'boolean';
    if (value instanceof Date) return 'date';
    if (typeof value === 'string' && !isNaN(Date.parse(value))) return 'date';
    return 'string';
  }

  // ==========================================================================
  // DOM CREATION
  // ==========================================================================

  #createDOM() {
    // Clear container
    this.#container.innerHTML = '';

    // Main wrapper
    this.#wrapper = document.createElement('div');
    this.#wrapper.className = 'bw-datatable';

    // Toolbar
    if (this.#options.filterable) {
      const toolbar = document.createElement('div');
      toolbar.className = 'bw-datatable__toolbar';
      toolbar.innerHTML = `
        <input type="text" 
          class="bw-datatable__search" 
          placeholder="Search...">
      `;
      this.#wrapper.appendChild(toolbar);
    }

    // Scroll container (this is what scrolls)
    this.#scrollContainer = document.createElement('div');
    this.#scrollContainer.className = 'bw-datatable__scroll-container';
    this.#scrollContainer.style.cssText = `
      height: 400px;
      overflow-y: auto;
      overflow-x: auto;
      position: relative;
    `;

    // Height spacer - creates the scrollable height (absolute, doesn't affect layout)
    this.#heightSpacer = document.createElement('div');
    this.#heightSpacer.className = 'bw-datatable__spacer';
    this.#heightSpacer.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 1px;
      pointer-events: none;
    `;

    // Table
    this.#table = document.createElement('table');
    this.#table.className = 'bw-datatable__table';
    this.#table.style.cssText = `
      width: 100%;
      border-collapse: collapse;
      position: relative;
    `;

    // Thead - sticky header
    this.#thead = document.createElement('thead');
    this.#thead.className = 'bw-datatable__header';
    this.#thead.style.cssText = `
      position: sticky;
      top: 0;
      z-index: 10;
      background: var(--bw-dt-header-bg, #f9fafb);
    `;

    // Tbody - contains visible rows only
    this.#tbody = document.createElement('tbody');
    this.#tbody.className = 'bw-datatable__body';

    // Assemble
    this.#table.appendChild(this.#thead);
    this.#table.appendChild(this.#tbody);
    this.#scrollContainer.appendChild(this.#heightSpacer);
    this.#scrollContainer.appendChild(this.#table);
    this.#wrapper.appendChild(this.#scrollContainer);
    this.#container.appendChild(this.#wrapper);

    // Render header
    this.#renderHeader();
  }

  #renderHeader() {
    let html = '<tr class="bw-datatable__header-row">';

    // Checkbox column
    if (this.#options.selectable) {
      html += `
        <th class="bw-datatable__th bw-datatable__th--checkbox" style="width:48px;">
          <input type="checkbox" class="bw-datatable__select-all">
        </th>
      `;
    }

    // Data columns
    for (const col of this.#columns) {
      const sortable = this.#options.sortable && col.sortable !== false;
      const sortClass =
        this.#sort.column === col.id
          ? `bw-datatable__th--sort-${this.#sort.direction}`
          : '';

      // Column width
      const width = this.#columnWidths.get(col.id) || col.width || 'auto';
      const widthStyle =
        width !== 'auto'
          ? `width:${typeof width === 'number' ? width + 'px' : width};`
          : '';
      const minWidth = col.minWidth || 50;
      const minWidthStyle = `min-width:${
        typeof minWidth === 'number' ? minWidth + 'px' : minWidth
      };`;

      html += `
        <th class="bw-datatable__th ${sortClass} ${
        sortable ? 'bw-datatable__th--sortable' : ''
      }"
            data-column="${col.id}"
            style="${widthStyle}${minWidthStyle}">
          <span class="bw-datatable__th-content">
            <span class="bw-datatable__th-text">${this.#escapeHtml(
              col.header || col.id
            )}</span>
            ${sortable ? '<span class="bw-datatable__th-sort"></span>' : ''}
          </span>
          ${
            this.#options.resizable !== false
              ? `<div class="bw-datatable__resize-handle" data-column="${col.id}"></div>`
              : ''
          }
        </th>
      `;
    }

    html += '</tr>';
    this.#thead.innerHTML = html;
  }

  // ==========================================================================
  // EVENT BINDING
  // ==========================================================================

  #bindEvents() {
    // Scroll event for virtual scrolling
    this.#scrollContainer.addEventListener('scroll', this.#onScroll.bind(this));

    // Resize observer for viewport
    const resizeObserver = new ResizeObserver(() => {
      this.#calculateViewport();
      this.#render();
    });
    resizeObserver.observe(this.#scrollContainer);

    // Track if we just finished resizing (to prevent sort click)
    let justResized = false;

    // Column resize handlers
    if (this.#options.resizable !== false) {
      this.#thead.addEventListener('mousedown', (e) => {
        const handle = e.target.closest('.bw-datatable__resize-handle');
        if (handle) {
          e.preventDefault();
          e.stopPropagation();
          const columnId = handle.dataset.column;
          const th = handle.closest('th');
          const startWidth = th.offsetWidth;
          const colIndex = this.#columns.findIndex((c) => c.id === columnId);

          this.#resizing = {
            columnId,
            startX: e.clientX,
            startWidth,
            colIndex,
          };
          document.body.style.cursor = 'col-resize';
          document.body.style.userSelect = 'none';

          // Add class to table for visual feedback
          this.#container.classList.add('bw-datatable--resizing');
        }
      });

      // Double-click to reset column width
      this.#thead.addEventListener('dblclick', (e) => {
        const handle = e.target.closest('.bw-datatable__resize-handle');
        if (handle) {
          e.preventDefault();
          e.stopPropagation();
          const columnId = handle.dataset.column;

          // Remove stored width - column will auto-size
          this.#columnWidths.delete(columnId);

          // Clear inline styles
          const th = this.#thead.querySelector(`[data-column="${columnId}"]`);
          if (th) {
            th.style.width = '';
            th.style.minWidth = '';
          }

          // Re-render to apply
          this.#renderedRange = { start: -1, end: -1 };
          this.#render(true);

          this.#emit('column:resize:reset', { columnId });
        }
      });

      document.addEventListener('mousemove', (e) => {
        if (!this.#resizing) return;

        const { columnId, startX, startWidth, colIndex } = this.#resizing;
        const diff = e.clientX - startX;
        const col = this.#columns[colIndex];
        const minWidth = col?.minWidth || 20; // Allow very small
        const maxWidth = col?.maxWidth || 2000;

        let newWidth = Math.max(
          minWidth,
          Math.min(maxWidth, startWidth + diff)
        );

        // Update header cell width directly
        const th = this.#thead.querySelector(`[data-column="${columnId}"]`);
        if (th) {
          th.style.width = `${newWidth}px`;
          th.style.minWidth = `${newWidth}px`;
        }

        // Update body cells - they have data-col-index
        const bodyCells = this.#tbody.querySelectorAll(
          `[data-col-index="${colIndex}"]`
        );
        bodyCells.forEach((cell) => {
          cell.style.width = `${newWidth}px`;
          cell.style.minWidth = `${newWidth}px`;
        });

        // Store for mouseup
        this.#resizing.newWidth = newWidth;
      });

      document.addEventListener('mouseup', () => {
        if (this.#resizing) {
          const { columnId, newWidth } = this.#resizing;

          // Save final width
          if (newWidth) {
            this.#columnWidths.set(columnId, newWidth);
          }

          this.#resizing = null;
          justResized = true;

          document.body.style.cursor = '';
          document.body.style.userSelect = '';
          this.#container.classList.remove('bw-datatable--resizing');

          // Emit event
          this.#emit('column:resize', {
            columnId,
            width: this.#columnWidths.get(columnId),
          });

          // Reset flag after a short delay
          setTimeout(() => {
            justResized = false;
          }, 100);
        }
      });
    }

    // Header click (sort)
    this.#thead.addEventListener('click', (e) => {
      // Ignore clicks on resize handle or if we just finished resizing
      if (e.target.closest('.bw-datatable__resize-handle')) return;
      if (justResized) return;

      const th = e.target.closest('[data-column]');
      if (th && this.#options.sortable) {
        const columnId = th.dataset.column;
        const col = this.#columns.find((c) => c.id === columnId);
        if (col && col.sortable !== false) {
          this.#handleSort(columnId);
        }
      }

      // Select all checkbox
      if (e.target.classList.contains('bw-datatable__select-all')) {
        this.#handleSelectAll(e.target.checked);
      }
    });

    // Body click (row selection and cell focus)
    this.#tbody.addEventListener('click', (e) => {
      // Row checkbox
      const checkbox = e.target.closest('.bw-datatable__row-checkbox');
      if (checkbox) {
        this.#handleRowSelect(checkbox.dataset.rowId, checkbox.checked);
        return;
      }

      // Cell click for focus/editing
      const cell = e.target.closest('.bw-datatable__td');
      if (cell && !cell.classList.contains('bw-datatable__td--checkbox')) {
        const row = cell.closest('.bw-datatable__row');
        if (row && this.#options.editable) {
          const viewIndex = parseInt(row.dataset.viewIndex);
          const colIndex = Array.from(cell.parentNode.children).indexOf(cell);
          const adjustedColIndex = this.#options.selectable
            ? colIndex - 1
            : colIndex;

          // Check if clicking on already focused cell → start editing
          if (
            this.#focusedCell &&
            this.#focusedCell.rowIndex === viewIndex &&
            this.#focusedCell.colIndex === adjustedColIndex
          ) {
            this.#startEditing(viewIndex, adjustedColIndex);
          } else {
            // First click → just focus
            this.#setFocusedCell(viewIndex, adjustedColIndex);
          }
          return;
        }
      }

      // Row click for selection (only if not editable or clicking elsewhere)
      const row = e.target.closest('.bw-datatable__row');
      if (row && this.#options.selectable && !this.#options.editable) {
        const rowId = row.dataset.rowId;
        this.#handleRowSelect(rowId, !this.#selected.has(rowId));
      }
    });

    // Double-click to edit (backup)
    this.#tbody.addEventListener('dblclick', (e) => {
      if (!this.#options.editable) return;

      const cell = e.target.closest('.bw-datatable__td');
      if (cell && !cell.classList.contains('bw-datatable__td--checkbox')) {
        const row = cell.closest('.bw-datatable__row');
        if (row) {
          const colIndex = Array.from(cell.parentNode.children).indexOf(cell);
          const adjustedColIndex = this.#options.selectable
            ? colIndex - 1
            : colIndex;
          this.#startEditing(row.dataset.viewIndex, adjustedColIndex);
        }
      }
    });

    // Search input
    const searchInput = this.#wrapper.querySelector('.bw-datatable__search');
    if (searchInput) {
      let debounceTimer;
      searchInput.addEventListener('input', (e) => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
          this.filter(e.target.value);
        }, 200);
      });
    }

    // Keyboard navigation
    this.#scrollContainer.tabIndex = 0;
    this.#scrollContainer.addEventListener(
      'keydown',
      this.#onKeyDown.bind(this)
    );
  }

  #onScroll() {
    this.#scrollTop = this.#scrollContainer.scrollTop;
    this.#render();
  }

  #onKeyDown(e) {
    const totalHeight = this.#view.length * this.#rowHeight;
    const totalRows = this.#view.length;
    const totalCols = this.#columns.length;

    // If currently editing, handle edit-specific keys
    if (this.#editingCell) {
      return; // Let the input handle its own events
    }

    // Navigation with arrow keys when cell is focused
    if (this.#focusedCell) {
      const { rowIndex, colIndex } = this.#focusedCell;

      switch (e.key) {
        case 'Tab':
          e.preventDefault();
          if (e.shiftKey) {
            // Move left or up to previous row
            if (colIndex > 0) {
              this.#setFocusedCell(rowIndex, colIndex - 1);
            } else if (rowIndex > 0) {
              this.#setFocusedCell(rowIndex - 1, totalCols - 1);
            }
          } else {
            // Move right or down to next row
            if (colIndex < totalCols - 1) {
              this.#setFocusedCell(rowIndex, colIndex + 1);
            } else if (rowIndex < totalRows - 1) {
              this.#setFocusedCell(rowIndex + 1, 0);
            }
          }
          return;

        case 'Enter':
          e.preventDefault();
          if (this.#options.editable) {
            this.#startEditing(rowIndex, colIndex);
          }
          return;

        case 'ArrowUp':
          e.preventDefault();
          if (rowIndex > 0) {
            this.#setFocusedCell(rowIndex - 1, colIndex);
          }
          return;

        case 'ArrowDown':
          e.preventDefault();
          if (rowIndex < totalRows - 1) {
            this.#setFocusedCell(rowIndex + 1, colIndex);
          }
          return;

        case 'ArrowLeft':
          e.preventDefault();
          if (colIndex > 0) {
            this.#setFocusedCell(rowIndex, colIndex - 1);
          }
          return;

        case 'ArrowRight':
          e.preventDefault();
          if (colIndex < totalCols - 1) {
            this.#setFocusedCell(rowIndex, colIndex + 1);
          }
          return;

        case 'Escape':
          e.preventDefault();
          this.#clearFocusedCell();
          return;
      }
    }

    // Default scroll navigation
    switch (e.key) {
      case 'Home':
        e.preventDefault();
        this.#scrollContainer.scrollTop = 0;
        if (this.#options.editable) {
          this.#setFocusedCell(0, 0);
        }
        break;

      case 'End':
        e.preventDefault();
        this.#scrollContainer.scrollTop = totalHeight - this.#viewportHeight;
        if (this.#options.editable) {
          this.#setFocusedCell(totalRows - 1, 0);
        }
        break;

      case 'PageDown':
        e.preventDefault();
        this.#scrollContainer.scrollTop += this.#viewportHeight;
        break;

      case 'PageUp':
        e.preventDefault();
        this.#scrollContainer.scrollTop -= this.#viewportHeight;
        break;

      case 'Tab':
        // Start at first cell if no cell focused
        if (this.#options.editable && !this.#focusedCell) {
          e.preventDefault();
          this.#setFocusedCell(0, 0);
        }
        break;
    }
  }

  // ==========================================================================
  // CELL FOCUS & EDITING
  // ==========================================================================

  #setFocusedCell(rowIndex, colIndex) {
    this.#focusedCell = {
      rowIndex: parseInt(rowIndex),
      colIndex: parseInt(colIndex),
    };

    // Ensure row is visible
    this.#scrollToRowIfNeeded(this.#focusedCell.rowIndex);

    // Re-render to show focus
    this.#renderedRange = { start: -1, end: -1 }; // Force re-render
    this.#render();

    // Keep focus on scroll container for keyboard events
    this.#scrollContainer.focus();
  }

  #clearFocusedCell() {
    this.#focusedCell = null;
    this.#renderedRange = { start: -1, end: -1 };
    this.#render();
    this.#scrollContainer.focus();
  }

  #scrollToRowIfNeeded(rowIndex) {
    const rowTop = rowIndex * this.#rowHeight;
    const rowBottom = rowTop + this.#rowHeight;
    const viewTop = this.#scrollTop;
    const viewBottom = this.#scrollTop + this.#viewportHeight;

    if (rowTop < viewTop) {
      this.#scrollContainer.scrollTop = rowTop;
    } else if (rowBottom > viewBottom) {
      this.#scrollContainer.scrollTop = rowBottom - this.#viewportHeight;
    }
  }

  #getCellElement(rowIndex, colIndex) {
    const row = this.#tbody.querySelector(`[data-view-index="${rowIndex}"]`);
    if (!row) return null;

    const cells = row.querySelectorAll(
      '.bw-datatable__td:not(.bw-datatable__td--checkbox)'
    );
    return cells[colIndex] || null;
  }

  #startEditing(rowIndex, colIndex) {
    if (!this.#options.editable) return;

    rowIndex = parseInt(rowIndex);
    colIndex = parseInt(colIndex);

    const dataIndex = this.#view[rowIndex];
    if (dataIndex === undefined) return;

    const row = this.#data[dataIndex];
    const column = this.#columns[colIndex];

    if (!row || !column) return;
    if (column.editable === false) return;

    const rowId = this.#getRowId(row, dataIndex);
    const currentValue = row[column.field || column.id];

    this.#editingCell = {
      rowId,
      rowIndex,
      colIndex,
      dataIndex,
      columnId: column.id,
      field: column.field || column.id,
      originalValue: currentValue,
    };

    // Re-render to show input
    this.#renderedRange = { start: -1, end: -1 };
    this.#render();

    // Focus the input
    setTimeout(() => {
      const input = this.#tbody.querySelector('.bw-datatable__edit-input');
      if (input) {
        input.focus();
        input.select();
      }
    }, 0);

    this.#emit('cell:edit:start', {
      rowId,
      rowIndex,
      colIndex,
      columnId: column.id,
      value: currentValue,
    });
  }

  #saveEdit(newValue) {
    if (!this.#editingCell) return;

    const {
      dataIndex,
      field,
      originalValue,
      rowId,
      columnId,
      rowIndex,
      colIndex,
    } = this.#editingCell;
    const row = this.#data[dataIndex];

    // Store old value for history
    const oldValue = originalValue;

    // Update data
    row[field] = newValue;

    // Clear editing state
    this.#editingCell = null;

    // Keep focus on cell
    this.#focusedCell = { rowIndex, colIndex };

    // Re-render
    this.#renderedRange = { start: -1, end: -1 };
    this.#render();

    // Refocus scroll container for keyboard nav
    this.#scrollContainer.focus();

    // Emit event for history plugin
    this.#emit('cell:edit', {
      rowId,
      rowIndex,
      colIndex,
      columnId,
      field,
      oldValue,
      newValue,
      row: { ...row },
    });

    this.#emit('cell:edit:end', {
      rowId,
      columnId,
      oldValue,
      newValue,
    });
  }

  #cancelEdit() {
    if (!this.#editingCell) return;

    const { rowIndex, colIndex } = this.#editingCell;

    this.#editingCell = null;
    this.#focusedCell = { rowIndex, colIndex };

    this.#renderedRange = { start: -1, end: -1 };
    this.#render();

    // Refocus scroll container for keyboard nav
    this.#scrollContainer.focus();

    this.#emit('cell:edit:cancel');
  }

  #handleEditKeyDown(e) {
    if (!this.#editingCell) return;

    const input = e.target;
    const { rowIndex, colIndex } = this.#editingCell;
    const totalCols = this.#columns.length;
    const totalRows = this.#view.length;

    switch (e.key) {
      case 'Enter':
        e.preventDefault();
        e.stopPropagation();
        this.#skipBlurSave = true;
        this.#saveEdit(input.value);
        // Move to next row, stay in same column
        if (rowIndex < totalRows - 1) {
          this.#setFocusedCell(rowIndex + 1, colIndex);
        }
        this.#skipBlurSave = false;
        break;

      case 'Tab':
        e.preventDefault();
        e.stopPropagation();
        this.#skipBlurSave = true;
        this.#saveEdit(input.value);
        // Move to next/prev cell and start editing
        if (e.shiftKey) {
          if (colIndex > 0) {
            this.#startEditing(rowIndex, colIndex - 1);
          } else if (rowIndex > 0) {
            this.#startEditing(rowIndex - 1, totalCols - 1);
          } else {
            this.#setFocusedCell(rowIndex, colIndex);
          }
        } else {
          if (colIndex < totalCols - 1) {
            this.#startEditing(rowIndex, colIndex + 1);
          } else if (rowIndex < totalRows - 1) {
            this.#startEditing(rowIndex + 1, 0);
          } else {
            this.#setFocusedCell(rowIndex, colIndex);
          }
        }
        this.#skipBlurSave = false;
        break;

      case 'Escape':
        e.preventDefault();
        e.stopPropagation();
        this.#skipBlurSave = true;
        this.#cancelEdit();
        this.#skipBlurSave = false;
        break;
    }
  }

  // ==========================================================================
  // VIEWPORT CALCULATION
  // ==========================================================================

  #calculateViewport() {
    this.#viewportHeight = this.#scrollContainer.clientHeight;
  }

  #getVisibleRange() {
    const totalRows = this.#view.length;

    // Calculate visible start
    const visibleStart = Math.floor(this.#scrollTop / this.#rowHeight);
    const visibleCount = Math.ceil(this.#viewportHeight / this.#rowHeight);

    // Buffer = 100% of visible (so we render 2x visible rows total)
    const buffer = visibleCount;
    const start = Math.max(0, visibleStart - buffer);
    const end = Math.min(totalRows, visibleStart + visibleCount + buffer);

    return { start, end, visibleStart, visibleCount };
  }

  // ==========================================================================
  // RENDERING - THE CORE
  // ==========================================================================

  #render(force = false) {
    const totalRows = this.#view.length;
    const totalHeight = totalRows * this.#rowHeight;

    // Spacer creates the scrollable height
    this.#heightSpacer.style.height = `${totalHeight}px`;

    // Get visible range
    const range = this.#getVisibleRange();

    // Only skip re-render if range unchanged AND not forced
    if (
      !force &&
      range.start === this.#renderedRange.start &&
      range.end === this.#renderedRange.end
    ) {
      return;
    }

    this.#renderedRange = range;

    // Calculate offset for positioning
    const offsetY = range.start * this.#rowHeight;

    // Build rows HTML
    let html = '';

    for (let i = range.start; i < range.end; i++) {
      const dataIndex = this.#view[i];
      const row = this.#data[dataIndex];
      const rowId = this.#getRowId(row, dataIndex);
      const isSelected = this.#selected.has(rowId);

      html += `<tr class="bw-datatable__row ${
        isSelected ? 'bw-datatable__row--selected' : ''
      }" data-row-id="${rowId}" data-view-index="${i}">`;

      // Checkbox
      if (this.#options.selectable) {
        html += `
          <td class="bw-datatable__td bw-datatable__td--checkbox">
            <input type="checkbox" 
              class="bw-datatable__row-checkbox" 
              data-row-id="${rowId}"
              ${isSelected ? 'checked' : ''}>
          </td>
        `;
      }

      // Data cells
      for (let colIdx = 0; colIdx < this.#columns.length; colIdx++) {
        const col = this.#columns[colIdx];
        const value = row[col.field || col.id];

        const isFocused =
          this.#focusedCell &&
          this.#focusedCell.rowIndex === i &&
          this.#focusedCell.colIndex === colIdx;

        const isEditing =
          this.#editingCell &&
          this.#editingCell.rowIndex === i &&
          this.#editingCell.colIndex === colIdx;

        const focusClass = isFocused ? 'bw-datatable__td--focused' : '';
        const editClass = isEditing ? 'bw-datatable__td--editing' : '';

        const width = this.#columnWidths.get(col.id) || col.width;
        const widthStyle = width
          ? `width:${typeof width === 'number' ? width + 'px' : width};`
          : '';

        html += `<td class="bw-datatable__td ${focusClass} ${editClass}" 
                     tabindex="${isFocused ? '0' : '-1'}"
                     data-col-index="${colIdx}"
                     style="${widthStyle}">`;

        if (isEditing) {
          const escapedValue = this.#escapeHtml(String(value ?? ''));
          html += `<input type="text" 
                          class="bw-datatable__edit-input" 
                          value="${escapedValue.replace(/"/g, '&quot;')}"
                          data-original="${escapedValue.replace(
                            /"/g,
                            '&quot;'
                          )}">`;
        } else {
          const formatted = this.#formatValue(value, col, row);
          html += formatted;
        }

        html += '</td>';
      }

      html += '</tr>';
    }

    // Update DOM
    this.#tbody.innerHTML = html;

    // Position tbody using transform to show correct rows at scroll position
    this.#tbody.style.transform = `translateY(${offsetY}px)`;

    // Bind edit input events if editing
    if (this.#editingCell) {
      const input = this.#tbody.querySelector('.bw-datatable__edit-input');
      if (input) {
        input.addEventListener('keydown', (e) => this.#handleEditKeyDown(e));
        input.addEventListener('blur', (e) => {
          // Save on blur unless explicitly skipped (keyboard nav) or cancelled
          if (this.#editingCell && !this.#skipBlurSave) {
            this.#saveEdit(e.target.value);
          }
        });
      }
    }

    // Update header select-all checkbox
    this.#updateSelectAllCheckbox();
  }

  #getRowId(row, index) {
    const idField = this.#options.rowId;
    if (typeof idField === 'function') {
      return String(idField(row, index));
    }
    return String(row[idField] ?? `__row_${index}`);
  }

  #formatValue(value, col, row) {
    // Null/undefined
    if (value === null || value === undefined) return '';

    // Custom renderer
    if (col.render && typeof col.render === 'function') {
      return col.render(value, row, col);
    }

    // Type formatting
    switch (col.type) {
      case 'boolean':
        return value ? '✓' : '✗';
      case 'number':
        return typeof value === 'number' ? value.toLocaleString() : value;
      case 'date':
        if (value instanceof Date) return value.toLocaleDateString();
        return String(value);
      default:
        return this.#escapeHtml(String(value));
    }
  }

  #escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  // ==========================================================================
  // SORTING
  // ==========================================================================

  #handleSort(columnId) {
    // Toggle direction
    let direction = 'asc';
    if (this.#sort.column === columnId) {
      if (this.#sort.direction === 'asc') {
        direction = 'desc';
      } else if (this.#sort.direction === 'desc') {
        direction = null; // Remove sort
      }
    }

    this.sort(columnId, direction);
  }

  /**
   * Sort by column
   * @param {string} columnId - Column ID
   * @param {string|null} direction - 'asc', 'desc', or null
   */
  sort(columnId, direction = 'asc') {
    this.#sort = { column: direction ? columnId : null, direction };

    this.#withLoader(() => {
      // Rebuild view
      this.#rebuildView();

      // Re-render header (for sort indicator)
      this.#renderHeader();

      // Reset scroll and force render
      this.#scrollContainer.scrollTop = 0;
      this.#scrollTop = 0;
      this.#renderedRange = { start: -1, end: -1 };
      this.#render(true);

      this.#emit('sort', { column: columnId, direction });
      this.#emit('sort:after', { column: columnId, direction });
    });
  }

  // ==========================================================================
  // FILTERING
  // ==========================================================================

  /**
   * Filter by search term
   * @param {string} term - Search term
   */
  filter(term) {
    this.#globalFilter = term?.toLowerCase() || '';

    this.#withLoader(() => {
      // Rebuild view
      this.#rebuildView();

      // Reset scroll and force render
      this.#scrollContainer.scrollTop = 0;
      this.#scrollTop = 0;
      this.#renderedRange = { start: -1, end: -1 };
      this.#render(true);

      this.#emit('filter', { term });
      this.#emit('filter:after', { term, count: this.#view.length });
    });
  }

  /**
   * Filter by column
   * @param {string} columnId - Column ID
   * @param {*} value - Filter value
   */
  filterColumn(columnId, value) {
    if (value === '' || value === null || value === undefined) {
      delete this.#columnFilters[columnId];
    } else {
      this.#columnFilters[columnId] = value;
    }

    this.#withLoader(() => {
      this.#rebuildView();
      this.#scrollContainer.scrollTop = 0;
      this.#scrollTop = 0;
      this.#renderedRange = { start: -1, end: -1 };
      this.#render(true);
    });
  }

  /**
   * Clear all filters
   */
  clearFilters() {
    this.#globalFilter = '';
    this.#columnFilters = {};

    const searchInput = this.#wrapper.querySelector('.bw-datatable__search');
    if (searchInput) searchInput.value = '';

    this.#withLoader(() => {
      this.#rebuildView();
      this.#scrollContainer.scrollTop = 0;
      this.#scrollTop = 0;
      this.#renderedRange = { start: -1, end: -1 };
      this.#render(true);

      this.#emit('filter:clear');
    });
  }

  /**
   * Clear sort
   */
  clearSort() {
    this.#sort = { column: null, direction: null };

    this.#withLoader(() => {
      this.#rebuildView();
      this.#renderHeader();
      this.#scrollContainer.scrollTop = 0;
      this.#scrollTop = 0;
      this.#renderedRange = { start: -1, end: -1 };
      this.#render(true);

      this.#emit('sort:clear');
    });
  }

  /**
   * Reset table (clear filters and sort)
   */
  reset() {
    this.#globalFilter = '';
    this.#columnFilters = {};
    this.#sort = { column: null, direction: null };

    const searchInput = this.#wrapper.querySelector('.bw-datatable__search');
    if (searchInput) searchInput.value = '';

    this.#withLoader(() => {
      this.#rebuildView();
      this.#renderHeader();
      this.#scrollContainer.scrollTop = 0;
      this.#scrollTop = 0;
      this.#renderedRange = { start: -1, end: -1 };
      this.#render(true);

      this.#emit('reset');
    });
  }

  // ==========================================================================
  // VIEW BUILDING (Filter + Sort)
  // ==========================================================================

  #rebuildView() {
    // Start with all indices
    let indices = this.#data.map((_, i) => i);

    // Apply global filter
    if (this.#globalFilter) {
      const term = this.#globalFilter;
      indices = indices.filter((i) => {
        const row = this.#data[i];
        return this.#columns.some((col) => {
          const value = row[col.field || col.id];
          return String(value ?? '')
            .toLowerCase()
            .includes(term);
        });
      });
    }

    // Apply column filters
    for (const [columnId, filterValue] of Object.entries(this.#columnFilters)) {
      const col = this.#columns.find((c) => c.id === columnId);
      if (!col) continue;

      const field = col.field || col.id;
      const filterLower = String(filterValue).toLowerCase();

      indices = indices.filter((i) => {
        const value = this.#data[i][field];
        return String(value ?? '')
          .toLowerCase()
          .includes(filterLower);
      });
    }

    // Apply sort
    if (this.#sort.column && this.#sort.direction) {
      const col = this.#columns.find((c) => c.id === this.#sort.column);
      const field = col?.field || this.#sort.column;
      const mult = this.#sort.direction === 'asc' ? 1 : -1;
      const type = col?.type || 'string';

      indices.sort((aIdx, bIdx) => {
        const a = this.#data[aIdx][field];
        const b = this.#data[bIdx][field];

        // Null handling
        if (a == null && b == null) return 0;
        if (a == null) return 1;
        if (b == null) return -1;

        // Compare based on type
        let result;
        switch (type) {
          case 'number':
            result = Number(a) - Number(b);
            break;
          case 'date':
            result = new Date(a).getTime() - new Date(b).getTime();
            break;
          default:
            result = String(a).localeCompare(String(b));
        }

        return result * mult;
      });
    }

    this.#view = indices;
  }

  // ==========================================================================
  // SELECTION
  // ==========================================================================

  #handleRowSelect(rowId, selected) {
    if (selected) {
      this.#selected.add(rowId);
    } else {
      this.#selected.delete(rowId);
    }

    // Force re-render visible rows to update checkboxes
    this.#render(true);

    this.#emit('selection:change', {
      selected: Array.from(this.#selected),
      count: this.#selected.size,
    });
  }

  #handleSelectAll(selected) {
    this.#withLoader(() => {
      if (selected) {
        // Select all rows in current view (filtered data)
        this.#view.forEach((dataIndex) => {
          const row = this.#data[dataIndex];
          const rowId = this.#getRowId(row, dataIndex);
          this.#selected.add(rowId);
        });
      } else {
        this.#selected.clear();
      }

      // Force re-render
      this.#render(true);

      this.#emit('selection:change', {
        selected: Array.from(this.#selected),
        count: this.#selected.size,
      });
    });
  }

  #updateSelectAllCheckbox() {
    const checkbox = this.#thead.querySelector('.bw-datatable__select-all');
    if (!checkbox) return;

    const totalVisible = this.#view.length;
    const selectedVisible = this.#view.filter((dataIndex) => {
      const row = this.#data[dataIndex];
      const rowId = this.#getRowId(row, dataIndex);
      return this.#selected.has(rowId);
    }).length;

    checkbox.checked = totalVisible > 0 && selectedVisible === totalVisible;
    checkbox.indeterminate =
      selectedVisible > 0 && selectedVisible < totalVisible;
  }

  // Public selection methods
  selectAll() {
    this.#handleSelectAll(true);
  }

  clearSelection() {
    this.#selected.clear();
    this.#render(true);
    this.#emit('selection:change', { selected: [], count: 0 });
  }

  getSelected() {
    return this.#view
      .map((dataIndex) => this.#data[dataIndex])
      .filter((row) =>
        this.#selected.has(this.#getRowId(row, this.#data.indexOf(row)))
      );
  }

  getSelectedIds() {
    return Array.from(this.#selected);
  }

  // ==========================================================================
  // PUBLIC API
  // ==========================================================================

  /**
   * Set new data
   * @param {Array} data - New data array
   */
  setData(data) {
    this.#data = data || [];
    this.#selected.clear();

    // For setData, check NEW data size
    const needsLoader = this.#data.length > this.#loaderThreshold;

    if (needsLoader) {
      this.#showLoader();
      setTimeout(() => {
        this.#rebuildView();
        this.#scrollContainer.scrollTop = 0;
        this.#scrollTop = 0;
        this.#renderedRange = { start: -1, end: -1 };
        this.#render(true);
        this.#hideLoader();
      }, 10);
    } else {
      this.#rebuildView();
      this.#scrollContainer.scrollTop = 0;
      this.#scrollTop = 0;
      this.#renderedRange = { start: -1, end: -1 };
      this.#render(true);
    }
  }

  /**
   * Get all data
   * @returns {Array}
   */
  getData() {
    return this.#data;
  }

  /**
   * Get filtered data
   * @returns {Array}
   */
  getFilteredData() {
    return this.#view.map((i) => this.#data[i]);
  }

  /**
   * Get row count
   * @returns {Object} { total, filtered }
   */
  getRowCount() {
    return {
      total: this.#data.length,
      filtered: this.#view.length,
    };
  }

  /**
   * Scroll to row
   * @param {number} index - Row index
   */
  scrollToRow(index) {
    const top = index * this.#rowHeight;
    this.#scrollContainer.scrollTop = top;
  }

  /**
   * Scroll to top
   */
  scrollToTop() {
    this.#scrollContainer.scrollTop = 0;
  }

  /**
   * Scroll to bottom
   */
  scrollToBottom() {
    this.#scrollContainer.scrollTop = this.#view.length * this.#rowHeight;
  }

  /**
   * Update a cell value programmatically
   * @param {string} rowId - Row ID
   * @param {string} columnId - Column ID
   * @param {*} value - New value
   */
  updateCell(rowId, columnId, value) {
    // Find row by ID
    const dataIndex = this.#data.findIndex((row, i) => {
      return this.#getRowId(row, i) === String(rowId);
    });

    if (dataIndex === -1) return false;

    const row = this.#data[dataIndex];
    const column = this.#columns.find((c) => c.id === columnId);
    if (!column) return false;

    const field = column.field || column.id;
    const oldValue = row[field];

    row[field] = value;

    // Force re-render
    this.#renderedRange = { start: -1, end: -1 };
    this.#render(true);

    this.#emit('cell:edit', {
      rowId,
      columnId,
      field,
      oldValue,
      newValue: value,
      row: { ...row },
    });

    return true;
  }

  /**
   * Get row by ID
   * @param {string} rowId - Row ID
   * @returns {Object|null}
   */
  getRowById(rowId) {
    const dataIndex = this.#data.findIndex((row, i) => {
      return this.#getRowId(row, i) === String(rowId);
    });

    if (dataIndex === -1) return null;
    return { ...this.#data[dataIndex] };
  }

  /**
   * Update entire row
   * @param {string} rowId - Row ID
   * @param {Object} newData - New row data
   */
  updateRow(rowId, newData) {
    const dataIndex = this.#data.findIndex((row, i) => {
      return this.#getRowId(row, i) === String(rowId);
    });

    if (dataIndex === -1) return false;

    const oldRow = { ...this.#data[dataIndex] };
    this.#data[dataIndex] = { ...this.#data[dataIndex], ...newData };

    // Force re-render
    this.#renderedRange = { start: -1, end: -1 };
    this.#render(true);

    this.#emit('row:update', {
      rowId,
      oldRow,
      newRow: { ...this.#data[dataIndex] },
    });

    return true;
  }

  /**
   * Get state
   * @returns {Object}
   */
  getState() {
    return {
      data: this.#data,
      view: this.#view,
      columns: this.#columns,
      selected: Array.from(this.#selected),
      sort: { ...this.#sort },
      globalFilter: this.#globalFilter,
      columnFilters: { ...this.#columnFilters },
      columnWidths: Object.fromEntries(this.#columnWidths),
      rowCount: this.#view.length,
      totalCount: this.#data.length,
    };
  }

  /**
   * Set column width
   * @param {string} columnId - Column ID
   * @param {number} width - Width in pixels
   */
  setColumnWidth(columnId, width) {
    this.#columnWidths.set(columnId, width);
    this.#renderHeader();
    this.#renderedRange = { start: -1, end: -1 };
    this.#render();
    this.#emit('column:resize', { columnId, width });
  }

  /**
   * Get column width
   * @param {string} columnId - Column ID
   * @returns {number|undefined}
   */
  getColumnWidth(columnId) {
    return this.#columnWidths.get(columnId);
  }

  /**
   * Get all column widths
   * @returns {Object}
   */
  getColumnWidths() {
    return Object.fromEntries(this.#columnWidths);
  }

  /**
   * Reset all column widths to default
   */
  resetColumnWidths() {
    this.#columnWidths.clear();
    this.#renderHeader();
    this.#renderedRange = { start: -1, end: -1 };
    this.#render();
    this.#emit('column:resize:reset');
  }

  /**
   * Destroy table
   */
  destroy() {
    this.#container.innerHTML = '';
    this.#eventHandlers = {};
  }

  // ==========================================================================
  // EVENTS
  // ==========================================================================

  /**
   * Subscribe to event
   * @param {string} event - Event name
   * @param {Function} callback - Callback function
   */
  on(event, callback) {
    if (!this.#eventHandlers[event]) {
      this.#eventHandlers[event] = [];
    }
    this.#eventHandlers[event].push(callback);
    return this;
  }

  /**
   * Unsubscribe from event
   * @param {string} event - Event name
   * @param {Function} callback - Callback function
   */
  off(event, callback) {
    if (this.#eventHandlers[event]) {
      this.#eventHandlers[event] = this.#eventHandlers[event].filter(
        (cb) => cb !== callback
      );
    }
    return this;
  }

  #emit(event, data = {}) {
    if (this.#eventHandlers[event]) {
      this.#eventHandlers[event].forEach((cb) => cb(data));
    }
  }

  // ==========================================================================
  // PLUGIN SYSTEM
  // ==========================================================================

  /**
   * Create plugin API object
   * @private
   */
  #createPluginAPI(pluginOptions) {
    return {
      table: this,
      eventBus: {
        on: (event, callback) => this.on(event, callback),
        off: (event, callback) => this.off(event, callback),
        emit: (event, data) => this.#emit(event, data),
      },
      getState: () => this.getState(),
      getOptions: () => ({ ...this.#options }),
      options: pluginOptions,
    };
  }

  /**
   * Use a plugin
   * @param {Object|Function} plugin - Plugin to use
   * @param {Object} options - Plugin options
   * @returns {BWDataTable}
   */
  use(plugin, options = {}) {
    // Create API for plugin
    const api = this.#createPluginAPI(options);

    try {
      if (typeof plugin === 'function') {
        // Class-style plugin: new Plugin(table, options)
        const instance = new plugin(this, options);
        if (instance.init) {
          instance.init(api);
        }
        this.#plugins.push(instance);
      } else if (plugin && typeof plugin.init === 'function') {
        // Object-style plugin: { init: function(api) {} }
        plugin.init(api);
        this.#plugins.push(plugin);
      } else {
        console.warn('BWDataTable: Invalid plugin format', plugin);
      }
    } catch (error) {
      console.error('BWDataTable: Plugin initialization failed', error);
    }

    return this;
  }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { BWDataTable };
} else if (typeof window !== 'undefined') {
  window.BWDataTable = BWDataTable;
}

export { BWDataTable };
