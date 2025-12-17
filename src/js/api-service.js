import { CONFIG, API_ENDPOINTS } from './config.js';
import { DOM } from './dom.js';

/**
 * Class to handle API communication and data fetching
 * Manages requests to public transport APIs with fallback support
 */
export class APIService {
  async #findStops(stopName, apiBase) {
    if (!stopName) {
      throw new Error("Stop query is empty.");
    }

    // Use more specific search parameters according to API docs
    const url = `${apiBase}/locations?query=${encodeURIComponent(stopName)}&results=5&stops=true&addresses=false&poi=false&fuzzy=true&pretty=false`;
    const response = await fetch(url, { cache: "no-store" });
    
    if (!response.ok) {
      throw new Error(`findStops ${apiBase}: ${response.status}`);
    }

    const data = await response.json();
    
    return data
      .filter(item => item.type === "stop")
      .slice(0, 1) // Only take the first (most relevant) result
      .map(stop => ({ id: stop.id, name: stop.name }));
  }

  /**
   * Search for station suggestions as user types
   * @param {string} query - Search query
   * @returns {Array} Array of station suggestions
   */
  async searchSuggestions(query) {
    if (!query || query.length < 2) {
      return [];
    }

    try {
      const url = `${API_ENDPOINTS[0]}/locations?query=${encodeURIComponent(query)}&results=8&stops=true&addresses=false&poi=false&fuzzy=true&pretty=false`;
      const response = await fetch(url, { cache: "no-store" });
      
      if (!response.ok) {
        return [];
      }

      const data = await response.json();
      return data
        .filter(item => item.type === "stop")
        .map(stop => ({ id: stop.id, name: stop.name }));
    } catch (error) {
      console.warn("Error fetching suggestions:", error);
      return [];
    }
  }

  async #fetchDepartures(stopId, apiBase) {
    const params = new URLSearchParams({
      duration: String(CONFIG.lookAheadMinutes),
      remarks: 'false',           // Don't include hints & warnings
      subStops: 'false',           // Don't include sub-stops
      entrances: 'false',         // Don't include entrances
      pretty: 'false'             // Don't pretty-print JSON
    });

    const url = `${apiBase}/stops/${encodeURIComponent(stopId)}/departures?${params.toString()}`;
    const response = await fetch(url, { cache: "no-store" });
    
    if (!response.ok) {
      throw new Error(`departures ${apiBase} ${stopId}: ${response.status}`);
    }

    const data = await response.json();
    return Array.isArray(data) ? data : (data.departures || []);
  }

  async loadDepartureData() {
    if (!CONFIG.stopQuery) {
      throw new Error("❌ FEHLER: Haltestellenabfrage fehlt. Bitte 'stopQuery' Variable prüfen.");
    }
  
    for (const apiBase of API_ENDPOINTS) {
      try {
        const stops = await this.#findStops(CONFIG.stopQuery, apiBase);
        
        if (stops.length) {
          DOM.stationInfo.textContent = stops[0].name || CONFIG.stopQuery;
        }

        const departurePromises = stops.map(stop => this.#fetchDepartures(stop.id, apiBase));
        const results = await Promise.allSettled(departurePromises);
        const departures = results
          .filter(result => result.status === 'fulfilled')
          .flatMap(result => result.value);

        if (departures.length > 0) {
          return departures;
        }
      } catch (error) {
        console.warn(`API failure ${apiBase}:`, error);
      }
    }

    throw new Error("Alle Datenquellen sind fehlgeschlagen.");
  }
}

