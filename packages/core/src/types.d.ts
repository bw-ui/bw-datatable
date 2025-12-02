/**
 * BWDataTable v3.0 - TypeScript Definitions
 * @bw-ui/datatable
 */

// =============================================================================
// CONFIGURATION TYPES
// =============================================================================

/**
 * Column type for data formatting and sorting
 */
export type ColumnType = 'string' | 'number' | 'boolean' | 'date';

/**
 * Sort direction
 */
export type SortDirection = 'asc' | 'desc' | null;

/**
 * Column definition
 */
export interface Column {
  /** Unique column identifier */
  id: string;

  /** Field name in data object (defaults to id) */
  field?: string;

  /** Display header text */
  header?: string;

  /** Column data type for formatting/sorting */
  type?: ColumnType;

  /** Column width (CSS value) */
  width?: string | number;

  /** Minimum column width */
  minWidth?: string | number;

  /** Maximum column width */
  maxWidth?: string | number;

  /** Enable sorting for this column (default: true) */
  sortable?: boolean;

  /** Enable filtering for this column (default: true) */
  filterable?: boolean;

  /** Enable editing for this column (default: true) */
  editable?: boolean;

  /** Custom cell renderer */
  render?: (value: any, row: any, column: Column) => string;

  /** CSS class for column cells */
  className?: string;

  /** Text alignment */
  align?: 'left' | 'center' | 'right';
}

/**
 * Table configuration options
 */
export interface BWDataTableOptions {
  /** Data array */
  data?: any[];

  /** Column definitions (auto-detected if not provided) */
  columns?: Column[];

  /** Fixed row height in pixels (default: 40) */
  rowHeight?: number;

  /** Buffer rows above/below viewport (default: 20) */
  bufferSize?: number;

  /** Field to use as unique row identifier (default: 'id') */
  rowId?: string | ((row: any, index: number) => string);

  /** Enable column sorting (default: true) */
  sortable?: boolean;

  /** Enable global search filter (default: true) */
  filterable?: boolean;

  /** Enable row selection (default: true) */
  selectable?: boolean;

  /** Enable inline cell editing (default: true) */
  editable?: boolean;

  /** Enable column resizing (default: false) */
  resizable?: boolean;

  /** Callback when table is ready */
  onReady?: (table: BWDataTable) => void;
}

// =============================================================================
// STATE TYPES
// =============================================================================

/**
 * Current sort state
 */
export interface SortState {
  column: string | null;
  direction: SortDirection;
}

/**
 * Table state
 */
export interface TableState {
  /** All data rows */
  data: any[];

  /** Filtered/sorted view indices */
  view: number[];

  /** Column definitions */
  columns: Column[];

  /** Selected row IDs */
  selected: string[];

  /** Current sort state */
  sort: SortState;

  /** Global filter term */
  globalFilter: string;

  /** Column-specific filters */
  columnFilters: Record<string, any>;

  /** Filtered row count */
  rowCount: number;

  /** Total row count */
  totalCount: number;
}

/**
 * Row count info
 */
export interface RowCount {
  total: number;
  filtered: number;
}

// =============================================================================
// EVENT TYPES
// =============================================================================

/**
 * Sort event data
 */
export interface SortEventData {
  column: string;
  direction: SortDirection;
}

/**
 * Filter event data
 */
export interface FilterEventData {
  term: string;
}

/**
 * Selection change event data
 */
export interface SelectionEventData {
  selected: string[];
  count: number;
}

/**
 * Cell edit event data
 */
export interface CellEditEventData {
  rowId: string;
  rowIndex: number;
  colIndex: number;
  columnId: string;
  field: string;
  oldValue: any;
  newValue: any;
  row: any;
}

/**
 * Cell edit start event data
 */
export interface CellEditStartEventData {
  rowId: string;
  rowIndex: number;
  colIndex: number;
  columnId: string;
  value: any;
}

/**
 * Row update event data
 */
export interface RowUpdateEventData {
  rowId: string;
  oldRow: any;
  newRow: any;
}

/**
 * Event callback type
 */
export type EventCallback<T = any> = (data: T) => void;

/**
 * All available events
 */
export interface BWDataTableEvents {
  sort: SortEventData;
  'sort:after': SortEventData;
  filter: FilterEventData;
  'filter:after': FilterEventData;
  'filter:clear': void;
  'sort:clear': void;
  reset: void;
  'selection:change': SelectionEventData;
  'cell:edit': CellEditEventData;
  'cell:edit:start': CellEditStartEventData;
  'cell:edit:end': {
    rowId: string;
    columnId: string;
    oldValue: any;
    newValue: any;
  };
  'cell:edit:cancel': void;
  'row:update': RowUpdateEventData;
  'table:ready': { table: BWDataTable };
}

// =============================================================================
// PLUGIN TYPES
// =============================================================================

/**
 * Event bus for plugins
 */
export interface PluginEventBus {
  on<K extends keyof BWDataTableEvents>(
    event: K,
    callback: EventCallback<BWDataTableEvents[K]>
  ): void;
  off<K extends keyof BWDataTableEvents>(
    event: K,
    callback: EventCallback<BWDataTableEvents[K]>
  ): void;
  emit<K extends keyof BWDataTableEvents>(
    event: K,
    data?: BWDataTableEvents[K]
  ): void;
}

/**
 * Plugin API provided to plugins during initialization
 */
export interface PluginAPI {
  /** Reference to the table instance */
  table: BWDataTable;

  /** Event bus for subscribing to/emitting events */
  eventBus: PluginEventBus;

  /** Get current table state */
  getState(): TableState;

  /** Get table options */
  getOptions(): BWDataTableOptions;

  /** Plugin-specific options passed during .use() */
  options: any;
}

/**
 * Plugin interface
 */
export interface Plugin {
  /** Plugin name */
  name: string;

  /** Initialize plugin */
  init(api: PluginAPI): void | PluginInstance;

  /** Cleanup plugin */
  destroy?(): void;
}

/**
 * Plugin instance returned from init
 */
export interface PluginInstance {
  name: string;
  destroy?(): void;
  [key: string]: any;
}

// =============================================================================
// MAIN CLASS
// =============================================================================

/**
 * BWDataTable - High-performance virtual scrolling data table
 *
 * @example
 * ```typescript
 * const table = new BWDataTable('#container', {
 *   data: myData,
 *   rowHeight: 44,
 *   sortable: true,
 *   filterable: true,
 *   editable: true,
 * });
 *
 * // Add plugins
 * table
 *   .use(HistoryPlugin, { maxHistory: 50 })
 *   .use(ClipboardPlugin)
 *   .use(ExportPlugin);
 *
 * // Listen to events
 * table.on('cell:edit', (data) => {
 *   console.log('Cell edited:', data);
 * });
 * ```
 */
export declare class BWDataTable {
  /**
   * Create a new BWDataTable instance
   * @param selector - CSS selector or HTMLElement
   * @param options - Table configuration options
   */
  constructor(selector: string | HTMLElement, options?: BWDataTableOptions);

  // ===========================================================================
  // DATA METHODS
  // ===========================================================================

  /**
   * Set new data
   * @param data - Array of row objects
   */
  setData(data: any[]): void;

  /**
   * Get all data
   */
  getData(): any[];

  /**
   * Get filtered/sorted data
   */
  getFilteredData(): any[];

  /**
   * Get row counts
   */
  getRowCount(): RowCount;

  /**
   * Get row by ID
   * @param rowId - Row identifier
   */
  getRowById(rowId: string): any | null;

  /**
   * Update a single cell
   * @param rowId - Row identifier
   * @param columnId - Column identifier
   * @param value - New value
   */
  updateCell(rowId: string, columnId: string, value: any): boolean;

  /**
   * Update entire row
   * @param rowId - Row identifier
   * @param newData - Partial row data to merge
   */
  updateRow(rowId: string, newData: Partial<any>): boolean;

  // ===========================================================================
  // SORT METHODS
  // ===========================================================================

  /**
   * Sort by column
   * @param columnId - Column to sort by
   * @param direction - Sort direction ('asc', 'desc', or null to clear)
   */
  sort(columnId: string, direction?: SortDirection): void;

  /**
   * Clear current sort
   */
  clearSort(): void;

  // ===========================================================================
  // FILTER METHODS
  // ===========================================================================

  /**
   * Filter by search term (global search)
   * @param term - Search term
   */
  filter(term: string): void;

  /**
   * Filter by specific column
   * @param columnId - Column to filter
   * @param value - Filter value
   */
  filterColumn(columnId: string, value: any): void;

  /**
   * Clear all filters
   */
  clearFilters(): void;

  /**
   * Reset table (clear filters and sort)
   */
  reset(): void;

  // ===========================================================================
  // SELECTION METHODS
  // ===========================================================================

  /**
   * Get selected rows
   */
  getSelected(): any[];

  /**
   * Get selected row IDs
   */
  getSelectedIds(): string[];

  /**
   * Select all visible rows
   */
  selectAll(): void;

  /**
   * Clear selection
   */
  clearSelection(): void;

  // ===========================================================================
  // NAVIGATION METHODS
  // ===========================================================================

  /**
   * Scroll to specific row
   * @param index - Row index (0-based)
   */
  scrollToRow(index: number): void;

  /**
   * Scroll to top
   */
  scrollToTop(): void;

  /**
   * Scroll to bottom
   */
  scrollToBottom(): void;

  // ===========================================================================
  // STATE METHODS
  // ===========================================================================

  /**
   * Get current table state
   */
  getState(): TableState;

  /**
   * Force re-render
   */
  render(): void;

  /**
   * Destroy table and cleanup
   */
  destroy(): void;

  // ===========================================================================
  // EVENT METHODS
  // ===========================================================================

  /**
   * Subscribe to event
   * @param event - Event name
   * @param callback - Event handler
   */
  on<K extends keyof BWDataTableEvents>(
    event: K,
    callback: EventCallback<BWDataTableEvents[K]>
  ): this;

  /**
   * Unsubscribe from event
   * @param event - Event name
   * @param callback - Event handler to remove
   */
  off<K extends keyof BWDataTableEvents>(
    event: K,
    callback: EventCallback<BWDataTableEvents[K]>
  ): this;

  // ===========================================================================
  // PLUGIN METHODS
  // ===========================================================================

  /**
   * Add a plugin
   * @param plugin - Plugin class or object
   * @param options - Plugin options
   */
  use(plugin: Plugin | (new (...args: any[]) => any), options?: any): this;

  // ===========================================================================
  // PLUGIN-ADDED METHODS (available when plugins are loaded)
  // ===========================================================================

  /** Undo last action (HistoryPlugin) */
  undo?(): boolean;

  /** Redo last undone action (HistoryPlugin) */
  redo?(): boolean;

  /** Check if undo is available (HistoryPlugin) */
  canUndo?(): boolean;

  /** Check if redo is available (HistoryPlugin) */
  canRedo?(): boolean;

  /** Clear history (HistoryPlugin) */
  clearHistory?(): void;

  /** Copy selected rows to clipboard (ClipboardPlugin) */
  copy?(selectedOnly?: boolean): boolean;

  /** Copy all rows to clipboard (ClipboardPlugin) */
  copyAll?(): boolean;

  /** Paste from clipboard (ClipboardPlugin) */
  paste?(): void;

  /** Export to CSV (ExportPlugin) */
  exportCSV?(filename?: string, selectedOnly?: boolean): void;

  /** Export to JSON (ExportPlugin) */
  exportJSON?(filename?: string, selectedOnly?: boolean): void;
}

export default BWDataTable;
