export const generateSessionCode = () =>
  Math.random().toString(36).slice(2, 7).toUpperCase()

export const calculatePoiScore = ({
  correctAnswers,
  totalQuestions,
  arrived,
}) => {
  if (!arrived || totalQuestions === 0) return 0

  const accuracy = correctAnswers / totalQuestions
  const base = Math.round(accuracy * 20)

  return Math.max(0, Math.min(20, base))
}

export const getGameStatus = ({ secondsRemaining, completedCount, totalPois }) => {
  if (secondsRemaining <= 0) return 'timeup'
  if (completedCount >= totalPois) return 'completed'
  return 'active'
}

export const formatTimer = (seconds) => {
  const safe = Math.max(0, seconds)
  const minutes = Math.floor(safe / 60)
  const secs = safe % 60
  return `${minutes.toString().padStart(2, '0')}:${secs
    .toString()
    .padStart(2, '0')}`
}
