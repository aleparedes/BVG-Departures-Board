import { CONFIG } from './config.js';

/**
 * Class to generate LED-style SVG text with realistic effects
 * Creates pixelated text with glow effects and dot patterns
 */
export class LEDSVGGenerator {
  constructor(textUtils) {
    this.textUtils = textUtils;
  }

  /**
   * Generates LED-style SVG text with visual effects
   * @param {string} text - Text to render
   * @param {number} width - SVG width
   * @param {number} height - SVG height
   * @param {number} fontSize - Font size
   * @param {Object} options - Rendering options (align, clipWidth)
   * @returns {string} Complete SVG markup
   */
  generateSVG(text, width, height, fontSize, options = {}) {
    const basePitch = Math.max(4, Math.floor(height / 10));
    const pitch = Math.max(3, Math.floor(basePitch * CONFIG.ledScale));
    const radius = Math.max(2, Math.floor(pitch * 0.40));
    const padding = Math.floor(pitch * 0.85);
    const glow = Math.max(0.4, Math.min(1.0, CONFIG.attenuateGlow || 1));
    const fontSizeBoost = Math.floor(fontSize * CONFIG.textBoost);
    const sanitizedText = this.textUtils.sanitizeText(text);
    const uniqueId = `led-${Math.random().toString(36).slice(2, 8)}`;
    
    const clipWidth = Math.max(10, (options.clipWidth ?? (width - padding * 2)));
    const align = options.align || 'left';
    const x = align === 'right' ? (width - padding) : padding;
    const textAnchor = align === 'right' ? 'end' : 'start';
    const y = height * 0.72;
  
    const glowColor = 'var(--color-led-glow)';
    const hotColor = '#ffe6a3';

    return `
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" preserveAspectRatio="xMidYMid meet" style="display:block">
    <defs>
              <pattern id="${uniqueId}-dots" patternUnits="userSpaceOnUse" width="${pitch}" height="${pitch}">
                <radialGradient id="${uniqueId}-g" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="${hotColor}"/>
          <stop offset="55%" stop-color="${glowColor}"/>
          <stop offset="100%" stop-color="#563800"/>
        </radialGradient>
                <circle cx="${radius}" cy="${radius}" r="${radius}" fill="url(#${uniqueId}-g)"/>
      </pattern>
              <filter id="${uniqueId}-dilate">
                <feMorphology operator="dilate" radius="${Math.max(0, Math.floor(radius * 0.28))}"/>
      </filter>
              <filter id="${uniqueId}-glow" x="-12%" y="-12%" width="124%" height="124%">
                <feGaussianBlur stdDeviation="${Math.max(0.4, radius * 0.28)}" result="b"/>
        <feComponentTransfer>
          <feFuncA type="linear" slope="${glow}"/>
        </feComponentTransfer>
          <feMerge>
          <feMergeNode in="b"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
              <clipPath id="${uniqueId}-clip">
                <rect x="${align === 'right' ? (width - clipWidth - padding) : 0}" y="0" width="${clipWidth}" height="${height}"/>
              </clipPath>
              <mask id="${uniqueId}-mask">
        <rect width="100%" height="100%" fill="black"/>
                <g filter="url(#${uniqueId}-dilate)" clip-path="url(#${uniqueId}-clip)">
                  <text class="svg-text" x="${x}" y="${y}" text-anchor="${textAnchor}" 
                        font-family="var(--font-family)" 
                        font-weight="900" 
                        font-size="${fontSizeBoost}" 
                        fill="white" 
                        letter-spacing="-0.01em">${sanitizedText}</text>
        </g>
      </mask>
    </defs>
            <rect width="100%" height="100%" fill="url(#${uniqueId}-dots)" mask="url(#${uniqueId}-mask)" filter="url(#${uniqueId}-glow)"/>
  </svg>`;
  }
}

