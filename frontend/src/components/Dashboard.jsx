import React, { useState, useEffect } from 'react';
import { LineChart, BarChart, Card } from './charts';
import './Dashboard.css';

export default function Dashboard() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const response = await fetch('/api/analytics');
      const result = await response.json();
      setData(result);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
      setLoading(false);
    }
  };

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div className="dashboard-container">
      <h1>Dashboard Overview</h1>
      <Card title="Revenue" data={data.revenue} />
      <LineChart data={data.trends} />
    </div>
  );
}
