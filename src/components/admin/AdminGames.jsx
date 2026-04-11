import { useEffect, useState } from 'react'

export default function AdminGames({ backendUrl, adminUserId, onBack }) {
  const [games, setGames] = useState([])
  const [detail, setDetail] = useState(null)
  const [filter, setFilter] = useState('')

  const headers = { 'Content-Type': 'application/json', 'X-Admin-User-Id': adminUserId }

  const loadGames = () => {
    const url = filter ? `${backendUrl}/admin/games?status=${filter}` : `${backendUrl}/admin/games`
    fetch(url, { headers })
      .then((r) => r.json())
      .then((d) => setGames(d.games || []))
      .catch(() => {})
  }

  useEffect(() => { loadGames() }, [filter]) // eslint-disable-line react-hooks/exhaustive-deps

  const viewDetail = (gameId) => {
    fetch(`${backendUrl}/admin/games/${gameId}`, { headers })
      .then((r) => r.json())
      .then(setDetail)
      .catch(() => {})
  }

  const forceEnd = async (gameId) => {
    await fetch(`${backendUrl}/admin/games/${gameId}/end`, { method: 'POST', headers })
    loadGames()
    setDetail(null)
  }

  const kickPlayer = async (gameId, userId) => {
    await fetch(`${backendUrl}/admin/games/${gameId}/kick/${userId}`, { method: 'POST', headers })
    viewDetail(gameId)
  }

  const cleanupStale = async () => {
    await fetch(`${backendUrl}/admin/games/cleanup`, { method: 'POST', headers })
    loadGames()
  }

  if (detail) {
    const game = detail.game
    return (
      <section className="panel">
        <h2>Game: {game.code}</h2>
        <p className="subtle">Status: {game.status} | ID: {game.id.slice(0, 8)}...</p>
        <h3>Players</h3>
        <div className="admin-list">
          {(detail.players || []).map((p) => {
            const user = p.user
            if (!user) return null
            return (
              <div key={user.id} className="admin-list-item">
                <span>{user.name} {user.leader ? '(Host)' : ''} — {p.score ?? 0} pts</span>
                {!user.leader && game.status === 'active' && (
                  <button className="ghost-btn" style={{ color: '#f87171' }} onClick={() => kickPlayer(game.id, user.id)}>Kick</button>
                )}
              </div>
            )
          })}
        </div>
        {game.status === 'active' && (
          <button className="primary-btn" style={{ background: '#dc2626' }} onClick={() => forceEnd(game.id)}>
            Force End Game
          </button>
        )}
        <button className="secondary-btn" onClick={() => setDetail(null)}>Back to Games</button>
      </section>
    )
  }

  return (
    <section className="panel">
      <h2>Games</h2>
      <div className="row-actions">
        {['', 'lobby', 'active', 'ended'].map((f) => (
          <button key={f} className={filter === f ? 'primary-btn' : 'ghost-btn'} onClick={() => setFilter(f)}>
            {f || 'All'}
          </button>
        ))}
        <button className="ghost-btn" style={{ color: '#fbbf24' }} onClick={cleanupStale}>
          Clean Up Stale
        </button>
      </div>
      <div className="admin-list">
        {games.map((g) => (
          <div key={g.id} className="admin-list-item">
            <div>
              <strong>{g.code || 'No code'}</strong>
              <p className="subtle">{g.status || 'unknown'} | {g.player_count ?? 0}/{g.max_players ?? 0} players | {g.timer_seconds ?? 0}s timer</p>
            </div>
            <button className="ghost-btn" onClick={() => viewDetail(g.id)}>Details</button>
          </div>
        ))}
        {games.length === 0 && <p className="subtle">No games found.</p>}
      </div>
      <button className="secondary-btn" onClick={onBack}>Back</button>
    </section>
  )
}
