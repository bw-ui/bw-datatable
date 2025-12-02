/**
 * BWDataTable v3 - UrlStatePlugin
 * Sync table state with URL
 * 
 * Features:
 * - Sync sort state to URL (?sort=name:asc)
 * - Sync search/filter to URL (?search=john)
 * - Restore state from URL on load
 * - Browser back/forward support
 */

const DEFAULTS = {
  prefix: '',
  pushState: true,
  syncSort: true,
  syncFilter: true,
  syncSearch: true,
};

export const UrlStatePlugin = {
  name: 'url-state',

  init(api) {
    const { eventBus, table, options: pluginOptions } = api;
    
    if (!table) {
      console.error('UrlStatePlugin: table is undefined');
      return;
    }
    
    if (!eventBus) {
      console.error('UrlStatePlugin: eventBus is undefined');
      return;
    }
    
    const opts = { ...DEFAULTS, ...pluginOptions };
    let isRestoring = false;
    let popstateHandler = null;

    // =========================================================================
    // URL HELPERS
    // =========================================================================

    function getParam(key) {
      const params = new URLSearchParams(window.location.search);
      return params.get(opts.prefix + key);
    }

    function setParams(updates) {
      const params = new URLSearchParams(window.location.search);
      
      for (const [key, value] of Object.entries(updates)) {
        const fullKey = opts.prefix + key;
        if (value === null || value === undefined || value === '') {
          params.delete(fullKey);
        } else {
          params.set(fullKey, String(value));
        }
      }

      const queryString = params.toString();
      const newUrl = queryString 
        ? `${window.location.pathname}?${queryString}`
        : window.location.pathname;

      if (opts.pushState) {
        window.history.pushState({}, '', newUrl);
      } else {
        window.history.replaceState({}, '', newUrl);
      }
    }

    // =========================================================================
    // STATE TO URL
    // =========================================================================

    function updateUrl() {
      if (isRestoring) return;

      const state = table.getState();
      const updates = {};

      // Sort
      if (opts.syncSort) {
        if (state.sort && state.sort.column && state.sort.direction) {
          updates.sort = `${state.sort.column}:${state.sort.direction}`;
        } else {
          updates.sort = null;
        }
      }

      // Search/Filter
      if (opts.syncSearch || opts.syncFilter) {
        if (state.globalFilter) {
          updates.search = state.globalFilter;
        } else {
          updates.search = null;
        }
      }

      setParams(updates);
      
      if (eventBus && eventBus.emit) {
        eventBus.emit('urlstate:update', { updates });
      }
    }

    // =========================================================================
    // URL TO STATE
    // =========================================================================

    function restoreFromUrl() {
      isRestoring = true;
      let restored = false;

      try {
        // Restore sort
        if (opts.syncSort) {
          const sortParam = getParam('sort');
          if (sortParam && sortParam.includes(':')) {
            const [column, direction] = sortParam.split(':');
            if (column && (direction === 'asc' || direction === 'desc')) {
              table.sort(column, direction);
              restored = true;
            }
          }
        }

        // Restore search
        if (opts.syncSearch || opts.syncFilter) {
          const searchParam = getParam('search');
          if (searchParam) {
            table.filter(searchParam);
            
            // Also update the search input if exists
            const searchInput = document.querySelector('.bw-datatable__search');
            if (searchInput) {
              searchInput.value = searchParam;
            }
            restored = true;
          }
        }

        if (restored && eventBus && eventBus.emit) {
          eventBus.emit('urlstate:restore', { 
            sort: getParam('sort'),
            search: getParam('search')
          });
        }
      } catch (err) {
        console.error('UrlStatePlugin: Error restoring state', err);
      }

      isRestoring = false;
    }

    // =========================================================================
    // EVENT LISTENERS
    // =========================================================================

    // Listen to sort changes
    eventBus.on('sort', updateUrl);
    eventBus.on('sort:after', updateUrl);
    
    // Listen to filter changes
    eventBus.on('filter', updateUrl);
    eventBus.on('filter:after', updateUrl);
    eventBus.on('filter:clear', updateUrl);

    // Handle browser back/forward
    popstateHandler = () => {
      restoreFromUrl();
    };
    window.addEventListener('popstate', popstateHandler);

    // Initial restore from URL (with small delay to ensure table is ready)
    setTimeout(() => {
      restoreFromUrl();
    }, 0);

    // =========================================================================
    // EXTEND TABLE API
    // =========================================================================

    table.getUrlState = () => ({
      sort: getParam('sort'),
      search: getParam('search'),
    });
    
    table.updateUrl = updateUrl;
    table.restoreFromUrl = restoreFromUrl;

    // =========================================================================
    // RETURN PLUGIN INSTANCE
    // =========================================================================

    return {
      name: 'url-state',
      updateUrl,
      restoreFromUrl,
      getUrlState: table.getUrlState,
      destroy() {
        if (popstateHandler) {
          window.removeEventListener('popstate', popstateHandler);
        }
        delete table.getUrlState;
        delete table.updateUrl;
        delete table.restoreFromUrl;
      },
    };
  },
};

export default UrlStatePlugin;
