import { formatTimer } from '../utils/game'

export default function TimerBanner({ secondsRemaining, status, onForceEnd }) {
  return (
    <div className="timer-banner">
      <div>
        <p className="eyebrow">Session Timer</p>
        <h2>{formatTimer(secondsRemaining)}</h2>
      </div>
      <div className="timer-right">
        <p className={`status-pill status-${status}`}>{status.toUpperCase()}</p>
        <button type="button" className="ghost-btn" onClick={onForceEnd}>
          End Game
        </button>
      </div>
    </div>
  )
}
