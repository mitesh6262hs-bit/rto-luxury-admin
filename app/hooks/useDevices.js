'use client';

import { useState, useEffect } from 'react';
import { db } from '../utils/firebase';
import { collection, query, onSnapshot, orderBy } from 'firebase/firestore';

export function useDevices() {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const q = query(collection(db, 'devices'), orderBy('createdAt', 'desc'));
    
    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        const deviceData = [];
        snapshot.forEach((doc) => {
          deviceData.push({ id: doc.id, ...doc.data() });
        });
        setDevices(deviceData);
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
        console.error('Error fetching devices:', err);
      }
    );

    return () => unsubscribe();
  }, []);

  return { devices, loading, error };
}
