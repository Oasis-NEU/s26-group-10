export const SAMPLE_POIS = [
  {
    id: 'poi-1',
    title: 'Centennial Common',
    distanceMeters: 140,
    description:
      'Gather in the center lawn and locate the marker near the sculpture.',
    imageUrl:
      'https://images.unsplash.com/photo-1472396961693-142e6e269027?auto=format&fit=crop&w=1200&q=80',
    quiz: [
      {
        id: 'q1',
        prompt: 'What is the safest first action before crossing a busy street?',
        options: ['Run quickly', 'Wait and check signals', 'Follow others blindly', 'Use your phone while walking'],
        answerIndex: 1,
      },
      {
        id: 'q2',
        prompt: 'Which clue style gives direction and context?',
        options: ['Random emoji', 'Single letter', 'Landmark + distance', 'Blank hint'],
        answerIndex: 2,
      },
    ],
  },
  {
    id: 'poi-2',
    title: 'Library Steps',
    distanceMeters: 310,
    description:
      'Find the engraved quote near the west entrance and read the final line.',
    imageUrl:
      'https://images.unsplash.com/photo-1507842217343-583bb7270b66?auto=format&fit=crop&w=1200&q=80',
    quiz: [
      {
        id: 'q1',
        prompt: 'Why is a shared session code useful?',
        options: ['It replaces maps', 'It links players to one game', 'It tracks battery', 'It disables timer'],
        answerIndex: 1,
      },
      {
        id: 'q2',
        prompt: 'What should happen after completing this POI quiz?',
        options: ['End app instantly', 'Return to POI list with status update', 'Delete progress', 'Reset session code'],
        answerIndex: 1,
      },
    ],
  },
  {
    id: 'poi-3',
    title: 'Science Quad',
    distanceMeters: 520,
    description:
      'Look for the solar installation and capture the panel count from the sign.',
    imageUrl:
      'https://images.unsplash.com/photo-1497436072909-60f360e1d4b1?auto=format&fit=crop&w=1200&q=80',
    quiz: [
      {
        id: 'q1',
        prompt: 'How should tie-breakers be resolved in timed games?',
        options: ['Random winner', 'Earlier finish time wins', 'Host chooses favorite', 'Ignore ties'],
        answerIndex: 1,
      },
      {
        id: 'q2',
        prompt: 'What is the final output after time expires?',
        options: ['Tutorial', 'New POI creation', 'Leaderboard', 'Edit profile'],
        answerIndex: 2,
      },
    ],
  },
]

export const SAMPLE_LEADERBOARD = [
  { id: 'u1', name: 'Team Atlas', score: 80, completed: 3, timeBonus: 14 },
  { id: 'u2', name: 'Blue Falcons', score: 70, completed: 3, timeBonus: 9 },
  { id: 'u3', name: 'Crimson Orbit', score: 60, completed: 2, timeBonus: 11 },
]
