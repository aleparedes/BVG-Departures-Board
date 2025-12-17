/**
 * Class to handle text-related operations
 * Includes width measurement, truncation and sanitization
 */
export class TextUtils {
  #measureContext = document.createElement('canvas').getContext('2d'); // Context for text measurement

  /**
   * Measures text width with specific font
   * @param {string} text - Text to measure
   * @param {number} fontSize - Font size in pixels
   * @param {string} fontWeight - Font weight (default: '900')
   * @returns {number} Text width in pixels
   */
  measureTextWidth(text, fontSize, fontWeight = '900') {
    this.#measureContext.font = `${fontWeight} ${fontSize}px ${getComputedStyle(document.documentElement).getPropertyValue('--font-family')}`;
    return this.#measureContext.measureText(text).width;
  }

  /**
   * Calculates optimal font size based on available height
   * @param {number} maxHeight - Maximum available height
   * @param {number} factor - Scale factor (default: 0.78)
   * @returns {number} Calculated font size
   */
  calculateFontSize(maxHeight, factor = 0.78) {
    return Math.max(10, Math.floor(maxHeight * factor));
  }

  /**
   * Truncates text to fit within specific width
   * Uses binary search for efficiency
   * @param {string} text - Original text
   * @param {number} fontSize - Font size
   * @param {number} maxWidth - Maximum allowed width
   * @returns {string} Truncated text
   */
  truncateText(text, fontSize, maxWidth) {
    if (this.measureTextWidth(text, fontSize) <= maxWidth) {
      return text;
    }

    // Binary search to find optimal cut point
    let low = 0;
    let high = text.length;
    
    while (low < high) {
      const mid = Math.floor((low + high) / 2);
      const truncated = text.slice(0, mid);
      
      if (this.measureTextWidth(truncated, fontSize) <= maxWidth) {
        low = mid + 1;
      } else {
        high = mid;
      }
    }

    return text.slice(0, Math.max(0, low - 1));
  }

  /**
   * Sanitizes text for safe use in HTML/SVG
   * Escapes special characters that could cause issues
   * @param {string} text - Text to sanitize
   * @returns {string} Sanitized text
   */
  sanitizeText(text) {
    return String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }
}


