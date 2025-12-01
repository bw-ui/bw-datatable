/**
 * ============================================================================
 * Black & White UI Engineering
 * BWDataTable - Main Class
 * ============================================================================
 *
 * Production-ready data table with plugin architecture.
 *
 * Features:
 * - Zero dependencies, vanilla JS
 * - Event-driven plugin architecture
 * - Virtual scroll ready
 * - Sort, filter, pagination, selection, editing
 * - Auto-detect columns from data
 * - Nested data support (dot notation)
 *
 * Usage:
 *   const table = new BWDataTable('#table', {
 *     data: [...],
 *     columns: [...],
 *   });
 *
 *   table.use(VirtualPlugin);
 *   table.use(UndoPlugin, { maxHistory: 50 });
 *
 * @module core/BWDataTable
 * @version 1.0.1
 * @license MIT
 * ============================================================================
 */

import EventBus from './EventBus.js';
import StateManager from './StateManager.js';
import PluginSystem from './PluginSystem.js';

/**
 * Default options
 */
const DEFAULTS = {
  // Data
  data: [],
  dataPath: null, // Path to array in data object (e.g., 'results.items')
  totalPath: null, // Path to total count (e.g., 'results.total')
  rowId: 'id', // Field to use as row ID, or function

  // Columns
  columns: null, // null = auto-detect from data

  // Features (can disable)
  sortable: true,
  filterable: true,
  selectable: true,
  editable: false,
  paginated: true,

  // Pagination
  page: 0,
  pageSize: 20,
  pageSizes: [10, 20, 50, 100],

  // Selection
  selectionMode: 'multi', // 'single' | 'multi' | 'none'

  // Styling
  theme: 'light', // 'light' | 'dark' | 'auto'
  striped: true,
  bordered: true,
  hoverable: true,

  // Classes
  containerClass: '',
  tableClass: '',

  // Editing
  editOnClick: false, // Single click to edit (default: double-click)
  editableColumns: null, // Array of column IDs, null = all (if editable: true)

  // Column Resize
  resizable: true, // Enable column resize
  minColumnWidth: 50, // Minimum column width (px)
  maxColumnWidth: null, // Maximum column width (px), null = no limit

  // Keyboard
  keyboardNavigation: true, // Enable keyboard navigation

  // States
  loading: false, // Show loading overlay
  loadingText: 'Loading...', // Loading message
  emptyText: 'No data available', // Empty state message
  errorText: null, // Error message (null = no error)

  // Callbacks
  onReady: null,
  onSort: null,
  onFilter: null,
  onSelect: null,
  onEdit: null,
  onPageChange: null,
  onError: null,
  onEditStart: null, // (rowId, columnId, value) => {}
  onEditEnd: null, // (rowId, columnId, value, oldValue) => {}
  onEditCancel: null, // (rowId, columnId) => {}
};

export class BWDataTable {
  /** @type {HTMLElement} - Container element */
  #container;

  /** @type {Object} - Merged options */
  #options;

  /** @type {EventBus} - Central event hub */
  #eventBus;

  /** @type {StateManager} - State management */
  #stateManager;

  /** @type {PluginSystem} - Plugin management */
  #pluginSystem;

  /** @type {Object} - DOM slot references */
  #slots = {
    toolbar: null,
    header: null,
    body: null,
    footer: null,
    overlay: null,
  };

  /** @type {boolean} - Initialization flag */
  #initialized = false;

  /**
   * Create a new DataTable
   *
   * @param {string|HTMLElement} selector - Container selector or element
   * @param {Object} options - Configuration options
   *
   * @example
   *   // Simple
   *   new BWDataTable('#table', { data: [...] });
   *
   *   // Full config
   *   new BWDataTable('#table', {
   *     data: apiResponse,
   *     dataPath: 'results.items',
   *     columns: [
   *       { id: 'name', header: 'Name' },
   *       { id: 'age', header: 'Age', type: 'number' },
   *     ],
   *     sortable: true,
   *     pageSize: 25,
   *   });
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

    // Merge options
    this.#options = { ...DEFAULTS, ...options };

    // Initialize core systems
    this.#eventBus = new EventBus();
    this.#stateManager = new StateManager(this.#eventBus);
    this.#pluginSystem = new PluginSystem(this.#eventBus);

    // Setup plugin API
    this.#pluginSystem.setAPI(this.#createPluginAPI());

    // Initialize
    this.#init();
  }

  /**
   * Initialize the DataTable
   * @private
   */
  #init() {
    // Extract data from source
    const data = this.#extractData(this.#options.data);

    // Auto-detect or validate columns
    const columns = this.#options.columns || this.#autoDetectColumns(data);

    // Set initial state
    this.#stateManager.setState(
      {
        data: data,
        rows: [...data],
        columns: columns,
        columnOrder: columns.map((c) => c.id),
        page: this.#options.page,
        pageSize: this.#options.pageSize,
        selectionMode: this.#options.selectionMode,
        totalRows: data.length,
        focusedCell: null, // { rowId, columnId }
        isLoading: this.#options.loading,
        error: this.#options.errorText,
      },
      { silent: true, track: false }
    );

    // Create DOM structure
    this.#createDOM();

    // Bind internal events
    this.#bindEvents();

    // Mark initialized
    this.#initialized = true;

    // Emit ready
    this.#eventBus.emit('table:ready', { table: this });

    // Callback
    if (this.#options.onReady) {
      this.#options.onReady(this);
    }

    // Initial render
    this.render();
  }

  /**
   * Extract data array from source (handles dataPath)
   * @private
   * @param {Array|Object} source - Data source
   * @returns {Array} Data array
   */
  #extractData(source) {
    if (!source) return [];

    // Direct array
    if (Array.isArray(source)) return source;

    // Extract from path
    if (this.#options.dataPath) {
      return this.#getNestedValue(source, this.#options.dataPath) || [];
    }

    return [];
  }

  /**
   * Get nested value using dot notation
   * @private
   * @param {Object} obj - Source object
   * @param {string} path - Dot notation path
   * @returns {*} Value at path
   */
  #getNestedValue(obj, path) {
    if (!obj || !path) return undefined;
    return path.split('.').reduce((o, k) => o?.[k], obj);
  }

  /**
   * Auto-detect columns from first data row
   * @private
   * @param {Array} data - Data array
   * @returns {Array} Column definitions
   */
  #autoDetectColumns(data) {
    if (!data.length) return [];

    const firstRow = data[0];
    return Object.keys(firstRow).map((key) => ({
      id: key,
      header: this.#formatHeader(key),
      field: key,
      type: this.#detectType(firstRow[key]),
    }));
  }

  /**
   * Format key as header (camelCase → Title Case)
   * @private
   * @param {string} key - Object key
   * @returns {string} Formatted header
   */
  #formatHeader(key) {
    return key
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, (s) => s.toUpperCase())
      .trim();
  }

  /**
   * Detect data type from value
   * @private
   * @param {*} value - Sample value
   * @returns {string} Type name
   */
  #detectType(value) {
    if (value === null || value === undefined) return 'text';
    if (typeof value === 'number') return 'number';
    if (typeof value === 'boolean') return 'boolean';
    if (value instanceof Date) return 'date';
    if (typeof value === 'string') {
      if (/^\d{4}-\d{2}-\d{2}/.test(value)) return 'date';
    }
    return 'text';
  }

  /**
   * Create DOM structure with slots
   * @private
   */
  #createDOM() {
    // Add base class
    this.#container.classList.add('bw-datatable');

    // Add theme class
    if (this.#options.theme) {
      this.#container.classList.add(`bw-datatable--${this.#options.theme}`);
    }

    // Add modifier classes
    if (this.#options.striped)
      this.#container.classList.add('bw-datatable--striped');
    if (this.#options.bordered)
      this.#container.classList.add('bw-datatable--bordered');
    if (this.#options.hoverable)
      this.#container.classList.add('bw-datatable--hoverable');
    if (this.#options.containerClass)
      this.#container.classList.add(this.#options.containerClass);

    // Create slot elements
    this.#container.innerHTML = `
      <div class="bw-datatable__toolbar" data-slot="toolbar"></div>
      <div class="bw-datatable__wrapper">
        <table class="bw-datatable__table ${this.#options.tableClass}">
          <thead class="bw-datatable__header" data-slot="header"></thead>
          <tbody class="bw-datatable__body" data-slot="body"></tbody>
        </table>
      </div>
      <div class="bw-datatable__footer" data-slot="footer"></div>
      <div class="bw-datatable__overlay" data-slot="overlay"></div>
    `;

    // Store slot references
    this.#slots.toolbar = this.#container.querySelector(
      '[data-slot="toolbar"]'
    );
    this.#slots.header = this.#container.querySelector('[data-slot="header"]');
    this.#slots.body = this.#container.querySelector('[data-slot="body"]');
    this.#slots.footer = this.#container.querySelector('[data-slot="footer"]');
    this.#slots.overlay = this.#container.querySelector(
      '[data-slot="overlay"]'
    );
  }

  /**
   * Bind internal event listeners
   * @private
   */
  #bindEvents() {
    // State changes trigger re-render
    this.#eventBus.on('state:change', ({ changes }) => {
      if (
        changes.includes('rows') ||
        changes.includes('columns') ||
        changes.includes('batch')
      ) {
        this.render();
      }
    });

    // Click delegation on body
    this.#slots.body.addEventListener('click', (e) => this.#handleBodyClick(e));

    // Click delegation on header
    this.#slots.header.addEventListener('click', (e) =>
      this.#handleHeaderClick(e)
    );

    // Click delegation on footer (pagination)
    this.#slots.footer.addEventListener('click', (e) =>
      this.#handleFooterClick(e)
    );

    // Double-click for editing
    this.#slots.body.addEventListener('dblclick', (e) =>
      this.#handleEditStart(e)
    );

    // Single-click edit (if enabled)
    if (this.#options.editOnClick) {
      this.#slots.body.addEventListener('click', (e) => {
        const cell = e.target.closest('[data-cell]');
        if (cell && !e.target.closest('input, select')) {
          this.#handleEditStart(e);
        }
      });
    }

    // Column resize
    if (this.#options.resizable) {
      this.#slots.header.addEventListener('mousedown', (e) =>
        this.#handleResizeStart(e)
      );
      this.#slots.header.addEventListener('dblclick', (e) =>
        this.#handleResizeAutoFit(e)
      );
    }

    // Keyboard navigation
    if (this.#options.keyboardNavigation) {
      this.#container.setAttribute('tabindex', '0');
      this.#container.addEventListener('keydown', (e) =>
        this.#handleKeyboardNav(e)
      );
      this.#slots.body.addEventListener('click', (e) =>
        this.#handleCellFocus(e)
      );
    }
  }

  /**
   * Handle cell focus on click
   * @private
   * @param {MouseEvent} e - Mouse event
   */
  #handleCellFocus(e) {
    const cell = e.target.closest('[data-cell]');
    const row = e.target.closest('[data-row-id]');

    if (!cell || !row) return;

    const rowId = row.dataset.rowId;
    const columnId = cell.dataset.cell;

    this.#setFocusedCell(rowId, columnId);
  }

  /**
   * Set focused cell
   * @private
   * @param {string} rowId - Row ID
   * @param {string} columnId - Column ID
   */
  #setFocusedCell(rowId, columnId) {
    // Remove previous focus
    const prevFocused = this.#container.querySelector(
      '.bw-datatable__td--focused'
    );
    if (prevFocused) {
      prevFocused.classList.remove('bw-datatable__td--focused');
    }

    // Set new focus
    const cell = this.#container.querySelector(
      `[data-row-id="${rowId}"] [data-cell="${columnId}"]`
    );

    if (cell) {
      cell.classList.add('bw-datatable__td--focused');
      this.#stateManager.setState(
        {
          focusedCell: { rowId, columnId },
        },
        { silent: true, track: false }
      );

      // Ensure container has focus for keyboard events
      this.#container.focus();
    }
  }

  /**
   * Handle keyboard navigation
   * @private
   * @param {KeyboardEvent} e - Keyboard event
   */
  #handleKeyboardNav(e) {
    // Skip if editing
    if (this.#stateManager.get('editingCell')) return;

    // Skip if focus is on input/select
    if (e.target.matches('input, select, textarea')) return;

    const focusedCell = this.#stateManager.get('focusedCell');

    switch (e.key) {
      case 'ArrowUp':
        e.preventDefault();
        this.#moveFocus('up');
        break;

      case 'ArrowDown':
        e.preventDefault();
        this.#moveFocus('down');
        break;

      case 'ArrowLeft':
        e.preventDefault();
        this.#moveFocus('left');
        break;

      case 'ArrowRight':
        e.preventDefault();
        this.#moveFocus('right');
        break;

      case 'Home':
        e.preventDefault();
        if (e.ctrlKey) {
          this.#moveFocus('first');
        } else {
          this.#moveFocus('rowStart');
        }
        break;

      case 'End':
        e.preventDefault();
        if (e.ctrlKey) {
          this.#moveFocus('last');
        } else {
          this.#moveFocus('rowEnd');
        }
        break;

      case 'Enter':
        e.preventDefault();
        if (focusedCell && this.#options.editable) {
          this.startEdit(focusedCell.rowId, focusedCell.columnId);
        }
        break;

      case ' ':
        e.preventDefault();
        if (focusedCell && this.#options.selectable) {
          this.#handleSelection(focusedCell.rowId, e);
        }
        break;

      case 'Tab':
        // Let Tab work normally if no cell focused
        if (focusedCell) {
          e.preventDefault();
          this.#moveFocus(e.shiftKey ? 'left' : 'right');
        }
        break;
    }
  }

  /**
   * Move focus in direction
   * @private
   * @param {string} direction - 'up' | 'down' | 'left' | 'right' | 'first' | 'last' | 'rowStart' | 'rowEnd'
   */
  #moveFocus(direction) {
    const state = this.#stateManager.getState();
    const focusedCell = state.focusedCell;

    // Get visible columns
    const columns = state.columns.filter(
      (c) => !state.hiddenColumns?.includes(c.id)
    );
    if (!columns.length) return;

    // Get visible rows
    const start = this.#options.paginated ? state.page * state.pageSize : 0;
    const end = this.#options.paginated
      ? start + state.pageSize
      : state.rows.length;
    const visibleRows = state.rows.slice(start, end);
    if (!visibleRows.length) return;

    let rowIndex, colIndex;

    if (focusedCell) {
      rowIndex = visibleRows.findIndex(
        (r) => this.#getRowId(r) === focusedCell.rowId
      );
      colIndex = columns.findIndex((c) => c.id === focusedCell.columnId);

      // If focused cell not visible (page changed), reset
      if (rowIndex === -1) {
        rowIndex = 0;
        colIndex = 0;
      }
    } else {
      // No focus yet, start at first cell
      rowIndex = 0;
      colIndex = 0;
    }

    // Calculate new position
    switch (direction) {
      case 'up':
        rowIndex = Math.max(0, rowIndex - 1);
        break;
      case 'down':
        rowIndex = Math.min(visibleRows.length - 1, rowIndex + 1);
        break;
      case 'left':
        colIndex--;
        if (colIndex < 0) {
          colIndex = columns.length - 1;
          rowIndex = Math.max(0, rowIndex - 1);
        }
        break;
      case 'right':
        colIndex++;
        if (colIndex >= columns.length) {
          colIndex = 0;
          rowIndex = Math.min(visibleRows.length - 1, rowIndex + 1);
        }
        break;
      case 'first':
        rowIndex = 0;
        colIndex = 0;
        break;
      case 'last':
        rowIndex = visibleRows.length - 1;
        colIndex = columns.length - 1;
        break;
      case 'rowStart':
        colIndex = 0;
        break;
      case 'rowEnd':
        colIndex = columns.length - 1;
        break;
    }

    // Set new focus
    const newRow = visibleRows[rowIndex];
    const newColumn = columns[colIndex];

    if (newRow && newColumn) {
      this.#setFocusedCell(this.#getRowId(newRow), newColumn.id);
    }
  }

  /**
   * Clear cell focus
   * @private
   */
  #clearFocus() {
    const prevFocused = this.#container.querySelector(
      '.bw-datatable__td--focused'
    );
    if (prevFocused) {
      prevFocused.classList.remove('bw-datatable__td--focused');
    }
    this.#stateManager.setState(
      { focusedCell: null },
      { silent: true, track: false }
    );
  }

  /**
   * Handle column resize start
   * @private
   * @param {MouseEvent} e - Mouse event
   */
  #handleResizeStart(e) {
    const handle = e.target.closest('[data-resize]');
    if (!handle) return;

    e.preventDefault();
    e.stopPropagation();

    const columnId = handle.dataset.resize;
    const th = handle.closest('th');
    const startX = e.pageX;
    const startWidth = th.offsetWidth;

    // Flag to track if we actually resized
    let didResize = false;

    // Add resizing class
    this.#container.classList.add('bw-datatable--resizing');

    // Mouse move handler
    const onMouseMove = (e) => {
      didResize = true;
      const diff = e.pageX - startX;
      let newWidth = startWidth + diff;

      // Apply constraints
      newWidth = Math.max(newWidth, this.#options.minColumnWidth);
      if (this.#options.maxColumnWidth) {
        newWidth = Math.min(newWidth, this.#options.maxColumnWidth);
      }

      // Update column width live
      th.style.width = `${newWidth}px`;
      th.style.minWidth = `${newWidth}px`;
      th.style.maxWidth = `${newWidth}px`;

      // Update body cells too
      const bodyCells = this.#slots.body.querySelectorAll(
        `[data-cell="${columnId}"]`
      );
      bodyCells.forEach((cell) => {
        cell.style.width = `${newWidth}px`;
        cell.style.minWidth = `${newWidth}px`;
        cell.style.maxWidth = `${newWidth}px`;
      });
    };

    // Mouse up handler
    const onMouseUp = (e) => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);

      // Remove resizing class
      this.#container.classList.remove('bw-datatable--resizing');

      // Only save if we actually resized
      if (didResize) {
        const finalWidth = th.offsetWidth;
        const columnWidths = { ...this.#stateManager.get('columnWidths') };
        columnWidths[columnId] = finalWidth;

        this.#stateManager.setState({ columnWidths }, { silent: true });

        // Emit event
        this.#eventBus.emit('column:resize', { columnId, width: finalWidth });
      }

      // Prevent click event from firing (which triggers sort)
      const preventClick = (e) => {
        e.stopPropagation();
        e.preventDefault();
      };
      th.addEventListener('click', preventClick, { capture: true, once: true });
      setTimeout(() => {
        th.removeEventListener('click', preventClick, { capture: true });
      }, 100);
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  }

  /**
   * Handle double-click to auto-fit column width
   * @private
   * @param {MouseEvent} e - Mouse event
   */
  #handleResizeAutoFit(e) {
    const handle = e.target.closest('[data-resize]');
    if (!handle) return;

    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();

    const columnId = handle.dataset.resize;
    const column = this.#stateManager
      .get('columns')
      .find((c) => c.id === columnId);

    if (!column) return;

    // Calculate max content width
    let maxWidth = this.#options.minColumnWidth;

    // Check header width
    const th = handle.closest('th');
    const headerContent = th.querySelector('.bw-datatable__th-content');
    if (headerContent) {
      maxWidth = Math.max(maxWidth, headerContent.scrollWidth + 40);
    }

    // Check all body cells
    const bodyCells = this.#slots.body.querySelectorAll(
      `[data-cell="${columnId}"]`
    );
    bodyCells.forEach((cell) => {
      maxWidth = Math.max(maxWidth, cell.scrollWidth + 32);
    });

    // Apply max width constraint
    if (this.#options.maxColumnWidth) {
      maxWidth = Math.min(maxWidth, this.#options.maxColumnWidth);
    }

    // Update state
    const columnWidths = { ...this.#stateManager.get('columnWidths') };
    columnWidths[columnId] = maxWidth;

    this.#stateManager.setState({ columnWidths }, { silent: true });
    this.render();

    // Emit event
    this.#eventBus.emit('column:resize', { columnId, width: maxWidth });
  }

  /**
   * Handle body clicks (row/cell selection, edit)
   * @private
   * @param {Event} e - Click event
   */
  #handleBodyClick(e) {
    const cell = e.target.closest('[data-cell]');
    const row = e.target.closest('[data-row-id]');
    const checkbox = e.target.closest('[data-select-row]');

    if (!row) return;

    const rowId = row.dataset.rowId;
    const columnId = cell?.dataset.cell;

    // Emit cell click
    if (cell) {
      this.#eventBus.emit('cell:click', { rowId, columnId, event: e });
    }

    // Emit row click
    this.#eventBus.emit('row:click', { rowId, event: e });

    // Handle selection (only if clicked on checkbox or row itself)
    if (
      this.#options.selectable &&
      this.#stateManager.get('selectionMode') !== 'none'
    ) {
      if (checkbox || !cell) {
        this.#handleSelection(rowId, e);
      }
    }
  }

  /**
   * Handle header clicks (sorting, select all)
   * @private
   * @param {Event} e - Click event
   */
  #handleHeaderClick(e) {
    // Select all checkbox
    const selectAll = e.target.closest('[data-select-all]');
    if (selectAll) {
      this.#handleSelectAll(selectAll.checked);
      return;
    }

    // Sort
    const th = e.target.closest('[data-column]');
    if (!th) return;

    const columnId = th.dataset.column;
    const column = this.#stateManager
      .get('columns')
      .find((c) => c.id === columnId);

    if (!this.#options.sortable || column?.sortable === false) return;

    this.sort(columnId);
  }

  /**
   * Handle footer clicks (pagination)
   * @private
   * @param {Event} e - Click event
   */
  #handleFooterClick(e) {
    const btn = e.target.closest('[data-page]');
    if (!btn || btn.disabled) return;

    const action = btn.dataset.page;
    const state = this.#stateManager.getState();
    const totalPages = Math.ceil(state.totalRows / state.pageSize);

    switch (action) {
      case 'first':
        this.goToPage(0);
        break;
      case 'prev':
        this.goToPage(state.page - 1);
        break;
      case 'next':
        this.goToPage(state.page + 1);
        break;
      case 'last':
        this.goToPage(totalPages - 1);
        break;
    }
  }

  /**
   * Handle row selection
   * @private
   * @param {string} rowId - Row ID
   * @param {Event} e - Click event
   */
  #handleSelection(rowId, e) {
    const selected = new Set(this.#stateManager.get('selected'));
    const mode = this.#stateManager.get('selectionMode');

    if (mode === 'single') {
      // Single selection - toggle same row or switch to new
      if (selected.has(rowId)) {
        selected.clear();
      } else {
        selected.clear();
        selected.add(rowId);
      }
    } else if (mode === 'multi') {
      // Multi selection - always toggle
      if (selected.has(rowId)) {
        selected.delete(rowId);
      } else {
        selected.add(rowId);
      }
    }

    this.#stateManager.setState({ selected }, { silent: true });

    // Callback
    if (this.#options.onSelect) {
      this.#options.onSelect([...selected], this);
    }

    // Re-render to update selection UI
    this.render();
  }

  /**
   * Handle select all checkbox
   * @private
   * @param {boolean} checked - Checkbox state
   */
  #handleSelectAll(checked) {
    const state = this.#stateManager.getState();
    let selected;

    if (checked) {
      // Select all visible rows
      const start = this.#options.paginated ? state.page * state.pageSize : 0;
      const end = this.#options.paginated
        ? start + state.pageSize
        : state.rows.length;
      const visibleRows = state.rows.slice(start, end);
      selected = new Set(visibleRows.map((row) => this.#getRowId(row)));
    } else {
      // Deselect all
      selected = new Set();
    }

    this.#stateManager.setState({ selected }, { silent: true });

    if (this.#options.onSelect) {
      this.#options.onSelect([...selected], this);
    }

    this.render();
  }

  /**
   * Handle edit start (double-click or single-click)
   * @private
   * @param {Event} e - Click event
   */
  #handleEditStart(e) {
    if (!this.#options.editable) return;

    const cell = e.target.closest('[data-cell]');
    const row = e.target.closest('[data-row-id]');

    if (!cell || !row) return;

    const rowId = row.dataset.rowId;
    const columnId = cell.dataset.cell;
    const column = this.#stateManager
      .get('columns')
      .find((c) => c.id === columnId);

    // Check if column is editable
    if (!this.#isColumnEditable(column)) return;

    // Already editing this cell
    const editingCell = this.#stateManager.get('editingCell');
    if (editingCell?.rowId === rowId && editingCell?.columnId === columnId)
      return;

    // Save current edit if any
    if (editingCell) {
      this.#saveEdit();
    }

    // Get current value
    const rowData = this.#stateManager
      .get('rows')
      .find((r) => this.#getRowId(r) === rowId);
    const value = this.#getCellValue(rowData, column);

    // Set editing state
    this.#stateManager.setState(
      {
        editingCell: { rowId, columnId, originalValue: value },
      },
      { silent: true }
    );

    // Render edit input
    this.#renderEditCell(cell, column, value);

    // Emit event
    this.#eventBus.emit('edit:start', { rowId, columnId, value });

    // Callback
    if (this.#options.onEditStart) {
      this.#options.onEditStart(rowId, columnId, value, this);
    }
  }

  /**
   * Check if column is editable
   * @private
   * @param {Object} column - Column definition
   * @returns {boolean}
   */
  #isColumnEditable(column) {
    // Column explicitly set to not editable
    if (column.editable === false) return false;

    // Column explicitly set to editable
    if (column.editable === true) return true;

    // Check editableColumns option
    if (this.#options.editableColumns) {
      return this.#options.editableColumns.includes(column.id);
    }

    // Default: editable if global editable is true
    return this.#options.editable;
  }

  /**
   * Render edit input in cell
   * @private
   * @param {HTMLElement} cell - Cell element
   * @param {Object} column - Column definition
   * @param {*} value - Current value
   */
  #renderEditCell(cell, column, value) {
    const type = column.editType || column.type || 'text';
    let input;

    switch (type) {
      case 'number':
        input = document.createElement('input');
        input.type = 'number';
        input.value = value ?? '';
        input.className = 'bw-datatable__edit-input';
        break;

      case 'boolean':
        input = document.createElement('input');
        input.type = 'checkbox';
        input.checked = Boolean(value);
        input.className = 'bw-datatable__edit-checkbox';
        break;

      case 'select':
        input = document.createElement('select');
        input.className = 'bw-datatable__edit-select';
        (column.options || []).forEach((opt) => {
          const option = document.createElement('option');
          option.value = typeof opt === 'object' ? opt.value : opt;
          option.textContent = typeof opt === 'object' ? opt.label : opt;
          option.selected = option.value === String(value);
          input.appendChild(option);
        });
        break;

      case 'date':
        input = document.createElement('input');
        input.type = 'date';
        input.value = value ? new Date(value).toISOString().split('T')[0] : '';
        input.className = 'bw-datatable__edit-input';
        break;

      default: // text
        input = document.createElement('input');
        input.type = 'text';
        input.value = value ?? '';
        input.className = 'bw-datatable__edit-input';
    }

    // Store reference
    input.dataset.editInput = 'true';

    // Keyboard handler on INPUT
    input.addEventListener('keydown', (e) => {
      switch (e.key) {
        case 'Enter':
          e.preventDefault();
          this.#saveEdit();
          break;

        case 'Escape':
          e.preventDefault();
          this.#cancelEdit();
          break;

        case 'Tab':
          e.preventDefault();
          e.stopPropagation();

          // Get next cell info BEFORE save
          const nextInfo = this.#getNextEditableCell(e.shiftKey);

          // Save current edit (this calls render() and rebuilds DOM)
          this.#saveEdit();

          // Move to next cell - need to find cell again after render
          if (nextInfo) {
            setTimeout(() => {
              // Find cell again after DOM rebuild
              const newCell = this.#container.querySelector(
                `[data-row-id="${nextInfo.rowId}"] [data-cell="${nextInfo.columnId}"]`
              );

              if (newCell) {
                this.#startEditCell(
                  nextInfo.rowId,
                  nextInfo.columnId,
                  nextInfo.value,
                  newCell
                );
              }
            }, 50);
          }
          break;
      }
    });

    // Blur handler
    input.addEventListener('blur', (e) => {
      // Small delay to allow Tab keydown to fire first
      setTimeout(() => {
        // Only save if we're still editing this cell (not moved to next)
        const editingCell = this.#stateManager.get('editingCell');
        if (
          editingCell &&
          !this.#container.querySelector('[data-edit-input]:focus')
        ) {
          this.#saveEdit();
        }
      }, 100);
    });

    // Replace cell content
    cell.innerHTML = '';
    cell.appendChild(input);
    cell.classList.add('bw-datatable__td--editing');

    // Focus input
    input.focus();
    if (input.select) input.select();
  }

  /**
   * Save current edit
   * @private
   */
  #saveEdit() {
    const editingCell = this.#stateManager.get('editingCell');
    if (!editingCell) return;

    const { rowId, columnId, originalValue } = editingCell;
    const input = this.#container.querySelector('[data-edit-input]');

    if (!input) {
      this.#stateManager.setState({ editingCell: null }, { silent: true });
      return;
    }

    // Get new value
    let newValue;
    if (input.type === 'checkbox') {
      newValue = input.checked;
    } else if (input.type === 'number') {
      newValue = input.value === '' ? null : Number(input.value);
    } else {
      newValue = input.value;
    }

    // Get column for validation
    const column = this.#stateManager
      .get('columns')
      .find((c) => c.id === columnId);

    // Validate if validator exists
    if (column.validator) {
      const isValid = column.validator(newValue, originalValue, rowId);
      if (!isValid) {
        input.classList.add('bw-datatable__edit-input--invalid');
        return;
      }
    }

    // Emit before event (can cancel)
    const result = this.#eventBus.emit('edit:before', {
      rowId,
      columnId,
      value: newValue,
      oldValue: originalValue,
    });
    if (result === false) {
      this.#cancelEdit();
      return;
    }

    // Update data
    if (newValue !== originalValue) {
      this.#updateCellValue(rowId, columnId, newValue);
    }

    // Clear editing state
    this.#stateManager.setState({ editingCell: null }, { silent: true });

    // Re-render
    this.render();

    // Emit event
    this.#eventBus.emit('edit:end', {
      rowId,
      columnId,
      value: newValue,
      oldValue: originalValue,
    });

    // Callback
    if (this.#options.onEditEnd) {
      this.#options.onEditEnd(rowId, columnId, newValue, originalValue, this);
    }
  }

  /**
   * Cancel current edit
   * @private
   */
  #cancelEdit() {
    const editingCell = this.#stateManager.get('editingCell');
    if (!editingCell) return;

    const { rowId, columnId } = editingCell;

    // Clear editing state
    this.#stateManager.setState({ editingCell: null }, { silent: true });

    // Re-render
    this.render();

    // Emit event
    this.#eventBus.emit('edit:cancel', { rowId, columnId });

    // Callback
    if (this.#options.onEditCancel) {
      this.#options.onEditCancel(rowId, columnId, this);
    }
  }

  /**
   * Get next/previous editable cell info
   * @private
   * @param {boolean} reverse - Go backward (Shift+Tab)
   * @returns {Object|null} Next cell info or null
   */
  #getNextEditableCell(reverse = false) {
    const state = this.#stateManager.getState();
    const editingCell = state.editingCell;

    if (!editingCell) return null;

    const { rowId, columnId } = editingCell;

    // Get visible editable columns
    const columns = state.columns.filter(
      (c) => !state.hiddenColumns?.includes(c.id) && this.#isColumnEditable(c)
    );

    if (!columns.length) return null;

    // Find current column index
    const colIndex = columns.findIndex((c) => c.id === columnId);

    // Get visible rows
    const start = this.#options.paginated ? state.page * state.pageSize : 0;
    const end = this.#options.paginated
      ? start + state.pageSize
      : state.rows.length;
    const visibleRows = state.rows.slice(start, end);

    // Find current row index
    const rowIndex = visibleRows.findIndex((r) => this.#getRowId(r) === rowId);

    let nextColIndex = colIndex;
    let nextRowIndex = rowIndex;

    if (reverse) {
      nextColIndex--;
      if (nextColIndex < 0) {
        nextColIndex = columns.length - 1;
        nextRowIndex--;
      }
    } else {
      nextColIndex++;
      if (nextColIndex >= columns.length) {
        nextColIndex = 0;
        nextRowIndex++;
      }
    }

    // Check bounds
    if (nextRowIndex < 0 || nextRowIndex >= visibleRows.length) return null;

    // Get next cell info
    const nextRow = visibleRows[nextRowIndex];
    const nextColumn = columns[nextColIndex];
    const nextRowId = this.#getRowId(nextRow);

    // Find cell element
    const cell = this.#container.querySelector(
      `[data-row-id="${nextRowId}"] [data-cell="${nextColumn.id}"]`
    );

    if (!cell) return null;

    return {
      rowId: nextRowId,
      columnId: nextColumn.id,
      column: nextColumn,
      value: this.#getCellValue(nextRow, nextColumn),
      cell: cell,
    };
  }
  /**
   * Start editing a specific cell (internal)
   * @private
   * @param {string} rowId - Row ID
   * @param {string} columnId - Column ID
   * @param {*} value - Cell value
   * @param {HTMLElement} cell - Cell element
   */
  #startEditCell(rowId, columnId, value, cell) {
    const column = this.#stateManager
      .get('columns')
      .find((c) => c.id === columnId);

    if (!cell || !column) return;

    // Set editing state
    this.#stateManager.setState(
      {
        editingCell: { rowId, columnId, originalValue: value },
      },
      { silent: true }
    );

    // Render edit input
    this.#renderEditCell(cell, column, value);

    // Emit event
    this.#eventBus.emit('edit:start', { rowId, columnId, value });

    // Callback
    if (this.#options.onEditStart) {
      this.#options.onEditStart(rowId, columnId, value, this);
    }
  }

  /**
   * Update cell value in data
   * @private
   * @param {string} rowId - Row ID
   * @param {string} columnId - Column ID
   * @param {*} value - New value
   */
  #updateCellValue(rowId, columnId, value) {
    const state = this.#stateManager.getState();
    const column = state.columns.find((c) => c.id === columnId);

    // Find row in both data and rows arrays
    const dataRow = state.data.find((r) => this.#getRowId(r) === rowId);
    const row = state.rows.find((r) => this.#getRowId(r) === rowId);

    if (!dataRow || !column) return;

    // Update value using field path or column id
    const field = column.field || column.id;

    if (field.includes('.')) {
      // Nested field
      this.#setNestedValue(dataRow, field, value);
      if (row !== dataRow) {
        this.#setNestedValue(row, field, value);
      }
    } else {
      // Direct field
      dataRow[field] = value;
      if (row !== dataRow) {
        row[field] = value;
      }
    }
  }

  /**
   * Set nested value using dot notation
   * @private
   * @param {Object} obj - Target object
   * @param {string} path - Dot notation path
   * @param {*} value - Value to set
   */
  #setNestedValue(obj, path, value) {
    const keys = path.split('.');
    const lastKey = keys.pop();
    const target = keys.reduce((o, k) => (o[k] = o[k] || {}), obj);
    target[lastKey] = value;
  }

  /**
   * Create API object for plugins
   * @private
   * @returns {Object} Plugin API
   */
  #createPluginAPI() {
    return {
      // State access
      stateManager: this.#stateManager,
      getState: () => this.#stateManager.getState(),
      setState: (updates, options) =>
        this.#stateManager.setState(updates, options),
      get: (key) => this.#stateManager.get(key),

      // Event system
      eventBus: this.#eventBus,
      on: (event, cb) => this.#eventBus.on(event, cb),
      off: (event, cb) => this.#eventBus.off(event, cb),
      emit: (event, data) => this.#eventBus.emit(event, data),
      intercept: (event, cb) => this.#eventBus.intercept(event, cb),

      // DOM slots
      slots: this.#slots,

      // Table reference
      table: this,

      // Options
      getOptions: () => ({ ...this.#options }),

      // Utilities
      getNestedValue: (obj, path) => this.#getNestedValue(obj, path),
      getRowId: (row) => this.#getRowId(row),
      getCellValue: (row, column) => this.#getCellValue(row, column),
    };
  }

  /**
   * Get row ID from row data
   * @private
   * @param {Object} row - Row data
   * @returns {string} Row ID
   */
  #getRowId(row) {
    const { rowId } = this.#options;

    // Function
    if (typeof rowId === 'function') {
      return String(rowId(row));
    }

    // Field name
    if (row[rowId] !== undefined) {
      return String(row[rowId]);
    }

    // Auto-generate
    if (row.__bw_id !== undefined) {
      return row.__bw_id;
    }

    // Fallback: generate and store
    row.__bw_id = `bw_${Math.random().toString(36).slice(2, 9)}`;
    return row.__bw_id;
  }

  /**
   * Get cell value from row
   * @private
   * @param {Object} row - Row data
   * @param {Object} column - Column definition
   * @returns {*} Cell value
   */
  #getCellValue(row, column) {
    // Custom getter
    if (column.valueGetter) {
      return column.valueGetter(row);
    }

    // Field path (supports dot notation)
    if (column.field) {
      return this.#getNestedValue(row, column.field);
    }

    // Direct key
    return row[column.id];
  }

  // ===========================================================================
  // PUBLIC API
  // ===========================================================================

  /**
   * Hide a column
   *
   * @param {string} columnId - Column ID
   */
  hideColumn(columnId) {
    const hiddenColumns = [...(this.#stateManager.get('hiddenColumns') || [])];
    if (!hiddenColumns.includes(columnId)) {
      hiddenColumns.push(columnId);
      this.#stateManager.setState({ hiddenColumns }, { silent: true });
      this.render();
      this.#eventBus.emit('column:hide', { columnId });
    }
  }

  /**
   * Show a column
   *
   * @param {string} columnId - Column ID
   */
  showColumn(columnId) {
    const hiddenColumns = [...(this.#stateManager.get('hiddenColumns') || [])];
    const index = hiddenColumns.indexOf(columnId);
    if (index > -1) {
      hiddenColumns.splice(index, 1);
      this.#stateManager.setState({ hiddenColumns }, { silent: true });
      this.render();
      this.#eventBus.emit('column:show', { columnId });
    }
  }

  /**
   * Toggle column visibility
   *
   * @param {string} columnId - Column ID
   */
  toggleColumn(columnId) {
    const hiddenColumns = this.#stateManager.get('hiddenColumns') || [];
    if (hiddenColumns.includes(columnId)) {
      this.showColumn(columnId);
    } else {
      this.hideColumn(columnId);
    }
  }

  /**
   * Get hidden columns
   *
   * @returns {string[]} Array of hidden column IDs
   */
  getHiddenColumns() {
    return [...(this.#stateManager.get('hiddenColumns') || [])];
  }

  /**
   * Get visible columns
   *
   * @returns {Object[]} Array of visible column definitions
   */
  getVisibleColumns() {
    const hiddenColumns = this.#stateManager.get('hiddenColumns') || [];
    return this.#stateManager
      .get('columns')
      .filter((c) => !hiddenColumns.includes(c.id));
  }

  /**
   * Set loading state
   *
   * @param {boolean} loading - Loading state
   * @param {string} text - Optional loading text
   */
  setLoading(loading, text = null) {
    if (text) {
      this.#options.loadingText = text;
    }
    this.#stateManager.setState({ isLoading: loading }, { silent: true });
    this.#renderOverlay(this.#stateManager.getState());
  }

  /**
   * Set error state
   *
   * @param {string|null} error - Error message or null to clear
   */
  setError(error) {
    this.#stateManager.setState({ error }, { silent: true });
    this.#renderOverlay(this.#stateManager.getState());
  }

  /**
   * Set empty text
   *
   * @param {string} text - Empty state message
   */
  setEmptyText(text) {
    this.#options.emptyText = text;
    this.render();
  }

  /**
   * Focus a cell programmatically
   *
   * @param {string} rowId - Row ID
   * @param {string} columnId - Column ID
   */
  focusCell(rowId, columnId) {
    this.#setFocusedCell(rowId, columnId);
  }

  /**
   * Get currently focused cell
   *
   * @returns {Object|null} { rowId, columnId } or null
   */
  getFocusedCell() {
    return this.#stateManager.get('focusedCell');
  }

  /**
   * Set column width programmatically
   *
   * @param {string} columnId - Column ID
   * @param {number} width - Width in pixels
   */
  setColumnWidth(columnId, width) {
    width = Math.max(width, this.#options.minColumnWidth);
    if (this.#options.maxColumnWidth) {
      width = Math.min(width, this.#options.maxColumnWidth);
    }

    const columnWidths = { ...this.#stateManager.get('columnWidths') };
    columnWidths[columnId] = width;

    this.#stateManager.setState({ columnWidths }, { silent: true });
    this.render();
  }

  /**
   * Get column widths
   *
   * @returns {Object} Column widths { columnId: width }
   */
  getColumnWidths() {
    return { ...this.#stateManager.get('columnWidths') };
  }

  /**
   * Reset column widths to default
   */
  resetColumnWidths() {
    this.#stateManager.setState({ columnWidths: {} }, { silent: true });
    this.render();
  }

  /**
   * Start editing a cell programmatically
   *
   * @param {string} rowId - Row ID
   * @param {string} columnId - Column ID
   */
  startEdit(rowId, columnId) {
    if (!this.#options.editable) return;

    const column = this.#stateManager
      .get('columns')
      .find((c) => c.id === columnId);
    if (!column || !this.#isColumnEditable(column)) return;

    const cell = this.#container.querySelector(
      `[data-row-id="${rowId}"] [data-cell="${columnId}"]`
    );

    if (cell) {
      const row = this.#stateManager
        .get('rows')
        .find((r) => this.#getRowId(r) === rowId);
      const value = this.#getCellValue(row, column);

      this.#stateManager.setState(
        {
          editingCell: { rowId, columnId, originalValue: value },
        },
        { silent: true }
      );

      this.#renderEditCell(cell, column, value);
    }
  }

  /**
   * Stop editing and save
   */
  stopEdit() {
    this.#saveEdit();
  }

  /**
   * Cancel editing without saving
   */
  cancelEdit() {
    this.#cancelEdit();
  }

  /**
   * Check if currently editing
   *
   * @returns {Object|null} Editing cell info or null
   */
  isEditing() {
    return this.#stateManager.get('editingCell');
  }

  /**
   * Update a cell value programmatically
   *
   * @param {string} rowId - Row ID
   * @param {string} columnId - Column ID
   * @param {*} value - New value
   */
  setCellValue(rowId, columnId, value) {
    this.#updateCellValue(rowId, columnId, value);
    this.render();
  }

  /**
   * Register a plugin
   *
   * @param {Object} plugin - Plugin definition
   * @param {Object} options - Plugin options
   * @returns {BWDataTable} this (for chaining)
   *
   * @example
   *   table.use(UndoPlugin, { maxHistory: 50 })
   *        .use(VirtualPlugin);
   */
  use(plugin, options = {}) {
    this.#pluginSystem.register(plugin, options);
    return this;
  }

  /**
   * Get a plugin instance
   *
   * @param {string} name - Plugin name
   * @returns {Object|null} Plugin instance
   */
  getPlugin(name) {
    return this.#pluginSystem.get(name);
  }

  /**
   * Render the table
   * Plugins can intercept render:before, render:header, render:body, render:footer
   */
  render() {
    const state = this.#stateManager.getState();

    // Emit before render (plugins can modify data)
    const result = this.#eventBus.emit('render:before', { state });
    if (result === false) return;

    // Render header
    this.#renderHeader(state);

    // Render body
    this.#renderBody(state);

    // Render footer
    this.#renderFooter(state);

    // Render overlay (loading/error)
    this.#renderOverlay(state);

    // Emit after render (plugins can decorate)
    this.#eventBus.emit('render:after', { state, slots: this.#slots });
  }

  /**
   * Render overlay (loading/error states)
   * @private
   * @param {Object} state - Current state
   */
  #renderOverlay(state) {
    const { isLoading, error } = state;

    if (isLoading) {
      this.#slots.overlay.innerHTML = `
      <div class="bw-datatable__overlay-content bw-datatable__overlay--loading">
        <span class="bw-datatable__spinner"></span>
        <span class="bw-datatable__overlay-text">${
          this.#options.loadingText
        }</span>
      </div>
    `;
      this.#slots.overlay.classList.add('bw-datatable__overlay--visible');
    } else if (error) {
      this.#slots.overlay.innerHTML = `
      <div class="bw-datatable__overlay-content bw-datatable__overlay--error">
        <span class="bw-datatable__error-icon">⚠️</span>
        <span class="bw-datatable__overlay-text">${error}</span>
      </div>
    `;
      this.#slots.overlay.classList.add('bw-datatable__overlay--visible');
    } else {
      this.#slots.overlay.innerHTML = '';
      this.#slots.overlay.classList.remove('bw-datatable__overlay--visible');
    }
  }

  /**
   * Render table header
   * @private
   * @param {Object} state - Current state
   */
  #renderHeader(state) {
    const intercepted = this.#eventBus.emit('render:header', {
      state,
      slot: this.#slots.header,
    });
    if (intercepted === false) return;

    const { columns, sort, selected, columnWidths } = state;

    // Check if all visible rows are selected
    const start = this.#options.paginated ? state.page * state.pageSize : 0;
    const end = this.#options.paginated
      ? start + state.pageSize
      : state.rows.length;
    const visibleRows = state.rows.slice(start, end);
    const allSelected =
      visibleRows.length > 0 &&
      visibleRows.every((row) => selected.has(this.#getRowId(row)));

    let html = '<tr>';

    // Selection checkbox column
    if (this.#options.selectable && state.selectionMode !== 'none') {
      html += `<th class="bw-datatable__th bw-datatable__th--checkbox">
      <input type="checkbox" data-select-all ${allSelected ? 'checked' : ''}>
    </th>`;
    }

    // Data columns
    for (const column of columns) {
      if (state.hiddenColumns?.includes(column.id)) continue;

      const sortInfo = sort.find((s) => s.column === column.id);
      const sortClass = sortInfo
        ? `bw-datatable__th--sort-${sortInfo.dir}`
        : '';
      const sortable = this.#options.sortable && column.sortable !== false;
      const resizable = this.#options.resizable && column.resizable !== false;

      // Get width from state or column definition
      const width = columnWidths?.[column.id] || column.width;
      const widthStyle = width
        ? `width: ${width}px; min-width: ${width}px;`
        : '';

      html += `
      <th class="bw-datatable__th ${sortClass} ${
        sortable ? 'bw-datatable__th--sortable' : ''
      }"
          data-column="${column.id}"
          style="${widthStyle}">
        <span class="bw-datatable__th-content">${
          column.header || column.id
        }</span>
        ${sortable ? '<span class="bw-datatable__th-sort"></span>' : ''}
        ${
          resizable
            ? '<span class="bw-datatable__resize-handle" data-resize="' +
              column.id +
              '"></span>'
            : ''
        }
      </th>
    `;
    }

    html += '</tr>';
    this.#slots.header.innerHTML = html;
  }

  /**
   * Render table body
   * @private
   * @param {Object} state - Current state
   */
  #renderBody(state) {
    const intercepted = this.#eventBus.emit('render:body', {
      state,
      slot: this.#slots.body,
    });
    if (intercepted === false) return;

    const { rows, columns, selected, columnWidths } = state;

    // Paginate
    const start = this.#options.paginated ? state.page * state.pageSize : 0;
    const end = this.#options.paginated ? start + state.pageSize : rows.length;
    const visibleRows = rows.slice(start, end);

    // Calculate colspan
    const visibleColumns = columns.filter(
      (c) => !state.hiddenColumns?.includes(c.id)
    );
    const colspan =
      visibleColumns.length +
      (this.#options.selectable && state.selectionMode !== 'none' ? 1 : 0);

    let html = '';

    for (const row of visibleRows) {
      const rowId = this.#getRowId(row);
      const isSelected = selected.has(rowId);

      html += `<tr class="bw-datatable__row ${
        isSelected ? 'bw-datatable__row--selected' : ''
      }" data-row-id="${rowId}">`;

      // Selection checkbox
      if (this.#options.selectable && state.selectionMode !== 'none') {
        html += `<td class="bw-datatable__td bw-datatable__td--checkbox">
        <input type="checkbox" ${
          isSelected ? 'checked' : ''
        } data-select-row="${rowId}">
      </td>`;
      }

      // Data cells
      for (const column of columns) {
        if (state.hiddenColumns?.includes(column.id)) continue;

        const value = this.#getCellValue(row, column);
        const formatted = this.#formatValue(value, column);

        // Apply column width
        const width = columnWidths?.[column.id] || column.width;
        const widthStyle = width
          ? `width: ${width}px; min-width: ${width}px; max-width: ${width}px;`
          : '';

        html += `<td class="bw-datatable__td" data-cell="${column.id}" style="${widthStyle}">${formatted}</td>`;
      }

      html += '</tr>';
    }

    this.#slots.body.innerHTML = html;

    // Empty state
    if (!visibleRows.length) {
      const emptyText = this.#options.emptyText || 'No data available';
      this.#slots.body.innerHTML = `
    <tr class="bw-datatable__row--empty">
      <td colspan="${colspan}">
        <div class="bw-datatable__empty">
          <span class="bw-datatable__empty-icon">📭</span>
          <span class="bw-datatable__empty-text">${emptyText}</span>
        </div>
      </td>
    </tr>
  `;
      return;
    }
  }

  /**
   * Format cell value based on type
   * @private
   * @param {*} value - Raw value
   * @param {Object} column - Column definition
   * @returns {string} Formatted value
   */
  #formatValue(value, column) {
    // Custom formatter
    if (column.formatter) {
      return column.formatter(value, column);
    }

    // Null/undefined
    if (value === null || value === undefined) {
      return '';
    }

    // By type
    switch (column.type) {
      case 'number':
        return Number(value).toLocaleString();
      case 'boolean':
        return value ? '✓' : '✗';
      case 'date':
        return new Date(value).toLocaleDateString();
      default:
        return String(value);
    }
  }

  /**
   * Render table footer (pagination)
   * @private
   * @param {Object} state - Current state
   */
  #renderFooter(state) {
    // Allow plugin to intercept
    const intercepted = this.#eventBus.emit('render:footer', {
      state,
      slot: this.#slots.footer,
    });
    if (intercepted === false) return;

    if (!this.#options.paginated) {
      this.#slots.footer.innerHTML = '';
      return;
    }

    const { page, pageSize, totalRows } = state;
    const totalPages = Math.ceil(totalRows / pageSize);
    const start = totalRows === 0 ? 0 : page * pageSize + 1;
    const end = Math.min((page + 1) * pageSize, totalRows);

    this.#slots.footer.innerHTML = `
      <div class="bw-datatable__pagination">
        <div class="bw-datatable__pagination-info">
          Showing ${start} to ${end} of ${totalRows} entries
        </div>
        <div class="bw-datatable__pagination-controls">
          <button class="bw-datatable__pagination-btn" data-page="first" ${
            page === 0 ? 'disabled' : ''
          }>«</button>
          <button class="bw-datatable__pagination-btn" data-page="prev" ${
            page === 0 ? 'disabled' : ''
          }>‹</button>
          <span class="bw-datatable__pagination-pages">Page ${page + 1} of ${
      totalPages || 1
    }</span>
          <button class="bw-datatable__pagination-btn" data-page="next" ${
            page >= totalPages - 1 ? 'disabled' : ''
          }>›</button>
          <button class="bw-datatable__pagination-btn" data-page="last" ${
            page >= totalPages - 1 ? 'disabled' : ''
          }>»</button>
        </div>
      </div>
    `;
  }

  /**
   * Sort by column
   *
   * @param {string} columnId - Column ID
   * @param {string} dir - Direction: 'asc' | 'desc' | null (toggle)
   */
  sort(columnId, dir = null) {
    const state = this.#stateManager.getState();
    const currentSort = state.sort.find((s) => s.column === columnId);

    // Determine new direction
    if (dir === null) {
      if (!currentSort) dir = 'asc';
      else if (currentSort.dir === 'asc') dir = 'desc';
      else dir = null; // Remove sort
    }

    // Emit before event (can be cancelled/modified)
    const result = this.#eventBus.emit('sort:before', { columnId, dir });
    if (result === false) return;

    // Build new sort array (single sort)
    const newSort = dir ? [{ column: columnId, dir }] : [];

    // Sort rows
    const rows = [...state.data];
    if (newSort.length) {
      const column = state.columns.find((c) => c.id === columnId);
      rows.sort((a, b) => {
        const aVal = this.#getCellValue(a, column);
        const bVal = this.#getCellValue(b, column);

        // Handle null/undefined
        if (aVal == null && bVal == null) return 0;
        if (aVal == null) return 1;
        if (bVal == null) return -1;

        let cmp = 0;
        if (aVal < bVal) cmp = -1;
        else if (aVal > bVal) cmp = 1;

        return dir === 'desc' ? -cmp : cmp;
      });
    }

    // Update state
    this.#stateManager.setState(
      { sort: newSort, rows, page: 0 },
      { silent: true }
    );
    this.render();

    // Emit after event
    this.#eventBus.emit('sort:after', { columnId, dir, rows });

    // Callback
    if (this.#options.onSort) {
      this.#options.onSort({ column: columnId, dir }, this);
    }
  }

  /**
   * Filter rows
   *
   * @param {string} columnId - Column ID (or 'global' for global filter)
   * @param {*} value - Filter value
   */
  filter(columnId, value) {
    const state = this.#stateManager.getState();

    // Emit before event
    const result = this.#eventBus.emit('filter:before', { columnId, value });
    if (result === false) return;

    let filters = { ...state.filters };
    let globalFilter = state.globalFilter;

    if (columnId === 'global') {
      globalFilter = value;
    } else {
      if (value === '' || value === null || value === undefined) {
        delete filters[columnId];
      } else {
        filters[columnId] = value;
      }
    }

    // Filter rows
    let rows = [...state.data];

    // Global filter
    if (globalFilter) {
      const term = String(globalFilter).toLowerCase();
      rows = rows.filter((row) => {
        return state.columns.some((col) => {
          const val = this.#getCellValue(row, col);
          return String(val).toLowerCase().includes(term);
        });
      });
    }

    // Column filters
    for (const [colId, filterVal] of Object.entries(filters)) {
      const column = state.columns.find((c) => c.id === colId);
      if (!column) continue;

      const term = String(filterVal).toLowerCase();
      rows = rows.filter((row) => {
        const val = this.#getCellValue(row, column);
        return String(val).toLowerCase().includes(term);
      });
    }

    // Re-apply sort if active
    if (state.sort.length) {
      const sortInfo = state.sort[0];
      const column = state.columns.find((c) => c.id === sortInfo.column);
      rows.sort((a, b) => {
        const aVal = this.#getCellValue(a, column);
        const bVal = this.#getCellValue(b, column);

        if (aVal == null && bVal == null) return 0;
        if (aVal == null) return 1;
        if (bVal == null) return -1;

        let cmp = 0;
        if (aVal < bVal) cmp = -1;
        else if (aVal > bVal) cmp = 1;

        return sortInfo.dir === 'desc' ? -cmp : cmp;
      });
    }

    // Update state
    this.#stateManager.setState(
      {
        filters,
        globalFilter,
        rows,
        page: 0,
        totalRows: rows.length,
      },
      { silent: true }
    );
    this.render();

    // Emit after event
    this.#eventBus.emit('filter:after', { filters, globalFilter, rows });

    // Callback
    if (this.#options.onFilter) {
      this.#options.onFilter({ filters, globalFilter }, this);
    }
  }

  /**
   * Go to page
   *
   * @param {number} page - Page number (0-indexed)
   */
  goToPage(page) {
    const state = this.#stateManager.getState();
    const totalPages = Math.ceil(state.totalRows / state.pageSize);

    // Clamp page
    page = Math.max(0, Math.min(page, totalPages - 1));

    if (page === state.page) return;

    // Update state and render
    this.#stateManager.setState({ page }, { silent: true });
    this.render();

    // Callback
    if (this.#options.onPageChange) {
      this.#options.onPageChange(page, this);
    }
  }

  /**
   * Set page size
   *
   * @param {number} size - Rows per page
   */
  setPageSize(size) {
    this.#stateManager.setState({ pageSize: size, page: 0 }, { silent: true });
    this.render();
  }

  /**
   * Get current data (filtered/sorted)
   *
   * @returns {Array} Current rows
   */
  getData() {
    return [...this.#stateManager.get('rows')];
  }

  /**
   * Get original data (unfiltered/unsorted)
   *
   * @returns {Array} Original data
   */
  getOriginalData() {
    return [...this.#stateManager.get('data')];
  }

  /**
   * Set new data
   *
   * @param {Array|Object} data - New data (array or object with dataPath)
   */
  setData(data) {
    const extracted = this.#extractData(data);

    // Auto-detect columns if not provided
    const columns = this.#options.columns || this.#autoDetectColumns(extracted);

    this.#stateManager.setState(
      {
        data: extracted,
        rows: [...extracted],
        columns: columns,
        columnOrder: columns.map((c) => c.id),
        totalRows: extracted.length,
        page: 0,
        selected: new Set(),
        sort: [],
        filters: {},
        globalFilter: '',
      },
      { silent: true }
    );
    this.render();
  }

  /**
   * Get selected rows
   *
   * @returns {Array} Selected row data
   */
  getSelected() {
    const state = this.#stateManager.getState();
    const selectedIds = state.selected;
    return state.rows.filter((row) => selectedIds.has(this.#getRowId(row)));
  }

  /**
   * Get selected row IDs
   *
   * @returns {Array} Selected row IDs
   */
  getSelectedIds() {
    return [...this.#stateManager.get('selected')];
  }

  /**
   * Select rows by ID
   *
   * @param {Array} ids - Row IDs to select
   */
  select(ids) {
    this.#stateManager.setState({ selected: new Set(ids) }, { silent: true });
    this.render();
  }

  /**
   * Clear selection
   */
  clearSelection() {
    this.#stateManager.setState({ selected: new Set() }, { silent: true });
    this.render();
  }

  /**
   * Refresh/re-render table
   */
  refresh() {
    this.render();
  }

  /**
   * Reload data (re-apply current filters/sort)
   */
  reload() {
    const state = this.#stateManager.getState();

    // Re-filter and re-sort from original data
    this.filter('global', state.globalFilter);
  }

  /**
   * Reset to initial state (clear filters, sort, selection)
   */
  reset() {
    const state = this.#stateManager.getState();

    this.#stateManager.setState(
      {
        rows: [...state.data],
        sort: [],
        filters: {},
        globalFilter: '',
        selected: new Set(),
        page: 0,
        totalRows: state.data.length,
      },
      { silent: true }
    );
    this.render();
  }

  /**
   * Destroy table and cleanup
   */
  destroy() {
    // Destroy plugins
    this.#pluginSystem.destroyAll();

    // Clear event bus
    this.#eventBus.clear();

    // Clear DOM
    this.#container.innerHTML = '';
    this.#container.classList.remove(
      'bw-datatable',
      'bw-datatable--light',
      'bw-datatable--dark',
      'bw-datatable--auto',
      'bw-datatable--striped',
      'bw-datatable--bordered',
      'bw-datatable--hoverable'
    );

    // Emit destroyed
    this.#eventBus.emit('table:destroyed');
  }

  /**
   * Subscribe to events
   *
   * @param {string} event - Event name
   * @param {Function} callback - Handler
   * @returns {Function} Unsubscribe function
   */
  on(event, callback) {
    return this.#eventBus.on(event, callback);
  }

  /**
   * Unsubscribe from events
   *
   * @param {string} event - Event name
   * @param {Function} callback - Handler
   */
  off(event, callback) {
    this.#eventBus.off(event, callback);
  }
}

export default BWDataTable;
