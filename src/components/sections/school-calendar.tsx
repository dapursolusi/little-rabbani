'use client';

import { useMemo, useState } from 'react';

import Link from 'next/link';

import { createHoliday } from '@/features/holiday/actions';
import { holidayFields } from '@/features/holiday/fields';
import { Holiday } from '@/features/holiday/types';
import { Add02Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale/id';

import {
  Item,
  ItemActions,
  ItemFooter,
  ItemGroup,
  ItemHeader,
  ItemSeparator,
} from '@/components/ui/item';

import DefaultFormFields from '../shared/form/default-form-field';
import { Modal } from '../shared/modal';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { ButtonGroup } from '../ui/button-group';
import { Calendar } from '../ui/calendar';
import { Card, CardContent, CardFooter } from '../ui/card';
import { DialogClose, DialogFooter } from '../ui/dialog';
import CalendarEventList from './calendar-event-list';

interface SchoolCalendarProps {
  holidays: Holiday[];
  onDateSelect?: (date: string) => void;
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

function isHoliday(date: Date, holidays: Holiday[]): boolean {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return holidays.some((h) => {
    const start = new Date(h.startDate + 'T00:00:00');
    const end = new Date(h.endDate + 'T00:00:00');
    return d >= start && d <= end;
  });
}

function AddCustomHoliday({ hasExisting }: { hasExisting: boolean }) {
  const [open, setOpen] = useState(false);
  const [showForm, setShowForm] = useState(false);

  if (!hasExisting) {
    return (
      <Modal
        title="Tambah Hari Libur"
        description="Tambahkan hari libur baru di luar hari libur nasional."
        trigger={{
          text: 'Hari Libur',
          icon: Add02Icon,
        }}
        content={<HolidayForm />}
      />
    );
  }

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <HugeiconsIcon icon={Add02Icon} />
        Hari Libur
      </Button>
      <Modal
        title="Sudah ada hari libur"
        description="Hari ini sudah terdapat hari libur, anda yakin ingin menambahkan hari libur baru di luar hari libur nasional?"
        open={!showForm && open}
        onOpenChange={(v) => {
          setOpen(v);
          if (!v) setShowForm(false);
        }}
        footer={
          <DialogFooter>
            <DialogClose render={<Button variant="outline">Batal</Button>} />
            <Button onClick={() => setShowForm(true)}>Lanjutkan</Button>
          </DialogFooter>
        }
      />
      <Modal
        title="Tambah Hari Libur"
        description="Tambahkan hari libur baru di luar hari libur nasional."
        open={showForm}
        onOpenChange={setShowForm}
        content={<HolidayForm />}
      />
    </>
  );
}

function HolidayForm() {
  return (
    <DefaultFormFields
      formFields={holidayFields()}
      schemaKey="holiday"
      initialData={{
        reason: '',
        startDate: '',
        endDate: '',
        scope: 'custom',
      }}
      onSubmit={createHoliday}
    >
      <DialogFooter>
        <DialogClose render={<Button variant="outline">Batal</Button>} />
        <Button type="submit">Simpan</Button>
      </DialogFooter>
    </DefaultFormFields>
  );
}

export default function SchoolCalendar({
  holidays,
  onDateSelect,
}: SchoolCalendarProps) {
  const [date, setDate] = useState(new Date());

  const modifiers = useMemo(
    () => ({
      weekend: { dayOfWeek: [0, 6] },
      holiday: (day: Date) => isHoliday(day, holidays),
    }),
    [holidays]
  );

  const modifiersClassNames = useMemo(
    () => ({
      weekend: 'text-red-500!',
      holiday: 'text-red-500!',
    }),
    []
  );

  const matchingHolidays = useMemo(
    () => getMatchingHolidays(date, holidays),
    [date, holidays]
  );

  const handleDaySelect = (day: Date | undefined) => {
    if (!day) return;
    setDate(day);
    onDateSelect?.(format(day, 'yyyy-MM-dd'));
  };

  return (
    <div className="w-full my-2 md:px-6 px-2   flex items-center justify-center">
      <Card className="md:flex md:flex-row md:p-0 mx-auto w-full max-md:items-center  ">
        <CardContent className="md:pb-4 md:pt-4 md:pr-0">
          <Calendar
            key={`calendar-${holidays.length}`}
            mode="single"
            selected={date}
            onSelect={handleDaySelect}
            className="rounded-lg border-2 [--cell-size:2.5rem] md:[--cell-size:5rem] [&_td]:border [&_th]:border"
            required
            fixedWeeks
            locale={id}
            modifiers={modifiers}
            modifiersClassNames={modifiersClassNames}
          />
        </CardContent>
        <CardFooter className="rounded-bl-none md:items-start flex flex-col w-full md:max-h-[705]! md:overflow-x-hidden md:overflow-y-auto">
          <span className="text-lg font-semibold my-2 w-full text-center">
            {date.toLocaleDateString('id-ID', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </span>
          <ButtonGroup className="w-full">
            <Button
              variant="default"
              render={
                <Link href="/dashboard/owner/calendar/create">
                  <HugeiconsIcon icon={Add02Icon} />
                  Kegiatan
                </Link>
              }
            ></Button>
            <AddCustomHoliday hasExisting={matchingHolidays.length > 0} />
            <Button variant="default">+ Rencana Belajar</Button>
          </ButtonGroup>
          {matchingHolidays.length > 0 && (
            <ItemGroup className="w-full gap-1!">
              <ItemSeparator></ItemSeparator>
              <Item>
                <ItemHeader>
                  <span className="font-semibold text-lg text-destructive/80">
                    Hari Libur:
                  </span>
                </ItemHeader>
              </Item>
              {matchingHolidays
                .filter((h) => h.scope === 'national' && h.source === 'synced')
                .map((holiday) => (
                  <Item
                    key={holiday.id}
                    variant="outline"
                    className="cursor-not-allowed"
                  >
                    <ItemHeader className="font-semibold">
                      {holiday.reason}
                    </ItemHeader>
                    <ItemFooter>
                      <Badge variant="secondary">Libur Nasional</Badge>
                    </ItemFooter>
                  </Item>
                ))}
              {matchingHolidays
                .filter((h) => h.scope !== 'national' && h.source !== 'synced')
                .map((holiday) => (
                  <Item key={holiday.id} variant="outline">
                    <ItemHeader className="font-semibold">
                      {holiday.reason}
                    </ItemHeader>
                    <ItemActions>Edit</ItemActions>
                    <ItemFooter>
                      <Badge variant="default">Kustom</Badge>
                    </ItemFooter>
                  </Item>
                ))}
            </ItemGroup>
          )}
          <CalendarEventList date={format(date, 'yyyy-MM-dd')} />
        </CardFooter>
      </Card>
    </div>
  );
}
