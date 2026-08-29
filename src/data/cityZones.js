/**
 * Hyperlocal Locality & Colony Coordinate Registry
 * Provides precise lat/lng anchors for mohallas, schemes, and markets across Alwar.
 */

export const CITY_ZONES = {
  // ── Alwar Urban & Residential Schemes ─────────────────────────
  'Scheme 1': { lat: 27.5621, lng: 76.6105, radiusKm: 1.2 },
  'Scheme 2': { lat: 27.5654, lng: 76.6142, radiusKm: 1.2 },
  'Scheme 3': { lat: 27.5688, lng: 76.6189, radiusKm: 1.2 },
  'Scheme 4': { lat: 27.5712, lng: 76.6215, radiusKm: 1.5 },
  'Scheme 8': { lat: 27.5775, lng: 76.6268, radiusKm: 1.5 },
  'Scheme 10': { lat: 27.5842, lng: 76.6321, radiusKm: 1.8 },

  // ── Prominent Colonies & Residential Sectors ──────────────────
  'Budh Vihar': { lat: 27.5412, lng: 76.6025, radiusKm: 2.0 },
  'Kala Kuan': { lat: 27.5489, lng: 76.6087, radiusKm: 1.5 },
  'Housing Board': { lat: 27.5465, lng: 76.6052, radiusKm: 1.5 },
  'Shivaji Park': { lat: 27.5742, lng: 76.6385, radiusKm: 1.8 },
  'Arya Nagar': { lat: 27.5582, lng: 76.6041, radiusKm: 1.2 },
  'Daudpur': { lat: 27.5601, lng: 76.6092, radiusKm: 1.2 },
  'Manu Marg': { lat: 27.5595, lng: 76.6154, radiusKm: 1.0 },
  'Malviya Nagar': { lat: 27.5518, lng: 76.6210, radiusKm: 1.4 },
  'Moti Nagar': { lat: 27.5450, lng: 76.6110, radiusKm: 1.2 },
  'Moti Doongri': { lat: 27.5562, lng: 76.6285, radiusKm: 1.5 },
  'Surya Nagar': { lat: 27.5891, lng: 76.6412, radiusKm: 2.0 },
  'Shalimar': { lat: 27.5954, lng: 76.6482, radiusKm: 2.5 },
  'Hasan Khan Mewati Nagar': { lat: 27.5385, lng: 76.5982, radiusKm: 2.0 },
  'NEB Colony': { lat: 27.5762, lng: 76.6451, radiusKm: 1.8 },
  'Subhash Nagar': { lat: 27.5721, lng: 76.6419, radiusKm: 1.5 },

  // ── Central Commercial Hubs & Historic Markets ────────────────
  'Hope Circus': { lat: 27.5530, lng: 76.6068, radiusKm: 0.8 },
  'Church Road': { lat: 27.5552, lng: 76.6121, radiusKm: 0.8 },
  'Bazaza Bazar': { lat: 27.5515, lng: 76.6045, radiusKm: 0.6 },
  'Purana Bazar': { lat: 27.5498, lng: 76.6032, radiusKm: 0.8 },
  'Munshi Bazar': { lat: 27.5541, lng: 76.6079, radiusKm: 0.6 },
  'Station Road': { lat: 27.5684, lng: 76.6231, radiusKm: 1.2 },
  'Ambedkar Circle': { lat: 27.5615, lng: 76.6192, radiusKm: 1.0 },
  'Bhagat Singh Circle': { lat: 27.5575, lng: 76.6165, radiusKm: 0.8 },
  'Jail Chauraha': { lat: 27.5638, lng: 76.6210, radiusKm: 1.0 },
  'Company Bagh': { lat: 27.5580, lng: 76.6245, radiusKm: 1.0 },

  // ── Industrial, Transport & Transit Outskirts ─────────────────
  'MIA (Matsya Industrial Area)': { lat: 27.5185, lng: 76.6720, radiusKm: 4.0 },
  'Transport Nagar': { lat: 27.5812, lng: 76.6521, radiusKm: 2.0 },
  'Tijara Phatak': { lat: 27.5732, lng: 76.6295, radiusKm: 1.2 },
  'Delhi Road': { lat: 27.5910, lng: 76.6450, radiusKm: 3.0 },
  'Jaipur Road': { lat: 27.5290, lng: 76.5920, radiusKm: 3.0 },
  'Town Center': { lat: 27.5530, lng: 76.6346, radiusKm: 2.0 },
};

// Aliased export for legacy camelCase imports
export const cityZones = CITY_ZONES;

/**
 * Resolves approximate coordinates for a given locality query string.
 * Falls back to Town Center if no exact or partial match is found.
 */
export function resolveLocalityCoordinates(localityName = '', fallbackCity = 'Alwar') {
  if (!localityName || typeof localityName !== 'string') {
    return CITY_ZONES['Town Center'];
  }

  const cleanQuery = localityName.toLowerCase().trim();

  // 1. Exact Match
  for (const [zoneKey, coords] of Object.entries(CITY_ZONES)) {
    if (zoneKey.toLowerCase() === cleanQuery) {
      return coords;
    }
  }

  // 2. Substring Match (e.g. "Budh Vihar Phase 2" -> "Budh Vihar")
  for (const [zoneKey, coords] of Object.entries(CITY_ZONES)) {
    const cleanZone = zoneKey.toLowerCase();
    if (cleanQuery.includes(cleanZone) || cleanZone.includes(cleanQuery)) {
      return coords;
    }
  }

  return CITY_ZONES['Town Center'];
}

export default CITY_ZONES;

/**
 * Computes the nearest Alwar colony/locality given current latitude & longitude.
 */
export function findNearestColony(lat, lng) {
  if (!lat || !lng) return 'Town Center';
  let closestName = 'Town Center';
  let minDistance = Infinity;

  for (const [zoneKey, data] of Object.entries(CITY_ZONES)) {
    if (!data.lat || !data.lng) continue;
    const dLat = data.lat - lat;
    const dLng = data.lng - lng;
    const dist = Math.sqrt(dLat * dLat + dLng * dLng);
    if (dist < minDistance) {
      minDistance = dist;
      closestName = zoneKey;
    }
  }
  return closestName;
}