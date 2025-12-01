/**
 * ============================================================================
 * Black & White UI Engineering
 * BWDataTable - EventBus
 * ============================================================================
 *
 * Central communication hub for the entire DataTable system.
 *
 * Patterns:
 * - Pub/Sub (on/off/emit)
 * - Intercept (modify or cancel events before listeners)
 *
 * Usage:
 *   bus.on('sort:change', (data) => {});
 *   bus.emit('sort:change', { column: 'name' });
 *   bus.intercept('sort:change', (data) => false); // Cancel
 *
 * @module core/EventBus
 * @version 1.0.0
 * @license MIT
 * ============================================================================
 */
export class EventBus {
  /** @type {Map<string, Set<Function>>} - Event listeners */
  #listeners = new Map();

  /** @type {Map<string, Set<Function>>} - Event interceptors (run before listeners) */
  #interceptors = new Map();

  /**
   * Subscribe to an event
   * @param {string} event - Event name (e.g., 'sort:change', 'filter:apply')
   * @param {Function} callback - Function to call when event fires
   * @returns {Function} Unsubscribe function
   *
   * @example
   *   const unsub = bus.on('row:click', (row) => console.log(row));
   *   unsub(); // Stop listening
   */
  on(event, callback) {
    if (!this.#listeners.has(event)) {
      this.#listeners.set(event, new Set());
    }
    this.#listeners.get(event).add(callback);

    return () => this.off(event, callback);
  }

  /**
   * Unsubscribe from an event
   * @param {string} event - Event name
   * @param {Function} callback - Original callback to remove
   */
  off(event, callback) {
    if (this.#listeners.has(event)) {
      this.#listeners.get(event).delete(callback);
    }
  }

  /**
   * Emit an event to all listeners
   * @param {string} event - Event name
   * @param {*} data - Data to pass to listeners
   * @returns {*} Modified data (if intercepted) or false (if cancelled)
   *
   * Flow:
   *   1. Run interceptors (can modify/cancel)
   *   2. If not cancelled, notify all listeners
   *
   * @example
   *   bus.emit('sort:change', { column: 'name', dir: 'asc' });
   */
  emit(event, data) {
    // Step 1: Run interceptors first (can modify or cancel)
    if (this.#interceptors.has(event)) {
      for (const interceptor of this.#interceptors.get(event)) {
        const result = interceptor(data);

        // Interceptor returned false = cancel event
        if (result === false) return false;

        // Interceptor returned new data = modify event
        if (result !== undefined) data = result;
      }
    }

    // Step 2: Notify all listeners with (possibly modified) data
    if (this.#listeners.has(event)) {
      for (const callback of this.#listeners.get(event)) {
        callback(data);
      }
    }

    return data;
  }

  /**
   * Intercept an event before it reaches listeners
   * Use to modify event data or cancel events entirely
   *
   * @param {string} event - Event name
   * @param {Function} callback - Interceptor function
   *   - Return `false` to cancel event
   *   - Return modified data to change what listeners receive
   *   - Return `undefined` to pass through unchanged
   * @returns {Function} Remove interceptor function
   *
   * @example
   *   // Cancel all sort events
   *   bus.intercept('sort:change', () => false);
   *
   *   // Force descending sort
   *   bus.intercept('sort:change', (data) => ({ ...data, dir: 'desc' }));
   *
   *   // Validate before allowing
   *   bus.intercept('cell:edit', (data) => {
   *     if (data.value < 0) return false; // Reject negative
   *     return data;
   *   });
   */
  intercept(event, callback) {
    if (!this.#interceptors.has(event)) {
      this.#interceptors.set(event, new Set());
    }
    this.#interceptors.get(event).add(callback);

    return () => this.#interceptors.get(event).delete(callback);
  }

  /**
   * Remove all listeners and interceptors
   * Call on destroy to prevent memory leaks
   */
  clear() {
    this.#listeners.clear();
    this.#interceptors.clear();
  }
}

export default EventBus;
