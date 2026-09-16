import * as migration_20260620_025003_baseline_serenity_schema from './20260620_025003_baseline_serenity_schema';
import * as migration_20260916_005208_platform_reliability from './20260916_005208_platform_reliability';

export const migrations = [
  {
    up: migration_20260620_025003_baseline_serenity_schema.up,
    down: migration_20260620_025003_baseline_serenity_schema.down,
    name: '20260620_025003_baseline_serenity_schema',
  },
  {
    up: migration_20260916_005208_platform_reliability.up,
    down: migration_20260916_005208_platform_reliability.down,
    name: '20260916_005208_platform_reliability'
  },
];
