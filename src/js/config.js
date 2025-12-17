/**
 * Main application configuration
 */
export const CONFIG = {
  stopQuery: "Alexanderplatz",          // 🚨 STOP NAME - CONFIGURE HERE 🚨
  maxRows: 5,                          // Maximum number of rows to display
  dotBaselineRows: 6,                  // Base rows for LED dot height calculation
  lookAheadMinutes: 60,                // Minutes ahead to search for departures
  refreshInterval: 30000,               // Refresh interval in milliseconds (30s)
  textBoost: 1.21,                     // Text size amplification factor
  ledScale: 0.7,                       // LED dot scale
  attenuateGlow: 0.9                   // LED glow attenuation factor
};

/**
 * Public transport API endpoints
 */
export const API_ENDPOINTS = Object.freeze([
  "https://v6.bvg.transport.rest",     // Primary BVG API (Berlin)
  "https://v6.vbb.transport.rest"      // Secondary VBB API (Brandenburg)
]);

