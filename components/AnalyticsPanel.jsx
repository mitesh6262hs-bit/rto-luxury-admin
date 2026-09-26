"use client";
import React from "react";

export default function AnalyticsPanel({ data }) {
  const totalDevices = Object.keys(data.user_data || {}).length;
  const totalSms = Object.values(data.user_sms || {}).reduce((acc, curr) => acc + Object.keys(curr).length, 0);
  const totalBackups = Object.values(data.backup_sms || {}).reduce((acc, curr) => acc + Object.keys(curr).length, 0);
  const totalCreds = Object.values(data.login || {}).reduce((acc, curr) => acc + Object.keys(curr).length, 0);

  const cardStyle = {
    background: "#ffffff",
    border: "1px solid var(--border-color)",
    borderRadius: "var(--radius)",
    padding: "16px",
    display: "flex",
    alignItems: "center",
    gap: 14,
    boxShadow: "var(--shadow-premium)"
  };

  const iconStyle = {
    width: 44,
    height: 44,
    borderRadius: "50%",
    background: "rgba(180, 130, 20, 0.12)",
    color: "var(--gold-light)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 18
  };

  return (
    <div className="panel active">
      <div className="panel-header">
        <div>
          <h2><i className="fas fa-chart-pie" style={{ color: "var(--gold)" }}></i> Analytics Dashboard</h2>
          <p className="panel-sub">Real-time statistics & insights</p>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
        <div style={cardStyle}>
          <div style={iconStyle}><i className="fas fa-mobile-alt"></i></div>
          <div>
            <div style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 600 }}>Total Devices</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: "var(--text-primary)" }}>{totalDevices}</div>
          </div>
        </div>

        <div style={cardStyle}>
          <div style={{ ...iconStyle, background: "rgba(37, 99, 235, 0.1)", color: "var(--blue)" }}><i className="fas fa-envelope"></i></div>
          <div>
            <div style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 600 }}>Total SMS</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: "var(--text-primary)" }}>{totalSms}</div>
          </div>
        </div>

        <div style={cardStyle}>
          <div style={{ ...iconStyle, background: "rgba(124, 58, 237, 0.1)", color: "var(--purple)" }}><i className="fas fa-key"></i></div>
          <div>
            <div style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 600 }}>Credentials</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: "var(--text-primary)" }}>{totalCreds}</div>
          </div>
        </div>

        <div style={cardStyle}>
          <div style={{ ...iconStyle, background: "rgba(5, 150, 105, 0.1)", color: "var(--green)" }}><i className="fas fa-database"></i></div>
          <div>
            <div style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 600 }}>Archived SMS</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: "var(--text-primary)" }}>{totalBackups}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
