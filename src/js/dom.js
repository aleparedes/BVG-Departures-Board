/**
 * References to main DOM elements
 * Module scripts load after DOM is ready, so elements are available
 */
export const DOM = Object.freeze({
  get ledDisplay() { return document.getElementById('ledDisplay'); },
  get stationModal() { return document.getElementById('stationModal'); },
  get stationInput() { return document.getElementById('stationInput'); },
  get updateBtn() { return document.getElementById('updateStationBtn'); },
  get suggestions() { return document.getElementById('suggestions'); },
  get stationInfo() { return document.getElementById('stationInfo'); }
});

