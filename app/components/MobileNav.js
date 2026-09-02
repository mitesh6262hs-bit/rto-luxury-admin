// app/components/MobileNav.js
'use client';

import { useAppContext } from '../context/AppContext';
import styles from './MobileNav.module.css';

export default function MobileNav() {
    const { 
        isPanelOpen, 
        togglePanel, 
        allDeviceKeys,
        allSmsList,
        favourites,
        credCatalogData
    } = useAppContext();

    const navItems = [
        { id: 'devices', icon: 'fa-mobile-alt', label: 'Devices' },
        { id: 'favourites', icon: 'fa-star', label: 'Fav' },
        { id: 'sms', icon: 'fa-envelope', label: 'Messages' },
        { id: 'credentials', icon: 'fa-key', label: 'Creds' },
        { id: 'backup', icon: 'fa-database', label: 'Backup' },
    ];

    const getBadge = (id) => {
        switch(id) {
            case 'favourites': return favourites.length;
            case 'sms': return allSmsList.length;
            case 'credentials': return credCatalogData.length;
            default: return null;
        }
    };

    return (
        <nav className={styles.mobileNav}>
            {navItems.map((item) => {
                const isActive = isPanelOpen[item.id];
                const badge = getBadge(item.id);
                const iconStyle = item.id === 'favourites' ? { color: 'var(--gold)' } : {};

                return (
                    <button
                        key={item.id}
                        className={`${styles.navItem} ${isActive ? styles.active : ''}`}
                        onClick={() => togglePanel(item.id)}
                    >
                        <i className={`fas ${item.icon}`} style={iconStyle}></i>
                        <span>{item.label}</span>
                        {badge !== null && badge > 0 && (
                            <span className={styles.navBadge}>{badge}</span>
                        )}
                    </button>
                );
            })}
        </nav>
    );
}
