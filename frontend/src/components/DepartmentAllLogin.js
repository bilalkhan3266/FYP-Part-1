import React from "react";
import "./DepartmentAllLogin.css";
import { useNavigate } from "react-router-dom";

/* 🎯 Import Icons */
import {
  FaBook,
  FaMoneyBill,
  FaUserTie,
  FaBus,
  FaVials,
  FaUsersCog,
  FaUserGraduate,
  FaBuilding,
} from "react-icons/fa";

export default function DepartmentAllLogin() {
  const navigate = useNavigate();

  const departments = [
    { name: "Library Department", role: "library", icon: <FaBook /> },
    { name: "Fee Department", role: "fee", icon: <FaMoneyBill /> },
    { name: "HOD", role: "hod", icon: <FaUserTie /> },
    { name: "Transport Department", role: "transport", icon: <FaBus /> },
    { name: "Laboratory Department", role: "laboratory", icon: <FaVials /> },
    { name: "Student Service Department", role: "student_service", icon: <FaUsersCog /> },
    { name: "Student Department", role: "student", icon: <FaUserGraduate /> },
    { name: "Coordination Office", role: "coordination", icon: <FaBuilding /> },
  ];

  return (
    <div className="dept-container">
      <h1>Department Login Portal</h1>
      <p>Select your department</p>

      <div className="dept-grid">
        {departments.map((dept, index) => (
          <button
            key={index}
            onClick={() => navigate(`/department/${dept.role}`)}
            className="dept-card"
            style={{ animationDelay: `${index * 0.1}s` }} // stagger animation
          >
            <span className="dept-icon">{dept.icon}</span>
            {dept.name}
          </button>
        ))}
      </div>
    </div>
  );
}
