export default function ProgressBar({ completed, total }) {
  const percent = total === 0 ? 0 : Math.round((completed / total) * 100)

  return (
    <div className="progress-shell" aria-label="Progress">
      <div className="progress-track">
        <div className="progress-fill" style={{ width: `${percent}%` }} />
      </div>
      <p>{completed}/{total} POIs complete</p>
    </div>
  )
}
