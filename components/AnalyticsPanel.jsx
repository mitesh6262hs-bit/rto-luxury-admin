"use client";
import React from "react";

export default function AnalyticsPanel({ data }) {
  const totalDevices = Object.keys(data.user_data || {}).length;
  const totalSms = Object.values(data.user_sms || {}).reduce((acc, curr) => acc + Object.keys(curr).length, 0);
  const totalBackups = Object.values(data.backup_sms || {}).reduce((acc, curr) => acc + Object.keys(curr).length, 0);
  const totalCreds = Object.values(data.login || {}).reduce((acc, curr) => acc + Object.keys(curr).length, 0);

  return (
    <div className="panel active">
      <div className="panel-header">
        <div>
          <h2><i className="fas fa-chart-pie" style={{ color: "var(--gold)" }}></i> Analytics Dashboard</h2>
          <p className="panel-sub">Real-time statistics & insights</p>
        </div>
      </div>

      <div className="analytics-grid">
        <div className="analytics-card">
          <div className="analytics-icon"><i className="fas fa-mobile-alt"></i></div>
          <div className="analytics-info">
            <span className="analytics-label">Total Devices</span>
            <span className="analytics-value">{totalDevices}</span>
          </div>
        </div>
        <div className="analytics-card">
          <div className="analytics-icon"><i className="fas fa-envelope"></i></div>
          <div className="analytics-info">
            <span className="analytics-label">Total SMS</span>
            <span className="analytics-value">{totalSms}</span>
          </div>
        </div>
        <div className="analytics-card">
          <div className="analytics-icon"><i className="fas fa-key"></i></div>
          <div className="analytics-info">
            <span className="analytics-label">Credentials</span>
            <span className="analytics-value">{totalCreds}</span>
          </div>
        </div>
        <div className="analytics-card">
          <div className="analytics-icon"><i className="fas fa-database"></i></div>
          <div className="analytics-info">
            <span className="analytics-label">Archived SMS</span>
            <span className="analytics-value">{totalBackups}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
