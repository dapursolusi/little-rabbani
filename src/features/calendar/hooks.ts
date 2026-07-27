'use client';

import { useEffect, useState } from 'react';

import { useParams } from 'next/navigation';

import { getSessionTypes } from '@/features/sessionType/actions';
import { SessionType } from '@/features/sessionType/types';
import { getSubThemes } from '@/features/theme/actions';
import { SubTheme } from '@/features/theme/types';

import { getCalendarEventById } from './actions';
import { CalendarEvent, CalendarEventFormData } from './types';

export function useCalendarFormData() {
  const { id } = useParams();
  const [event, setEvent] = useState<CalendarEventFormData | null>(null);
  const [sessions, setSessions] = useState<SessionType[]>([]);
  const [subThemes, setSubThemes] = useState<SubTheme[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const [sessionsRes, subThemesRes, eventRes] = await Promise.all([
        getSessionTypes(),
        getSubThemes(),
        getCalendarEventById(id as string),
      ]);
      if (sessionsRes.success) setSessions(sessionsRes.data);
      if (subThemesRes.success) setSubThemes(subThemesRes.data);
      if (eventRes.success) {
        const data = eventRes.data as CalendarEvent;
        const isMultipleDays = data.startDate !== data.endDate;
        setEvent({
          ...data,
          isMultipleDays,
        });
      }
    };

    if (!id) return;
    fetchData();
  }, []);

  return { eventId: id as string, event, sessions, subThemes };
}
