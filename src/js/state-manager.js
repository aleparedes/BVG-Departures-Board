import { CONFIG } from './config.js';

/**
 * Class to handle application state
 */
export class StateManager {
  #isLoading = false;             // Current loading state

  /**
   * Getter to check if application is loading data
   * @returns {boolean} true if loading, false otherwise
   */
  get isLoading() {
    return this.#isLoading;
  }

  /**
   * Sets loading state and updates UI
   * @param {boolean} loading - New loading state
   */
  setLoading(loading) {
    this.#isLoading = loading;
    this.#updateRefreshStatus();
  }

  /**
   * Updates timestamp of last successful refresh
   * and refreshes visual state
   */
  updateRefreshTime() {
    this.#updateRefreshStatus();
  }

  /**
   * Updates visual state of refresh indicator
   * Shows different states: loading, updated, error
   * @private
   */
  #updateRefreshStatus() {
    // No UI updates needed - only LED display
  }

  /**
   * Sets error state and updates UI
   */
  setError() {
    // Error state handled by LED display
  }

  /**
   * Public method to update refresh status display
   * Used by external timers
   */
  updateRefreshStatus() {
    this.#updateRefreshStatus();
  }
}


