/**
 * BWDataTable URL State Plugin - TypeScript Definitions
 * @bw-ui/datatable-url-state
 */

import { PluginAPI, Plugin, PluginInstance } from '@bw-ui/datatable';

/**
 * URL State plugin options
 */
export interface UrlStatePluginOptions {
  /**
   * Persist state to URL on changes
   * @default true
   */
  persist?: boolean;

  /**
   * Restore state from URL on init
   * @default true
   */
  restore?: boolean;

  /**
   * Prefix for URL parameters
   * @default 'dt_'
   */
  prefix?: string;

  /**
   * Use hash (#) instead of query string (?)
   * @default false
   */
  useHash?: boolean;

  /**
   * Debounce delay for URL updates (ms)
   * @default 300
   */
  debounce?: number;

  /**
   * State properties to sync
   * @default ['sort', 'filter', 'page']
   */
  syncState?: ('sort' | 'filter' | 'page' | 'selected')[];
}

/**
 * URL state object
 */
export interface UrlState {
  /** Sort column */
  sortColumn?: string;

  /** Sort direction */
  sortDirection?: 'asc' | 'desc';

  /** Filter/search term */
  filter?: string;

  /** Current page (if paginated) */
  page?: number;

  /** Selected row IDs */
  selected?: string[];
}

/**
 * URL state change event data
 */
export interface UrlStateChangeEvent {
  /** Previous state */
  previous: UrlState;

  /** Current state */
  current: UrlState;

  /** Full URL */
  url: string;
}

/**
 * URL State plugin instance
 */
export interface UrlStatePluginInstance extends PluginInstance {
  name: 'url-state';

  /**
   * Get current URL state
   */
  getState(): UrlState;

  /**
   * Set state and update URL
   * @param state - State to set
   */
  setState(state: Partial<UrlState>): void;

  /**
   * Clear all URL state params
   */
  clearState(): void;

  /**
   * Get shareable URL with current state
   */
  getShareableUrl(): string;

  /**
   * Cleanup plugin
   */
  destroy(): void;
}

/**
 * URL State Plugin
 *
 * Syncs table state with URL for shareable links and browser navigation.
 *
 * @example
 * ```typescript
 * import { BWDataTable } from '@bw-ui/datatable';
 * import { UrlStatePlugin } from '@bw-ui/datatable-url-state';
 *
 * const table = new BWDataTable('#table', { data })
 *   .use(UrlStatePlugin, {
 *     persist: true,
 *     restore: true,
 *     prefix: 'dt_',
 *   });
 *
 * // URL automatically updates when:
 * // - Sort changes: ?dt_sort=name&dt_dir=asc
 * // - Filter changes: ?dt_filter=john
 *
 * // Get shareable link
 * const url = table.getShareableUrl?.();
 * ```
 */
export declare const UrlStatePlugin: Plugin & {
  name: 'url-state';
  init(api: PluginAPI): UrlStatePluginInstance;
};

export default UrlStatePlugin;

/**
 * Extended table interface with URL State plugin methods
 */
declare module '@bw-ui/datatable' {
  interface BWDataTable {
    /** Get shareable URL with current state */
    getShareableUrl?(): string;
  }

  interface BWDataTableEvents {
    'urlstate:change': UrlStateChangeEvent;
    'urlstate:restore': UrlState;
  }
}
