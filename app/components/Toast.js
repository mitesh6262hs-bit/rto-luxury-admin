// app/components/Toast.js
'use client';

import { useState, useEffect } from 'react';
import styles from './Toast.module.css';

let toastId = 0;

export default function Toast() {
    const [toasts, setToasts] = useState([]);

    useEffect(() => {
        // Expose toast function globally
        window.showToast = (message, type = 'info', duration = 2800) => {
            const id = toastId++;
            setToasts(prev => [...prev, { id, message, type, duration }]);
            
            setTimeout(() => {
                setToasts(prev => prev.filter(t => t.id !== id));
            }, duration);
        };

        return () => {
            delete window.showToast;
        };
    }, []);

    if (toasts.length === 0) return null;

    return (
        <div className={styles.container}>
            {toasts.map((toast) => (
                <div key={toast.id} className={`${styles.toast} ${styles[toast.type]}`}>
                    {toast.message}
                </div>
            ))}
        </div>
    );
}
