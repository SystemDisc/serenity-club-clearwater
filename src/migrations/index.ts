import * as migration_20260620_025003_baseline_serenity_schema from './20260620_025003_baseline_serenity_schema'

export const migrations = [
  {
    up: migration_20260620_025003_baseline_serenity_schema.up,
    down: migration_20260620_025003_baseline_serenity_schema.down,
    name: '20260620_025003_baseline_serenity_schema',
  },
]
