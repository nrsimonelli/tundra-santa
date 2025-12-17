# Rival Formula Ideas

## Concept: Different formulas for each rank

Instead of showing top 3 of the same metric, each rank tells a different story:

| Rank | Formula | Meaning |
|------|---------|---------|
| Nemesis | `(wins × losses²) + draws` | Weights their wins over you - your "kryptonite" |
| Rival | `(wins × losses) + draws` | Balanced matchup |
| Challenger | `(wins² × losses) + draws` | Weights your wins over them - your "victim" |

## Constraints to consider

- Nemesis should have a losing record against them (losses > wins)
- Challenger should have a winning record (wins > losses)
- Rival remains most evenly matched regardless of direction

This surfaces 3 distinct relationships rather than just "top 3 of the same metric."

