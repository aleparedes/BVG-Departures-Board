import { CONFIG } from './config.js';
import { DOM } from './dom.js';
import { StateManager } from './state-manager.js';
import { TextUtils } from './text-utils.js';
import { LEDSVGGenerator } from './led-svg-generator.js';
import { APIService } from './api-service.js';
import { DataProcessor } from './data-processor.js';
import { Renderer } from './renderer.js';

/**
 * Main application controller class
 * Orchestrates all components and manages the application lifecycle
 */
export class BusDepartureApp {
  #state;
  #textUtils;
  #ledSVG;
  #apiService;
  #dataProcessor;
  #renderer;

  constructor() {
    this.#state = new StateManager();
    this.#textUtils = new TextUtils();
    this.#ledSVG = new LEDSVGGenerator(this.#textUtils);
    this.#apiService = new APIService();
    this.#dataProcessor = new DataProcessor();
    this.#renderer = new Renderer(this.#textUtils, this.#ledSVG, this.#dataProcessor);
    
    this.#setupEventListeners();
    this.#startRefreshTimer();
    // Don't run automatically - wait for station selection
  }

  #setupEventListeners() {
    window.addEventListener('resize', () => this.run());
    setInterval(() => this.#state.updateRefreshStatus(), 1000);
    
    // Handle station input changes
    DOM.updateBtn.addEventListener('click', () => this.#updateStation());
    DOM.stationInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.#updateStation();
      }
    });

    // Autocomplete functionality
    let debounceTimer;
    DOM.stationInput.addEventListener('input', (e) => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        this.#handleInputChange(e.target.value);
      }, 300); // 300ms delay
    });

    // Hide suggestions when clicking outside
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.autocomplete-wrapper')) {
        this.#hideSuggestions();
      }
    });
  }

  #startRefreshTimer() {
    setInterval(() => this.run(), CONFIG.refreshInterval);
  }

  #updateStation() {
    const newStation = DOM.stationInput.value.trim();
    if (newStation && newStation !== CONFIG.stopQuery) {
      CONFIG.stopQuery = newStation;
      this.#hideModal();
      this.run();
    }
  }

  /**
   * Handle input changes for autocomplete
   * @param {string} value - Current input value
   */
  async #handleInputChange(value) {
    if (!value || value.length < 2) {
      this.#hideSuggestions();
      return;
    }

    try {
      const suggestions = await this.#apiService.searchSuggestions(value);
      this.#showSuggestions(suggestions);
    } catch (error) {
      console.warn("Error fetching suggestions:", error);
      this.#hideSuggestions();
    }
  }

  /**
   * Show suggestions dropdown
   * @param {Array} suggestions - Array of suggestion objects
   */
  #showSuggestions(suggestions) {
    if (!suggestions || suggestions.length === 0) {
      this.#hideSuggestions();
      return;
    }

    DOM.suggestions.innerHTML = suggestions
      .map(suggestion => `<div class="suggestion-item" data-name="${suggestion.name}">${suggestion.name}</div>`)
      .join('');

    // Add click listeners to suggestions
    DOM.suggestions.querySelectorAll('.suggestion-item').forEach(item => {
      item.addEventListener('click', () => {
        const stationName = item.dataset.name;
        DOM.stationInput.value = stationName;
        this.#hideSuggestions();
        this.#updateStation();
      });
    });

    DOM.suggestions.style.display = 'block';
  }

  /**
   * Hide suggestions dropdown
   */
  #hideSuggestions() {
    DOM.suggestions.style.display = 'none';
    DOM.suggestions.innerHTML = '';
  }

  /**
   * Hide the station selection modal
   */
  #hideModal() {
    DOM.stationModal.style.display = 'none';
  }

  #calculateLayout() {
    const totalHeight = DOM.ledDisplay.clientHeight;
    const dotHeight = Math.floor(totalHeight / CONFIG.dotBaselineRows);
    const lineColumnWidth = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--line-width'));
    
    const fontSize = this.#textUtils.calculateFontSize(dotHeight, 0.78);
    const baseEtaWidth = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--eta-width'));
    const dynamicEtaWidth = Math.max(baseEtaWidth, Math.floor(fontSize * 4.8));
    
    // Calculate extra width for 4 additional characters
    const extraCharWidth = Math.floor(fontSize * CONFIG.textBoost * 0.6 * parseInt(getComputedStyle(document.documentElement).getPropertyValue('--destination-extra-chars')));
    const destinationWidth = Math.floor(DOM.ledDisplay.clientWidth - lineColumnWidth - dynamicEtaWidth - 6) + extraCharWidth;

    return {
      totalHeight,
      dotHeight,
      lineColumnWidth,
      etaColumnWidth: dynamicEtaWidth,
      destinationWidth,
      fontSize
    };
  }

  async run() {
    if (this.#state.isLoading) return;

    if (!CONFIG.stopQuery) {
      this.#renderer.renderMessage("❌ FEHLER: Bitte 'stopQuery' Variable einstellen. ❌", true);
      this.#state.setError();
      return;
    }

    const layout = this.#calculateLayout();

    // Don't show loading message during refresh - keep current display

    // Fetch fresh data from API
    this.#state.setLoading(true);
    
    try {
      const departures = await this.#apiService.loadDepartureData();
      
      const processedDepartures = this.#dataProcessor.processDepartures(departures || []);
      
      this.#renderer.renderDepartures(
        processedDepartures, 
        layout.totalHeight, 
        layout.destinationWidth, 
        layout.lineColumnWidth, 
        layout.etaColumnWidth, 
        layout.dotHeight, 
        layout.fontSize
      );
      
      this.#state.updateRefreshTime();
    } catch (error) {
      console.error("Critical error fetching data:", error);
      this.#renderer.renderMessage("❌ API/Netzwerkfehler ❌\nVerbindung prüfen.", true);
      this.#state.setError();
    } finally {
      this.#state.setLoading(false);
    }
  }
}

