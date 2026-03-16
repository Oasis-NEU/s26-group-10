import { useEffect, useMemo, useState } from 'react'
import './App.css'
import TimerBanner from './components/TimerBanner'
import ProgressBar from './components/ProgressBar'
import { SAMPLE_LEADERBOARD } from './data/mockData'
import { getGameStatus } from './utils/game'
import { connectSocket, disconnectSocket, socket } from './lib/socket'

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL ?? 'http://localhost:8000'
const DEFAULT_MAP_ID = import.meta.env.VITE_DEFAULT_MAP_ID ?? 'b5158f57-3278-4ddd-9cb4-a434d1c4449b'

function App() {
  const [screen, setScreen] = useState('home')
  const [mode, setMode] = useState('player')
  const [joinCodeInput, setJoinCodeInput] = useState('')
  const [sessionCode, setSessionCode] = useState('')
  const [playerName, setPlayerName] = useState('')
  const [secondsRemaining, setSecondsRemaining] = useState(20 * 60)
  const [pois, setPois] = useState([])
  const [selectedPoiId, setSelectedPoiId] = useState(null)
  const [arrivedMap, setArrivedMap] = useState({})
  const [completedMap, setCompletedMap] = useState({})
  const [quizAnswers, setQuizAnswers] = useState({})
  const [quizResultByPoi, setQuizResultByPoi] = useState({})
  const [userId, setUserId] = useState('')
  const [gameId, setGameId] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [leaderboard, setLeaderboard] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [gameStarted, setGameStarted] = useState(false)

  const selectedPoi = useMemo(
    () => pois.find((poi) => poi.id === selectedPoiId) ?? null,
    [pois, selectedPoiId],
  )

  const completedCount = useMemo(
    () => Object.values(completedMap).filter(Boolean).length,
    [completedMap],
  )

  const gameStatus = getGameStatus({
    secondsRemaining,
    completedCount,
    totalPois: pois.length,
  })

  const totalScore = useMemo(
    () =>
      Object.values(quizResultByPoi).reduce(
        (sum, item) => sum + (item.score ?? 0),
        0,
      ),
    [quizResultByPoi],
  )

  // Socket event listeners
  useEffect(() => {
    connectSocket()

    // Confirm join — fires for both host and player
    const onJoinConfirmed = (payload) => {
      setUserId(payload.user_id)
      setGameId(payload.game_id)
      setSessionCode(payload.code)
      setErrorMessage('')
      // Host goes to lobby to wait, player goes to poi-list when game starts
      if (mode === 'host') {
        setScreen('lobby') 
      } else {
        setScreen('waiting')
      }
    }

    // Lobby updated — new player joined
    const onLobbyUpdated = (payload) => {
      // Could display player list in lobby if needed
      console.log('Lobby updated:', payload.players)
    }

    // Game started — backend sends locations and timer
    const onGameStarted = (payload) => {
      const mappedPois = (payload.locations ?? []).map((loc) => ({
        id: loc.id,
        title: loc.name,
        description: loc.info ?? '',
        distanceMeters: 0,
        points: loc.point_value ?? 100,
        imageUrl: '',
        quiz: [],
      }))
      setPois(mappedPois)
      if (mappedPois.length > 0) setSelectedPoiId(mappedPois[0].id)
      setSecondsRemaining(payload.timer_seconds ?? 20 * 60)
      setGameStarted(true)
      setScreen('poi-list')
    }

    // Timer tick — server drives the clock
    const onTimerTick = (payload) => {
      setSecondsRemaining(payload.seconds_remaining)
    }

    // Location reached — server confirmed arrival, sends info + questions
    const onLocationReached = (payload) => {
      const location = payload.location
      if (!location) return

      setPois((prev) =>
        prev.map((poi) =>
          poi.id === location.id
            ? {
                ...poi,
                title: location.name ?? poi.title,
                description: location.info ?? poi.description,
                points: location.point_value ?? poi.points,
                quiz: (payload.questions ?? []).map((q) => ({
                  id: q.id,
                  prompt: q.body,
                  options: Array.isArray(q.options) ? q.options : JSON.parse(q.options ?? '[]'),
                  answerIndex: 0,
                })),
              }
            : poi,
        ),
      )

      setArrivedMap((prev) => ({ ...prev, [location.id]: true }))
      setErrorMessage('')
      setScreen('poi-detail')
    }

    // Too far — player not close enough
    const onLocationTooFar = (payload) => {
      setErrorMessage(payload?.message ?? 'You are too far from this location.')
      setArrivedMap((prev) => ({ ...prev, [selectedPoiId]: false }))
    }

    // Quiz result — score awarded
    const onQuizResult = (payload) => {
      if (!selectedPoiId) return
      setQuizResultByPoi((prev) => ({
        ...prev,
        [selectedPoiId]: {
          correctAnswers: payload.correct,
          totalQuestions: payload.total,
          score: payload.points_earned,
        },
      }))
      setCompletedMap((prev) => ({ ...prev, [selectedPoiId]: true }))
      setErrorMessage('')
      setScreen('poi-list')
    }

    // Game ended — show leaderboard
    const onGameEnded = (payload) => {
      setLeaderboard(payload.leaderboard ?? [])
      setScreen('leaderboard')
    }

    // Backend error
    const onSocketError = (payload) => {
      setErrorMessage(payload?.message ?? 'Something went wrong. Please try again.')
      setIsLoading(false)
    }

    socket.on('join_confirmed', onJoinConfirmed)
    socket.on('lobby_updated', onLobbyUpdated)
    socket.on('game_started', onGameStarted)
    socket.on('timer_tick', onTimerTick)
    socket.on('location_reached', onLocationReached)
    socket.on('location_too_far', onLocationTooFar)
    socket.on('quiz_result', onQuizResult)
    socket.on('game_ended', onGameEnded)
    socket.on('error', onSocketError)

    return () => {
      socket.off('join_confirmed', onJoinConfirmed)
      socket.off('lobby_updated', onLobbyUpdated)
      socket.off('game_started', onGameStarted)
      socket.off('timer_tick', onTimerTick)
      socket.off('location_reached', onLocationReached)
      socket.off('location_too_far', onLocationTooFar)
      socket.off('quiz_result', onQuizResult)
      socket.off('game_ended', onGameEnded)
      socket.off('error', onSocketError)
      disconnectSocket()
    }
  }, [mode, selectedPoiId])

  // HOST: Create party via REST, then join socket room
  const startSession = async () => {
    if (!playerName.trim()) {
      setErrorMessage('Please enter your name.')
      return
    }
    setIsLoading(true)
    setErrorMessage('')

    try {
      const res = await fetch(`${BACKEND_URL}/party`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          host_name: playerName.trim(),
          map_id: DEFAULT_MAP_ID,
          timer_seconds: 20 * 60,
          max_players: 10,
          start_lat: 42.3398,
          start_lng: -71.0892,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.detail ?? 'Failed to create party')

      setSessionCode(data.code)
      setUserId(data.user_id)
      setGameId(data.game_id)

      // Join the socket room so host receives game_started and timer_tick
      socket.emit('party_join', { code: data.code, name: playerName.trim(), user_id: data.user_id })
      setScreen('lobby')
    } catch (err) {
      setErrorMessage(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  // HOST: Trigger game start
  const triggerGameStart = () => {
    if (!sessionCode || !userId) return
    socket.emit('game_start', { code: sessionCode, user_id: userId })
  }

  // PLAYER: Join via socket
  const submitJoin = () => {
    const cleaned = joinCodeInput.trim().toUpperCase()
    if (!cleaned) return
    if (!playerName.trim()) {
      setErrorMessage('Please enter your name before joining.')
      return
    }
    setErrorMessage('')
    socket.emit('party_join', { code: cleaned, name: playerName.trim() })
  }

  const openPoi = (poiId) => {
    setSelectedPoiId(poiId)
    setScreen('poi-check')
  }

  const markArrived = (value) => {
    if (!selectedPoi) return
    if (!value) return
    if (!userId || !gameId) {
      setErrorMessage('Join a live game before checking location.')
      return
    }
    setErrorMessage('')
    socket.emit('location_check', {
      user_id: userId,
      game_id: gameId,
      location_id: selectedPoi.id,
      lat: 42.3398,
      lng: -71.0892,
    })
  }

  const selectAnswer = (questionId, optionIndex) => {
    if (!selectedPoi) return
    setQuizAnswers((prev) => ({
      ...prev,
      [selectedPoi.id]: {
        ...(prev[selectedPoi.id] ?? {}),
        [questionId]: optionIndex,
      },
    }))
  }

  const submitQuiz = () => {
    if (!selectedPoi) return
    if (!userId || !gameId) {
      setErrorMessage('Join a live game before submitting answers.')
      return
    }
    const answerSet = quizAnswers[selectedPoi.id] ?? {}
    const orderedAnswers = selectedPoi.quiz.map((q) => {
      const picked = answerSet[q.id]
      if (typeof picked !== 'number') return null
      return String.fromCharCode(65 + picked)
    })

    socket.emit('quiz_answer', {
      user_id: userId,
      game_id: gameId,
      location_id: selectedPoi.id,
      answers: orderedAnswers,
    })
  }

  const resetGame = () => {
    setScreen('home')
    setMode('player')
    setJoinCodeInput('')
    setSessionCode('')
    setPlayerName('')
    setSecondsRemaining(20 * 60)
    setPois([])
    setSelectedPoiId(null)
    setArrivedMap({})
    setCompletedMap({})
    setQuizAnswers({})
    setQuizResultByPoi({})
    setUserId('')
    setGameId('')
    setErrorMessage('')
    setLeaderboard([])
    setGameStarted(false)
  }

  const renderHeader = () => {
    if (['home', 'join', 'create', 'lobby'].includes(screen)) return null
    return (
      <header className="page-header">
        <div>
          <p className="eyebrow">Session Code</p>
          <h1>{sessionCode || '-----'}</h1>
        </div>
        <div className="header-meta">
          <p className="meta-chip">{mode === 'host' ? 'Host' : 'Player'}</p>
          <p className="meta-chip">Score: {totalScore}</p>
        </div>
      </header>
    )
  }

  return (
    <main className="app-shell">
      {renderHeader()}

      {['poi-list', 'poi-check', 'poi-detail', 'quiz'].includes(screen) && (
        <TimerBanner
          secondsRemaining={secondsRemaining}
          status={gameStatus}
          onForceEnd={() => socket.emit('game_end', { code: sessionCode })}
        />
      )}

      {/* HOME */}
      {screen === 'home' && (
        <section className="panel home-panel">
          <h1>Oasis Hunt</h1>
          <p className="subtle">
            Build a route, join with a code, reach POIs, answer quizzes, and climb
            the leaderboard.
          </p>
          <div className="button-stack">
            <button className="primary-btn" onClick={() => { setMode('host'); setScreen('create') }}>
              Create
            </button>
            <button className="primary-btn" onClick={() => { setMode('player'); setScreen('join') }}>
              Join
            </button>
          </div>
        </section>
      )}

      {/* CREATE */}
      {screen === 'create' && (
        <section className="panel">
          <h2>Create Session</h2>
          <p className="subtle">Enter your name and launch the game.</p>
          {errorMessage && <p className="subtle error">{errorMessage}</p>}

          <label className="field">
            Host / Team name
            <input
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="Ex: Campus Explorers"
            />
          </label>

          <div className="row-actions">
            <button className="secondary-btn" onClick={() => setScreen('home')}>
              Back
            </button>
            <button className="primary-btn" onClick={startSession} disabled={isLoading}>
              {isLoading ? 'Creating...' : 'Create Session'}
            </button>
          </div>
        </section>
      )}

      {/* LOBBY — host waits here, shares code with players */}
      {screen === 'lobby' && (
        <section className="panel">
          <h2>Waiting for players</h2>
          <p className="subtle">Share this code with your players:</p>
          <h1 style={{ letterSpacing: '0.2em', margin: '1rem 0' }}>{sessionCode}</h1>
          <p className="subtle">Players can join at the Join screen.</p>
          {errorMessage && <p className="subtle error">{errorMessage}</p>}
          <div className="row-actions">
            <button className="secondary-btn" onClick={resetGame}>
              Cancel
            </button>
            <button className="primary-btn" onClick={triggerGameStart}>
              Start Game
            </button>
          </div>
        </section>
      )}

      {/* JOIN */}
      {screen === 'join' && (
        <section className="panel">
          <h2>Join Session</h2>
          {errorMessage && <p className="subtle error">{errorMessage}</p>}
          <label className="field">
            Your name
            <input
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="Ex: Team Nova"
            />
          </label>
          <label className="field">
            Enter code
            <input
              value={joinCodeInput}
              onChange={(e) => setJoinCodeInput(e.target.value)}
              placeholder="ABCDE"
              maxLength={6}
            />
          </label>
          <div className="row-actions">
            <button className="secondary-btn" onClick={() => setScreen('home')}>
              Back
            </button>
            <button className="primary-btn" onClick={submitJoin}>
              Join
            </button>
          </div>
        </section>
      )}

      {/* WAITING — player joined, waiting for host to start */}
      {screen === 'waiting' && (
        <section className="panel">
          <h2>Waiting for host to start...</h2>
          <p className="subtle">You've joined session <strong>{sessionCode}</strong>.</p>
          <p className="subtle">The game will begin shortly.</p>
        </section>
      )}

      {/* POI LIST */}
      {screen === 'poi-list' && (
        <section className="panel">
          <h2>POIs</h2>
          <ProgressBar completed={completedCount} total={pois.length} />
          <div className="poi-cards">
            {pois.map((poi, idx) => {
              const isComplete = !!completedMap[poi.id]
              return (
                <article key={poi.id} className={`poi-card ${isComplete ? 'done' : ''}`}>
                  <div>
                    <p className="eyebrow">POI #{idx + 1}</p>
                    <h3>{poi.title}</h3>
                    <p className="subtle">Distance: {poi.distanceMeters}m</p>
                  </div>
                  <div className="row-actions">
                    {isComplete && <span className="complete-badge">Complete</span>}
                    <button className="primary-btn" onClick={() => openPoi(poi.id)}>
                      {isComplete ? 'Review' : 'Open'}
                    </button>
                  </div>
                </article>
              )
            })}
          </div>
        </section>
      )}

      {/* POI CHECK */}
      {screen === 'poi-check' && selectedPoi && (
        <section className="panel">
          <h2>{selectedPoi.title}</h2>
          <p className="subtle">POI #{pois.findIndex((p) => p.id === selectedPoi.id) + 1} route check</p>
          {errorMessage && <p className="subtle error">{errorMessage}</p>}

          <div className="row-actions">
            <button className="secondary-btn" onClick={() => setScreen('poi-list')}>
              Not yet
            </button>
            <button className="primary-btn" onClick={() => markArrived(true)}>
              I arrived
            </button>
          </div>

          <button className="ghost-btn" onClick={() => setScreen('poi-list')}>
            Back to list
          </button>
        </section>
      )}

      {/* POI DETAIL */}
      {screen === 'poi-detail' && selectedPoi && (
        <section className="panel">
          {selectedPoi.imageUrl && (
            <img src={selectedPoi.imageUrl} alt={selectedPoi.title} className="poi-image" />
          )}
          <h2>{selectedPoi.title}</h2>
          <p>{selectedPoi.description}</p>
          <div className="row-actions">
            <button className="secondary-btn" onClick={() => setScreen('poi-list')}>
              Save for later
            </button>
            <button className="primary-btn" onClick={() => setScreen('quiz')}>
              Take quiz
            </button>
          </div>
        </section>
      )}

      {/* QUIZ */}
      {screen === 'quiz' && selectedPoi && (
        <section className="panel">
          <h2>{selectedPoi.title} Quiz</h2>
          <p className="subtle">{selectedPoi.quiz.length} questions</p>
          {errorMessage && <p className="subtle error">{errorMessage}</p>}
          <div className="quiz-stack">
            {selectedPoi.quiz.map((question, qIdx) => (
              <article key={question.id} className="quiz-card">
                <p>
                  <strong>Q{qIdx + 1}.</strong> {question.prompt}
                </p>
                <div className="option-grid">
                  {question.options.map((option, oIdx) => {
                    const selected = quizAnswers[selectedPoi.id]?.[question.id] === oIdx
                    return (
                      <button
                        key={option}
                        type="button"
                        className={`option-btn ${selected ? 'active' : ''}`}
                        onClick={() => selectAnswer(question.id, oIdx)}
                      >
                        {String.fromCharCode(65 + oIdx)}. {option}
                      </button>
                    )
                  })}
                </div>
              </article>
            ))}
          </div>
          <div className="row-actions">
            <button className="secondary-btn" onClick={() => setScreen('poi-detail')}>
              Back
            </button>
            <button className="primary-btn" onClick={submitQuiz}>
              Submit
            </button>
          </div>
        </section>
      )}

      {/* LEADERBOARD */}
      {screen === 'leaderboard' && (
        <section className="panel">
          <h2>Leaderboard</h2>
          <p className="subtle">Session ended. Final ranking is shown below.</p>
          <ol className="leaderboard-list">
            {(leaderboard.length > 0 ? leaderboard : SAMPLE_LEADERBOARD)
              .sort((a, b) => b.score - a.score)
              .map((entry, i) => (
                <li key={entry.user_id ?? entry.id ?? i} className="leader-item">
                  <span>{entry.name}</span>
                  <span>{entry.score} pts</span>
                </li>
              ))}
          </ol>
          <button className="primary-btn" onClick={resetGame}>
            Back to Start
          </button>
        </section>
      )}
    </main>
  )
}

export default App