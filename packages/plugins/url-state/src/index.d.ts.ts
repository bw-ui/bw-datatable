/**
 * @bw-ui/datatable-url-state - TypeScript Definitions
 */

import { Plugin, PluginAPI } from '@bw-ui/datatable';

export interface UrlStatePluginOptions {
  /** Prefix for URL params (e.g., 'table_' → ?table_page=2) */
  prefix?: string;
  /** Use pushState (true) or replaceState (false) */
  pushState?: boolean;
  /** Listen for browser back/forward navigation */
  watchPopState?: boolean;
  /** Sync current page to URL */
  syncPage?: boolean;
  /** Sync sort column and direction to URL */
  syncSort?: boolean;
  /** Sync column filters to URL */
  syncFilter?: boolean;
  /** Sync global search to URL */
  syncSearch?: boolean;
}

export interface UrlStateParams {
  page?: number;
  sort?: string;
  search?: string;
  [key: `filter_${string}`]: string;
}

export interface UrlStateChangeEvent {
  params: Record<string, string>;
}

export interface UrlStatePluginInstance {
  /** Get current state as URL params object */
  getUrlState: () => UrlStateParams;
  /** Set state from params object */
  setUrlState: (params: UrlStateParams) => void;
  /** Clear all URL state */
  clearUrlState: () => void;
  /** Manually sync from URL to table state */
  syncFromUrl: () => void;
  /** Manually sync from table state to URL */
  syncToUrl: () => void;
  /** Cleanup */
  destroy: () => void;
}

export interface UrlStatePlugin extends Plugin {
  name: 'url-state';
  init: (api: PluginAPI) => UrlStatePluginInstance;
}

export declare const UrlStatePlugin: UrlStatePlugin;
export default UrlStatePlugin;

// Extend BWDataTable interface
declare module '@bw-ui/datatable' {
  interface BWDataTable {
    /** Get current state as URL params object */
    getUrlState(): UrlStateParams;
    /** Set state from params object */
    setUrlState(params: UrlStateParams): void;
    /** Clear all URL state */
    clearUrlState(): void;
    /** Manually sync from URL to table state */
    syncUrlToState(): void;
    /** Manually sync from table state to URL */
    syncStateToUrl(): void;
  }
}
