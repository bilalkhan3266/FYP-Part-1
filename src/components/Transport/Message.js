import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { LayoutDashboard, ClipboardList, CheckCircle2, MessageSquare, UserPen, LogOut } from "lucide-react";
import "./Message.css";

function MessagePage() {
  const navigate = useNavigate();

  const [messageData, setMessageData] = useState({
    studentId: "",
    subject: "",
    message: "",
  });

  const [history, setHistory] = useState([]);

  const handleChange = (e) => {
    setMessageData({ ...messageData, [e.target.name]: e.target.value });
  };

  const handleSend = (e) => {
    e.preventDefault();
    if (messageData.studentId && messageData.subject && messageData.message) {
      const newMsg = { ...messageData, date: new Date().toLocaleString() };
      setHistory([newMsg, ...history]);
      alert("✅ Message Sent Successfully!");
      setMessageData({ studentId: "", subject: "", message: "" });
    } else {
      alert("⚠ Please fill all fields!");
    }
  };

  return (
    <div className="page-wrapper">
      {/* Sidebar */}
      <aside className="left-sidebar">
        <h2>Riphah</h2>
        <nav>
          <button className="active"><LayoutDashboard size={18} /> Dashboard</button>
          <button onClick={() => navigate("/student-clearance-request")}>
            <ClipboardList size={18} /> Submit Request
          </button>
          <button onClick={() => navigate("/student-clearance-status")}>
            <CheckCircle2 size={18} /> Clearance Status
          </button>
          <button onClick={() => navigate("/student-messages")}><MessageSquare size={18} /> Messages</button>
          <button onClick={() => navigate("/student-edit-profile")}><UserPen size={18} /> Edit Profile</button>
          <button onClick={() => navigate("/")}><LogOut size={18} /> Logout</button>
        </nav>
        <footer>© 2025 Riphah</footer>
      </aside>

      {/* Main content */}
      <div className="message-container">
        <div className="message-card">
          <h2 className="message-title">📩 Send Message to Student</h2>
          <form onSubmit={handleSend}>
            <input
              type="text"
              name="studentId"
              placeholder="Enter Student ID"
              className="message-input"
              value={messageData.studentId}
              onChange={handleChange}
            />
            <input
              type="text"
              name="subject"
              placeholder="Message Subject"
              className="message-input"
              value={messageData.subject}
              onChange={handleChange}
            />
            <textarea
              name="message"
              placeholder="Write your message here..."
              className="message-textarea"
              value={messageData.message}
              onChange={handleChange}
            />
            <button type="submit" className="message-btn">
              Send Message
            </button>
          </form>

          {/* Message History */}
          <div className="message-history">
            <h3>📜 Message History</h3>
            {history.length === 0 ? (
              <p className="no-msg">No messages sent yet.</p>
            ) : (
              history.map((msg, index) => (
                <div className="history-item" key={index}>
                  <p><strong>To:</strong> {msg.studentId}</p>
                  <p><strong>Subject:</strong> {msg.subject}</p>
                  <p>{msg.message}</p>
                  <small>{msg.date}</small>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default MessagePage;
