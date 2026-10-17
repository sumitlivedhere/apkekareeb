import { useState, useCallback } from 'react';
import { CITY_ZONES } from '../data/cityZones';

const GPS_SESSION_KEY = 'aapkekareeb_live_gps';

// 📍 Comprehensive Alwar Landmarks, Markets & Tourist Spot Coordinates
const ALWAR_LANDMARK_COORDS = {
  'hope circus': { lat: 27.5625, lng: 76.6142 },
  'church road': { lat: 27.5632, lng: 76.6151 },
  'bhagat singh circle': { lat: 27.5678, lng: 76.6195 },
  'moti dungri': { lat: 27.5545, lng: 76.6188 },
  'scheme no. 2': { lat: 27.5715, lng: 76.6235 },
  'scheme 2': { lat: 27.5715, lng: 76.6235 },
  'lajpat nagar': { lat: 27.5722, lng: 76.6241 },
  'scheme 1': { lat: 27.5655, lng: 76.6182 },
  'scheme 8': { lat: 27.5785, lng: 76.6312 },
  'scheme 10': { lat: 27.5812, lng: 76.6345 },
  'budh vihar': { lat: 27.5835, lng: 76.6285 },
  'kala kuan': { lat: 27.5435, lng: 76.6052 },
  'manu marg': { lat: 27.5592, lng: 76.6168 },
  'kali mori': { lat: 27.5742, lng: 76.6115 },
  'railway station': { lat: 27.5698, lng: 76.6275 },
  'bus stand': { lat: 27.5582, lng: 76.6122 },
  'kedalganj': { lat: 27.5648, lng: 76.6095 },
  'malan ki gali': { lat: 27.5612, lng: 76.6075 },
  'bajajkhana': { lat: 27.5605, lng: 76.6062 },
  'vaishali nagar': { lat: 27.5865, lng: 76.6215 },
  'surya nagar': { lat: 27.5842, lng: 76.6192 },
  'amritpuri': { lat: 27.5495, lng: 76.6105 },
  'shivaji park': { lat: 27.5768, lng: 76.6175 },
  'neb': { lat: 27.5795, lng: 76.6385 },
  'mia': { lat: 27.5285, lng: 76.6895 },
  'matsya industrial': { lat: 27.5285, lng: 76.6895 },
  'old rao hotel': { lat: 27.5512, lng: 76.6215 },
  'jai paltan': { lat: 27.5528, lng: 76.5995 },
  'bala quila': { lat: 27.5805, lng: 76.5895 },
  'moosi maharani': { lat: 27.5762, lng: 76.5965 },
  'siliserh': { lat: 27.5215, lng: 76.5325 },
  'kishanpur': { lat: 27.5265, lng: 76.5445 },
  'sariska': { lat: 27.3285, lng: 76.4325 },
  'bhangarh': { lat: 27.0965, lng: 76.2865 },
  'garbhaji': { lat: 27.5085, lng: 76.5512 },
  'alwar': { lat: 27.5625, lng: 76.6142 },
};

/**
 * 📐 Haversine formula: Calculates exact distance in kilometers between two GPS coordinates
 */
export function calculateDistanceKm(lat1, lon1, lat2, lon2) {
  if (
    lat1 === null || lat1 === undefined ||
    lon1 === null || lon1 === undefined ||
    lat2 === null || lat2 === undefined ||
    lon2 === null || lon2 === undefined
  ) {
    return null;
  }

  const R = 6371; // Earth's radius in km
  const dLat = ((Number(lat2) - Number(lat1)) * Math.PI) / 180;
  const dLon = ((Number(lon2) - Number(lon1)) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((Number(lat1) * Math.PI) / 180) *
      Math.cos((Number(lat2) * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Number((R * c).toFixed(2));
}

/**
 * 🧭 Calculates 8-point compass direction (N, NE, E, SE, S, SW, W, NW) from User GPS to Listing
 */
export function calculateCompassDirection(lat1, lon1, lat2, lon2) {
  if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) return '';
  const φ1 = (Number(lat1) * Math.PI) / 180;
  const φ2 = (Number(lat2) * Math.PI) / 180;
  const Δλ = ((Number(lon2) - Number(lon1)) * Math.PI) / 180;

  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x =
    Math.cos(φ1) * Math.sin(φ2) -
    Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);

  const θ = Math.atan2(y, x);
  const brng = ((θ * 180) / Math.PI + 360) % 360;
  const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  return directions[Math.round(brng / 45) % 8];
}

/**
 * ⏱️ Estimates travel time (Walking for <= 1.2 km, Two-Wheeler/Car for > 1.2 km)
 */
export function formatTravelEstimate(distanceKm) {
  if (distanceKm === null || distanceKm === undefined || isNaN(distanceKm)) return null;
  if (distanceKm < 0.15) {
    return { icon: '🚶', label: 'Right here (< 2 min walk)', mode: 'walk' };
  }
  if (distanceKm <= 1.2) {
    const walkMins = Math.max(2, Math.round((distanceKm / 4.8) * 60));
    return { icon: '🚶', label: `~${walkMins} min walk`, mode: 'walk' };
  }
  const driveMins = Math.max(3, Math.round((distanceKm / 26) * 60));
  return { icon: '🛵', label: `~${driveMins} min ride`, mode: 'ride' };
}

/**
 * 🗺️ Builds a direct Google Maps Turn-by-Turn Directions URL from User GPS to Listing
 */
export function buildGoogleMapsRouteUrl(userCoords, item, itemCoords) {
  const destQuery =
    itemCoords?.lat && itemCoords?.lng
      ? `${itemCoords.lat},${itemCoords.lng}`
      : encodeURIComponent(
          `${item?.sellerName || item?.title || ''} ${item?.location || 'Alwar, Rajasthan'}`.trim()
        );

  if (userCoords?.lat && userCoords?.lng) {
    return `https://www.google.com/maps/dir/?api=1&origin=${userCoords.lat},${userCoords.lng}&destination=${destQuery}&travelmode=driving`;
  }
  return `https://www.google.com/maps/search/?api=1&query=${destQuery}`;
}

/**
 * Small deterministic offset (~40m) based on item ID so multiple listings in the same
 * locality don't stack on the exact same 0.00 km decimal
 */
function getDeterministicMicroOffset(idStr = '') {
  let hash = 0;
  const str = String(idStr || 'item');
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  const latOffset = ((hash % 100) / 100) * 0.0009;
  const lngOffset = (((hash >> 4) % 100) / 100) * 0.0009;
  return { latOffset, lngOffset };
}

/**
 * Resolves a listing's coordinates:
 * 1. Explicit `item.lat` / `item.lng`
 * 2. Match against `CITY_ZONES`
 * 3. Match against `ALWAR_LANDMARK_COORDS`
 */
export function resolveListingCoordinates(item) {
  if (!item) return null;

  if (
    item.lat !== null &&
    item.lat !== undefined &&
    item.lng !== null &&
    item.lng !== undefined &&
    !isNaN(Number(item.lat)) &&
    !isNaN(Number(item.lng))
  ) {
    return { lat: Number(item.lat), lng: Number(item.lng) };
  }

  const rawLoc = String(
    `${item.location || ''} ${item.location_name || ''} ${item.landmark || ''} ${item.title || ''}`
  ).toLowerCase();

  if (!rawLoc.trim()) return null;

  const { latOffset, lngOffset } = getDeterministicMicroOffset(item.id || item.title);

  // Check CITY_ZONES first
  for (const [zoneName, zoneCoords] of Object.entries(CITY_ZONES || {})) {
    if (rawLoc.includes(zoneName.toLowerCase()) && zoneCoords?.lat && zoneCoords?.lng) {
      return {
        lat: Number((Number(zoneCoords.lat) + latOffset).toFixed(6)),
        lng: Number((Number(zoneCoords.lng) + lngOffset).toFixed(6)),
      };
    }
  }

  // Check extended Alwar landmarks & tourist spots
  for (const [key, coords] of Object.entries(ALWAR_LANDMARK_COORDS)) {
    if (rawLoc.includes(key)) {
      return {
        lat: Number((coords.lat + latOffset).toFixed(6)),
        lng: Number((coords.lng + lngOffset).toFixed(6)),
      };
    }
  }

  // Default fallback to Alwar center if listing is in Alwar
  return {
    lat: Number((27.5625 + latOffset).toFixed(6)),
    lng: Number((76.6142 + lngOffset).toFixed(6)),
  };
}

export function useUserLocation() {
  const [location, setLocation] = useState(() => {
    try {
      const saved = sessionStorage.getItem(GPS_SESSION_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {}
    return {
      city: 'Alwar',
      area: null,
      lat: null,
      lng: null,
      accuracy: null,
      isGpsActive: false,
    };
  });

  const [isLocating, setIsLocating] = useState(false);
  const [error, setError] = useState(null);

  const detectLocation = useCallback((onSuccessCallback) => {
    if (!navigator.geolocation) {
      const msg = 'Geolocation is not supported by your browser.';
      setError(msg);
      alert(msg);
      return;
    }

    setIsLocating(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;

        const nextLoc = {
          city: 'Alwar',
          area: null, // Never guess colony name from GPS
          lat: Number(latitude.toFixed(6)),
          lng: Number(longitude.toFixed(6)),
          accuracy: Math.round(accuracy || 0),
          isGpsActive: true,
          updatedAt: Date.now(),
        };

        setLocation(nextLoc);
        setIsLocating(false);

        try {
          sessionStorage.setItem(GPS_SESSION_KEY, JSON.stringify(nextLoc));
        } catch {}

        if (typeof onSuccessCallback === 'function') {
          onSuccessCallback(nextLoc);
        }
      },
      (err) => {
        setIsLocating(false);
        const msg =
          err.code === 1
            ? 'Location permission denied. Please allow location access in your browser settings to use Nearby search.'
            : 'Unable to fetch accurate GPS signal. Please try again.';
        setError(msg);
        alert(msg);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 15000,
      }
    );
  }, []);

  const clearLocation = useCallback(() => {
    const resetLoc = {
      city: 'Alwar',
      area: null,
      lat: null,
      lng: null,
      accuracy: null,
      isGpsActive: false,
    };
    setLocation(resetLoc);
    try {
      sessionStorage.removeItem(GPS_SESSION_KEY);
    } catch {}
  }, []);

  return {
    location,
    isLocating,
    error,
    detectLocation,
    clearLocation,
  };
}