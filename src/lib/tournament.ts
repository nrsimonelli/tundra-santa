export interface ParsedGameName {
  group: string | null
  round: string | null
  roundNumber: number | null
  gameNumber: number | null
  isSpecialRound: boolean
  originalName: string
}

export type RoundType =
  | 'group'
  | 'semifinals'
  | 'finals'
  | 'quarterfinals'
  | 'prequarter'
  | 'elimination'
  | 'playin'
  | 'tier'
  | 'unknown'

const PREQUARTER_BASE = 50
const QUARTERFINAL_BASE = 100
const SEMIFINAL_BASE = 200
const FINAL_BASE = 300
const UNKNOWN_ROUND_SORT_KEY = 999

interface RoundTypeConfig {
  roundType: RoundType
  baseNumber: number
  label: string
  keywords: string[]
}

const ROUND_TYPE_CONFIGS: Record<string, RoundTypeConfig> = {
  prequarter: {
    roundType: 'prequarter',
    baseNumber: PREQUARTER_BASE,
    label: 'PreQuarters',
    keywords: ['prequarter', 'pre-quarter'],
  },
  quarterfinals: {
    roundType: 'quarterfinals',
    baseNumber: QUARTERFINAL_BASE,
    label: 'Quarterfinals',
    keywords: ['quarterfinal', 'quarter', 'qf', 'qe'],
  },
  semifinals: {
    roundType: 'semifinals',
    baseNumber: SEMIFINAL_BASE,
    label: 'Semifinals',
    keywords: ['semifinal', 'semi', 'sf', 'se'],
  },
  finals: {
    roundType: 'finals',
    baseNumber: FINAL_BASE,
    label: 'Finals',
    keywords: ['final', 'finals', 'ff'],
  },
  playin: {
    roundType: 'playin',
    baseNumber: FINAL_BASE - 10,
    label: 'Play-In',
    keywords: ['play', 'in', 'playin'],
  },
  elimination: {
    roundType: 'elimination',
    baseNumber: SEMIFINAL_BASE - 50,
    label: 'Elimination',
    keywords: ['elimination', 'elim'],
  },
}

// Helper functions
const getGroup = (match: RegExpMatchArray, idx: number): string | null =>
  match[idx]?.toUpperCase() || null

const getNum = (match: RegExpMatchArray, idx: number): number | null => {
  const val = match[idx]
  return val ? parseInt(val, 10) : null
}

// Handler factories
function createRoundHandler(
  roundIdx: number,
  groupIdx?: number,
  gameIdx?: number
) {
  return (match: RegExpMatchArray): ParsedGameName => ({
    group: groupIdx !== undefined ? getGroup(match, groupIdx) : null,
    round: `Round ${match[roundIdx]}`,
    roundNumber: getNum(match, roundIdx),
    gameNumber: gameIdx !== undefined ? getNum(match, gameIdx) : null,
    isSpecialRound: false,
    originalName: match[0],
  })
}

function createTierHandler(tierIdx: number, gameIdx: number | null) {
  return (match: RegExpMatchArray): ParsedGameName => {
    const tierNum = parseInt(match[tierIdx], 10)
    const gameNum = gameIdx !== null ? parseInt(match[gameIdx], 10) : null
    return {
      group: `Tier ${tierNum}`,
      round: `Tier ${tierNum}`,
      roundNumber: gameNum ? tierNum * 1000 + gameNum : tierNum * 1000,
      gameNumber: gameNum,
      isSpecialRound: true,
      originalName: match[0],
    }
  }
}

function createSpecialRoundHandler(
  config: RoundTypeConfig,
  labelFn: (match: RegExpMatchArray, group: string | null) => string,
  groupIdx: number = 1,
  gameIdx?: number
) {
  return (match: RegExpMatchArray): ParsedGameName => {
    const group = getGroup(match, groupIdx)
    const gameNum = gameIdx !== undefined ? getNum(match, gameIdx) : null
    return {
      group,
      round: labelFn(match, group),
      roundNumber: gameNum
        ? config.baseNumber + gameNum - 1
        : config.baseNumber,
      gameNumber: gameNum,
      isSpecialRound: true,
      originalName: match[0],
    }
  }
}

interface PatternMatcher {
  pattern: RegExp
  handler: (match: RegExpMatchArray) => ParsedGameName
  priority: number
}

const PATTERN_MATCHERS: PatternMatcher[] = [
  // Tier patterns
  {
    pattern: /^Tier\s+(\d+)\s+G(\d+)$/i,
    priority: 100,
    handler: createTierHandler(1, 2),
  },
  {
    pattern: /^T([123])\s+G(\d+)$/i,
    priority: 99,
    handler: createTierHandler(1, 2),
  },
  {
    pattern: /^T([123])$/i,
    priority: 98,
    handler: createTierHandler(1, null),
  },
  // Winter Cup elimination
  {
    pattern:
      /^(Semi|Semifinal|Semifinals|Quarterfinal|Quarterfinals|Play-In|Playin|PreQuarter|Pre-Quarter)\s+([A-Za-z])\s*G\s*(\d+)$/i,
    priority: 90,
    handler: (match) => {
      const roundTypeName = match[1].toLowerCase()
      const config =
        Object.values(ROUND_TYPE_CONFIGS).find((cfg) =>
          cfg.keywords.some((kw) => roundTypeName.includes(kw))
        ) || null
      return {
        group: match[2].toUpperCase(),
        round: config?.label || 'Unknown Round',
        roundNumber: config ? config.baseNumber + parseInt(match[3], 10) : 0,
        gameNumber: parseInt(match[3], 10),
        isSpecialRound: true,
        originalName: match[0],
      }
    },
  },
  // Winter Cup group
  {
    pattern: /^([A-Z])(\d+)\s+G(\d+)$/i,
    priority: 85,
    handler: createRoundHandler(2, 1, 3),
  },
  // Special rounds
  {
    pattern: /^(prequarter|pre-quarter)\s*([a-z])?$/i,
    priority: 80,
    handler: createSpecialRoundHandler(
      ROUND_TYPE_CONFIGS.prequarter,
      (_, group) => `PreQuarter${group ? ` ${group}` : ''}`,
      2
    ),
  },
  {
    pattern: /^q([fe])(\d+)$/i,
    priority: 75,
    handler: (match) => ({
      group: null,
      round: `${match[1].toUpperCase() === 'F' ? 'QF' : 'QE'}${match[2]}`,
      roundNumber: QUARTERFINAL_BASE + parseInt(match[2], 10) - 1,
      gameNumber: parseInt(match[2], 10),
      isSpecialRound: true,
      originalName: match[0],
    }),
  },
  {
    pattern: /^(quarterfinal|quarterfinals|quarter\s+final)\s*([a-z])?$/i,
    priority: 70,
    handler: createSpecialRoundHandler(
      ROUND_TYPE_CONFIGS.quarterfinals,
      (_, group) => `Quarterfinal${group ? ` ${group}` : ''}`,
      2
    ),
  },
  {
    pattern: /^semi\s*([a-z])(\d+)$/i,
    priority: 65,
    handler: (match) => ({
      group: match[1].toUpperCase(),
      round: `Semi ${match[1].toUpperCase()}${match[2]}`,
      roundNumber: SEMIFINAL_BASE + parseInt(match[2], 10) - 1,
      gameNumber: parseInt(match[2], 10),
      isSpecialRound: true,
      originalName: match[0],
    }),
  },
  {
    pattern: /^semi\s*(\d+)$/i,
    priority: 64,
    handler: createSpecialRoundHandler(
      ROUND_TYPE_CONFIGS.semifinals,
      (match) => `Semi ${match[1]}`,
      undefined,
      1
    ),
  },
  {
    pattern: /^(semifinal|semifinals|semi\s+final|semi)\s*([a-z])?$/i,
    priority: 63,
    handler: createSpecialRoundHandler(
      ROUND_TYPE_CONFIGS.semifinals,
      (_, group) => `Semifinal${group ? ` ${group}` : ''}`,
      2
    ),
  },
  {
    pattern: /^s([fe])(\d+)$/i,
    priority: 62,
    handler: (match) => ({
      group: null,
      round: `${match[1].toUpperCase() === 'F' ? 'SF' : 'SE'}${match[2]}`,
      roundNumber: SEMIFINAL_BASE + parseInt(match[2], 10) - 1,
      gameNumber: parseInt(match[2], 10),
      isSpecialRound: true,
      originalName: match[0],
    }),
  },
  {
    pattern: /^ff(\d+)$/i,
    priority: 60,
    handler: createSpecialRoundHandler(
      ROUND_TYPE_CONFIGS.finals,
      (match) => `FF${match[1]}`,
      undefined,
      1
    ),
  },
  {
    pattern: /^finals?\s*([a-z])(\d+)$/i,
    priority: 59,
    handler: (match) => ({
      group: match[1].toUpperCase(),
      round: `Finals ${match[1].toUpperCase()}${match[2]}`,
      roundNumber: FINAL_BASE + parseInt(match[2], 10) - 1,
      gameNumber: parseInt(match[2], 10),
      isSpecialRound: true,
      originalName: match[0],
    }),
  },
  {
    pattern: /^finals?\s*(\d+)$/i,
    priority: 58,
    handler: createSpecialRoundHandler(
      ROUND_TYPE_CONFIGS.finals,
      (match) => `Finals ${match[1]}`,
      undefined,
      1
    ),
  },
  {
    pattern: /^(final|finals)\s*([a-z])?$/i,
    priority: 57,
    handler: createSpecialRoundHandler(
      ROUND_TYPE_CONFIGS.finals,
      (_, group) => `Final${group ? ` ${group}` : ''}`,
      2
    ),
  },
  {
    pattern: /^elimination\s+(\d+)([a-z])$/i,
    priority: 55,
    handler: (match) => ({
      group: match[2].toUpperCase(),
      round: `Elimination ${match[1]}${match[2].toLowerCase()}`,
      roundNumber: SEMIFINAL_BASE - 50 + parseInt(match[1], 10),
      gameNumber: parseInt(match[1], 10),
      isSpecialRound: true,
      originalName: match[0],
    }),
  },
  {
    pattern: /^elim\s+([a-z])$/i,
    priority: 54,
    handler: createSpecialRoundHandler(
      ROUND_TYPE_CONFIGS.elimination,
      (_, group) => `Elim ${group || ''}`,
      1
    ),
  },
  {
    pattern: /^(play\s*-?\s*in|playin)$/i,
    priority: 53,
    handler: createSpecialRoundHandler(
      ROUND_TYPE_CONFIGS.playin,
      () => 'Play In'
    ),
  },
  // Standard rounds
  {
    pattern: /^R(\d+)\s+([a-z])(\d+)$/i,
    priority: 50,
    handler: createRoundHandler(1, 2, 3),
  },
  {
    pattern: /^R(\d+)\s+([a-z])$/i,
    priority: 49,
    handler: createRoundHandler(1, 2),
  },
  {
    pattern: /^R(\d+)(?:\s+T(\d+))?$/i,
    priority: 48,
    handler: (match) => ({
      group: match[2] ? `T${match[2]}` : null,
      round: `Round ${match[1]}${match[2] ? ` - Table ${match[2]}` : ''}`,
      roundNumber: parseInt(match[1], 10),
      gameNumber: null,
      isSpecialRound: false,
      originalName: match[0],
    }),
  },
  // Table patterns (T4+)
  {
    pattern: /^T([4-9]|[1-9]\d+)\s+G(\d+)$/i,
    priority: 40,
    handler: (match) => ({
      group: `T${match[1]}`,
      round: `Game ${match[2]}`,
      roundNumber: parseInt(match[2], 10),
      gameNumber: parseInt(match[2], 10),
      isSpecialRound: false,
      originalName: match[0],
    }),
  },
  {
    pattern: /^T([4-9]|[1-9]\d+)$/i,
    priority: 39,
    handler: (match) => ({
      group: `T${match[1]}`,
      round: `Table ${match[1]}`,
      roundNumber: null,
      gameNumber: null,
      isSpecialRound: false,
      originalName: match[0],
    }),
  },
  // Group patterns
  {
    pattern: /^(?:group\s*)?([a-z]+)(\d+)$/i,
    priority: 30,
    handler: createRoundHandler(2, 1),
  },
]

export function parseGameName(gameName: string | null): ParsedGameName {
  if (!gameName) {
    return {
      group: null,
      round: null,
      roundNumber: null,
      gameNumber: null,
      isSpecialRound: false,
      originalName: gameName || '',
    }
  }

  const normalized = gameName.trim()
  const sortedMatchers = [...PATTERN_MATCHERS].sort(
    (a, b) => b.priority - a.priority
  )

  for (const matcher of sortedMatchers) {
    const match = normalized.match(matcher.pattern)
    if (match) {
      return { ...matcher.handler(match), originalName: gameName }
    }
  }

  return {
    group: null,
    round: normalized,
    roundNumber: null,
    gameNumber: null,
    isSpecialRound: false,
    originalName: gameName,
  }
}

export function getRoundType(parsed: ParsedGameName): RoundType {
  if (parsed.group?.startsWith('Tier ')) return 'tier'
  if (parsed.isSpecialRound) {
    const lower = parsed.originalName.toLowerCase()
    for (const config of Object.values(ROUND_TYPE_CONFIGS)) {
      if (config.keywords.some((kw) => lower.includes(kw))) {
        return config.roundType
      }
    }
  }
  if (parsed.group && parsed.roundNumber !== null) return 'group'
  return 'unknown'
}

export function getRoundSortKey(parsed: ParsedGameName): number {
  if (parsed.group?.startsWith('Tier ')) {
    const tierMatch = parsed.group.match(/Tier\s+(\d+)/i)
    if (tierMatch) return 20 + parseInt(tierMatch[1], 10) * 10
  }
  if (parsed.isSpecialRound && parsed.roundNumber !== null)
    return parsed.roundNumber
  if (parsed.roundNumber !== null) return parsed.roundNumber
  return UNKNOWN_ROUND_SORT_KEY
}

export interface GameWithParsedName {
  id: number
  name: string | null
  parsed: ParsedGameName
  participants: Array<{
    player: { id: number; username: string }
    ranking: number | null
    final_score: number | null
    faction: string | null
    player_mat: string | null
  }>
}

export interface RoundGroup {
  roundKey: string
  roundLabel: string
  roundType: RoundType
  sortKey: number
  games: GameWithParsedName[]
}

const ROUND_LABELS: Record<RoundType, string> = {
  finals: 'Finals',
  semifinals: 'Semifinals',
  quarterfinals: 'Quarterfinals',
  prequarter: 'PreQuarters',
  playin: 'Play-In',
  elimination: 'Elimination',
  tier: 'Tier',
  group: 'Round',
  unknown: 'Unknown',
}

const GROUPED_ROUND_TYPES: RoundType[] = [
  'finals',
  'semifinals',
  'quarterfinals',
  'playin',
  'prequarter',
]

function getRoundKeyAndLabel(
  parsed: ParsedGameName,
  roundType: RoundType
): { roundKey: string; roundLabel: string } {
  if (roundType === 'tier') {
    const tierMatch = parsed.group?.match(/Tier\s+(\d+)/i)
    return tierMatch
      ? { roundKey: `tier-${tierMatch[1]}`, roundLabel: `Tier ${tierMatch[1]}` }
      : { roundKey: 'tier-unknown', roundLabel: 'Tier' }
  }
  if (GROUPED_ROUND_TYPES.includes(roundType)) {
    return { roundKey: roundType, roundLabel: ROUND_LABELS[roundType] }
  }
  if (parsed.isSpecialRound) {
    return {
      roundKey: parsed.round?.toLowerCase() || 'unknown',
      roundLabel: parsed.round || 'Unknown Round',
    }
  }
  if (parsed.roundNumber !== null) {
    return {
      roundKey: `round-${parsed.roundNumber}`,
      roundLabel: parsed.round || `Round ${parsed.roundNumber}`,
    }
  }
  return {
    roundKey: parsed.originalName.toLowerCase(),
    roundLabel: parsed.originalName || 'Unknown',
  }
}

export function groupGamesByRound(games: GameWithParsedName[]): RoundGroup[] {
  const roundMap = new Map<string, RoundGroup>()

  for (const game of games) {
    const roundType = getRoundType(game.parsed)
    const { roundKey, roundLabel } = getRoundKeyAndLabel(game.parsed, roundType)

    if (!roundMap.has(roundKey)) {
      roundMap.set(roundKey, {
        roundKey,
        roundLabel,
        roundType,
        sortKey: getRoundSortKey(game.parsed),
        games: [],
      })
    }

    roundMap.get(roundKey)!.games.push(game)
  }

  const rounds = Array.from(roundMap.values())
  const typeOrder: Record<RoundType, number> = {
    group: 1,
    tier: 2,
    prequarter: 3,
    quarterfinals: 4,
    elimination: 5,
    semifinals: 6,
    playin: 7,
    finals: 8,
    unknown: 9,
  }

  rounds.sort((a, b) => {
    const typeDiff = typeOrder[a.roundType] - typeOrder[b.roundType]
    if (typeDiff !== 0) return typeDiff
    if (a.sortKey !== b.sortKey) return a.sortKey - b.sortKey
    return a.roundKey.localeCompare(b.roundKey)
  })

  return rounds
}

export function getGameDisplayName(
  game: GameWithParsedName,
  roundLabel: string
): string {
  if (!game.name) return `Game ${game.id}`

  const parsed = game.parsed
  const originalName = game.name.trim()
  const roundType = getRoundType(parsed)

  // Tier handling
  if (roundType === 'tier') {
    const gMatch = originalName.match(/G(\d+)$/i)
    if (gMatch) return `G${gMatch[1]}`
    if (parsed.gameNumber) return `G${parsed.gameNumber}`
    if (parsed.roundNumber) {
      const gameNum = parsed.roundNumber % 1000
      if (gameNum > 0) return `G${gameNum}`
    }
    return originalName
  }

  // Finals handling
  if (roundType === 'finals' && roundLabel === 'Finals') {
    const numMatch = originalName.match(/(\d+)$/)
    const num = numMatch ? parseInt(numMatch[1], 10) : parsed.gameNumber
    if (num) return `Game ${num}`
    if (parsed.roundNumber) {
      const gameNum = parsed.roundNumber - FINAL_BASE + 1
      if (gameNum > 0) return `Game ${gameNum}`
    }
    return originalName
  }

  // Special rounds
  if (
    roundType === 'semifinals' ||
    roundType === 'quarterfinals' ||
    roundType === 'playin' ||
    roundType === 'prequarter'
  ) {
    // Winter Cup elimination: "Semi A G1" -> "A G1"
    const winterCupElim = originalName.match(
      /^(?:Semi|Semifinal|Quarterfinal|Quarterfinals|Play-In|Playin|PreQuarter|Pre-Quarter)\s+([A-Z])\s+G(\d+)$/i
    )
    if (winterCupElim) return `${winterCupElim[1]} G${winterCupElim[2]}`

    // Group + number: "Semi A1" -> "A1"
    const groupNum = originalName.match(/([A-Z])\s*(\d+)$/i)
    if (groupNum) return groupNum[1] + groupNum[2]

    // Middle pattern: "Semi A1"
    const middle = originalName.match(/\s+([A-Z])(\d+)(?:\s|$)/i)
    if (middle) return middle[1] + middle[2]

    // Use parsed group
    if (parsed.group && parsed.group.length === 1) {
      const numMatch = originalName.match(/(\d+)/)
      if (numMatch) return parsed.group + numMatch[1]
      return parsed.group
    }

    // Abbreviations: "QF1" -> "1"
    const abbrev = originalName.match(/^(QF|SF|QE|SE|FF)(\d+)$/i)
    if (abbrev) return abbrev[2]

    // Fallback: number
    const numMatch = originalName.match(/(\d+)$/)
    if (numMatch) return numMatch[1]
  }

  // Winter Cup: "A1 G1" under "Round 1" -> "A G1"
  const winterCup = originalName.match(/^([A-Z])(\d+)\s+G(\d+)$/i)
  if (winterCup) {
    const roundMatch = roundLabel.match(/Round\s+(\d+)/i)
    if (roundMatch && roundMatch[1] === winterCup[2]) {
      return `${winterCup[1]} G${winterCup[3]}`
    }
  }

  // Round prefix: "R1 A1" under "Round 1" -> "A1"
  const roundPrefix = originalName.match(/^R(\d+)\s+(.+)$/i)
  if (roundPrefix) {
    const roundMatch = roundLabel.match(/Round\s+(\d+)/i)
    if (roundMatch && roundMatch[1] === roundPrefix[1]) {
      return roundPrefix[2].trim()
    }
  }

  // Table-only games
  if (
    parsed.group?.startsWith('T') &&
    (parsed.round?.includes('Table') || roundLabel.includes('Table'))
  ) {
    return parsed.group
  }

  // Group + number: "A1", "B2"
  if (parsed.group && parsed.roundNumber !== null) {
    const groupMatch = originalName.match(/^([a-z])(\d+)$/i)
    if (groupMatch) {
      return groupMatch[1].toUpperCase() + groupMatch[2]
    }
    return parsed.group + parsed.roundNumber
  }

  return originalName
}
