/**
 * Sync Indonesian national holidays from Google Calendar into the holiday table.
 *
 * Strategy: DELETE all source='synced' + termId IS NULL rows, then INSERT fresh.
 * This avoids stale Hijri-predicted dates lingering when government moon-sighting
 * adjustments shift Idul Fitri / Idul Adha by 1–2 days.
 *
 * Run: bun --env-file=.env.local run scripts/seed-holidays.ts
 */
import { neon } from '@neondatabase/serverless';
import { and, eq, isNull } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/neon-http';

// We need holiday table schema. Since this script runs standalone (no @/ alias),
// import the schema module directly.
import * as schema from '../src/lib/db/schema';

const CALENDAR_ID = 'id.indonesian%23holiday%40group.v.calendar.google.com';
const API_KEY = process.env.GOOGLE_CALENDAR_API_KEY;
const DATABASE_URL = process.env.DATABASE_URL;
const API_URL = `https://www.googleapis.com/calendar/v3/calendars/${CALENDAR_ID}/events`;

interface GoogleEvent {
  summary?: string;
  start?: { date?: string };
  end?: { date?: string };
}

async function fetchHolidays(year: number): Promise<GoogleEvent[]> {
  if (!API_KEY) throw new Error('GOOGLE_CALENDAR_API_KEY not set');

  const events: GoogleEvent[] = [];
  let pageToken: string | undefined;

  do {
    const params = new URLSearchParams({
      key: API_KEY,
      timeMin: `${year}-01-01T00:00:00+07:00`,
      singleEvents: 'true',
      orderBy: 'startTime',
      maxResults: '2500',
    });
    if (pageToken) params.set('pageToken', pageToken);

    const res = await fetch(`${API_URL}?${params}`);
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Google Calendar API error ${res.status}: ${text}`);
    }

    const json = (await res.json()) as {
      items?: GoogleEvent[];
      nextPageToken?: string;
    };

    if (json.items) events.push(...json.items);
    pageToken = json.nextPageToken;
  } while (pageToken);

  return events;
}

interface HolidayRow {
  startDate: string;
  endDate: string;
  reason: string;
  source: 'synced';
  scope: 'national';
  termId: null;
}

function toHolidayRows(events: GoogleEvent[]): HolidayRow[] {
  return events
    .filter((e) => e?.start?.date && e?.summary)
    .map((e) => {
      const rawEnd = e.end?.date ?? e.start!.date!;
      let endDate: string;
      if (rawEnd === e.start!.date!) {
        endDate = rawEnd;
      } else {
        // Google all-day events: end.date is exclusive (next day).
        // Parse as UTC to avoid timezone offset shifting toISOString().
        const yr = Number(rawEnd.slice(0, 4));
        const mo = Number(rawEnd.slice(5, 7)) - 1;
        const dy = Number(rawEnd.slice(8, 10));
        const d = new Date(Date.UTC(yr, mo, dy - 1));
        endDate = d.toISOString().slice(0, 10);
      }

      return {
        startDate: e.start!.date!,
        endDate,
        reason: e.summary!.trim(),
        source: 'synced' as const,
        scope: 'national' as const,
        termId: null,
      };
    });
}

async function main() {
  if (!DATABASE_URL) throw new Error('DATABASE_URL not set');

  const sql = neon(DATABASE_URL);
  const db = drizzle({ client: sql, schema });

  const year = 2026;

  console.log(`Fetching holidays from ${year}-01-01 from Google Calendar…`);
  const events = await fetchHolidays(year);

  if (events.length === 0) {
    console.warn(
      'Google returned 0 events — aborting sync (existing data preserved).'
    );
    return;
  }

  const rows = toHolidayRows(events);
  console.log(`Got ${rows.length} holidays.`);

  console.log('Deleting previously synced national holidays…');
  const deleted = await db
    .delete(schema.holiday)
    .where(
      and(eq(schema.holiday.source, 'synced'), isNull(schema.holiday.termId))
    );
  console.log(`Deleted ${deleted.rowCount ?? 0} rows.`);

  console.log('Inserting fresh holidays…');
  const inserted = await db.insert(schema.holiday).values(rows).returning();
  console.log(`Inserted ${inserted.length} rows.`);
  console.log('Done.');
}

main().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
