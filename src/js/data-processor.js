import { CONFIG } from './config.js';

/**
 * Class to process and normalize API data
 * Handles data transformation and filtering for display
 */
export class DataProcessor {
  normalizeDeparture(departure) {
    return {
      when: departure.when || departure.plannedWhen,
      plannedWhen: departure.plannedWhen,
      line: departure.line?.name || departure.line?.id || '',
      direction: departure.direction || departure.destination?.name || departure.directionId || '—',
      cancelled: !!departure.cancelled,
      delay: departure.delay || 0,
      // Additional fields for validation
      remarks: departure.remarks || [],
      // Real-time status indicator
      realtimeDataUpdatedAt: departure.realtimeDataUpdatedAt
    };
  }

  processDepartures(departures) {
    const now = new Date();
    const maxDepartureTime = new Date(now.getTime() + (CONFIG.lookAheadMinutes * 60 * 1000));
    
    
    return departures
      .map(dep => this.normalizeDeparture(dep))
      .filter(dep => {
        // Basic validation
        if (!dep.when || dep.cancelled) {
          return false;
        }

        const departureTime = new Date(dep.when);
        
        // Filter out departures that are too far in the future
        if (departureTime > maxDepartureTime) {
          return false;
        }

        // Filter out departures that are significantly in the past
        // Allow some tolerance for delays (up to 5 minutes past)
        const fiveMinutesAgo = new Date(now.getTime() - (5 * 60 * 1000));
        if (departureTime < fiveMinutesAgo) {
          return false;
        }

        // Additional validation for real-time data
        if (dep.realtimeDataUpdatedAt) {
          const dataAge = now.getTime() - new Date(dep.realtimeDataUpdatedAt).getTime();
          // If real-time data is older than 10 minutes, be more cautious
          if (dataAge > (10 * 60 * 1000)) {
            // Only show if departure is still reasonable
            const plannedTime = new Date(dep.plannedWhen || dep.when);
            const timeDiff = Math.abs(departureTime.getTime() - plannedTime.getTime());
            // If actual time differs significantly from planned (>15 min), skip
            if (timeDiff > (15 * 60 * 1000)) {
              return false;
            }
          }
        }

        // Check for problematic remarks that might indicate issues
        if (dep.remarks && dep.remarks.length > 0) {
          const problematicRemarks = [
            'cancelled', 'cancellation', 'ausfall', 'entfällt',
            'not operating', 'nicht in betrieb', 'service suspended'
          ];
          
          const hasProblematicRemark = dep.remarks.some(remark => {
            const remarkText = (remark.text || remark).toLowerCase();
            return problematicRemarks.some(problem => remarkText.includes(problem));
          });
          
          if (hasProblematicRemark) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => new Date(a.when) - new Date(b.when))
      .slice(0, CONFIG.maxRows);
  }

  calculateMinutesUntil(departureTime) {
    const now = new Date();
    const departure = new Date(departureTime);
    const minutes = Math.round((departure.getTime() - now.getTime()) / 60000);
    
    // Return 0 for past departures, but allow some tolerance for delays
    return Math.max(0, minutes);
  }

}


