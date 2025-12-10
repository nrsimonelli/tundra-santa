export type TournamentFormat = 'tournament' | 'league' | '1v1'

export interface ParsedGame {
  sectionKey: string
  sectionLabel: string
  displayName: string
  sortOrder: number
}

export interface GameWithParsedName {
  id: number
  name: string | null
  parsed: ParsedGame
  participants: Array<{
    player: { id: number; username: string }
    ranking: number | null
    final_score: number | null
    faction: string | null
    player_mat: string | null
  }>
}

export interface SectionGroup {
  sectionKey: string
  sectionLabel: string
  sortOrder: number
  games: GameWithParsedName[]
}

/**
 * Detects tournament format based on event name
 */
export function detectFormat(eventName: string | null): TournamentFormat {
  if (!eventName) return 'tournament'
  const lower = eventName.toLowerCase()
  if (lower.includes('league')) return 'league'
  if (lower.includes('1v1')) return '1v1'
  return 'tournament'
}

/**
 * Parses a game name into section and display information
 */
export function parseGameName(
  gameName: string | null,
  format: TournamentFormat
): ParsedGame {
  if (!gameName) {
    return {
      sectionKey: 'unknown',
      sectionLabel: 'Unknown',
      displayName: 'Unnamed',
      sortOrder: 9999,
    }
  }

  const name = gameName.trim()

  if (format === 'league') {
    return parseLeagueGameName(name)
  } else if (format === '1v1') {
    return parse1v1GameName(name)
  } else {
    return parseTournamentGameName(name)
  }
}

/**
 * Parses league format: T1 G1, T2 G1, Tier 1 G1, etc.
 */
function parseLeagueGameName(name: string): ParsedGame {
  // Tier 1 G1, Tier 2 G1, etc.
  const tierMatch = name.match(/^Tier\s+(\d+)\s+G(\d+)$/i)
  if (tierMatch) {
    const tier = parseInt(tierMatch[1], 10)
    const game = parseInt(tierMatch[2], 10)
    return {
      sectionKey: `tier-${tier}`,
      sectionLabel: `Tier ${tier}`,
      displayName: `G${game}`,
      sortOrder: tier * 1000 + game,
    }
  }

  // T1 G1, T2 G1, T3 G29, etc.
  const tMatch = name.match(/^T([123])\s+G(\d+)$/i)
  if (tMatch) {
    const tier = parseInt(tMatch[1], 10)
    const game = parseInt(tMatch[2], 10)
    return {
      sectionKey: `tier-${tier}`,
      sectionLabel: `Tier ${tier}`,
      displayName: `G${game}`,
      sortOrder: tier * 1000 + game,
    }
  }

  // Fallback for league format
  return {
    sectionKey: 'unknown',
    sectionLabel: 'Unknown',
    displayName: name,
    sortOrder: 9999,
  }
}

/**
 * Parses 1v1 format: G1, G2, G3, etc. - all games in a single section
 */
function parse1v1GameName(name: string): ParsedGame {
  // G1, G2, G3, etc. - all go into a single "Games" section
  const gameMatch = name.match(/^G(\d+)$/i)
  if (gameMatch) {
    const gameNum = parseInt(gameMatch[1], 10)
    return {
      sectionKey: 'games',
      sectionLabel: 'Games',
      displayName: `G${gameNum}`,
      sortOrder: gameNum,
    }
  }

  // Fallback for 1v1 format
  return {
    sectionKey: 'games',
    sectionLabel: 'Games',
    displayName: name,
    sortOrder: 9999,
  }
}

/**
 * Parses tournament format: rounds, elimination rounds, etc.
 */
function parseTournamentGameName(name: string): ParsedGame {
  // Regular rounds: R1 A1, R2 A1, R1 A2, etc.
  // Check these FIRST so they get lower sortOrder values
  const roundMatch = name.match(/^R(\d+)\s+([A-Z])(\d+)$/i)
  if (roundMatch) {
    const roundNum = parseInt(roundMatch[1], 10)
    const group = roundMatch[2].toUpperCase()
    const gameNum = parseInt(roundMatch[3], 10)
    // Use group letter code for sorting within round
    // Regular rounds: 0-99999 range (assuming max 20 rounds)
    const groupCode = group.charCodeAt(0) - 64
    return {
      sectionKey: `round-${roundNum}`,
      sectionLabel: `Round ${roundNum}`,
      displayName: `${group}${gameNum}`,
      sortOrder: roundNum * 1000 + groupCode * 10 + gameNum,
    }
  }

  // Simple rounds: A1, B1, A2, etc. (letter = group, number = round)
  const simpleRoundMatch = name.match(/^([A-Z])(\d+)$/i)
  if (simpleRoundMatch) {
    const group = simpleRoundMatch[1].toUpperCase()
    const roundNum = parseInt(simpleRoundMatch[2], 10)
    // Use group letter code (A=1, B=2, etc.) for sorting within round
    // Regular rounds: 0-99999 range (assuming max 20 rounds)
    const groupCode = group.charCodeAt(0) - 64
    return {
      sectionKey: `round-${roundNum}`,
      sectionLabel: `Round ${roundNum}`,
      displayName: group,
      sortOrder: roundNum * 1000 + groupCode,
    }
  }

  // All elimination rounds start at 100000 to ensure they come after all regular rounds
  const ELIMINATION_BASE = 100000

  // SF PLAYIN 1, FF PLAYIN 1
  // These come BEFORE their respective rounds (SF Playin before Semifinals, FF Playin before Finals)
  const playinMatch = name.match(/^(SF|FF)\s+PLAYIN\s+(\d+)$/i)
  if (playinMatch) {
    const prefix = playinMatch[1].toUpperCase()
    const gameNum = parseInt(playinMatch[2], 10)
    return {
      sectionKey: `${prefix}-playin`,
      sectionLabel: prefix === 'SF' ? 'Semifinals Playin' : 'Finals Playin',
      displayName: `Game ${gameNum}`, // Display as "Game [n]" instead of just the number
      sortOrder:
        prefix === 'SF'
          ? ELIMINATION_BASE + 2000 + gameNum
          : ELIMINATION_BASE + 3000 + gameNum,
    }
  }

  // Standalone PI (Play-In)
  const piMatch = name.match(/^PI$/i)
  if (piMatch) {
    return {
      sectionKey: 'playin',
      sectionLabel: 'Play-In',
      displayName: 'Game 1',
      sortOrder: ELIMINATION_BASE + 2000,
    }
  }

  // ELIM A, ELIM A2, ELIM 1 A
  const elimMatch1 = name.match(/^ELIM\s+([A-Z])(\d+)$/i)
  if (elimMatch1) {
    const group = elimMatch1[1].toUpperCase()
    const num = parseInt(elimMatch1[2], 10)
    return {
      sectionKey: 'elimination',
      sectionLabel: 'Elimination',
      displayName: `${group}${num}`,
      sortOrder: ELIMINATION_BASE + 1500 + num,
    }
  }

  const elimMatch2 = name.match(/^ELIM\s+(\d+)\s+([A-Z])$/i)
  if (elimMatch2) {
    const num = parseInt(elimMatch2[1], 10)
    const group = elimMatch2[2].toUpperCase()
    return {
      sectionKey: 'elimination',
      sectionLabel: 'Elimination',
      displayName: `${group}${num}`,
      sortOrder: ELIMINATION_BASE + 1500 + num,
    }
  }

  const elimMatch3 = name.match(/^ELIM\s+([A-Z])$/i)
  if (elimMatch3) {
    const group = elimMatch3[1].toUpperCase()
    return {
      sectionKey: 'elimination',
      sectionLabel: 'Elimination',
      displayName: group,
      sortOrder: ELIMINATION_BASE + 1500,
    }
  }

  // PreQuarters: PQ A, PreQuarter A
  const pqMatch = name.match(/^(PQ|PreQuarter)\s+([A-Z])$/i)
  if (pqMatch) {
    const group = pqMatch[2].toUpperCase()
    return {
      sectionKey: 'pre-quarters',
      sectionLabel: 'Pre-Quarters',
      displayName: group,
      sortOrder: ELIMINATION_BASE + 500,
    }
  }

  // Quarterfinals: QF 1, QF A, QF A 1
  const qfMatch1 = name.match(/^QF\s+(\d+)$/i)
  if (qfMatch1) {
    const num = parseInt(qfMatch1[1], 10)
    return {
      sectionKey: 'quarterfinals',
      sectionLabel: 'Quarterfinals',
      displayName: `Game ${num}`,
      sortOrder: ELIMINATION_BASE + 1000 + num,
    }
  }

  const qfMatch2 = name.match(/^QF\s+([A-Z])\s+(\d+)$/i)
  if (qfMatch2) {
    const group = qfMatch2[1].toUpperCase()
    const num = parseInt(qfMatch2[2], 10)
    return {
      sectionKey: 'quarterfinals',
      sectionLabel: 'Quarterfinals',
      displayName: `${group}${num}`,
      sortOrder: ELIMINATION_BASE + 1000 + num,
    }
  }

  const qfMatch3 = name.match(/^QF\s+([A-Z])$/i)
  if (qfMatch3) {
    const group = qfMatch3[1].toUpperCase()
    return {
      sectionKey: 'quarterfinals',
      sectionLabel: 'Quarterfinals',
      displayName: group,
      sortOrder: ELIMINATION_BASE + 1000,
    }
  }

  // Semifinals: SF 1, SF A, SF A 1
  // These come AFTER Semifinals Playin (2500)
  const sfMatch1 = name.match(/^SF\s+(\d+)$/i)
  if (sfMatch1) {
    const num = parseInt(sfMatch1[1], 10)
    return {
      sectionKey: 'semifinals',
      sectionLabel: 'Semifinals',
      displayName: `Game ${num}`,
      sortOrder: ELIMINATION_BASE + 2500 + num,
    }
  }

  const sfMatch2 = name.match(/^SF\s+([A-Z])\s+(\d+)$/i)
  if (sfMatch2) {
    const group = sfMatch2[1].toUpperCase()
    const num = parseInt(sfMatch2[2], 10)
    return {
      sectionKey: 'semifinals',
      sectionLabel: 'Semifinals',
      displayName: `${group}${num}`,
      sortOrder: ELIMINATION_BASE + 2500 + num,
    }
  }

  const sfMatch3 = name.match(/^SF\s+([A-Z])$/i)
  if (sfMatch3) {
    // If it's just "SF A" (letter only, no number), display as "Game 1"
    // If it's "SF A 1", it's already handled by sfMatch2 and displays as "A1"
    return {
      sectionKey: 'semifinals',
      sectionLabel: 'Semifinals',
      displayName: 'Game 1',
      sortOrder: ELIMINATION_BASE + 2500,
    }
  }

  // Finals: FF, F, FF A 1, F 1
  // These come AFTER Finals Playin (3500)
  const fMatch1 = name.match(/^(FF|F)$/i)
  if (fMatch1) {
    return {
      sectionKey: 'finals',
      sectionLabel: 'Finals',
      displayName: 'Game 1', // Display as "Game 1" instead of "FF" or "F"
      sortOrder: ELIMINATION_BASE + 3500,
    }
  }

  const fMatch2 = name.match(/^(FF|F)\s+(\d+)$/i)
  if (fMatch2) {
    const num = parseInt(fMatch2[2], 10)
    return {
      sectionKey: 'finals',
      sectionLabel: 'Finals',
      displayName: `Game ${num}`,
      sortOrder: ELIMINATION_BASE + 3500 + num,
    }
  }

  const fMatch3 = name.match(/^(FF|F)\s+([A-Z])\s+(\d+)$/i)
  if (fMatch3) {
    const group = fMatch3[2].toUpperCase()
    const num = parseInt(fMatch3[3], 10)
    return {
      sectionKey: 'finals',
      sectionLabel: 'Finals',
      displayName: `${group}${num}`,
      sortOrder: ELIMINATION_BASE + 3500 + num,
    }
  }

  // Fallback
  return {
    sectionKey: 'unknown',
    sectionLabel: 'Unknown',
    displayName: name,
    sortOrder: 9999,
  }
}

/**
 * Groups games by section
 */
export function groupGamesBySection(
  games: GameWithParsedName[]
): SectionGroup[] {
  const sectionMap = new Map<string, SectionGroup>()

  for (const game of games) {
    const { sectionKey, sectionLabel, sortOrder } = game.parsed

    if (!sectionMap.has(sectionKey)) {
      sectionMap.set(sectionKey, {
        sectionKey,
        sectionLabel,
        sortOrder,
        games: [],
      })
    }

    sectionMap.get(sectionKey)!.games.push(game)
  }

  const sections = Array.from(sectionMap.values())

  // Sort sections by sortOrder
  sections.sort((a, b) => {
    if (a.sortOrder !== b.sortOrder) {
      return a.sortOrder - b.sortOrder
    }
    return a.sectionKey.localeCompare(b.sectionKey)
  })

  // Sort games within each section
  for (const section of sections) {
    section.games.sort((a, b) => {
      if (a.parsed.sortOrder !== b.parsed.sortOrder) {
        return a.parsed.sortOrder - b.parsed.sortOrder
      }
      return (a.parsed.displayName || '').localeCompare(
        b.parsed.displayName || ''
      )
    })
  }

  return sections
}
