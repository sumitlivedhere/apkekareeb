/**
 * Municipal Town Center Geographic Coordinates Database
 */
export const TOWN_CENTERS = {
  Alwar: {
    lat: 27.5530,
    lng: 76.6346,
    name: 'Alwar Municipal Core',
    maxRadiusKm: 15,
    coreRadiusKm: 5,
  },
  Jaipur: {
    lat: 26.9124,
    lng: 75.7873,
    name: 'Jaipur Urban Zone',
    maxRadiusKm: 25,
    coreRadiusKm: 8,
  },
};

/**
 * Calculates great-circle distance between two GPS points using the Haversine formula
 * @returns {number} Distance in kilometers
 */
export function calculateHaversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's mean radius in kilometers
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Number((R * c).toFixed(2));
}

/**
 * Requests high-accuracy browser GPS coordinates
 * @returns {Promise<{ lat: number, lng: number, accuracy: number }>}
 */
export function getLiveBrowserCoordinates() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by your browser.'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        resolve({
          lat: Number(pos.coords.latitude.toFixed(6)),
          lng: Number(pos.coords.longitude.toFixed(6)),
          accuracy: Math.round(pos.coords.accuracy),
        });
      },
      (err) => {
        let msg = 'Could not acquire GPS fix.';
        if (err.code === 1) msg = 'Location permission was denied.';
        if (err.code === 2) msg = 'Location unavailable or GPS disabled.';
        if (err.code === 3) msg = 'Location request timed out.';
        reject(new Error(msg));
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  });
}

/**
 * Validates whether user coordinates fall within the municipal geofence boundary
 */
export function verifyTownResidency(userLat, userLng, targetCity = 'Alwar') {
  const center = TOWN_CENTERS[targetCity] || TOWN_CENTERS.Alwar;
  const distanceKm = calculateHaversineDistance(userLat, userLng, center.lat, center.lng);

  return {
    isWithinBoundary: distanceKm <= center.maxRadiusKm,
    isWithinCore: distanceKm <= center.coreRadiusKm,
    distanceKm,
    maxAllowedKm: center.maxRadiusKm,
    cityName: targetCity,
  };
}