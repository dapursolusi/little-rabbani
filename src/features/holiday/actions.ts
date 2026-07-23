'use server';

import { db } from '@/db';
import { holiday } from '@/db/schema';
import { HolidayFormSchema } from '@/features/holiday/schema';
import { and, eq, isNull, sql } from 'drizzle-orm';

import { requireOwner } from '../../lib/actions/utils';

export async function getHolidays(termId?: string) {
  const authCheck = await requireOwner();
  if (!authCheck.authorized) {
    return { success: false as const, error: authCheck.error };
  }

  try {
    const conditions = [isNull(holiday.deletedAt)];
    if (termId) {
      conditions.push(
        sql`(${holiday.termId} = ${termId} OR ${holiday.termId} IS NULL)`
      );
    }

    const where = and(...conditions);

    const items = await db.query.holiday.findMany({
      where,
      orderBy: (holiday, { asc }) => [asc(holiday.startDate)],
    });

    return { success: true as const, data: items };
  } catch {
    return { success: false as const, error: 'Gagal mengambil data libur' };
  }
}

export async function createHoliday(input: Record<string, unknown>) {
  const authCheck = await requireOwner();
  if (!authCheck.authorized) {
    return { success: false as const, error: authCheck.error };
  }

  const parsed = HolidayFormSchema.safeParse(input);
  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message ?? 'Data tidak valid';
    return { success: false as const, error: firstError };
  }

  try {
    const [newItem] = await db
      .insert(holiday)
      .values({
        termId: parsed.data.termId ?? null,
        startDate: parsed.data.startDate,
        endDate: parsed.data.endDate,
        reason: parsed.data.reason,
        source: 'manual',
        scope: parsed.data.scope,
      })
      .returning();

    return { success: true as const, data: newItem };
  } catch {
    return { success: false as const, error: 'Gagal membuat hari libur' };
  }
}

export async function deleteHoliday(id: string) {
  const authCheck = await requireOwner();
  if (!authCheck.authorized) {
    return { success: false as const, error: authCheck.error };
  }

  try {
    await db
      .update(holiday)
      .set({ deletedAt: new Date() })
      .where(eq(holiday.id, id));
    return { success: true as const, data: undefined };
  } catch {
    return { success: false as const, error: 'Gagal menghapus hari libur' };
  }
}

// ── Google Calendar Sync ──────────────────────────────────────────

const HOLIDAY_CALENDAR_ID =
  'id.indonesian%23holiday%40group.v.calendar.google.com';
const HOLIDAY_API_URL = `https://www.googleapis.com/calendar/v3/calendars/${HOLIDAY_CALENDAR_ID}/events`;

interface GoogleEvent {
  summary?: string;
  start?: { date?: string };
  end?: { date?: string };
}

async function fetchGoogleHolidays(year: number): Promise<GoogleEvent[]> {
  const apiKey = process.env.GOOGLE_CALENDAR_API_KEY;
  if (!apiKey) throw new Error('GOOGLE_CALENDAR_API_KEY not set');

  const events: GoogleEvent[] = [];
  let pageToken: string | undefined;

  do {
    const params = new URLSearchParams({
      key: apiKey,
      timeMin: `${year}-01-01T00:00:00+07:00`,
      singleEvents: 'true',
      orderBy: 'startTime',
      maxResults: '2500',
    });
    if (pageToken) params.set('pageToken', pageToken);

    const res = await fetch(`${HOLIDAY_API_URL}?${params}`);
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

function googleToHolidayRows(events: GoogleEvent[]) {
  return events
    .filter((e) => e?.start?.date && e?.summary)
    .map((e) => {
      const rawEnd = e.end?.date ?? e.start!.date!;
      let endDate: string;
      if (rawEnd === e.start!.date!) {
        endDate = rawEnd;
      } else {
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

export async function syncHolidays() {
  try {
    const events = await fetchGoogleHolidays(2026);

    if (events.length === 0) {
      return {
        success: true as const,
        data: { inserted: 0, deleted: 0 },
      };
    }

    const rows = googleToHolidayRows(events);

    const deletedResult = await db
      .delete(holiday)
      .where(and(eq(holiday.source, 'synced'), isNull(holiday.termId)));

    const inserted = await db.insert(holiday).values(rows).returning();

    return {
      success: true as const,
      data: {
        inserted: inserted.length,
        deleted: deletedResult.rowCount ?? 0,
      },
    };
  } catch (error) {
    console.error('[syncHolidays]', error);
    return { success: false as const, error: 'Gagal sinkronisasi hari libur' };
  }
}
