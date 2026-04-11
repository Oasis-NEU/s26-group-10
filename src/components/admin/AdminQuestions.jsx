import { useEffect, useState } from 'react'

export default function AdminQuestions({ backendUrl, adminUserId, locationId, onBack }) {
  const [questions, setQuestions] = useState([])
  const [form, setForm] = useState({ body: '', options: ['', '', '', ''], correct_answer: 'A' })
  const [editId, setEditId] = useState(null)
  const [error, setError] = useState('')

  const headers = { 'Content-Type': 'application/json', 'X-Admin-User-Id': adminUserId }

  const loadQuestions = () => {
    fetch(`${backendUrl}/admin/questions/location/${locationId}`, { headers })
      .then((r) => r.json())
      .then((d) => setQuestions(d.questions || []))
      .catch(() => {})
  }

  useEffect(() => { loadQuestions() }, [locationId]) // eslint-disable-line react-hooks/exhaustive-deps

  const setOption = (idx, val) => {
    const opts = [...form.options]
    opts[idx] = val
    setForm({ ...form, options: opts })
  }

  const save = async () => {
    setError('')
    const payload = { body: form.body, options: form.options.filter((o) => o.trim()), correct_answer: form.correct_answer }
    const url = editId ? `${backendUrl}/admin/questions/${editId}` : `${backendUrl}/admin/questions/location/${locationId}`
    const method = editId ? 'PUT' : 'POST'
    const res = await fetch(url, { method, headers, body: JSON.stringify(payload) })
    if (!res.ok) { setError('Failed to save'); return }
    setForm({ body: '', options: ['', '', '', ''], correct_answer: 'A' })
    setEditId(null)
    loadQuestions()
  }

  const deleteQ = async (id) => {
    await fetch(`${backendUrl}/admin/questions/${id}`, { method: 'DELETE', headers })
    loadQuestions()
  }

  const startEdit = (q) => {
    const opts = Array.isArray(q.options) ? q.options : JSON.parse(q.options || '[]')
    while (opts.length < 4) opts.push('')
    setEditId(q.id)
    setForm({ body: q.body, options: opts, correct_answer: q.correct_answer })
  }

  return (
    <section className="panel">
      <h2>Questions</h2>
      {error && <p className="subtle error">{error}</p>}
      <div className="admin-list">
        {questions.map((q) => (
          <div key={q.id} className="admin-list-item">
            <div>
              <strong>{q.body}</strong>
              <p className="subtle">Answer: {q.correct_answer}</p>
            </div>
            <div className="row-actions">
              <button className="ghost-btn" onClick={() => startEdit(q)}>Edit</button>
              <button className="ghost-btn" style={{ color: '#f87171' }} onClick={() => deleteQ(q.id)}>Delete</button>
            </div>
          </div>
        ))}
        {questions.length === 0 && <p className="subtle">No questions yet.</p>}
      </div>
      <h3>{editId ? 'Edit Question' : 'Add Question'}</h3>
      <div className="admin-form">
        <label className="field">Question<input value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} /></label>
        {form.options.map((opt, i) => (
          <label key={i} className="field">Option {String.fromCharCode(65 + i)}<input value={opt} onChange={(e) => setOption(i, e.target.value)} /></label>
        ))}
        <label className="field">Correct Answer (A/B/C/D)<input value={form.correct_answer} onChange={(e) => setForm({ ...form, correct_answer: e.target.value.toUpperCase() })} maxLength={1} /></label>
        <div className="row-actions">
          {editId && <button className="ghost-btn" onClick={() => { setEditId(null); setForm({ body: '', options: ['', '', '', ''], correct_answer: 'A' }) }}>Cancel</button>}
          <button className="primary-btn" onClick={save}>{editId ? 'Update' : 'Add'}</button>
        </div>
      </div>
      <button className="secondary-btn" onClick={onBack}>Back</button>
    </section>
  )
}
