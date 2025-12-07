import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./MessagePage.css"; // Use similar styling as student EditProfile sidebar

export default function FeeMessagePage() {
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");

  const sendMessage = () => {
    if (input.trim() !== "") {
      const newMsg = { text: input, sender: "Fee Department", date: new Date().toLocaleString() };
      setMessages([newMsg, ...messages]);
      setInput("");
    }
  };

  return (
    <div className="fee-message-page">
      {/* ---------- Sidebar ---------- */}
      <aside className="sidebar">
        <h2>Fee Department</h2>
        <nav>
          <button onClick={() => navigate("/fee-dashboard")}>🏠 Dashboard</button>
          <button className="active">💬 Messages</button>
          <button onClick={() => navigate("/fee-requests")}>📄 View Requests</button>
          <button onClick={() => navigate("/fee-approved")}>✅ Approved Requests</button>
          <button onClick={() => navigate("/fee-rejected")}>❌ Rejected Requests</button>
          <button onClick={() => navigate("/fee-edit-profile")}>📝 Edit Profile</button>
          <button onClick={() => navigate("/")}>🚪 Logout</button>
        </nav>
        <footer>© 2025 Fee Portal</footer>
      </aside>

      {/* ---------- Main Content ---------- */}
      <main className="main-content">
        <div className="msg-card">
          <h1>💬 Message Student</h1>
          <p>Send fee clearance updates or notices to students</p>

          {/* Chat Input */}
          <div className="msg-form">
            <input
              type="text"
              placeholder="Type your message..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
            <button onClick={sendMessage}>Send Message</button>
          </div>

          {/* Message History */}
          <div className="history-box">
            <h3>Message History</h3>
            {messages.length === 0 ? (
              <p className="no-history">No previous messages.</p>
            ) : (
              messages.map((msg, i) => (
                <div className="history-item" key={i}>
                  <div className="h-top">
                    <span><strong>From:</strong> {msg.sender}</span>
                    <small>{msg.date}</small>
                  </div>
                  <p>{msg.text}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
