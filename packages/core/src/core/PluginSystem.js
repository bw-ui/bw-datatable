/**
 * ============================================================================
 * Black & White UI Engineering
 * BWDataTable - PluginSystem
 * ============================================================================
 *
 * Plugin architecture for extending DataTable functionality.
 *
 * Features:
 * - Register/unregister plugins
 * - Plugin lifecycle (init, destroy)
 * - API injection (plugins get access to core systems)
 * - Plugin dependencies (optional)
 *
 * Plugin Structure:
 *   {
 *     name: 'my-plugin',
 *     init(api) { return instance; },
 *     destroy(instance) { }
 *   }
 *
 * API Provided to Plugins:
 *   state, setState, getState, eventBus, slots, options, table
 *
 * @module core/PluginSystem
 * @version 1.0.0
 * @license MIT
 * ============================================================================
 */

export class PluginSystem {
  /** @type {Map<string, Object>} - Registered plugins { name: { plugin, instance, options } } */
  #plugins = new Map();

  /** @type {Object} - API object shared with plugins */
  #api = null;

  /** @type {EventBus} - For plugin events */
  #eventBus;

  /**
   * @param {EventBus} eventBus - EventBus instance
   */
  constructor(eventBus) {
    this.#eventBus = eventBus;
  }

  /**
   * Set the API object that plugins receive
   * Called by BWDataTable after all core systems initialized
   *
   * @param {Object} api - API object with state, eventBus, slots, etc.
   */
  setAPI(api) {
    this.#api = api;
  }

  /**
   * Register and init a plugin
   *
   * @param {Object} plugin - Plugin definition
   * @param {string} plugin.name - Unique plugin name
   * @param {Function} plugin.init - init function, receives API, returns instance
   * @param {Function} [plugin.destroy] - Cleanup function, receives instance
   * @param {Array} [plugin.dependencies] - Required plugin names
   * @param {Object} options - Plugin-specific options
   * @returns {Object} Plugin instance (for chaining table.use().use())
   *
   * @example
   *   pluginSystem.register(UndoPlugin, { maxHistory: 100 });
   */
  register(plugin, options = {}) {
    const { name, init, dependencies = [] } = plugin;

    // Validate
    if (!name) {
      throw new Error('Plugin must have a name');
    }
    if (this.#plugins.has(name)) {
      console.warn(`Plugin "${name}" already registered, skipping`);
      return this.#plugins.get(name).instance;
    }
    if (typeof init !== 'function') {
      throw new Error(`Plugin "${name}" must have init function`);
    }

    // Check dependencies
    for (const dep of dependencies) {
      if (!this.#plugins.has(dep)) {
        throw new Error(`Plugin "${name}" requires "${dep}" plugin`);
      }
    }

    // init plugin with API + options
    const instance = init({
      ...this.#api,
      options,
    });

    // Store plugin
    this.#plugins.set(name, {
      plugin,
      instance,
      options,
    });

    // Emit event
    this.#eventBus.emit('plugin:registered', { name, instance });

    return instance;
  }

  /**
   * Unregister and destroy a plugin
   *
   * @param {string} name - Plugin name
   *
   * @example
   *   pluginSystem.unregister('undo');
   */
  unregister(name) {
    if (!this.#plugins.has(name)) {
      console.warn(`Plugin "${name}" not found`);
      return;
    }

    const { plugin, instance } = this.#plugins.get(name);

    // Call destroy if exists
    if (typeof plugin.destroy === 'function') {
      plugin.destroy(instance);
    }

    // Remove plugin
    this.#plugins.delete(name);

    // Emit event
    this.#eventBus.emit('plugin:unregistered', { name });
  }

  /**
   * Get a plugin instance by name
   *
   * @param {string} name - Plugin name
   * @returns {Object|null} Plugin instance or null
   *
   * @example
   *   const undoPlugin = pluginSystem.get('undo');
   *   undoPlugin.undo();
   */
  get(name) {
    return this.#plugins.get(name)?.instance || null;
  }

  /**
   * Check if a plugin is registered
   *
   * @param {string} name - Plugin name
   * @returns {boolean}
   */
  has(name) {
    return this.#plugins.has(name);
  }

  /**
   * Get all registered plugin names
   *
   * @returns {string[]} Array of plugin names
   */
  list() {
    return [...this.#plugins.keys()];
  }

  /**
   * Destroy all plugins and clear registry
   * Called when DataTable is destroyed
   */
  destroyAll() {
    for (const [name, { plugin, instance }] of this.#plugins) {
      if (typeof plugin.destroy === 'function') {
        plugin.destroy(instance);
      }
    }
    this.#plugins.clear();
    this.#eventBus.emit('plugin:destroyedAll');
  }
}

export default PluginSystem;
