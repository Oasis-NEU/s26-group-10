import './App.css'

function App() {
  return (
    <main className="page-shell">
      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">Northeastern campus adventure</p>
          <h1>ArrowNU turns finding your way around campus into a team game.</h1>
          <p className="hero-text">
            Explore key spots around Northeastern, uncover quick facts about each
            location, and work together with your group as you move from clue to
            clue.
          </p>
          <div className="hero-actions">
            <button type="button" className="primary-button">
              Start a Party
            </button>
            <button type="button" className="secondary-button">
              See How It Works
            </button>
          </div>
          <div className="hero-notes">
            <span>Multiplayer-friendly</span>
            <span>Built for new students</span>
            <span>Campus learning game</span>
          </div>
        </div>

        <aside className="preview-card" aria-label="Game preview">
          <div className="preview-header">
            <span className="status-dot" />
            <p>Live game preview</p>
          </div>
          <div className="preview-body">
            <div className="preview-stop active">
              <p className="stop-label">Current destination</p>
              <h2>Snell Library</h2>
              <p>Meet your team here and unlock the first campus clue.</p>
            </div>
            <div className="preview-route">
              <div />
              <div />
              <div />
            </div>
            <div className="preview-stop">
              <p className="stop-label">Next up</p>
              <h3>Centennial Common</h3>
              <p>Discover one of the busiest student gathering spaces.</p>
            </div>
          </div>
        </aside>
      </section>

      <section className="info-strip">
        <article className="info-card">
          <p className="info-number">01</p>
          <h2>Create a party</h2>
          <p>One player hosts and invites others into a shared campus run.</p>
        </article>
        <article className="info-card">
          <p className="info-number">02</p>
          <h2>Follow clues</h2>
          <p>Travel between important Northeastern landmarks and solve prompts.</p>
        </article>
        <article className="info-card">
          <p className="info-number">03</p>
          <h2>Learn the campus</h2>
          <p>Each stop teaches useful facts so the game feels fun and practical.</p>
        </article>
      </section>
    </main>
  )
}

export default App
