import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { CITY_ZONES, findNearestColony } from '../data/cityZones';

const STORAGE_KEY = 'townhub_user_precise_location';

const DEFAULT_LOCATION = {
  colony: 'Budh Vihar',
  landmark: 'Budh Vihar (Sector 1 & 2)',
  city: 'Alwar',
  lat: 27.5682,
  lng: 76.6215,
  radiusKm: 5,
  accuracyMeters: null,
  isGPSActive: false,
};

const LocationContext = createContext(null);

export function LocationProvider({ children, defaultCity = 'Alwar' }) {
  const [location, setLocation] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return { ...DEFAULT_LOCATION, ...parsed };
      }
      return { ...DEFAULT_LOCATION, city: defaultCity };
    } catch {
      return { ...DEFAULT_LOCATION, city: defaultCity };
    }
  });

  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState(null);

  const selectedCity = location.city || defaultCity;
  const setSelectedCity = useCallback((newCity) => {
    setLocation((prev) => {
      const updated = { ...prev, city: newCity };
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(updated)); } catch {}
      return updated;
    });
  }, []);

  const userArea = location.colony || location.landmark || 'Town Center';
  const setUserArea = useCallback((newArea) => {
    setLocation((prev) => {
      const updated = { ...prev, colony: newArea, landmark: newArea };
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(updated)); } catch {}
      return updated;
    });
  }, []);

  const coords = { lat: location.lat, lng: location.lng };
  const setCoords = useCallback((newCoords) => {
    if (!newCoords) return;
    setLocation((prev) => {
      const updated = { ...prev, lat: newCoords.lat, lng: newCoords.lng };
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(updated)); } catch {}
      return updated;
    });
  }, []);

  const detectLiveGPS = useCallback(async (onSuccessCallback) => {
    setIsLocating(true);
    setLocationError(null);

    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        setLocationError('GPS not supported on device.');
        setIsLocating(false);
        resolve(null);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = Number(pos.coords.latitude.toFixed(6));
          const lng = Number(pos.coords.longitude.toFixed(6));
          const accuracyMeters = Math.round(pos.coords.accuracy);

          const preciseColonyName = findNearestColony(lat, lng);

          const finalLocation = {
            colony: preciseColonyName,
            landmark: `${preciseColonyName}, ${location.city}`,
            city: location.city,
            lat,
            lng,
            accuracyMeters,
            radiusKm: location.radiusKm || 5,
            isGPSActive: true,
          };

          setLocation(finalLocation);
          try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(finalLocation));
          } catch {}
          setIsLocating(false);

          if (onSuccessCallback) {
            onSuccessCallback({ lat, lng, area: preciseColonyName });
          }
          resolve(finalLocation);
        },
        (err) => {
          console.warn('GPS detection error:', err.message);
          setLocationError('Could not detect GPS.');
          setIsLocating(false);
          resolve(null);
        },
        { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 }
      );
    });
  }, [location.city, location.radiusKm]);

  const detectGpsLocation = detectLiveGPS;

  const setColony = useCallback(
    (colonyObj, cityName = location.city) => {
      if (!colonyObj) return;

      const updated = {
        colony: colonyObj.name || colonyObj.colony,
        landmark: colonyObj.landmark || colonyObj.name || colonyObj.colony,
        city: cityName,
        lat: colonyObj.lat,
        lng: colonyObj.lng,
        radiusKm: location.radiusKm || 5,
        accuracyMeters: null,
        isGPSActive: false,
      };

      setLocation(updated);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch {}
      setLocationError(null);
    },
    [location.city, location.radiusKm]
  );

  const setRadiusKm = useCallback(
    (newRadius) => {
      const radiusNum = Number(newRadius) || 5;
      setLocation((prev) => {
        const updated = { ...prev, radiusKm: radiusNum };
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        } catch {}
        return updated;
      });
    },
    []
  );

  const contextValue = useMemo(
    () => ({
      location,
      selectedCity,
      setSelectedCity,
      userArea,
      setUserArea,
      coords,
      setCoords,
      isLocating,
      locationError,
      detectLiveGPS,
      detectGpsLocation,
      setColony,
      setRadiusKm,
    }),
    [
      location,
      selectedCity,
      setSelectedCity,
      userArea,
      setUserArea,
      coords,
      setCoords,
      isLocating,
      locationError,
      detectLiveGPS,
      detectGpsLocation,
      setColony,
      setRadiusKm,
    ]
  );

  return (
    <LocationContext.Provider value={contextValue}>
      {children}
    </LocationContext.Provider>
  );
}

// Fallback default context object so components never crash with blank screens if provider is missing
const FALLBACK_CONTEXT = {
  location: DEFAULT_LOCATION,
  selectedCity: 'Alwar',
  setSelectedCity: () => {},
  userArea: 'Budh Vihar',
  setUserArea: () => {},
  coords: { lat: DEFAULT_LOCATION.lat, lng: DEFAULT_LOCATION.lng },
  setCoords: () => {},
  isLocating: false,
  locationError: null,
  detectLiveGPS: async () => DEFAULT_LOCATION,
  detectGpsLocation: async () => DEFAULT_LOCATION,
  setColony: () => {},
  setRadiusKm: () => {},
};

export function useLocationContext() {
  const context = useContext(LocationContext);
  return context || FALLBACK_CONTEXT;
}

export function useLocation() {
  const context = useContext(LocationContext);
  return context || FALLBACK_CONTEXT;
}