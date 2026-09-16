import * as migration_20260620_025003_baseline_serenity_schema from './20260620_025003_baseline_serenity_schema';
import * as migration_20260916_005208_platform_reliability from './20260916_005208_platform_reliability';
import * as migration_20260916_010115_user_roles from './20260916_010115_user_roles';
import * as migration_20260916_025432_structured_meeting_schedules from './20260916_025432_structured_meeting_schedules';
import * as migration_20260916_030456_retained_monthly_flyers from './20260916_030456_retained_monthly_flyers';
import * as migration_20260916_031954_dated_events from './20260916_031954_dated_events';

export const migrations = [
  {
    up: migration_20260620_025003_baseline_serenity_schema.up,
    down: migration_20260620_025003_baseline_serenity_schema.down,
    name: '20260620_025003_baseline_serenity_schema',
  },
  {
    up: migration_20260916_005208_platform_reliability.up,
    down: migration_20260916_005208_platform_reliability.down,
    name: '20260916_005208_platform_reliability',
  },
  {
    up: migration_20260916_010115_user_roles.up,
    down: migration_20260916_010115_user_roles.down,
    name: '20260916_010115_user_roles',
  },
  {
    up: migration_20260916_025432_structured_meeting_schedules.up,
    down: migration_20260916_025432_structured_meeting_schedules.down,
    name: '20260916_025432_structured_meeting_schedules',
  },
  {
    up: migration_20260916_030456_retained_monthly_flyers.up,
    down: migration_20260916_030456_retained_monthly_flyers.down,
    name: '20260916_030456_retained_monthly_flyers',
  },
  {
    up: migration_20260916_031954_dated_events.up,
    down: migration_20260916_031954_dated_events.down,
    name: '20260916_031954_dated_events'
  },
];
