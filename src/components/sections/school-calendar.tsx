'use client';

import { useState } from 'react';

import { Holiday } from '@/features/holiday/types';

import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemFooter,
  ItemGroup,
  ItemHeader,
  ItemMedia,
  ItemSeparator,
  ItemTitle,
} from '@/components/ui/item';

import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { ButtonGroup } from '../ui/button-group';
import { Calendar } from '../ui/calendar';
import { Card, CardContent, CardFooter } from '../ui/card';

interface SchoolCalendarProps {
  holidays: Holiday[];
}

function getMatchingHolidays(date: Date, holidays: Holiday[]): Holiday[] {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return holidays.filter((h) => {
    const start = new Date(h.startDate + 'T00:00:00');
    const end = new Date(h.endDate + 'T00:00:00');
    return d >= start && d <= end;
  });
}

export default function SchoolCalendar({ holidays }: SchoolCalendarProps) {
  const [date, setDate] = useState(new Date());
  const [matchingHolidays, setMatchingHolidays] = useState<Holiday[]>([]);

  const handleDaySelect = (day: Date | undefined) => {
    if (!day) return;
    setDate(day);
    const matching = getMatchingHolidays(day, holidays);
    setMatchingHolidays(matching);
  };

  return (
    <div className="w-full my-2 flex items-center justify-center">
      <Card className="md:flex md:flex-row md:p-0 mx-auto">
        <CardContent className="md:pb-4 md:pt-4 md:pr-0">
          <Calendar
            mode="single"
            selected={date}
            onSelect={handleDaySelect}
            className="rounded-lg border-2 [--cell-size:2.5rem] md:[--cell-size:5rem]"
            required
            fixedWeeks
          />
        </CardContent>
        <CardFooter className="rounded-bl-none md:items-start flex flex-col">
          <ButtonGroup className="w-full">
            <Button variant="default">+ Kegiatan</Button>
            <Button variant="default">+ Hari Libur</Button>
            <Button variant="default">+ Rencana</Button>
          </ButtonGroup>
          <span>
            {date.toLocaleDateString('id-ID', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </span>
          {holidays.length > 0 && (
            <ItemGroup className="w-full gap-0!">
              <ItemSeparator></ItemSeparator>
              <Item>
                <ItemHeader>
                  <Badge>Hari Libur:</Badge>
                </ItemHeader>
              </Item>
              {matchingHolidays.map((holiday) => (
                <Item key={holiday.id} variant="outline">
                  <ItemHeader>{holiday.reason}</ItemHeader>
                  <ItemMedia></ItemMedia>
                  <ItemContent>
                    <ItemTitle></ItemTitle>
                    <ItemDescription></ItemDescription>
                  </ItemContent>
                  <ItemActions></ItemActions>
                  <ItemFooter></ItemFooter>
                </Item>
              ))}
            </ItemGroup>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
