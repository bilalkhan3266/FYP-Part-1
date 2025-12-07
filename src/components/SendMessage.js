import React, { useState } from "react";
import axios from "axios";
import "./SendMessage.css";

export default function SendMessage() {
  const [formData, setFormData] = useState({
    recipient_sapid: "",
    subject: "",
    message: "",
    message_type: "info",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    if (
      !formData.recipient_sapid.trim() ||
      !formData.subject.trim() ||
      !formData.message.trim()
    ) {
      setError("❌ All fields are required");
      setLoading(false);
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const apiUrl = process.env.REACT_APP_API_URL || "http://localhost:5000";

      const response = await axios.post(
        apiUrl + "/api/send-message",
        {
          recipient_sapid: formData.recipient_sapid.trim(),
          subject: formData.subject.trim(),
          message: formData.message.trim(),
          message_type: formData.message_type,
        },
        {
          headers: {
            Authorization: "Bearer " + token,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.data.success) {
        setSuccess(
          "✅ Message sent successfully to SAPID: " +
            formData.recipient_sapid
        );
        setFormData({
          recipient_sapid: "",
          subject: "",
          message: "",
          message_type: "info",
        });

        setTimeout(() => setSuccess(""), 3000);
      } else {
        setError(response.data.message || "❌ Failed to send message");
      }
    } catch (err) {
      console.error("Error:", err);
      setError(
        err.response?.data?.message ||
          "❌ Failed to send message. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="send-message-form">
      <h2>Send Message to Student</h2>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Student SAP ID *</label>
          <input
            type="text"
            name="recipient_sapid"
            value={formData.recipient_sapid}
            onChange={handleChange}
            placeholder="Enter student's SAP ID (e.g., 12345)"
            required
            disabled={loading}
          />
        </div>

        <div className="form-group">
          <label>Subject *</label>
          <input
            type="text"
            name="subject"
            value={formData.subject}
            onChange={handleChange}
            placeholder="Message subject"
            required
            disabled={loading}
          />
        </div>

        <div className="form-group">
          <label>Message Type</label>
          <select
            name="message_type"
            value={formData.message_type}
            onChange={handleChange}
            disabled={loading}
          >
            <option value="info">ℹ️ Info</option>
            <option value="success">✅ Success</option>
            <option value="warning">⚠️ Warning</option>
            <option value="error">❌ Error</option>
          </select>
        </div>

        <div className="form-group">
          <label>Message *</label>
          <textarea
            name="message"
            value={formData.message}
            onChange={handleChange}
            placeholder="Type your message..."
            rows="8"
            required
            disabled={loading}
          />
        </div>

        <button type="submit" disabled={loading} className="submit-btn">
          {loading ? "Sending..." : "📤 Send Message"}
        </button>
      </form>
    </div>
  );
}
