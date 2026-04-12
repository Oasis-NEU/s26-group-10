import { useEffect, useState } from 'react'

export default function AdminDashboard({ backendUrl, adminUserId, onNavigate, onLogout }) {
  const [stats, setStats] = useState(null)

  useEffect(() => {
    fetch(`${backendUrl}/admin/analytics/summary`, {
      headers: { 'X-Admin-User-Id': adminUserId },
    })
      .then((r) => r.json())
      .then(setStats)
      .catch(() => {})
  }, [backendUrl, adminUserId])

  const tiles = [
    { label: 'Maps & Locations', screen: 'admin-maps' },
    { label: 'Questions', screen: 'admin-maps-for-questions' },
    { label: 'Games', screen: 'admin-games' },
    { label: 'Users', screen: 'admin-users' },
    { label: 'Analytics', screen: 'admin-analytics' },
    { label: 'Settings', screen: 'admin-settings' },
  ]

  return (
    <section className="panel">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>Admin Dashboard</h2>
        <button className="ghost-btn" onClick={onLogout}>Logout</button>
      </div>

      {stats && (
        <div className="stat-grid">
          <div className="stat-card">
            <p className="stat-value">{stats.total_games}</p>
            <p className="stat-label">Total Games</p>
          </div>
          <div className="stat-card">
            <p className="stat-value">{stats.active_games}</p>
            <p className="stat-label">Active Games</p>
          </div>
          <div className="stat-card">
            <p className="stat-value">{stats.total_users}</p>
            <p className="stat-label">Total Users</p>
          </div>
          <div className="stat-card">
            <p className="stat-value">{stats.average_score}</p>
            <p className="stat-label">Avg Score</p>
          </div>
        </div>
      )}

      <div className="admin-nav-grid">
        {tiles.map((tile) => (
          <button
            key={tile.screen}
            className="secondary-btn"
            onClick={() => onNavigate(tile.screen)}
          >
            {tile.label}
          </button>
        ))}
      </div>
    </section>
  )
}
