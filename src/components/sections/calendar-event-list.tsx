'use client';

import { useEffect, useState } from 'react';

import {
  deleteCalendarEvent,
  getCalendarEventsByDate,
} from '@/features/calendar/actions';
import { CalendarEvent } from '@/features/calendar/types';

import { DataTableRowActions } from '../shared/table/data-table-row-action';
import { Badge } from '../ui/badge';
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemHeader,
  ItemTitle,
} from '../ui/item';

interface CalendarEventListProps {
  date: string;
}

export default function CalendarEventList({ date }: CalendarEventListProps) {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function fetch() {
      setLoading(true);
      const result = await getCalendarEventsByDate(date);
      if (cancelled) return;
      if (result.success) setEvents(result.data as CalendarEvent[]);
      setLoading(false);
    }

    fetch();
    return () => {
      cancelled = true;
    };
  }, [date]);

  if (loading) {
    return (
      <div className="text-center text-sm text-muted-foreground py-8">
        Memuat jadwal...
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="text-center text-sm text-muted-foreground py-8">
        Belum ada jadwal untuk tanggal ini
      </div>
    );
  }

  return (
    <ItemGroup className="w-full gap-1">
      <Item>
        <ItemHeader>
          <span className="font-semibold text-lg text-destructive/80">
            {new Date(date) > new Date()
              ? 'Rencana Kegiatan:'
              : 'Jadwal Kegiatan:'}
          </span>
        </ItemHeader>
      </Item>

      {events.map((e) => (
        <Item key={e.id} variant="outline">
          <ItemHeader>
            <Badge className="font-medium">
              {e.subTheme.theme?.name ?? '—'}: {e.subTheme?.name ?? '—'}
            </Badge>
            <span className="text-xs text-muted-foreground">
              {e.indoor ? (
                <span className="rounded bg-green-100 px-1.5 py-0.5 text-xs text-green-700">
                  Indoor
                </span>
              ) : (
                <span className="rounded bg-amber-100 px-1.5 py-0.5 text-xs text-amber-700">
                  Outdoor
                </span>
              )}
            </span>
          </ItemHeader>
          <ItemContent>
            <ItemTitle>{e.name}</ItemTitle>
            <ItemDescription className="flex flex-col gap-1">
              {e.sessionType && (
                <span className="text-xs text-muted-foreground">
                  {e.sessionType.name} ({e.sessionType.start} —{' '}
                  {e.sessionType.end})
                </span>
              )}
              {e.itemsToBring && (
                <span className="text-xs text-muted-foreground">
                  Bawaan: {e.itemsToBring}
                </span>
              )}
            </ItemDescription>
          </ItemContent>
          <ItemActions>
            <DataTableRowActions
              id={e.id}
              actions={{
                editHref: `/dashboard/calendar/edit/${e.id}`,
                delete: deleteCalendarEvent,
              }}
              dataName={e.name}
            />
          </ItemActions>
        </Item>
      ))}
    </ItemGroup>
  );
}
