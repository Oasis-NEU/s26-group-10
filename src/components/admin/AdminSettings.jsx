import { useEffect, useState } from 'react'

export default function AdminSettings({ backendUrl, adminUserId, onBack }) {
  const [settings, setSettings] = useState([])
  const [edits, setEdits] = useState({})
  const [saved, setSaved] = useState('')

  const headers = { 'Content-Type': 'application/json', 'X-Admin-User-Id': adminUserId }

  useEffect(() => {
    fetch(`${backendUrl}/admin/settings`, { headers })
      .then((r) => r.json())
      .then((d) => {
        setSettings(d.settings || [])
        const map = {}
        for (const s of d.settings || []) map[s.key] = s.value
        setEdits(map)
      })
      .catch(() => {})
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const save = async (key) => {
    await fetch(`${backendUrl}/admin/settings/${key}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({ value: edits[key] }),
    })
    setSaved(key)
    setTimeout(() => setSaved(''), 2000)
  }

  return (
    <section className="panel">
      <h2>Settings</h2>
      <div className="admin-list">
        {settings.map((s) => (
          <div key={s.key} className="admin-list-item" style={{ flexDirection: 'column', gap: '0.4rem' }}>
            <label className="field">
              {s.key}
              <div className="row-actions">
                <input value={edits[s.key] ?? ''} onChange={(e) => setEdits({ ...edits, [s.key]: e.target.value })} style={{ flex: 1 }} />
                <button className="primary-btn" onClick={() => save(s.key)}>{saved === s.key ? 'Saved' : 'Save'}</button>
              </div>
            </label>
          </div>
        ))}
        {settings.length === 0 && <p className="subtle">No settings found.</p>}
      </div>
      <button className="secondary-btn" onClick={onBack}>Back</button>
    </section>
  )
}
