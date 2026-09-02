// app/components/TopBar.js
'use client';

import { useAppContext } from '../context/AppContext';
import styles from './TopBar.module.css';

export default function TopBar() {
    const { isConnected, data, allDeviceKeys } = useAppContext();
    
    const manualRefresh = () => {
        // Force refresh logic
        window.location.reload();
    };

    const totalDevices = allDeviceKeys.length;

    return (
        <header className={styles.topBar}>
            <div className={styles.brand}>
                <span className={styles.brandIcon}>✦</span>
                <span className={styles.brandName}>
                    RTO<em>Luxury</em>
                </span>
                <span className={styles.brandBadge}>v3.0</span>
            </div>
            <div className={styles.topRight}>
                <button className={styles.btnRefresh} onClick={manualRefresh} title="Manual Refresh">
                    <i className="fas fa-sync-alt"></i>
                </button>
                <div className={`${styles.connectionStatus} ${isConnected ? styles.online : styles.offline}`}>
                    <span className={styles.dot}></span>
                    <span>{isConnected ? 'Online' : 'Offline'}</span>
                </div>
                <div className={styles.profileAvatar}>
                    <i className="fas fa-user-cog"></i>
                </div>
            </div>
        </header>
    );
}
