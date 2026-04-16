// src/components/Home.js
import React from "react";
import "./styles/dashboard.css";

export default function Home() {
  // some quick stats from localStorage
  const pending = JSON.parse(localStorage.getItem("ssd_pending") || "[]");
  const approved = JSON.parse(localStorage.getItem("ssd_approved") || "[]");
  const rejected = JSON.parse(localStorage.getItem("ssd_rejected") || "[]");

  return (
    <>
      <div className="program-header">
        <h2>Overview</h2>
        <p>Quick summary of requests and actions</p>
      </div>

      <div className="details-grid">
        <div className="stat-card">
          <strong>Pending Requests</strong>
          <p>{pending.length}</p>
        </div>
        <div className="stat-card">
          <strong>Approved Requests</strong>
          <p>{approved.length}</p>
        </div>
        <div className="stat-card">
          <strong>Rejected Requests</strong>
          <p>{rejected.length}</p>
        </div>
        <div className="stat-card">
          <strong>Message Threads</strong>
          <p>{JSON.parse(localStorage.getItem("ssd_messages") || "[]").length}</p>
        </div>
      </div>
    </>
  );
}
