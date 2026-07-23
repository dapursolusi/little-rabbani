'use client';

import { useEffect, useState } from 'react';

import { getScheduleItemsByDate } from '@/lib/actions/schedule';
import { getCategoryLabel } from '@/lib/activity-utils';

import { Item, ItemGroup, ItemHeader } from '../ui/item';

interface ScheduleItem {
  id: string;
  startDate: string | null;
  sessionTypeId: string | null;
  activityId: string | null;
  name: string | null;
  type: 'activity' | 'outing';
  location: string | null;
  bringItems: string | null;
  permissionRequired: boolean;
  sortOrder: number;
  activity: { id: string; name: string; category: string } | null;
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
            <span className="font-medium">
              {item.type === 'outing'
                ? item.location
                : (item.activity?.name ?? '—')}
            </span>
            <span className="text-xs text-muted-foreground">
              {item.type === 'outing' ? (
                <span className="rounded bg-blue-100 px-1.5 py-0.5 text-xs text-blue-700">
                  Outing
                </span>
              ) : (
                item.activity && getCategoryLabel(item.activity.category)
              )}
            </span>
          </ItemHeader>
          {item.sessionType && (
            <span className="text-xs text-muted-foreground">
              {item.sessionType.name} ({item.sessionType.start} —{' '}
              {item.sessionType.end})
            </span>
          )}
          {item.type === 'outing' && item.bringItems && (
            <span className="text-xs text-muted-foreground">
              Bawaan: {item.bringItems}
            </span>
          )}
        </Item>
      ))}
    </ItemGroup>
  );
}
