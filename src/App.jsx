import { useEffect, useMemo, useState } from 'react'
import './App.css'
import TimerBanner from './components/TimerBanner'
import ProgressBar from './components/ProgressBar'
import { SAMPLE_LEADERBOARD, SAMPLE_POIS } from './data/mockData'
import {
  calculatePoiScore,
  generateSessionCode,
  getGameStatus,
} from './utils/game'

function App() {
  const [screen, setScreen] = useState('home')
  const [mode, setMode] = useState('player')
  const [joinCodeInput, setJoinCodeInput] = useState('')
  const [sessionCode, setSessionCode] = useState('')
  const [playerName, setPlayerName] = useState('')
  const [secondsRemaining, setSecondsRemaining] = useState(20 * 60)
  const [pois, setPois] = useState(SAMPLE_POIS)
  const [selectedPoiId, setSelectedPoiId] = useState(SAMPLE_POIS[0].id)
  const [arrivedMap, setArrivedMap] = useState({})
  const [completedMap, setCompletedMap] = useState({})
  const [quizAnswers, setQuizAnswers] = useState({})
  const [quizResultByPoi, setQuizResultByPoi] = useState({})

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

  useEffect(() => {
    if (!['poi-list', 'poi-check', 'poi-detail', 'quiz'].includes(screen)) {
      return
    }

    if (gameStatus !== 'active') {
      setScreen('leaderboard')
      return
    }

    const timer = setInterval(() => {
      setSecondsRemaining((prev) => Math.max(0, prev - 1))
    }, 1000)

    return () => clearInterval(timer)
  }, [screen, gameStatus])

  useEffect(() => {
    if (gameStatus !== 'active' && screen !== 'leaderboard') {
      setScreen('leaderboard')
    }
  }, [gameStatus, screen])

  const startCreate = () => {
    setMode('host')
    setSessionCode(generateSessionCode())
    setSecondsRemaining(20 * 60)
    setScreen('create')
  }

  const goJoin = () => {
    setMode('player')
    setScreen('join')
  }

  const submitJoin = () => {
    const cleaned = joinCodeInput.trim().toUpperCase()
    if (!cleaned) return
    setSessionCode(cleaned)
    if (!selectedPoiId && pois[0]) {
      setSelectedPoiId(pois[0].id)
    }
    setScreen('poi-list')
  }

  const startSession = () => {
    if (pois.length === 0) return
    setSelectedPoiId(pois[0].id)
    setScreen('poi-list')
  }

  const openPoi = (poiId) => {
    setSelectedPoiId(poiId)
    setScreen('poi-check')
  }

  const markArrived = (value) => {
    if (!selectedPoi) return
    setArrivedMap((prev) => ({ ...prev, [selectedPoi.id]: value }))
    if (value) {
      setScreen('poi-detail')
    }
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
    const answerSet = quizAnswers[selectedPoi.id] ?? {}
    const correctAnswers = selectedPoi.quiz.filter(
      (q) => answerSet[q.id] === q.answerIndex,
    ).length
    const totalQuestions = selectedPoi.quiz.length

    const score = calculatePoiScore({
      correctAnswers,
      totalQuestions,
      arrived: !!arrivedMap[selectedPoi.id],
    })

    setQuizResultByPoi((prev) => ({
      ...prev,
      [selectedPoi.id]: { correctAnswers, totalQuestions, score },
    }))
    setCompletedMap((prev) => ({ ...prev, [selectedPoi.id]: true }))
    setScreen('poi-list')
  }

  const resetGame = () => {
    setScreen('home')
    setMode('player')
    setJoinCodeInput('')
    setSessionCode('')
    setPlayerName('')
    setSecondsRemaining(20 * 60)
    setPois(SAMPLE_POIS)
    setSelectedPoiId(SAMPLE_POIS[0].id)
    setArrivedMap({})
    setCompletedMap({})
    setQuizAnswers({})
    setQuizResultByPoi({})
  }

  const renderHeader = () => {
    if (screen === 'home' || screen === 'join' || screen === 'create') return null

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
          onForceEnd={() => setSecondsRemaining(0)}
        />
      )}

      {screen === 'home' && (
        <section className="panel home-panel">
          <h1>Oasis Hunt</h1>
          <p className="subtle">
            Build a route, join with a code, reach POIs, answer quizzes, and climb
            the leaderboard.
          </p>
          <div className="button-stack">
            <button className="primary-btn" onClick={startCreate}>
              Create
            </button>
            <button className="primary-btn" onClick={goJoin}>
              Join
            </button>
          </div>
        </section>
      )}

      {screen === 'create' && (
        <section className="panel">
          <h2>Create Session</h2>
          <p className="subtle">Assign host details, review POIs, then launch.</p>

          <label className="field">
            Host / Team name
            <input
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="Ex: Campus Explorers"
            />
          </label>

          <label className="field">
            Session code
            <input value={sessionCode} readOnly />
          </label>

          <div className="poi-list-mini">
            {pois.map((poi, index) => (
              <div key={poi.id} className="poi-mini-item">
                <strong>P{index + 1}:</strong> {poi.title}
                <span>{poi.distanceMeters}m</span>
              </div>
            ))}
          </div>

          <div className="row-actions">
            <button className="secondary-btn" onClick={() => setSessionCode(generateSessionCode())}>
              Regenerate Code
            </button>
            <button className="primary-btn" onClick={startSession}>
              Start Session
            </button>
          </div>
        </section>
      )}

      {screen === 'join' && (
        <section className="panel">
          <h2>Join Session</h2>
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

      {screen === 'poi-check' && selectedPoi && (
        <section className="panel">
          <h2>{selectedPoi.title}</h2>
          <p className="subtle">POI #{pois.findIndex((p) => p.id === selectedPoi.id) + 1} route check</p>
          <p>
            Current distance: <strong>{selectedPoi.distanceMeters}m</strong>
          </p>

          <div className="row-actions">
            <button className="secondary-btn" onClick={() => markArrived(false)}>
              Not yet arrived
            </button>
            <button className="primary-btn" onClick={() => markArrived(true)}>
              I arrived
            </button>
          </div>

          {arrivedMap[selectedPoi.id] === false && (
            <p className="warning-box">You’re not close enough yet — get closer to unlock this POI.</p>
          )}

          <button className="ghost-btn" onClick={() => setScreen('poi-list')}>
            Back to list
          </button>
        </section>
      )}

      {screen === 'poi-detail' && selectedPoi && (
        <section className="panel">
          <img src={selectedPoi.imageUrl} alt={selectedPoi.title} className="poi-image" />
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

      {screen === 'quiz' && selectedPoi && (
        <section className="panel">
          <h2>{selectedPoi.title} Quiz</h2>
          <p className="subtle">{selectedPoi.quiz.length} questions</p>
          <div className="quiz-stack">
            {selectedPoi.quiz.map((question, qIdx) => (
              <article key={question.id} className="quiz-card">
                <p>
                  <strong>Q{qIdx + 1}.</strong> {question.prompt}
                </p>
                <div className="option-grid">
                  {question.options.map((option, oIdx) => {
                    const selected =
                      quizAnswers[selectedPoi.id]?.[question.id] === oIdx
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
              Progress
            </button>
          </div>
        </section>
      )}

      {screen === 'leaderboard' && (
        <section className="panel">
          <h2>Leaderboard</h2>
          <p className="subtle">Session ended. Final ranking is shown below.</p>
          <ol className="leaderboard-list">
            {[
              ...SAMPLE_LEADERBOARD,
              {
                id: 'self',
                name: playerName || 'You',
                score: totalScore,
                completed: completedCount,
                timeBonus: Math.floor(secondsRemaining / 60),
              },
            ]
              .sort((a, b) => b.score - a.score)
              .map((entry) => (
                <li key={entry.id} className="leader-item">
                  <span>{entry.name}</span>
                  <span>
                    {entry.score} pts · {entry.completed} POIs · +{entry.timeBonus} bonus
                  </span>
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
