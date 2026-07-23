'use client';

import { useEffect, useState } from 'react';

import { getScheduleItemsByDate } from '@/features/schedule/actions';

import { Item, ItemGroup, ItemHeader } from '../ui/item';

interface ScheduleItem {
  id: string;
  startDate: string | null;
  sessionTypeId: string | null;
  subThemeId: string | null;
  name: string | null;
  indoor: boolean;
  location: string | null;
  itemsToBring: string | null;
  permissionRequired: boolean;
  sortOrder: number;
  subTheme: {
    id: string;
    name: string;
    themeId: string;
    theme: { id: string; name: string; color: string | null };
  } | null;
  sessionType: { id: string; name: string; start: string; end: string } | null;
}

interface ScheduleItemListProps {
  date: string;
}

export default function ScheduleItemList({ date }: ScheduleItemListProps) {
  const [items, setItems] = useState<ScheduleItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function fetch() {
      setLoading(true);
      const result = await getScheduleItemsByDate(date);
      if (cancelled) return;
      if (result.success) setItems(result.data as ScheduleItem[]);
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

  if (items.length === 0) {
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

      {items.map((item) => (
        <Item key={item.id} variant="outline">
          <ItemHeader>
            <span className="font-medium">{item.subTheme?.name ?? '—'}</span>
            <span className="text-xs text-muted-foreground">
              {item.indoor ? (
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
          {item.sessionType && (
            <span className="text-xs text-muted-foreground">
              {item.sessionType.name} ({item.sessionType.start} —{' '}
              {item.sessionType.end})
            </span>
          )}
          {item.itemsToBring && (
            <span className="text-xs text-muted-foreground">
              Bawaan: {item.itemsToBring}
            </span>
          )}
        </Item>
      ))}
    </ItemGroup>
  );
}
