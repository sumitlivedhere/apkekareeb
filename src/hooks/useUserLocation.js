import { useState, useEffect, useCallback } from 'react';
import { findNearestColony, CITY_ZONES } from '../data/cityZones';

const STORAGE_KEY = 'townhub_user_precise_location';

export function useUserLocation(defaultCity = 'Alwar') {
  const [userLocation, setUserLocation] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        const colonyName = parsed.colony || parsed.locality || 'Budh Vihar';
        return {
          locality: colonyName,
          colony: colonyName,
          city: parsed.city || defaultCity,
          display: `${colonyName}, ${parsed.city || defaultCity}`,
          lat: parsed.lat || 27.54123,
          lng: parsed.lng || 76.60251,
          isDefault: false,
        };
      }
    } catch {}
    return {
      locality: 'Budh Vihar',
      colony: 'Budh Vihar',
      city: defaultCity,
      display: `Budh Vihar, ${defaultCity}`,
      lat: 27.54123,
      lng: 76.60251,
      isDefault: true,
    };
  });

  const [isLocating, setIsLocating] = useState(false);

  const refreshLocation = useCallback(async () => {
    setIsLocating(true);
    if (!navigator.geolocation) {
      console.warn('Geolocation not supported by browser.');
      setIsLocating(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = Number(pos.coords.latitude.toFixed(6));
        const lng = Number(pos.coords.longitude.toFixed(6));
        const colony = findNearestColony(lat, lng);

        const newLoc = {
          locality: colony,
          colony: colony,
          city: defaultCity,
          display: `${colony}, ${defaultCity}`,
          lat,
          lng,
          isDefault: false,
        };

        setUserLocation(newLoc);
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(newLoc));
        } catch {}
        setIsLocating(false);
      },
      (err) => {
        console.warn('GPS location error:', err.message);
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 30000 }
    );
  }, [defaultCity]);

  return {
    userLocation,
    isLocating,
    refreshLocation,
    setUserLocation,
  };
}

export default useUserLocation;