import { CONFIG } from './config.js';
import { DOM } from './dom.js';

/**
 * Class to handle DOM rendering and visual updates
 * Manages creation of departure rows and LED display updates
 */
export class Renderer {
  constructor(textUtils, ledSVG, dataProcessor) {
    this.textUtils = textUtils;
    this.ledSVG = ledSVG;
    this.dataProcessor = dataProcessor;
  }

  createDepartureRow(departure, dotHeight, fontSize, destinationWidth, lineColumnWidth, etaColumnWidth, unitWidth) {
    const row = document.createElement('div');
    row.className = 'departure-row';

    // Check if arrival time is 0 minutes and add blinking class
    const minutes = this.dataProcessor.calculateMinutesUntil(departure.when);
    if (minutes === 0) {
      row.classList.add('arriving-now'); // Fast blinking for immediate arrival
    }

    // Line column
    const lineColumn = this.#createLineColumn(departure, dotHeight, fontSize, lineColumnWidth);
    row.appendChild(lineColumn);

    // Destination column
    const destinationColumn = this.#createDestinationColumn(departure, dotHeight, fontSize, destinationWidth);
    row.appendChild(destinationColumn);

    // ETA column
    const etaColumn = this.#createETAColumn(departure, dotHeight, fontSize, etaColumnWidth, unitWidth);
    row.appendChild(etaColumn);

    return row;
  }

  #createLineColumn(departure, dotHeight, fontSize, lineColumnWidth) {
    const lineColumn = document.createElement('div');
    lineColumn.className = 'departure-row__line';
    const lineCode = (departure.line || '').replace(/[^A-Za-z0-9]/g, '').slice(0, 4) || '—';
    lineColumn.innerHTML = this.ledSVG.generateSVG(
      lineCode, 
      lineColumnWidth - 8, 
      dotHeight, 
      fontSize, 
      { clipWidth: lineColumnWidth - 8, align: 'left' }
    );
    lineColumn.style.width = lineColumnWidth + 'px';
    return lineColumn;
  }

  #createDestinationColumn(departure, dotHeight, fontSize, destinationWidth) {
    const destinationColumn = document.createElement('div');
    destinationColumn.className = 'departure-row__destination';
    
    const fullText = departure.direction;
    const textWidth = this.textUtils.measureTextWidth(fullText, Math.floor(fontSize * CONFIG.textBoost));
    const availableWidth = destinationWidth - 2;
    
    // Activate scroll slightly before content would be cut off
    const marginBuffer = 100; // pixels buffer before activating scroll
    if (textWidth > (availableWidth - marginBuffer)) {
      destinationColumn.classList.add('scrollable');
      
      // Create truly infinite text with many repetitions
      const separator = '\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0';
      let infiniteText = '';
      for (let i = 0; i < 100; i++) {
        infiniteText += fullText + separator;
      }
      
      // Calculate total width needed for smooth scrolling
      const separatorWidth = this.textUtils.measureTextWidth(separator, Math.floor(fontSize * CONFIG.textBoost));
      const totalTextWidth = this.textUtils.measureTextWidth(infiniteText, Math.floor(fontSize * CONFIG.textBoost));
      const svgWidth = Math.max(destinationWidth * 2, totalTextWidth + 100); // Extra padding
      
      // Create wrapper div for smooth transform animation
      const wrapper = document.createElement('div');
      wrapper.className = 'scrolling-content';
      
      // Generate SVG content with proper width
      const svgContent = this.ledSVG.generateSVG(
        infiniteText, 
        svgWidth, 
        dotHeight, 
        fontSize, 
        { clipWidth: svgWidth, align: 'left' }
      );
      
      wrapper.innerHTML = svgContent;
      destinationColumn.appendChild(wrapper);
      
      // Use CSS animation with very long duration to avoid visible resets
      const baseSpeed = 150; // pixels per second (5x faster)
      const animationDuration = totalTextWidth / baseSpeed;
      wrapper.style.animationDuration = `${animationDuration}s`;
    } else {
      // Normal truncated text for shorter destinations
      const truncatedDestination = this.textUtils.truncateText(
        fullText, 
        Math.floor(fontSize * CONFIG.textBoost), 
        availableWidth
      );
      destinationColumn.innerHTML = this.ledSVG.generateSVG(
        truncatedDestination, 
        destinationWidth, 
        dotHeight, 
        fontSize, 
        { clipWidth: availableWidth, align: 'left' }
      );
    }
    
    return destinationColumn;
  }

  #createETAColumn(departure, dotHeight, fontSize, etaColumnWidth, unitWidth) {
    const etaColumn = document.createElement('div');
    etaColumn.className = 'departure-row__eta';
    etaColumn.style.width = etaColumnWidth + 'px';
    
    const minutes = this.dataProcessor.calculateMinutesUntil(departure.when);
    
    const numberWidth = etaColumnWidth - unitWidth - 4;

    // Minutes number
    const minutesElement = document.createElement('div');
    minutesElement.innerHTML = this.ledSVG.generateSVG(
      String(minutes), 
      numberWidth, 
      dotHeight, 
      fontSize, 
      { clipWidth: numberWidth - 2, align: 'right' }
    );
    etaColumn.appendChild(minutesElement);

    // Unit text
    const unitElement = document.createElement('div');
    unitElement.innerHTML = this.ledSVG.generateSVG(
      'Min', 
      unitWidth, 
      dotHeight, 
      fontSize, 
      { clipWidth: unitWidth - 2, align: 'left' }
    );
    etaColumn.appendChild(unitElement);

    return etaColumn;
  }

  renderDepartures(departures, totalHeight, destinationWidth, lineColumnWidth, etaColumnWidth, dotHeight, fontSize) {
    DOM.ledDisplay.innerHTML = '';
    const rowHeight = Math.ceil(totalHeight / CONFIG.maxRows);
    
    const baseUnitWidth = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--unit-width'));
    const dynamicUnitWidth = Math.max(baseUnitWidth, Math.floor(fontSize * 2.8));

    if (!departures.length) {
      this.#renderNoDeparturesMessage(destinationWidth, dotHeight, fontSize, rowHeight);
      return;
    }

    departures.forEach(departure => {
      const rowElement = this.createDepartureRow(
        departure, 
        dotHeight, 
        fontSize, 
        destinationWidth, 
        lineColumnWidth, 
        etaColumnWidth, 
        dynamicUnitWidth
      );
      rowElement.style.height = rowHeight + 'px';
      DOM.ledDisplay.appendChild(rowElement);
    });
  }

  #renderNoDeparturesMessage(destinationWidth, dotHeight, fontSize, rowHeight) {
    const row = document.createElement('div');
    row.className = 'departure-row';
    row.style.height = rowHeight + 'px';

    const destinationColumn = document.createElement('div');
    destinationColumn.className = 'departure-row__destination';
    const message = this.textUtils.truncateText(
      'Keine weiteren Fahrten 🚌', 
      Math.floor(fontSize * CONFIG.textBoost), 
      destinationWidth - 2
    );
    destinationColumn.innerHTML = this.ledSVG.generateSVG(
      message, 
      destinationWidth, 
      dotHeight, 
      fontSize, 
      { clipWidth: destinationWidth - 2, align: 'left' }
    );

    row.appendChild(document.createElement('div'));
    row.appendChild(destinationColumn);
    row.appendChild(document.createElement('div'));
    DOM.ledDisplay.appendChild(row);
  }

  renderMessage(message, isError = false) {
    DOM.ledDisplay.innerHTML = '';
    const messageElement = document.createElement('div');
    messageElement.className = 'led-message';
    messageElement.textContent = message;
    DOM.ledDisplay.appendChild(messageElement);

    if (isError) {
      // Error state will be handled by the calling function
      console.log("Rendering error message:", message);
    } else {
    }
  }
}

