// src/components/Messages.js
import React, { useEffect, useState } from "react";
import "./styles/dashboard.css";

export default function Messages() {
  const [threads, setThreads] = useState([]);
  const [selected, setSelected] = useState(null);
  const [text, setText] = useState("");

  useEffect(() => {
    const msgs = JSON.parse(localStorage.getItem("ssd_messages") || "[]");
    setThreads(msgs);
    if (msgs.length) setSelected(0);
  }, []);

  const sendMessage = () => {
    if (!selected && selected !== 0) return;
    if (!text.trim()) return;
    const copy = [...threads];
    const msg = { from: "dept", text, time: new Date().toISOString() };
    copy[selected].messages.push(msg);
    setThreads(copy);
    localStorage.setItem("ssd_messages", JSON.stringify(copy));
    setText("");
  };

  const newThread = () => {
    const threadsNow = JSON.parse(localStorage.getItem("ssd_messages") || "[]");
    const t = { id: Date.now(), title: `Thread ${threadsNow.length + 1}`, messages: [] };
    const arr = [t, ...threadsNow];
    localStorage.setItem("ssd_messages", JSON.stringify(arr));
    setThreads(arr);
    setSelected(0);
  };

  if (threads.length === 0) {
    return (
      <div>
        <h2>Messages</h2>
        <p>No message threads yet.</p>
        <button className="lab-btn primary" onClick={newThread}>Start New Thread</button>
      </div>
    );
  }

  return (
    <div className="messages-page">
      <aside className="threads-list">
        <h3>Threads</h3>
        <button className="lab-btn" onClick={newThread}>+ New Thread</button>
        {threads.map((t, i) => (
          <div key={t.id} className={`thread ${selected === i ? "active" : ""}`} onClick={() => setSelected(i)}>
            <strong>{t.title}</strong>
            <p className="muted">{t.messages.length} messages</p>
          </div>
        ))}
      </aside>

      <section className="chat-area">
        <h3>{threads[selected].title}</h3>
        <div className="chat-box">
          {threads[selected].messages.map((m, idx) => (
            <div key={idx} className={`chat-msg ${m.from === "dept" ? "dept" : "user"}`}>
              <p>{m.text}</p>
              <span className="muted">{new Date(m.time).toLocaleString()}</span>
            </div>
          ))}
        </div>

        <div className="chat-input">
          <input placeholder="Type message..." value={text} onChange={(e)=>setText(e.target.value)} />
          <button className="lab-btn primary" onClick={sendMessage}>Send</button>
        </div>
      </section>
    </div>
  );
}
