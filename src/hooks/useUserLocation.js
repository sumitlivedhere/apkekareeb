import { useState, useCallback } from 'react';
import { CITY_ZONES } from '../data/cityZones';

const GPS_SESSION_KEY = 'aapkekareeb_live_gps';

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
 * Resolves a listing's coordinates (uses explicit lat/lng on the listing first,
 * or falls back to the listing's tagged zone center so distance from user GPS works for all listings)
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

  const rawLoc = String(item.location || item.location_name || item.landmark || '').toLowerCase();
  if (!rawLoc) return null;

  for (const [zoneName, zoneCoords] of Object.entries(CITY_ZONES || {})) {
    if (rawLoc.includes(zoneName.toLowerCase()) && zoneCoords?.lat && zoneCoords?.lng) {
      return { lat: Number(zoneCoords.lat), lng: Number(zoneCoords.lng) };
    }
  }

  return null;
}

export function useUserLocation() {
  const [location, setLocation] = useState(() => {
    try {
      const saved = sessionStorage.getItem(GPS_SESSION_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {}
    // Default state: City-wide Alwar (No guessed colony/locality)
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
        maximumAge: 30000,
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