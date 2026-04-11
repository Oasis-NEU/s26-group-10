import { useEffect, useState } from 'react'

export default function AdminAnalytics({ backendUrl, adminUserId, onBack }) {
  const [stats, setStats] = useState(null)
  const [leaderboard, setLeaderboard] = useState([])

  const headers = { 'X-Admin-User-Id': adminUserId }

  useEffect(() => {
    fetch(`${backendUrl}/admin/analytics/summary`, { headers })
      .then((r) => r.json())
      .then(setStats)
      .catch(() => {})
    fetch(`${backendUrl}/admin/analytics/leaderboard`, { headers })
      .then((r) => r.json())
      .then((d) => setLeaderboard(d.leaderboard || []))
      .catch(() => {})
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <section className="panel">
      <h2>Analytics</h2>
      {stats && (
        <div className="stat-grid">
          <div className="stat-card"><p className="stat-value">{stats.total_games}</p><p className="stat-label">Total Games</p></div>
          <div className="stat-card"><p className="stat-value">{stats.active_games}</p><p className="stat-label">Active</p></div>
          <div className="stat-card"><p className="stat-value">{stats.total_users}</p><p className="stat-label">Users</p></div>
          <div className="stat-card"><p className="stat-value">{stats.average_score}</p><p className="stat-label">Avg Score</p></div>
        </div>
      )}
      <h3>Global Leaderboard</h3>
      <div className="admin-list">
        {leaderboard.map((entry, i) => (
          <div key={entry.users?.id ?? i} className="admin-list-item">
            <span>#{i + 1} {entry.users?.name ?? 'Unknown'}</span>
            <span>{entry.score} pts</span>
          </div>
        ))}
        {leaderboard.length === 0 && <p className="subtle">No scores yet.</p>}
      </div>
      <button className="secondary-btn" onClick={onBack}>Back</button>
    </section>
  )
}
