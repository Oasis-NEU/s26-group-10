import { supabase } from '../supabaseClient'

export async function createUser(name, isLeader = false) {
  const { data, error } = await supabase
    .from('users')
    .insert({ name, leader: isLeader })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function findGameByCode(code) {
  const { data, error } = await supabase
    .from('games')
    .select()
    .eq('code', code.toUpperCase())
    .single()
  if (error) throw new Error('Session not found. Check your code and try again.')
  return data
}

export async function createGame(code, mapId) {
  const { data, error } = await supabase
    .from('games')
    .insert({ code, map_id: mapId, status: 'active', timer_seconds: 1200 })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function addPlayerToGame(userId, gameId) {
  const { error } = await supabase
    .from('user_game')
    .insert({ user_id: userId, game_id: gameId })
  if (error) throw error
}

export async function initPlayerScore(userId, gameId) {
  const { error } = await supabase
    .from('score')
    .insert({ user_id: userId, game_id: gameId, score: 0 })
  if (error) throw error
}

export async function getOrCreateDefaultMap() {
  const { data, error } = await supabase
    .from('maps')
    .select('id')
    .limit(1)
    .maybeSingle()
  if (error) throw error
  if (data) return data.id

  const { data: newMap, error: createError } = await supabase
    .from('maps')
    .insert({ name: 'Default Map' })
    .select('id')
    .single()
  if (createError) throw createError
  return newMap.id
}

export async function getGameLocations(mapId) {
  const { data: mapLocs, error: mapError } = await supabase
    .from('map_location')
    .select('location_id')
    .eq('map_id', mapId)
  if (mapError) throw mapError
  if (mapLocs.length === 0) return []

  const locationIds = mapLocs.map((ml) => ml.location_id)

  const [locsResult, questionsResult] = await Promise.all([
    supabase.from('locations').select().in('id', locationIds),
    supabase.from('questions').select().in('location_id', locationIds),
  ])

  if (locsResult.error) throw locsResult.error
  if (questionsResult.error) throw questionsResult.error

  return locsResult.data.map((loc) => {
    const locQuestions = questionsResult.data.filter(
      (q) => q.location_id === loc.id,
    )
    return {
      id: loc.id,
      title: loc.name,
      distanceMeters: 0,
      description: loc.info,
      imageUrl: null,
      quiz: locQuestions.map((q) => {
        const options = Array.isArray(q.options) ? q.options : Object.values(q.options)
        const answerIndex = options.indexOf(q.correct_answer)
        return {
          id: q.id,
          prompt: q.body,
          options,
          answerIndex: answerIndex >= 0 ? answerIndex : 0,
        }
      }),
    }
  })
}

export async function recordVisit(playerId, locationId) {
  const { error } = await supabase
    .from('player_visits')
    .upsert(
      { player_id: playerId, location_id: locationId },
      { onConflict: 'player_id,location_id' },
    )
  if (error) throw error
}

export async function addScore(playerId, gameId, amount) {
  const { error } = await supabase.rpc('increment_score', {
    player_id: playerId,
    game_id: gameId,
    amount,
  })
  if (error) throw error
}

export async function getLeaderboard(gameId) {
  const { data: scores, error } = await supabase
    .from('score')
    .select('user_id, score')
    .eq('game_id', gameId)
    .order('score', { ascending: false })
  if (error) throw error
  if (scores.length === 0) return []

  const userIds = scores.map((s) => s.user_id)
  const [usersResult, visitsResult] = await Promise.all([
    supabase.from('users').select('id, name').in('id', userIds),
    supabase.from('player_visits').select('player_id').in('player_id', userIds),
  ])

  const userMap = Object.fromEntries(
    (usersResult.data ?? []).map((u) => [u.id, u.name]),
  )
  const visitCounts = {}
  ;(visitsResult.data ?? []).forEach((v) => {
    visitCounts[v.player_id] = (visitCounts[v.player_id] ?? 0) + 1
  })

  return scores.map((s) => ({
    id: s.user_id,
    name: userMap[s.user_id] ?? 'Unknown',
    score: s.score,
    completed: visitCounts[s.user_id] ?? 0,
    timeBonus: 0,
  }))
}
