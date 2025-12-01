/**
 * @bw-ui/datatable - TypeScript Definitions
 */

export interface BWDataTableOptions {
  /** Array of row objects */
  data: Record<string, any>[];
  /** Column definitions (auto-detect if null) */
  columns?: ColumnDefinition[] | null;
  /** Field to use as row ID */
  rowId?: string | ((row: Record<string, any>) => string);

  /** Enable inline editing */
  editable?: boolean;
  /** Which columns are editable */
  editableColumns?: string[];
  /** Enable row selection */
  selectable?: boolean;
  /** Selection mode */
  selectionMode?: 'single' | 'multi' | 'none';
  /** Enable column sorting */
  sortable?: boolean;
  /** Enable pagination */
  paginated?: boolean;
  /** Rows per page */
  pageSize?: number;
  /** Starting page (0-indexed) */
  page?: number;
  /** Enable global search */
  searchable?: boolean;

  /** Show table header */
  showHeader?: boolean;
  /** Show pagination footer */
  showFooter?: boolean;
  /** Loading overlay text */
  loadingText?: string;
  /** Empty state text */
  emptyText?: string;

  /** Called when cell edit completes */
  onEditEnd?: (
    rowId: string,
    columnId: string,
    value: any,
    oldValue: any,
    table: BWDataTable
  ) => void;
  /** Called when selection changes */
  onSelect?: (selectedIds: string[], table: BWDataTable) => void;
  /** Called when sort changes */
  onSort?: (
    column: string,
    direction: 'asc' | 'desc',
    table: BWDataTable
  ) => void;
  /** Called when filter changes */
  onFilter?: (filters: Record<string, any>, table: BWDataTable) => void;
  /** Called when page changes */
  onPageChange?: (page: number, table: BWDataTable) => void;
}

export interface ColumnDefinition {
  /** Unique column ID */
  id: string;
  /** Header text */
  header?: string;
  /** Data field (supports dot notation) */
  field?: string;
  /** Column type */
  type?: 'string' | 'number' | 'boolean' | 'date';
  /** Column width */
  width?: string;
  /** Enable sorting for this column */
  sortable?: boolean;
  /** Enable editing for this column */
  editable?: boolean;
  /** Hide column */
  hidden?: boolean;
  /** Custom cell renderer */
  render?: (
    value: any,
    row: Record<string, any>,
    column: ColumnDefinition
  ) => string;
}

export interface SortInfo {
  column: string;
  dir: 'asc' | 'desc';
}

export interface TableState {
  data: Record<string, any>[];
  rows: Record<string, any>[];
  columns: ColumnDefinition[];
  columnOrder: string[];
  columnWidths: Record<string, string>;
  pinnedLeft: string[];
  pinnedRight: string[];
  hiddenColumns: string[];
  sort: SortInfo[];
  filters: Record<string, any>;
  globalFilter: string;
  selected: Set<string>;
  selectionMode: 'single' | 'multi' | 'none';
  page: number;
  pageSize: number;
  totalRows: number;
  editingCell: { rowId: string; columnId: string } | null;
  editingRow: string | null;
  isLoading: boolean;
  error: string | null;
}

export interface PluginAPI {
  eventBus: EventBus;
  stateManager: StateManager;
  table: BWDataTable;
  getState: () => TableState;
  options: Record<string, any>;
}

export interface Plugin {
  name: string;
  init: (api: PluginAPI) => PluginInstance;
  destroy?: (instance: PluginInstance) => void;
}

export interface PluginInstance {
  destroy?: () => void;
  [key: string]: any;
}

export interface EventBus {
  on: (event: string, callback: Function) => () => void;
  off: (event: string, callback: Function) => void;
  emit: (event: string, data?: any) => any;
  intercept: (event: string, callback: Function) => () => void;
}

export interface StateManager {
  getState: () => TableState;
  get: <K extends keyof TableState>(key: K) => TableState[K];
  setState: (
    updates: Partial<TableState>,
    options?: { silent?: boolean; track?: boolean }
  ) => void;
  reset: (initialState?: Partial<TableState>) => void;
  getHistory: () => TableState[];
  restore: (snapshot: TableState) => void;
  batch: (fn: () => void) => void;
}

export declare class BWDataTable {
  constructor(selector: string | HTMLElement, options?: BWDataTableOptions);

  /** Register a plugin */
  use<T extends Plugin>(plugin: T, options?: Record<string, any>): this;

  /** Get plugin instance by name */
  getPlugin<T = PluginInstance>(name: string): T | null;

  // Data methods
  getData(): Record<string, any>[];
  getOriginalData(): Record<string, any>[];
  setData(data: Record<string, any>[]): void;
  addRow(row: Record<string, any>): void;
  removeRow(rowId: string): void;
  updateRow(rowId: string, data: Partial<Record<string, any>>): void;

  // Selection methods
  getSelected(): Record<string, any>[];
  getSelectedIds(): string[];
  selectAll(): void;
  clearSelection(): void;

  // Sort & Filter methods
  sort(column: string, direction?: 'asc' | 'desc'): void;
  filter(columnId: string, value: any): void;
  clearFilters(): void;

  // Pagination methods
  goToPage(page: number): void;
  setPageSize(size: number): void;

  // Editing methods
  startEdit(rowId: string, columnId: string): void;
  setCellValue(rowId: string, columnId: string, value: any): void;

  // Column methods
  getVisibleColumns(): ColumnDefinition[];
  hideColumn(columnId: string): void;
  showColumn(columnId: string): void;

  // Event methods
  on(event: string, callback: Function): () => void;
  off(event: string, callback: Function): void;
  emit(event: string, data?: any): any;

  // Rendering methods
  render(): void;
  setLoading(loading: boolean, text?: string): void;
  destroy(): void;
}

export { BWDataTable as default };
