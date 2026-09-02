'use client';

import { useState, useEffect } from 'react';

export function useFavourites() {
  const [favourites, setFavourites] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load favourites from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('favourites');
      if (saved) {
        setFavourites(JSON.parse(saved));
      } else {
        // Default mock data
        setFavourites([
          { id: 'dev-001', name: 'Camera 1 - Main Gate', model: 'Hikvision DS-2CD' },
          { id: 'dev-002', name: 'NVR Server', model: 'Dahua NVR' },
        ]);
      }
    } catch (error) {
      console.warn('Failed to load favourites:', error);
      setFavourites([]);
    }
    setLoading(false);
  }, []);

  const toggleFavourite = (deviceId) => {
    setFavourites((prev) => {
      const exists = prev.some((item) => item.id === deviceId);
      let newFavs;
      if (exists) {
        newFavs = prev.filter((item) => item.id !== deviceId);
      } else {
        // Add dummy data if not exists (you can enhance this)
        newFavs = [...prev, { id: deviceId, name: `Device ${deviceId.slice(0, 6)}`, model: 'Unknown' }];
      }
      // Save to localStorage for persistence
      try {
        localStorage.setItem('favourites', JSON.stringify(newFavs));
      } catch (e) {}
      return newFavs;
    });
  };

  return { favourites, loading, toggleFavourite };
}
