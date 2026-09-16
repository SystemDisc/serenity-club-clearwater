# Meeting migration review — September 15, 2026

Local rehearsal against the restored production copy. All 11 records were published. The additive migration preserves original wording and IDs. Days, times, and rooms below were copied from existing records; this is not independent confirmation of club facts. No legacy format or attendance wording was marked verified.

The editor retains these old values under **Previous schedule**. A club-designated person must confirm the sessions, formats, attendance, and any business-meeting or campfire variations before those details are published.

| Group | Existing days | Existing time / room | Structured recurrence | Still to confirm |
| --- | --- | --- | --- | --- |
| Board of Trustees | Second Wednesday of each month | 5:30 PM / Clubhouse | monthly: second Wednesday; 17:30 | Club business |
| Noon Group | Sunday | 12:00 PM / Back room | weekly:  Sunday; 12:00 | Open discussion |
| Intergroup Unity Speakers Meeting | Saturday | 8:00 PM / Front room | weekly:  Saturday; 20:00 | Speaker meeting |
| Turner Street Evening Group | Daily | 8:00 PM / Front room | weekly:  Monday, Tuesday, Wednesday, Thursday, Friday, Saturday, Sunday; 20:00 | Open discussion and campfire meeting |
| Serenity in Addiction | Daily | 7:00 PM / Front room | weekly:  Monday, Tuesday, Wednesday, Thursday, Friday, Saturday, Sunday; 19:00 | NA meeting |
| GOYA | Daily | 6:00 PM / Front room | weekly:  Monday, Tuesday, Wednesday, Thursday, Friday, Saturday, Sunday; 18:00 | Open discussion |
| Mid-Day | Daily | 3:00 PM / Front room | weekly:  Monday, Tuesday, Wednesday, Thursday, Friday, Saturday, Sunday; 15:00 | Open discussion |
| TGIF | Daily | 12:00 PM / Front room | weekly:  Monday, Tuesday, Wednesday, Thursday, Friday, Saturday, Sunday; 12:00 | Open discussion and book study |
| Women With Freedom | Wednesday | 10:00 AM / Back room | weekly:  Wednesday; 10:00 | Closed women-only meeting |
| Feelings | Monday through Saturday | 10:00 AM / Front room | weekly:  Monday, Tuesday, Wednesday, Thursday, Friday, Saturday; 10:00 | Book study and discussion |
| BYOC Early Birds | Daily | 7:00 AM / Back room | weekly:  Monday, Tuesday, Wednesday, Thursday, Friday, Saturday, Sunday; 07:00 | Bring Your Own Coffee |

## Original notes requiring review

### Board of Trustees

Monthly board meeting for club business and stewardship.

### Noon Group

The NA Noon Group meets Sundays in the back room of the club.

### Intergroup Unity Speakers Meeting

Saturday speaker meeting with fellowship across local groups.

### Turner Street Evening Group

Turner Street meets in the front room Sunday through Friday. Saturday night is the campfire meeting.

### Serenity in Addiction

Serenity in Addiction rotates open discussion, literature study, beginner, speaker, celebration, and IP discussion formats. Its business meeting is the first Monday at 8pm.

### GOYA

GOYA meets at 6pm in the front room.

### Mid-Day

The 3pm Mid-Day group meets seven days a week for open discussion.

### TGIF

TGIF meets at noon daily. Most days are open discussion, with Big Book study on Tuesday and 12 Steps and 12 Traditions study on Thursday.

### Women With Freedom

Women With Freedom meets Wednesday mornings in the back room.

### Feelings

The Feelings Group meets at 10am in the front room with rotating formats: 12 Steps and 12 Traditions, As Bill Sees It, Big Book stories, the first 164 pages, Living Sober, and open discussion.

### BYOC Early Birds

Bring Your Own Coffee (BYOC) meets every morning in the back room.

## Rehearsal and production procedure

Run `scripts/backfill-meeting-schedules.ts` through `scripts/with-env.mjs` against a reviewed environment. Its default is a report; `--apply` copies only missing structured schedules. It refuses unrecognized recurrence text before changing anything and is repeatable without duplicating sessions. Back up production before migrating; review this report against current production records first. Existing records with structured sessions are skipped. The backfill suppresses per-record cache invalidations and must run before the release build (or be followed by the normal authenticated public revalidation operation).

Local checks cover Monday–Saturday, second Wednesday, last/fifth weekdays, leap and year boundaries, different formats by day, multiple sessions, effective dates, DST, cancellations, monthly replacement, and moving one occurrence. Synthetic test assignments are not club schedule facts.
