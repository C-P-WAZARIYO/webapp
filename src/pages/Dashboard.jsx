import React, { useState, useEffect } from 'react';
import '../styles/Dashboard.css';

const Dashboard = () => {
  // Mock User State - Change 'role' to 'USER' or 'ANALYTIC' to see RBAC changes
  const [user] = useState({
    name: "Vikram Singh",
    role: "ADMIN", 
    lastLogin: "Feb 06, 2026 - 09:15 AM",
    targetProgress: 40,
    status: "On Track",
    trend: "up" // up, down, stable
  });

  const [greeting, setGreeting] = useState("");

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting("Good morning");
    else if (hour < 18) setGreeting("Good afternoon");
    else setGreeting("Good evening");
  }, []);

  // Mock Role Check
  const canUpload = ["ADMIN", "SUPERVISOR"].includes(user.role);

  return (
    <div className="dashboard-container">
      {/* 1. Welcome Section */}
      <header className="dashboard-header">
        <div className="welcome-meta">
          <h1 className="greeting-text">{greeting}, {user.name}</h1>
          <div className="user-badge">
            <span className="role-label">{user.role}</span>
            <span className="divider">|</span>
            <span className="last-login">Last login: {user.lastLogin}</span>
          </div>
        </div>
        
        {/* 6. Primary Action Area (RBAC Controlled) */}
        {canUpload && (
          <div className="action-area">
            <button className="cta-button">Upload Data</button>
          </div>
        )}
      </header>

      <div className="dashboard-grid">
        
        {/* 2. Target Status & 7. Progress Indicator */}
        <section className="status-card">
          <h2 className="section-title">Operational Target</h2>
          <div className="progress-value">{user.targetProgress}%</div>
          <div className="progress-bar-bg">
            <div className="progress-bar-fill" style={{ width: `${user.targetProgress}%` }}></div>
          </div>
          <div className="status-footer">
            <span className={`status-indicator ${user.status.replace(/\s+/g, '-').toLowerCase()}`}>
              {user.status}
            </span>
            <span className={`trend-icon trend-${user.trend}`}>
              {user.trend === "up" ? "↑" : user.trend === "down" ? "↓" : "—"}
            </span>
          </div>
        </section>

        {/* 4. Task Summary Card */}
        <section className="summary-card">
          <h2 className="section-title">Assignment Overview</h2>
          <div className="summary-stats">
            <div className="stat-item">
              <span className="stat-count">{12}</span>
              <span className="stat-label">Pending</span>
            </div>
            <div className="stat-item">
              <span className="stat-count success">{45}</span>
              <span className="stat-label">Completed</span>
            </div>
            <div className="stat-item">
              <span className="stat-count alert">{2}</span>
              <span className="stat-label">Cancelled</span>
            </div>
          </div>
          <div className="stat-subtext">
            <strong>Today's Load:</strong> 8 assignments. <span className="highlight">4 overdue from yesterday.</span>
          </div>
        </section>

        {/* 5. Needs Attention Panel (High Priority) */}
        <section className="priority-panel">
          <h2 className="section-title urgent">Needs Attention</h2>
          <div className="priority-content">
            {/* Logic: If empty, show calm message */}
            <div className="urgent-item">
              <p>System detected missing employee IDs in Batch #402.</p>
              <button className="text-link">Resolve Now</button>
            </div>
            {/* If empty: <p className="calm-message">All critical systems operational. No urgent actions required.</p> */}
          </div>
        </section>

        {/* 3. Notifications Panel */}
        <section className="notifications-panel">
          <h2 className="section-title">Actionable Alerts</h2>
          <ul className="notif-list">
            <li>New task allocation received from Supervisor.</li>
            <li>Work target threshold exceeded for Regional Division.</li>
            <li>Pending approval requested for User Access: ID_882.</li>
          </ul>
        </section>

        {/* 8. Role-Based Extension Area */}
        <section className="extension-area">
          <h2 className="section-title">Role Extensions</h2>
          <div className="placeholder-widget">
            <p>// Widget Injection Point</p>
            <p className="sub">Specific components for {user.role} rank will render here.</p>
          </div>
        </section>

      </div>
    </div>
  );
};

export default Dashboard;