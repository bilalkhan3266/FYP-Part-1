import React from 'react';
import './App.css';
import Button from './components/Button/Button';
import Card from './components/Card/Card';
import Alert from './components/Alert/Alert';
import Badge from './components/Badge/Badge';
import Navbar from './components/Navbar/Navbar';
import {
  FiUser,
  FiSettings,
  FiLogOut,
  FiHome,
  FiMail,
  FiBell,
} from 'react-icons/fi';

function App() {
  return (
    <div className="app">
      <Navbar />
      
      <div className="container">
        <section className="hero">
          <h1>Professional Component Library</h1>
          <p>Beautiful, reusable React components with React Icons</p>
        </section>

        {/* Buttons Section */}
        <section className="section">
          <h2>Buttons</h2>
          <div className="components-grid">
            <Button variant="primary" icon={FiHome}>
              Primary Button
            </Button>
            <Button variant="secondary" icon={FiSettings}>
              Secondary Button
            </Button>
            <Button variant="success" icon={FiBell}>
              Success Button
            </Button>
            <Button variant="danger" icon={FiLogOut}>
              Danger Button
            </Button>
            <Button variant="primary" disabled icon={FiUser}>
              Disabled Button
            </Button>
            <Button variant="outline" icon={FiMail}>
              Outline Button
            </Button>
          </div>
        </section>

        {/* Cards Section */}
        <section className="section">
          <h2>Cards</h2>
          <div className="components-grid">
            <Card
              title="User Profile"
              icon={FiUser}
              description="Manage your personal information and preferences"
            />
            <Card
              title="Settings"
              icon={FiSettings}
              description="Configure system-wide application settings"
            />
            <Card
              title="Notifications"
              icon={FiBell}
              description="Keep track of all your important updates"
            />
            <Card
              title="Messages"
              icon={FiMail}
              description="Send and receive messages with clients"
            />
          </div>
        </section>

        {/* Alerts Section */}
        <section className="section">
          <h2>Alerts</h2>
          <div className="alerts-container">
            <Alert
              type="success"
              message="Success! Your changes have been saved successfully."
            />
            <Alert
              type="info"
              message="Information: Please note the system will undergo maintenance tonight."
            />
            <Alert
              type="warning"
              message="Warning: Your session will expire in 5 minutes. Please save your work."
            />
            <Alert
              type="error"
              message="Error: Something went wrong. Please try again later."
            />
          </div>
        </section>

        {/* Badges Section */}
        <section className="section">
          <h2>Badges</h2>
          <div className="badges-container">
            <Badge variant="primary" label="Primary" />
            <Badge variant="success" label="Active" />
            <Badge variant="warning" label="Pending" />
            <Badge variant="danger" label="Critical" />
            <Badge variant="info" label="Info" />
            <Badge variant="secondary" label="Secondary" />
          </div>
        </section>
      </div>
    </div>
  );
}

export default App;
