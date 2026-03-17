import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { LayoutDashboard, MessageSquare, ClipboardList, CheckCircle2, XCircle, UserPen, LogOut } from "lucide-react";
import "./LibraryMessage.css";

export default function LibraryMessage() {
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");

  const sendMessage = () => {
    if (input.trim() !== "") {
      const newMsg = { text: input, sender: "Library Admin", date: new Date().toLocaleString() };
      setMessages([newMsg, ...messages]);
      setInput("");
    }
  };

  return (
    <div className="message-wrapper">
      {/* ---- SIDEBAR like EditProfile.js ---- */}
      <aside className="left-sidebar">
        <h2>Library Portal</h2>
        <nav>
          <button onClick={() => navigate("/library-dashboard")}><LayoutDashboard size={18} /> Dashboard</button>
          <button className="active"><MessageSquare size={18} /> Message Student</button>
          <button onClick={() => navigate("/library-requests")}><ClipboardList size={18} /> Requests</button>
          <button onClick={() => navigate("/library-approved")}><CheckCircle2 size={18} /> Approved</button>
          <button onClick={() => navigate("/library-rejected")}><XCircle size={18} /> Rejected</button>
          <button onClick={() => navigate("/library-edit-profile")}><UserPen size={18} /> Edit Profile</button>
          <button onClick={() => navigate("/login")}><LogOut size={18} /> Logout</button>
        </nav>
        <footer>© 2025 Library Portal</footer>
      </aside>

      {/* ---- MAIN CONTENT ---- */}
      <div className="content-area">
        <div className="msg-card">
          <h1>💬 Message Student</h1>
          <p>Send announcements or notices to students</p>

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
      </div>
    </div>
  );
}
