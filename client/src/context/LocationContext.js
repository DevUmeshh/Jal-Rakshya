import React, { createContext, useContext, useState, useCallback } from 'react';

const LocationContext = createContext();

export function LocationProvider({ children }) {
  // No localStorage — state resets on page refresh so citizen must search again
  const [selectedLocation, setSelectedLocation] = useState('');
  const [allLocations, setAllLocations] = useState([]);

  const selectLocation = useCallback((name) => {
    setSelectedLocation(name);
  }, []);

  const clearLocation = useCallback(() => {
    setSelectedLocation('');
  }, []);

  return (
    <LocationContext.Provider
      value={{ selectedLocation, selectLocation, clearLocation, allLocations, setAllLocations }}
    >
      {children}
    </LocationContext.Provider>
  );
}

export function useLocation() {
  const ctx = useContext(LocationContext);
  if (!ctx) throw new Error('useLocation must be used within LocationProvider');
  return ctx;
}
