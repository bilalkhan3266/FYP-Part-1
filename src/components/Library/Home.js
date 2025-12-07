import React from "react";
import { useNavigate } from "react-router-dom";
import "./Home.css";

function Home() {
  const navigate = useNavigate();

  return (
    <div className="home-container">
      <div className="home-box">
        <h1>🎓 Riphah International University</h1>
        <h2>Welcome to the Clearance Portal</h2>
        <p>Select your department to continue</p>

        <div className="home-buttons">
          {/* <button onClick={() => navigate("/library-login")}>📚 Library Department</button>
          <button onClick={() => navigate("/laboratory-login")}>🧪 Laboratory Department</button> */}
          <button onClick={() => navigate("/library-dashboard")}>⚙️ Admin Panel (Optional)</button>
        </div>
      </div>
    </div>
  );
}

export default Home;
