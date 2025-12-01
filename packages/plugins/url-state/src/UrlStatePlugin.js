/**
 * ============================================================================
 * Black & White UI Engineering
 * BWDataTable - UrlStatePlugin
 * ============================================================================
 *
 * URL state sync for DataTable.
 *
 * Features:
 * - Sync sort, filter, page to URL
 * - Restore state from URL on load
 * - Browser back/forward support
 * - Shareable links
 *
 * URL Format:
 * - ?page=2
 * - ?sort=name:asc
 * - ?filter_role=Admin
 * - ?search=john
 *
 * Events from Core:
 * - sort:after   → Update URL
 * - filter:after → Update URL
 * - state:change → Update URL (for page)
 *
 * Events Emitted:
 * - urlstate:change → URL state changed
 * - urlstate:restore → State restored from URL
 *
 * @module plugins/url-state/UrlStatePlugin
 * @version 1.0.0
 * @license MIT
 * ============================================================================
 */

const DEFAULTS = {
  prefix: '', // URL param prefix (e.g., 'table_')
  pushState: true, // Use pushState (true) or replaceState (false)
  watchPopState: true, // Listen for browser back/forward
  syncPage: true,
  syncSort: true,
  syncFilter: true,
  syncSearch: true,
};

export const UrlStatePlugin = {
  name: 'url-state',

  init(api) {
    const { eventBus, table, getState, options: pluginOptions } = api;
    const opts = { ...DEFAULTS, ...pluginOptions };

    /** @type {boolean} - Flag to prevent circular updates */
    let isUpdating = false;

    // =========================================================================
    // URL HELPERS
    // =========================================================================

    /**
     * Get prefixed param name
     * @param {string} name - Param name
     * @returns {string} Prefixed name
     */
    function param(name) {
      return opts.prefix + name;
    }

    /**
     * Get current URL params
     * @returns {URLSearchParams}
     */
    function getParams() {
      return new URLSearchParams(window.location.search);
    }

    /**
     * Update URL with params
     * @param {URLSearchParams} params
     */
    function updateUrl(params) {
      const url = new URL(window.location.href);
      url.search = params.toString();

      if (opts.pushState) {
        window.history.pushState({}, '', url);
      } else {
        window.history.replaceState({}, '', url);
      }
    }

    // =========================================================================
    // STATE TO URL
    // =========================================================================

    /**
     * Sync current table state to URL
     */
    function syncToUrl() {
      if (isUpdating) return;

      const state = getState();
      const params = getParams();

      // Clear existing table params
      for (const key of [...params.keys()]) {
        if (key.startsWith(opts.prefix)) {
          params.delete(key);
        }
      }

      // Page
      if (opts.syncPage && state.page > 0) {
        params.set(param('page'), state.page + 1); // 1-indexed for URL
      }

      // Sort
      if (opts.syncSort && state.sort.length > 0) {
        const sortStr = state.sort.map((s) => `${s.column}:${s.dir}`).join(',');
        params.set(param('sort'), sortStr);
      }

      // Global search
      if (opts.syncSearch && state.globalFilter) {
        params.set(param('search'), state.globalFilter);
      }

      // Column filters
      if (opts.syncFilter && Object.keys(state.filters).length > 0) {
        for (const [col, value] of Object.entries(state.filters)) {
          params.set(param(`filter_${col}`), value);
        }
      }

      updateUrl(params);
      eventBus.emit('urlstate:change', { params: Object.fromEntries(params) });
    }

    // =========================================================================
    // URL TO STATE
    // =========================================================================

    /**
     * Restore table state from URL
     */
    function syncFromUrl() {
      isUpdating = true;

      const params = getParams();
      const state = getState();
      let hasChanges = false;

      // Page
      if (opts.syncPage) {
        const pageParam = params.get(param('page'));
        if (pageParam) {
          const page = parseInt(pageParam, 10) - 1; // Convert to 0-indexed
          if (page >= 0 && page !== state.page) {
            table.goToPage(page);
            hasChanges = true;
          }
        }
      }

      // Sort
      if (opts.syncSort) {
        const sortParam = params.get(param('sort'));
        if (sortParam) {
          const [column, dir] = sortParam.split(':');
          if (column && (dir === 'asc' || dir === 'desc')) {
            table.sort(column, dir);
            hasChanges = true;
          }
        }
      }

      // Global search
      if (opts.syncSearch) {
        const searchParam = params.get(param('search'));
        if (searchParam && searchParam !== state.globalFilter) {
          table.filter('global', searchParam);
          hasChanges = true;
        }
      }

      // Column filters
      if (opts.syncFilter) {
        for (const [key, value] of params.entries()) {
          const filterPrefix = param('filter_');
          if (key.startsWith(filterPrefix)) {
            const column = key.slice(filterPrefix.length);
            if (state.filters[column] !== value) {
              table.filter(column, value);
              hasChanges = true;
            }
          }
        }
      }

      isUpdating = false;

      if (hasChanges) {
        eventBus.emit('urlstate:restore', {
          params: Object.fromEntries(params),
        });
      }
    }

    // =========================================================================
    // PUBLIC API
    // =========================================================================

    /**
     * Get current state as URL params object
     * @returns {Object} URL params
     */
    function getUrlState() {
      const state = getState();
      const result = {};

      if (opts.syncPage && state.page > 0) {
        result.page = state.page + 1;
      }

      if (opts.syncSort && state.sort.length > 0) {
        result.sort = state.sort.map((s) => `${s.column}:${s.dir}`).join(',');
      }

      if (opts.syncSearch && state.globalFilter) {
        result.search = state.globalFilter;
      }

      if (opts.syncFilter && Object.keys(state.filters).length > 0) {
        for (const [col, value] of Object.entries(state.filters)) {
          result[`filter_${col}`] = value;
        }
      }

      return result;
    }

    /**
     * Set state from URL params object
     * @param {Object} params - URL params
     */
    function setUrlState(params) {
      isUpdating = true;

      if (params.page) {
        table.goToPage(parseInt(params.page, 10) - 1);
      }

      if (params.sort) {
        const [column, dir] = params.sort.split(':');
        if (column && dir) {
          table.sort(column, dir);
        }
      }

      if (params.search) {
        table.filter('global', params.search);
      }

      for (const [key, value] of Object.entries(params)) {
        if (key.startsWith('filter_')) {
          const column = key.slice(7);
          table.filter(column, value);
        }
      }

      isUpdating = false;
      syncToUrl();
    }

    /**
     * Clear URL state
     */
    function clearUrlState() {
      const params = getParams();

      for (const key of [...params.keys()]) {
        if (key.startsWith(opts.prefix)) {
          params.delete(key);
        }
      }

      updateUrl(params);
      eventBus.emit('urlstate:change', { params: {} });
    }

    // =========================================================================
    // EVENT LISTENERS
    // =========================================================================

    /** @type {number|null} - Debounce timer */
    let syncTimer = null;

    /**
     * Debounced sync to URL
     */
    function debouncedSync() {
      if (syncTimer) clearTimeout(syncTimer);
      syncTimer = setTimeout(() => {
        syncToUrl();
      }, 50);
    }

    // Sync on sort change
    eventBus.on('sort:after', () => {
      if (opts.syncSort) debouncedSync();
    });

    // Sync on filter change
    eventBus.on('filter:after', () => {
      if (opts.syncFilter || opts.syncSearch) debouncedSync();
    });

    // Sync on render (catches page changes)
    eventBus.on('render:after', () => {
      if (opts.syncPage) debouncedSync();
    });

    // Browser back/forward
    let popStateHandler = null;
    if (opts.watchPopState) {
      popStateHandler = () => {
        syncFromUrl();
      };
      window.addEventListener('popstate', popStateHandler);
    }

    // Restore state from URL on init
    syncFromUrl();

    // =========================================================================
    // EXTEND TABLE API
    // =========================================================================

    table.getUrlState = getUrlState;
    table.setUrlState = setUrlState;
    table.clearUrlState = clearUrlState;
    table.syncUrlToState = syncFromUrl;
    table.syncStateToUrl = syncToUrl;

    // =========================================================================
    // PLUGIN INSTANCE
    // =========================================================================

    return {
      getUrlState,
      setUrlState,
      clearUrlState,
      syncFromUrl,
      syncToUrl,
      destroy() {
        if (popStateHandler) {
          window.removeEventListener('popstate', popStateHandler);
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

export default UrlStatePlugin;
