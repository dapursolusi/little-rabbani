'use client';

import { useEffect, useRef, useState } from 'react';

import { SecurityIcon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';

import { EmptyState } from '@/components/shared/empty-state';
import { Badge } from '@/components/ui/badge';

import { getCategoryLabel } from '@/lib/activity-utils';

interface IActivityInfo {
  id: string;
  name: string;
  category: string;
}

interface IScheduleItem {
  id: string;
  sessionId: string;
  activityId: string | null;
  type: 'activity' | 'outing';
  location: string | null;
  itemsToBring: string | null;
  permissionRequired: boolean;
  sortOrder: number;
  activity: IActivityInfo | null;
}

interface ISession {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  label: string;
  scheduleItems: IScheduleItem[];
}

function formatTime(time: string) {
  return time.slice(0, 5);
}

export function TeacherScheduleView() {
  const [sessions, setSessions] = useState<ISession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const fetchRef = useRef<() => void>(() => {});

  useEffect(() => {
    fetchRef.current = async () => {
      try {
        const response = await fetch('/api/schedule/today');
        const json = await response.json();

        if (json.success) {
          setSessions(json.data);
        }
      } catch {
        // Polling silently handles errors
      } finally {
        setIsLoading(false);
      }
    };

    // Initial fetch
    fetchRef.current();

    // Poll every 7 seconds
    intervalRef.current = setInterval(() => {
      fetchRef.current();
    }, 7000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-sm text-muted-foreground">Memuat jadwal...</div>
      </div>
    );
  }

  if (sessions.length === 0) {
    return <EmptyState title="Tidak ada jadwal untuk hari ini" />;
  }

  return (
    <div className="space-y-4">
      {/* Today's date heading */}
      <p className="text-sm text-muted-foreground">
        {new Date().toLocaleDateString('id-ID', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        })}
      </p>

      {sessions.map((session) => (
        <div key={session.id} className="rounded-lg border bg-card">
          {/* Session header */}
          <div className="flex items-center justify-between border-b px-4 py-2">
            <div>
              <span className="font-medium text-foreground">
                {session.label}
              </span>
              <span className="ml-2 text-sm text-muted-foreground">
                {formatTime(session.startTime)} — {formatTime(session.endTime)}
              </span>
            </div>
            <Badge variant="outline" className="text-xs">
              {session.scheduleItems.length} aktivitas
            </Badge>
          </div>

          {/* Schedule items */}
          <div className="divide-y">
            {session.scheduleItems.map((item) => (
              <div key={item.id} className="px-4 py-2.5">
                {item.type === 'outing' ? (
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs">
                        Outing
                      </Badge>
                      <span className="font-medium text-foreground">
                        {item.location || 'Lokasi tidak ditentukan'}
                      </span>
                    </div>
                    {item.itemsToBring && (
                      <p className="text-xs text-muted-foreground">
                        Bawaan: {item.itemsToBring}
                      </p>
                    )}
                    {item.permissionRequired && (
                      <div className="flex items-center gap-1 text-xs text-warning">
                        <HugeiconsIcon
                          icon={SecurityIcon}
                          className="h-3.5 w-3.5 text-warning"
                        />
                        Izin orang tua diperlukan
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="secondary"
                      className="bg-success/10 text-success text-xs"
                    >
                      Aktivitas
                    </Badge>
                    <span className="font-medium text-foreground">
                      {item.activity?.name || 'Aktivitas tidak tersedia'}
                    </span>
                    {item.activity && (
                      <span className="text-xs text-muted-foreground">
                        {getCategoryLabel(item.activity.category)}
                      </span>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
