# tundra-santa

Built with [Next.js](https://nextjs.org/).

## Overview

`tundra-santa` is a Next.js (App Router) application for browsing and analyzing competitive Scythe events. It provides:

- A **Tournament Rating** leaderboard and tournament pages
- An **event history** view (tournament bracket/cards)
- A **1v1 League** section with season analytics and player profiles

## Architecture

This app follows the standard Next.js split:

- **Server components** fetch and shape data (using Supabase queries wrapped with caching).
- **Client components** power interactive UI (charts, tables, accordions, and theme controls).

The data layer uses:

- `src/lib/supabase/server.ts` to create a Supabase server client
- `src/lib/supabase/cached-queries.ts` and `src/lib/league-cached-queries.ts` for cached leaderboard/player/league data
- `src/lib/events.ts` and `src/lib/tournaments.ts` for rating event lists and tournament details
- `src/lib/cache-config.ts` (hourly revalidation)

## Primary Routes

- `/` landing page
- `/about` project overview
- `/leaderboard` and `/leaderboard/[username]` (Tournament Rating)
- `/tournament` and `/tournament/[id]` (tournament list + bracket/cards)
- `/league` (redirect to latest) and `/league/[scope]` (1v1 League analytics)
- `/league/players/[username]` (1v1 player profile)

## Primary Components / Modules

Key UI building blocks live in `src/components/*`:

- Navigation + theming
  - `src/components/top-nav.tsx`
  - `src/components/faction-theme-provider.tsx`
  - `src/components/faction-theme-picker.tsx`
- Tournament UI
  - `src/components/tournament-bracket.tsx`
- League UI
  - `src/components/league-standings-table.tsx`
  - `src/components/league-matchup-section.tsx`
  - `src/components/league-player-games-tabs.tsx`
- Analytics visuals
  - `src/components/chart.tsx`
  - `src/components/rivals-bar-chart.tsx`
- Small UI primitives
  - `src/components/kpi-card.tsx`

## Local Development

To run the app locally:

```bash
npm run dev
```
