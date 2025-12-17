import { StateManager } from './state-manager.js';
import { TextUtils } from './text-utils.js';
import { LEDSVGGenerator } from './led-svg-generator.js';
import { DataProcessor } from './data-processor.js';
import { BusDepartureApp } from './app.js';

// ===== GLOBAL INSTANCES =====
/**
 * Global instances for backward compatibility
 * These are used by the main application class
 */
export const state = new StateManager();
export const textUtils = new TextUtils();
export const ledSVG = new LEDSVGGenerator(textUtils);
export const dataProcessor = new DataProcessor();

// ===== APPLICATION INITIALIZATION =====
/**
 * Initialize the application when DOM is ready
 * Creates main application instance and starts the system
 */
new BusDepartureApp();

