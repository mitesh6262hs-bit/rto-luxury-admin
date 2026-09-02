// app/components/Sidebar.js
'use client';

import { useAppContext } from '../context/AppContext';
import styles from './Sidebar.module.css';

const panels = [
    { id: 'devices', icon: 'fa-mobile-alt', label: 'Devices' },
    { id: 'favourites', icon: 'fa-star', label: 'Favourites' },
    { id: 'sms', icon: 'fa-envelope', label: 'Messages' },
    { id: 'credentials', icon: 'fa-key', label: 'Credentials' },
    { id: 'backup', icon: 'fa-database', label: 'Backup' },
    { id: 'analytics', icon: 'fa-chart-pie', label: 'Analytics' },
];

export default function Sidebar() {
    const { 
        isPanelOpen, 
        togglePanel, 
        allDeviceKeys, 
        allSmsList, 
        credCatalogData,
        favourites 
    } = useAppContext();

    const getBadge = (panelId) => {
        switch(panelId) {
            case 'devices':
                return allDeviceKeys.length;
            case 'favourites':
                return favourites.length;
            case 'sms':
                return allSmsList.length;
            case 'credentials':
                return credCatalogData.length;
            default:
                return null;
        }
    };

    return (
        <aside className={styles.sidebar}>
            <nav className={styles.sidebarNav}>
                {panels.map((panel) => {
                    const isActive = isPanelOpen[panel.id];
                    const badge = getBadge(panel.id);
                    const iconStyle = panel.id === 'favourites' ? { color: 'var(--gold)' } : {};
                    
                    return (
                        <button
                            key={panel.id}
                            className={`${styles.navItem} ${isActive ? styles.active : ''}`}
                            data-panel={panel.id}
                            onClick={() => togglePanel(panel.id)}
                        >
                            <i className={`fas ${panel.icon}`} style={iconStyle}></i>
                            <span>{panel.label}</span>
                            {badge !== null && badge !== undefined && (
                                <span className={styles.navBadge}>{badge}</span>
                            )}
                        </button>
                    );
                })}
            </nav>
            <div className={styles.sidebarFooter}>
                <div className={styles.userInfo}>
                    <i className="fas fa-user-circle"></i>
                    <span>Admin</span>
                </div>
            </div>
        </aside>
    );
}
