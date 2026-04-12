# NEU Go!

A location-based multiplayer quiz game built for Northeastern University's campus. Players join sessions via a code, navigate to real-world points of interest (POIs) using GPS, read study material, answer quizzes at each location, and compete on a live leaderboard.

## Live Demo
https://neu-go.vercel.app


## Features

- Create or join game sessions with a 6-character code
- Real-time multiplayer via Socket.io
- GPS-based proximity detection to unlock POIs
- Study info screen before each quiz
- Multiple choice quizzes scored on accuracy
- Live leaderboard updated in real time
- Admin dashboard for managing maps, locations, questions, games, users, analytics, and settings

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19 + Vite |
| Backend | Python FastAPI + Socket.io |
| Database | Supabase (PostgreSQL + PostGIS) |
| Deployment | Vercel (frontend), Render (backend) |

## Project Structure

```
/
├── src/                    # React frontend
│   ├── App.jsx             # Main state machine (all screens)
│   ├── components/
│   │   ├── admin/          # Admin dashboard components
│   │   ├── TimerBanner.jsx
│   │   └── ProgressBar.jsx
│   ├── lib/socket.js       # Socket.io client
│   └── utils/game.js       # Timer and scoring helpers
├── backend/
│   ├── main.py             # FastAPI app entry point
│   ├── routers/            # REST endpoints (party, admin)
│   ├── sockets/handlers/   # WebSocket event handlers
│   ├── db/client.py        # Supabase client
│   └── config/settings.py  # Environment config
└── index.html
```

## Local Development

### Prerequisites

- Node.js 18+
- Python 3.13
- A Supabase project with the required schema

### Frontend

```bash
npm install
npm run dev
```

### Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn main:socket_app --reload
```

### Environment Variables

**Frontend** (`.env.local`):
```
VITE_BACKEND_URL=http://localhost:8000
VITE_DEFAULT_MAP_ID=<your-map-uuid>
```

**Backend** (`backend/api.env`):
```
supabase_url=<your-supabase-url>
supabase_key=<your-supabase-anon-key>
```

## Database Schema

Key tables: `games`, `users`, `user_game`, `score`, `maps`, `map_location`, `locations`, `questions`, `player_visits`, `settings`

Supabase RPC functions:
- `check_player_at_location(player_lat, player_lng, location_id, threshold_meters)` — GPS proximity check
- `increment_score(game_id, player_id, amount)` — atomic score update

## Admin Dashboard

Navigate to the home screen and click **Admin**. Log in with a user UUID that has `role = 'admin'` in the `users` table.

### Admin Features

- **Maps & Locations** — CRUD for maps and their associated POI locations
- **Questions** — Create/edit/delete quiz questions per location (options stored as JSON array, correct_answer is the full option text)
- **Games** — View active/completed games, force-end, kick players, cleanup stale sessions
- **Users** — Search users
- **Analytics** — Summary stats and global leaderboard
- **Settings** — Configure global parameters:
  - `default_timer_seconds` — default game timer (used when creating a session)
  - `max_players_default` — default max players per game
  - `proximity_threshold_meters` — GPS distance required to unlock a POI

## Game Flow

1. Host creates a game and shares the 6-character session code
2. Players join via the code and wait in the lobby
3. Host starts the game and the timer begins
4. Players navigate to POIs on campus using GPS (distances update live)
5. At each POI, tap **Open** then **I arrived** — GPS proximity is verified
6. Read the info/study material screen, then answer the quiz
7. Scores update live and the leaderboard is shown at game end
