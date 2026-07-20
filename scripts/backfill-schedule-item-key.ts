/**
 * Backfill scheduleItem.date and scheduleItem.sessionTypeId from the
 * existing termSession FK. This is the "expand" phase of expand–contract:
 * new columns get populated so code can switch reads to them.
 *
 * Run: bun run scripts/backfill-schedule-item-key.ts
 *
 * ponytail: one-shot backfill, run once per environment
 */
import { and, eq, isNull } from 'drizzle-orm';

import { db } from '@/lib/db';
import { scheduleItem, sessionType } from '@/lib/db/schema';
import { resolveSessionType } from '@/lib/session-type-resolver';

async function backfill() {
  try {
    const items = await db.query.scheduleItem.findMany({
      where: and(isNull(scheduleItem.date), isNull(scheduleItem.deletedAt)),
      with: { session: true },
    });

    if (items.length === 0) {
      console.log('No items to backfill.');
      return;
    }

    const allTypes = await db.query.sessionType.findMany({
      where: isNull(sessionType.deletedAt),
    });

    console.log(`Backfilling ${items.length} schedule items...`);
    console.log(`Session types available: ${allTypes.length}`);

    let done = 0;
    let orphaned = 0;
    let failed = 0;

    for (const item of items) {
      const ts = item.session;
      if (!ts) {
        console.error(
          `  ORPHAN: scheduleItem ${item.id} has no termSession — skipping`
        );
        orphaned++;
        continue;
      }

      const resolved = resolveSessionType(allTypes, ts.label, ts.date);
      if (!resolved) {
        // ponytail: items with unresolvable labels (e.g. "Hari Libur (dibatalkan)")
        // still get the date populated; sessionTypeId stays null
        console.log(
          `  SKIP: no sessionType for "${ts.label}" on ${ts.date} (item ${item.id}) — setting date only`
        );
        await db
          .update(scheduleItem)
          .set({ date: ts.date, updatedAt: new Date() })
          .where(eq(scheduleItem.id, item.id));
        done++;
        continue;
      }

      try {
        await db
          .update(scheduleItem)
          .set({
            date: ts.date,
            sessionTypeId: resolved.id,
            updatedAt: new Date(),
          })
          .where(eq(scheduleItem.id, item.id));
        done++;
      } catch (updateErr) {
        console.error(`  FAIL: update item ${item.id}:`, updateErr);
        failed++;
      }
    }

    console.log(
      `Done: ${done} backfilled, ${orphaned} orphaned, ${failed} failed.`
    );
    if (failed > 0) process.exit(1);
  } catch (err) {
    console.error('Backfill failed:', err);
    process.exit(1);
  }
}

backfill();
