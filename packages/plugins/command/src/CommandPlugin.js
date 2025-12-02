/**
 * BWDataTable v3 - CommandPlugin
 * Cmd+K command palette with beautiful UI
 *
 * Features:
 * - Ctrl+K / Cmd+K to open
 * - Tab to expand/collapse groups
 * - Arrow keys to navigate (with scroll into view)
 * - Enter to execute
 * - Escape to close
 * - Icons for each action
 * - Keyboard shortcuts display
 * - Search/filter commands
 * - Dynamic actions from other plugins
 */

const DEFAULTS = {
  placeholder: 'Type a command...',
  shortcut: true,
  maxResults: 50,
};

export const CommandPlugin = {
  name: 'command',

  init(api) {
    const { eventBus, table, options: pluginOptions } = api;

    if (!table) {
      console.error('CommandPlugin: table is undefined');
      return;
    }

    const opts = { ...DEFAULTS, ...pluginOptions };

    let modal = null;
    let input = null;
    let list = null;
    let isOpen = false;
    let currentItems = [];
    let activeIndex = 0;
    let customActions = [];
    let keyboardHandler = null;
    let expandedGroups = {};

    // =========================================================================
    // ICONS (SVG)
    // =========================================================================

    const icons = {
      search:
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>',
      sortAsc:
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 8l4-4 4 4M7 4v16"/><path d="M11 12h4M11 16h7M11 20h10"/></svg>',
      sortDesc:
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 16l4 4 4-4M7 20V4"/><path d="M11 12h4M11 8h7M11 4h10"/></svg>',
      check:
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="m9 12 2 2 4-4"/></svg>',
      x: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6M9 9l6 6"/></svg>',
      filter:
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>',
      arrowUp:
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 19V5M5 12l7-7 7 7"/></svg>',
      arrowDown:
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12l7 7 7-7"/></svg>',
      download:
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>',
      copy: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>',
      undo: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 7v6h6"/><path d="M21 17a9 9 0 00-9-9 9 9 0 00-6 2.3L3 13"/></svg>',
      redo: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 7v6h-6"/><path d="M3 17a9 9 0 019-9 9 9 0 016 2.3l3 2.7"/></svg>',
      chevronRight:
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m9 18 6-6-6-6"/></svg>',
      folder:
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/></svg>',
      empty:
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><path d="M8 15s1.5 2 4 2 4-2 4-2M9 9h.01M15 9h.01"/></svg>',
    };

    // =========================================================================
    // DEFAULT ACTIONS
    // =========================================================================

    function getDefaultActions() {
      var actions = [];
      var state = table.getState ? table.getState() : {};
      var columns = state.columns || [];

      // Sort Ascending group
      if (columns.length > 0) {
        actions.push({
          id: 'sort-asc',
          label: 'Sort Ascending',
          icon: icons.sortAsc,
          keywords: ['sort', 'asc', 'ascending', 'a-z', 'order'],
          isGroup: true,
          children: columns.map(function (col) {
            return {
              id: 'sort-asc-' + col.id,
              label: 'Sort ' + (col.header || col.id) + ' ↑',
              icon: icons.sortAsc,
              action: function () {
                table.sort && table.sort(col.id, 'asc');
              },
            };
          }),
        });

        // Sort Descending group
        actions.push({
          id: 'sort-desc',
          label: 'Sort Descending',
          icon: icons.sortDesc,
          keywords: ['sort', 'desc', 'descending', 'z-a', 'order'],
          isGroup: true,
          children: columns.map(function (col) {
            return {
              id: 'sort-desc-' + col.id,
              label: 'Sort ' + (col.header || col.id) + ' ↓',
              icon: icons.sortDesc,
              action: function () {
                table.sort && table.sort(col.id, 'desc');
              },
            };
          }),
        });
      }

      // Selection actions
      if (table.selectAll) {
        actions.push({
          id: 'select-all',
          label: 'Select All Rows',
          icon: icons.check,
          keywords: ['select', 'all', 'check', 'mark'],
          shortcut: '⌘A',
          action: function () {
            table.selectAll();
          },
        });
      }

      if (table.clearSelection) {
        actions.push({
          id: 'clear-selection',
          label: 'Clear Selection',
          icon: icons.x,
          keywords: ['clear', 'deselect', 'uncheck', 'none'],
          action: function () {
            table.clearSelection();
          },
        });
      }

      // Filter actions
      if (table.clearFilters) {
        actions.push({
          id: 'clear-filters',
          label: 'Clear All Filters',
          icon: icons.filter,
          keywords: ['clear', 'filter', 'reset', 'remove', 'search'],
          action: function () {
            table.clearFilters();
          },
        });
      }

      // Sort clear
      if (table.clearSort) {
        actions.push({
          id: 'clear-sort',
          label: 'Clear Sort',
          icon: icons.x,
          keywords: ['clear', 'sort', 'reset', 'unsort'],
          action: function () {
            table.clearSort();
          },
        });
      }

      // Reset all
      if (table.reset) {
        actions.push({
          id: 'reset-all',
          label: 'Reset All (Filters + Sort)',
          icon: icons.x,
          keywords: ['reset', 'clear', 'all', 'filter', 'sort'],
          action: function () {
            table.reset();
          },
        });
      }

      // Navigation actions
      if (table.scrollToTop) {
        actions.push({
          id: 'scroll-top',
          label: 'Go to Top',
          icon: icons.arrowUp,
          keywords: ['top', 'first', 'start', 'beginning', 'home'],
          shortcut: 'Home',
          action: function () {
            table.scrollToTop();
          },
        });
      }

      if (table.scrollToBottom) {
        actions.push({
          id: 'scroll-bottom',
          label: 'Go to Bottom',
          icon: icons.arrowDown,
          keywords: ['bottom', 'last', 'end'],
          shortcut: 'End',
          action: function () {
            table.scrollToBottom();
          },
        });
      }

      return actions;
    }

    // Get actions from other plugins
    function getPluginActions() {
      var actions = [];

      // Export actions
      if (typeof table.exportCSV === 'function') {
        actions.push({
          id: 'export-csv',
          label: 'Export to CSV',
          icon: icons.download,
          keywords: ['export', 'csv', 'download', 'save', 'file'],
          action: function () {
            table.exportCSV();
          },
        });
      }

      if (typeof table.exportJSON === 'function') {
        actions.push({
          id: 'export-json',
          label: 'Export to JSON',
          icon: icons.download,
          keywords: ['export', 'json', 'download', 'save', 'file'],
          action: function () {
            table.exportJSON();
          },
        });
      }

      // Clipboard actions
      if (typeof table.copy === 'function') {
        actions.push({
          id: 'copy',
          label: 'Copy Selected Rows',
          icon: icons.copy,
          keywords: ['copy', 'clipboard', 'selected'],
          shortcut: '⌘C',
          action: function () {
            table.copy();
          },
        });
      }

      // History actions
      if (typeof table.undo === 'function') {
        actions.push({
          id: 'undo',
          label: 'Undo',
          icon: icons.undo,
          keywords: ['undo', 'back', 'revert', 'cancel'],
          shortcut: '⌘Z',
          action: function () {
            table.undo();
          },
        });
      }

      if (typeof table.redo === 'function') {
        actions.push({
          id: 'redo',
          label: 'Redo',
          icon: icons.redo,
          keywords: ['redo', 'forward', 'repeat'],
          shortcut: '⌘Y',
          action: function () {
            table.redo();
          },
        });
      }

      return actions;
    }

    function getAllActions() {
      return getDefaultActions()
        .concat(getPluginActions())
        .concat(customActions);
    }

    // =========================================================================
    // STYLES
    // =========================================================================

    function addStyles() {
      if (document.getElementById('bw-command-styles')) return;

      var css =
        '\
.bw-command-modal { position:fixed; top:0; left:0; right:0; bottom:0; background:rgba(0,0,0,0.6); backdrop-filter:blur(4px); display:flex; align-items:flex-start; justify-content:center; padding-top:10vh; z-index:10000; opacity:0; visibility:hidden; transition:opacity 0.2s,visibility 0.2s; }\
.bw-command-modal--open { opacity:1; visibility:visible; }\
.bw-command-box { background:#fff; border-radius:16px; box-shadow:0 25px 60px rgba(0,0,0,0.35); width:100%; max-width:580px; overflow:hidden; transform:scale(0.95) translateY(-10px); transition:transform 0.2s; }\
.bw-command-modal--open .bw-command-box { transform:scale(1) translateY(0); }\
.bw-command-header { display:flex; align-items:center; padding:16px 20px; border-bottom:1px solid #e5e7eb; gap:12px; }\
.bw-command-icon { width:20px; height:20px; color:#9ca3af; flex-shrink:0; }\
.bw-command-input { flex:1; padding:0; border:none; font-size:17px; outline:none; background:transparent; color:#111827; }\
.bw-command-input::placeholder { color:#9ca3af; }\
.bw-command-kbd { padding:4px 8px; font-size:11px; font-weight:500; color:#6b7280; background:#f3f4f6; border-radius:6px; border:1px solid #e5e7eb; }\
.bw-command-list { max-height:400px; overflow-y:auto; padding:8px; }\
.bw-command-group { padding:12px 12px 6px; font-size:11px; font-weight:600; text-transform:uppercase; letter-spacing:0.05em; color:#9ca3af; }\
.bw-command-item { padding:10px 12px; cursor:pointer; display:flex; align-items:center; gap:12px; border-radius:10px; transition:background 0.1s; margin:2px 0; }\
.bw-command-item:hover { background:#f3f4f6; }\
.bw-command-item--active { background:#3b82f6 !important; color:#fff; }\
.bw-command-item--active .bw-command-item-icon { color:#fff; }\
.bw-command-item--active .bw-command-item-shortcut { color:rgba(255,255,255,0.7); background:rgba(255,255,255,0.2); border-color:rgba(255,255,255,0.2); }\
.bw-command-item--active .bw-command-item-chevron { color:#fff; }\
.bw-command-item--group { font-weight:500; }\
.bw-command-item-icon { width:18px; height:18px; color:#6b7280; flex-shrink:0; }\
.bw-command-item-label { flex:1; font-size:14px; }\
.bw-command-item-shortcut { font-size:11px; padding:3px 8px; background:#f3f4f6; border-radius:5px; color:#6b7280; border:1px solid #e5e7eb; }\
.bw-command-item-chevron { width:16px; height:16px; color:#9ca3af; transition:transform 0.15s; }\
.bw-command-item--expanded .bw-command-item-chevron { transform:rotate(90deg); }\
.bw-command-children { padding-left:20px; }\
.bw-command-empty { padding:40px 20px; text-align:center; color:#9ca3af; }\
.bw-command-empty-icon { width:48px; height:48px; margin:0 auto 12px; color:#d1d5db; }\
.bw-command-footer { display:flex; align-items:center; padding:12px 16px; font-size:12px; color:#9ca3af; border-top:1px solid #e5e7eb; background:#f9fafb; gap:16px; flex-wrap:wrap; }\
.bw-command-footer kbd { display:inline-flex; align-items:center; justify-content:center; min-width:22px; height:22px; padding:0 6px; font-size:11px; background:#fff; border:1px solid #e5e7eb; border-radius:5px; color:#6b7280; margin-right:4px; }';

      var style = document.createElement('style');
      style.id = 'bw-command-styles';
      style.textContent = css;
      document.head.appendChild(style);
    }

    // =========================================================================
    // CREATE UI
    // =========================================================================

    function createModal() {
      addStyles();

      modal = document.createElement('div');
      modal.className = 'bw-command-modal';

      var box = document.createElement('div');
      box.className = 'bw-command-box';

      // Header
      var header = document.createElement('div');
      header.className = 'bw-command-header';
      header.innerHTML =
        '<span class="bw-command-icon">' + icons.search + '</span>';

      input = document.createElement('input');
      input.type = 'text';
      input.className = 'bw-command-input';
      input.placeholder = opts.placeholder;
      input.spellcheck = false;

      var escKbd = document.createElement('span');
      escKbd.className = 'bw-command-kbd';
      escKbd.textContent = 'ESC';

      header.appendChild(input);
      header.appendChild(escKbd);

      // List
      list = document.createElement('div');
      list.className = 'bw-command-list';

      // Footer
      var footer = document.createElement('div');
      footer.className = 'bw-command-footer';
      footer.innerHTML =
        '<span><kbd>↑</kbd><kbd>↓</kbd> Navigate</span><span><kbd>Tab</kbd> Expand</span><span><kbd>↵</kbd> Select</span><span><kbd>Esc</kbd> Close</span>';

      box.appendChild(header);
      box.appendChild(list);
      box.appendChild(footer);
      modal.appendChild(box);

      // Events
      modal.addEventListener('click', function (e) {
        if (e.target === modal) close();
      });

      input.addEventListener('input', function () {
        renderList(input.value);
      });

      input.addEventListener('keydown', handleInputKeydown);

      document.body.appendChild(modal);
    }

    // =========================================================================
    // RENDER LIST
    // =========================================================================

    function renderList(query) {
      if (!list) return;

      var q = (query || '').toLowerCase().trim();
      var allActions = getAllActions();
      currentItems = [];

      // Filter and flatten
      allActions.forEach(function (action) {
        var matchesQuery =
          !q ||
          action.label.toLowerCase().indexOf(q) !== -1 ||
          (action.keywords || []).join(' ').toLowerCase().indexOf(q) !== -1;

        if (action.isGroup && action.children) {
          // Check if group or any children match
          var childMatches = action.children.filter(function (child) {
            return child.label.toLowerCase().indexOf(q) !== -1;
          });

          if (matchesQuery || childMatches.length > 0) {
            // Add group
            currentItems.push({
              id: action.id,
              label: action.label,
              icon: action.icon || icons.folder,
              isGroup: true,
              expanded: expandedGroups[action.id] || q.length > 0,
              children: action.children,
            });

            // Add children if expanded or searching
            if (expandedGroups[action.id] || q.length > 0) {
              var kids = q ? childMatches : action.children;
              kids.forEach(function (child) {
                currentItems.push({
                  id: child.id,
                  label: child.label,
                  icon: child.icon,
                  action: child.action,
                  shortcut: child.shortcut,
                  isChild: true,
                });
              });
            }
          }
        } else if (matchesQuery && action.action) {
          currentItems.push(action);
        }
      });

      // Limit results
      currentItems = currentItems.slice(0, opts.maxResults);

      if (currentItems.length === 0) {
        list.innerHTML =
          '<div class="bw-command-empty"><div class="bw-command-empty-icon">' +
          icons.empty +
          '</div><div>No commands found</div></div>';
        return;
      }

      // Reset active index
      activeIndex = 0;

      // Find first actionable item
      for (var i = 0; i < currentItems.length; i++) {
        if (currentItems[i].action) {
          activeIndex = i;
          break;
        }
      }

      // Render
      var html = '';
      currentItems.forEach(function (item, i) {
        var isActive = i === activeIndex;
        var classes = 'bw-command-item';
        if (isActive) classes += ' bw-command-item--active';
        if (item.isGroup) classes += ' bw-command-item--group';
        if (item.expanded) classes += ' bw-command-item--expanded';
        if (item.isChild) classes += ' bw-command-item--child';

        html += '<div class="' + classes + '" data-index="' + i + '">';
        html +=
          '<span class="bw-command-item-icon">' +
          (item.icon || icons.search) +
          '</span>';
        html += '<span class="bw-command-item-label">' + item.label + '</span>';
        if (item.shortcut) {
          html +=
            '<span class="bw-command-item-shortcut">' +
            item.shortcut +
            '</span>';
        }
        if (item.isGroup) {
          html +=
            '<span class="bw-command-item-chevron">' +
            icons.chevronRight +
            '</span>';
        }
        html += '</div>';
      });

      list.innerHTML = html;

      // Add click handlers
      list.querySelectorAll('.bw-command-item').forEach(function (el) {
        el.addEventListener('click', function () {
          var idx = parseInt(el.dataset.index, 10);
          var item = currentItems[idx];
          if (item) {
            if (item.isGroup) {
              toggleGroup(item.id);
            } else if (item.action) {
              item.action();
              close();
            }
          }
        });
      });

      // Scroll active into view
      scrollActiveIntoView();
    }

    function toggleGroup(groupId) {
      expandedGroups[groupId] = !expandedGroups[groupId];
      renderList(input ? input.value : '');
    }

    function scrollActiveIntoView() {
      var activeEl = list.querySelector('.bw-command-item--active');
      if (activeEl) {
        activeEl.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }

    function setActiveIndex(newIndex) {
      // Clamp
      if (newIndex < 0) newIndex = currentItems.length - 1;
      if (newIndex >= currentItems.length) newIndex = 0;

      activeIndex = newIndex;

      // Update UI
      list.querySelectorAll('.bw-command-item').forEach(function (el, i) {
        el.classList.toggle('bw-command-item--active', i === activeIndex);
      });

      scrollActiveIntoView();
    }

    // =========================================================================
    // KEYBOARD HANDLING
    // =========================================================================

    function handleInputKeydown(e) {
      if (currentItems.length === 0) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIndex(activeIndex + 1);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIndex(activeIndex - 1);
      } else if (e.key === 'Tab') {
        e.preventDefault();
        var item = currentItems[activeIndex];
        if (item && item.isGroup) {
          toggleGroup(item.id);
        }
      } else if (e.key === 'Enter') {
        e.preventDefault();
        var item = currentItems[activeIndex];
        if (item) {
          if (item.isGroup) {
            toggleGroup(item.id);
          } else if (item.action) {
            item.action();
            close();
          }
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        close();
      }
    }

    // =========================================================================
    // OPEN / CLOSE
    // =========================================================================

    function open() {
      if (!modal) createModal();

      isOpen = true;
      expandedGroups = {};
      modal.classList.add('bw-command-modal--open');
      input.value = '';
      renderList('');

      setTimeout(function () {
        input.focus();
      }, 50);

      if (eventBus && eventBus.emit) {
        eventBus.emit('command:open');
      }
    }

    function close() {
      if (!modal) return;

      isOpen = false;
      modal.classList.remove('bw-command-modal--open');

      if (eventBus && eventBus.emit) {
        eventBus.emit('command:close');
      }
    }

    function toggle() {
      isOpen ? close() : open();
    }

    // =========================================================================
    // GLOBAL KEYBOARD SHORTCUT
    // =========================================================================

    if (opts.shortcut) {
      keyboardHandler = function (e) {
        var isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
        var modifier = isMac ? e.metaKey : e.ctrlKey;

        if (modifier && e.key.toLowerCase() === 'k') {
          e.preventDefault();
          e.stopPropagation();
          toggle();
        }
      };

      document.addEventListener('keydown', keyboardHandler, true);
    }

    // =========================================================================
    // CUSTOM ACTIONS API
    // =========================================================================

    function addAction(action) {
      if (action && action.id && action.label) {
        customActions.push(action);
      }
    }

    function removeAction(id) {
      customActions = customActions.filter(function (a) {
        return a.id !== id;
      });
    }

    // =========================================================================
    // EXTEND TABLE API
    // =========================================================================

    table.openCommand = open;
    table.closeCommand = close;
    table.toggleCommand = toggle;
    table.addCommandAction = addAction;
    table.removeCommandAction = removeAction;

    // =========================================================================
    // RETURN
    // =========================================================================

    return {
      name: 'command',
      open: open,
      close: close,
      toggle: toggle,
      addAction: addAction,
      removeAction: removeAction,
      destroy: function () {
        if (keyboardHandler) {
          document.removeEventListener('keydown', keyboardHandler, true);
        }
        if (modal && modal.parentNode) {
          modal.parentNode.removeChild(modal);
        }
        modal = null;
        input = null;
        list = null;
        delete table.openCommand;
        delete table.closeCommand;
        delete table.toggleCommand;
        delete table.addCommandAction;
        delete table.removeCommandAction;
      },
    };
  },
};

export default CommandPlugin;
