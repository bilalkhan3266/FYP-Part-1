// src/components/ViewRequests.js
import React, { useEffect, useState } from "react";
import "./styles/dashboard.css";

export default function ViewRequests() {
  const [pending, setPending] = useState([]);
  const [form, setForm] = useState({
    studentId: "",
    name: "",
    program: "",
    semester: "",
    serviceType: "",
    description: ""
  });

  useEffect(() => {
    setPending(JSON.parse(localStorage.getItem("ssd_pending") || "[]"));
  }, []);

  const savePending = (arr) => {
    localStorage.setItem("ssd_pending", JSON.stringify(arr));
    setPending(arr);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const newReq = { id: Date.now(), ...form, createdAt: new Date().toISOString() };
    const arr = [newReq, ...pending];
    savePending(arr);
    setForm({ studentId: "", name: "", program: "", semester: "", serviceType: "", description: "" });
    alert("Request submitted");
  };

  const handleApprove = (id) => {
    const item = pending.find((p) => p.id === id);
    if (!item) return;
    const approved = JSON.parse(localStorage.getItem("ssd_approved") || "[]");
    approved.unshift({ ...item, approvedAt: new Date().toISOString() });
    localStorage.setItem("ssd_approved", JSON.stringify(approved));
    const remaining = pending.filter((p) => p.id !== id);
    savePending(remaining);
  };

  const handleReject = (id) => {
    const remarks = prompt("Enter rejection remarks:");
    if (remarks === null) return;
    const item = pending.find((p) => p.id === id);
    const rejected = JSON.parse(localStorage.getItem("ssd_rejected") || "[]");
    rejected.unshift({ ...item, remarks, rejectedAt: new Date().toISOString() });
    localStorage.setItem("ssd_rejected", JSON.stringify(rejected));
    const remaining = pending.filter((p) => p.id !== id);
    savePending(remaining);
  };

  return (
    <div>
      <h2>Submit Clearance / Service Request</h2>
      <form className="service-form" onSubmit={handleSubmit}>
        <div className="form-grid">
          <input placeholder="Student ID" required value={form.studentId} onChange={(e)=>setForm({...form, studentId: e.target.value})} />
          <input placeholder="Student Name" required value={form.name} onChange={(e)=>setForm({...form, name: e.target.value})} />
          <input placeholder="Program" required value={form.program} onChange={(e)=>setForm({...form, program: e.target.value})} />
          <input placeholder="Semester" required value={form.semester} onChange={(e)=>setForm({...form, semester: e.target.value})} />
          <input placeholder="Service Type (e.g., Bonafide)" required value={form.serviceType} onChange={(e)=>setForm({...form, serviceType: e.target.value})} />
        </div>

        <textarea placeholder="Description / Reason" required value={form.description} onChange={(e)=>setForm({...form, description: e.target.value})}></textarea>

        <button className="request-submit" type="submit">Submit Request</button>
      </form>

      <h3 style={{ marginTop: 30 }}>Pending Requests</h3>
      {pending.length === 0 && <p>No pending requests</p>}
      <div className="requests-list">
        {pending.map((r) => (
          <div key={r.id} className="request-card">
            <div>
              <strong>{r.serviceType}</strong> — {r.name} ({r.studentId})
              <p className="muted">Program: {r.program} • Sem: {r.semester}</p>
              <p>{r.description}</p>
            </div>
            <div className="request-actions">
              <button className="approve" onClick={() => handleApprove(r.id)}>Approve</button>
              <button className="reject" onClick={() => handleReject(r.id)}>Reject</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
