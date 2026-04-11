import { useEffect, useState } from 'react'

export default function AdminMaps({ backendUrl, adminUserId, onNavigate, onBack, selectForQuestions }) {
  const [maps, setMaps] = useState([])
  const [selectedMap, setSelectedMap] = useState(null)
  const [locations, setLocations] = useState([])
  const [form, setForm] = useState({ name: '', info: '', point_value: 100, lat: 0, lng: 0 })
  const [editId, setEditId] = useState(null)
  const [error, setError] = useState('')

  const headers = { 'Content-Type': 'application/json', 'X-Admin-User-Id': adminUserId }

  useEffect(() => {
    fetch(`${backendUrl}/admin/maps`, { headers })
      .then((r) => r.json())
      .then((d) => setMaps(d.maps || []))
      .catch(() => {})
  }, [])  // eslint-disable-line react-hooks/exhaustive-deps

  const loadLocations = (mapId) => {
    setSelectedMap(mapId)
    fetch(`${backendUrl}/admin/maps/${mapId}/locations`, { headers })
      .then((r) => r.json())
      .then((d) => setLocations(d.locations || []))
      .catch(() => {})
  }

  const parseCoords = (coords) => {
    let lat = 0, lng = 0
    if (typeof coords === 'string' && coords.length >= 42) {
      const buf = new Uint8Array(coords.length / 2)
      for (let i = 0; i < buf.length; i++) buf[i] = parseInt(coords.substr(i * 2, 2), 16)
      const dv = new DataView(buf.buffer)
      const le = buf[0] === 1
      const offset = buf.length - 16
      lng = dv.getFloat64(offset, le)
      lat = dv.getFloat64(offset + 8, le)
    }
    return { lat, lng }
  }

  const saveLocation = async () => {
    setError('')
    const url = editId
      ? `${backendUrl}/admin/maps/locations/${editId}`
      : `${backendUrl}/admin/maps/${selectedMap}/locations`
    const method = editId ? 'PUT' : 'POST'

    const res = await fetch(url, { method, headers, body: JSON.stringify(form) })
    if (!res.ok) { setError('Failed to save location'); return }
    setForm({ name: '', info: '', point_value: 100, lat: 0, lng: 0 })
    setEditId(null)
    loadLocations(selectedMap)
  }

  const deleteLocation = async (id) => {
    await fetch(`${backendUrl}/admin/maps/locations/${id}`, { method: 'DELETE', headers })
    loadLocations(selectedMap)
  }

  const startEdit = (loc) => {
    const { lat, lng } = parseCoords(loc.coords)
    setEditId(loc.id)
    setForm({ name: loc.name, info: loc.info || '', point_value: loc.point_value, lat, lng })
  }

  if (!selectedMap) {
    return (
      <section className="panel">
        <h2>{selectForQuestions ? 'Select Map for Questions' : 'Maps & Locations'}</h2>
        <div className="admin-list">
          {maps.map((mapId) => (
            <div key={mapId} className="admin-list-item">
              <span>Map: {mapId.slice(0, 8)}...</span>
              <button className="primary-btn" onClick={() => loadLocations(mapId)}>
                {selectForQuestions ? 'Select' : 'Manage Locations'}
              </button>
            </div>
          ))}
          {maps.length === 0 && <p className="subtle">No maps found.</p>}
        </div>
        <button className="secondary-btn" onClick={onBack}>Back</button>
      </section>
    )
  }

  if (selectForQuestions) {
    return (
      <section className="panel">
        <h2>Select Location for Questions</h2>
        <div className="admin-list">
          {locations.map((loc) => (
            <div key={loc.id} className="admin-list-item">
              <span>{loc.name} ({loc.point_value} pts)</span>
              <button className="primary-btn" onClick={() => onNavigate('admin-questions', loc.id)}>
                Manage Questions
              </button>
            </div>
          ))}
        </div>
        <button className="secondary-btn" onClick={() => setSelectedMap(null)}>Back to Maps</button>
      </section>
    )
  }

  return (
    <section className="panel">
      <h2>Locations for Map {selectedMap.slice(0, 8)}...</h2>
      {error && <p className="subtle error">{error}</p>}

      <div className="admin-list">
        {locations.map((loc) => (
          <div key={loc.id} className="admin-list-item">
            <div>
              <strong>{loc.name}</strong>
              <p className="subtle">{loc.info || 'No description'} — {loc.point_value} pts</p>
            </div>
            <div className="row-actions">
              <button className="ghost-btn" onClick={() => startEdit(loc)}>Edit</button>
              <button className="ghost-btn" style={{ color: '#f87171' }} onClick={() => deleteLocation(loc.id)}>Delete</button>
            </div>
          </div>
        ))}
      </div>

      <h3>{editId ? 'Edit Location' : 'Add Location'}</h3>
      <div className="admin-form">
        <label className="field">Name<input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></label>
        <label className="field">Info<input value={form.info} onChange={(e) => setForm({ ...form, info: e.target.value })} /></label>
        <label className="field">Point Value<input type="number" value={form.point_value} onChange={(e) => setForm({ ...form, point_value: +e.target.value })} /></label>
        <label className="field">Latitude<input type="number" step="any" value={form.lat} onChange={(e) => setForm({ ...form, lat: +e.target.value })} /></label>
        <label className="field">Longitude<input type="number" step="any" value={form.lng} onChange={(e) => setForm({ ...form, lng: +e.target.value })} /></label>
        <div className="row-actions">
          {editId && <button className="ghost-btn" onClick={() => { setEditId(null); setForm({ name: '', info: '', point_value: 100, lat: 0, lng: 0 }) }}>Cancel</button>}
          <button className="primary-btn" onClick={saveLocation}>{editId ? 'Update' : 'Add'}</button>
        </div>
      </div>

      <button className="secondary-btn" onClick={() => setSelectedMap(null)}>Back to Maps</button>
    </section>
  )
}
