import { useEffect, useState } from 'react'

export default function AdminUsers({ backendUrl, adminUserId, onBack }) {
  const [users, setUsers] = useState([])
  const [search, setSearch] = useState('')

  const headers = { 'Content-Type': 'application/json', 'X-Admin-User-Id': adminUserId }

  const loadUsers = () => {
    const url = search ? `${backendUrl}/admin/users?search=${encodeURIComponent(search)}` : `${backendUrl}/admin/users`
    fetch(url, { headers })
      .then((r) => r.json())
      .then((d) => setUsers(d.users || []))
      .catch(() => {})
  }

  useEffect(() => { loadUsers() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const toggleBan = async (userId, isBanned) => {
    const action = isBanned ? 'unban' : 'ban'
    await fetch(`${backendUrl}/admin/users/${userId}/${action}`, { method: 'POST', headers })
    loadUsers()
  }

  return (
    <section className="panel">
      <h2>Users</h2>
      <div className="row-actions">
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name..." style={{ flex: 1 }} />
        <button className="primary-btn" onClick={loadUsers}>Search</button>
      </div>
      <div className="admin-list">
        {users.map((u) => (
          <div key={u.id} className="admin-list-item">
            <div>
              <strong>{u.name}</strong>
              <p className="subtle">{u.role || 'player'}{u.is_banned ? ' | BANNED' : ''}{u.leader ? ' | Host' : ''}</p>
            </div>
            {u.role !== 'admin' && (
              <button className="ghost-btn" style={{ color: u.is_banned ? '#4ade80' : '#f87171' }} onClick={() => toggleBan(u.id, u.is_banned)}>
                {u.is_banned ? 'Unban' : 'Ban'}
              </button>
            )}
          </div>
        ))}
        {users.length === 0 && <p className="subtle">No users found.</p>}
      </div>
      <button className="secondary-btn" onClick={onBack}>Back</button>
    </section>
  )
}
