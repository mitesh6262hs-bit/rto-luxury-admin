"use client";
import React from "react";

export default function FavouritesPanel({ data, deviceSerialMap, favourites, toggleFavourite, showToast }) {
  const devices = data.user_data || {};

  const clearAll = () => {
    if (!confirm("⚠️ Remove all devices from favourites?")) return;
    favourites.forEach(id => toggleFavourite(id));
  };

  const copyId = (id) => {
    navigator.clipboard.writeText(id);
    showToast(`📋 Copied: ${id}`, "success");
  };

  return (
    <div className="panel active">
      <div className="panel-header">
        <div>
          <h2><i className="fas fa-star" style={{ color: "var(--gold)" }}></i> Favourite Devices</h2>
          <p className="panel-sub">Your most important devices</p>
        </div>
        <div className="panel-stats">
          <span className="stat-item"><i className="fas fa-star" style={{ color: "var(--gold)" }}></i> {favourites.length}</span>
          <button className="btn-sm" onClick={clearAll} style={{ background: "var(--red)", color: "#fff" }}>
            <i className="fas fa-trash"></i> Clear All
          </button>
        </div>
      </div>

      <div className="favourites-catalog active">
        {favourites.length === 0 ? (
          <div className="no-creds">
            <i className="fas fa-star" style={{ fontSize: 40, opacity: 0.3, color: "var(--gold)" }}></i>
            <h4>No Favourite Devices</h4>
            <p>Star devices from the Devices panel to view them here.</p>
          </div>
        ) : (
          <div className="fav-grid">
            {favourites.map(devId => {
              const dev = devices[devId] || {};
              const serial = deviceSerialMap[devId] || 0;
              const credCount = Object.keys(data.login?.[devId] || {}).length;
              const smsCount = Object.keys(data.user_sms?.[devId] || {}).length;

              return (
                <div key={devId} className="fav-card">
                  <div className="fav-card-header">
                    <div className="device-info">
                      <span className="fav-star" onClick={() => toggleFavourite(devId)}>★</span>
                      <span className="dev-name">📱 {devId}</span>
                      {serial > 0 && <span className="dev-serial">S-{serial}</span>}
                      <button className="fav-copy-btn" onClick={() => copyId(devId)}><i className="fas fa-copy"></i> Copy</button>
                    </div>
                  </div>
                  <div className="fav-card-body">
                    <div className="fav-info-grid">
                      <div className="fav-info-item"><span className="label">Device:</span><span className="value">{dev.Device_info || "N/A"}</span></div>
                      <div className="fav-info-item"><span className="label">SIM 1:</span><span className="value">{dev.numberSim1 || "N/A"}</span></div>
                      <div className="fav-info-item"><span className="label">SIM 2:</span><span className="value">{dev.numberSim2 || "N/A"}</span></div>
                      <div className="fav-info-item"><span className="label">Credentials:</span><span className="value">{credCount}</span></div>
                      <div className="fav-info-item"><span className="label">SMS:</span><span className="value">{smsCount}</span></div>
                    </div>
                  </div>
                  <div className="fav-card-footer">
                    <button className="fav-action-btn danger" onClick={() => toggleFavourite(devId)}><i className="fas fa-trash"></i> Remove</button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
