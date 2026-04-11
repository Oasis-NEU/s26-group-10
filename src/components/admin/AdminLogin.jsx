import { useState } from 'react'

export default function AdminLogin({ backendUrl, onLogin, onBack }) {
  const [adminId, setAdminId] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async () => {
    if (!adminId.trim()) {
      setError('Please enter your admin user ID.')
      return
    }
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`${backendUrl}/admin/settings`, {
        headers: { 'X-Admin-User-Id': adminId.trim() },
      })
      if (res.status === 403) {
        setError('Access denied. This user is not an admin.')
        return
      }
      if (!res.ok) throw new Error('Server error')
      onLogin(adminId.trim())
    } catch {
      setError('Could not connect to server.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="panel">
      <h2>Admin Login</h2>
      <p className="subtle">Enter your admin user ID to access the dashboard.</p>
      {error && <p className="subtle error">{error}</p>}
      <label className="field">
        Admin User ID
        <input
          value={adminId}
          onChange={(e) => setAdminId(e.target.value)}
          placeholder="UUID"
        />
      </label>
      <div className="row-actions">
        <button className="secondary-btn" onClick={onBack}>Back</button>
        <button className="primary-btn" onClick={handleLogin} disabled={loading}>
          {loading ? 'Verifying...' : 'Login'}
        </button>
      </div>
    </section>
  )
}
