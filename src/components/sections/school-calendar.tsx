'use client';

import { type ComponentProps, useEffect, useMemo, useState } from 'react';

import Link from 'next/link';

import { getCalendarEventDates } from '@/features/calendar/actions';
import { BatchUpsertModal } from '@/features/curriculum/components/batch-upsert-modal';
import { buildGateState, findCoveringTerm } from '@/features/curriculum/gate';
import type { CurriculumPlanView } from '@/features/curriculum/plan-view';
import { createHoliday } from '@/features/holiday/actions';
import { holidayFields } from '@/features/holiday/fields';
import type { Holiday } from '@/features/holiday/types';
import type { SubTheme } from '@/features/theme/types';
import {
  Add02Icon,
  ViewIcon,
  ViewOffSlashIcon,
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { addDays, endOfMonth, format, startOfMonth, subDays } from 'date-fns';
import { id } from 'date-fns/locale/id';

import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemFooter,
  ItemGroup,
  ItemHeader,
  ItemSeparator,
  ItemTitle,
} from '@/components/ui/item';

import DefaultFormFields from '../shared/form/default-form-field';
import { Modal } from '../shared/modal';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { ButtonGroup } from '../ui/button-group';
import { Calendar, CalendarDayButton } from '../ui/calendar';
import { Card, CardContent, CardFooter } from '../ui/card';
import { DialogClose, DialogFooter } from '../ui/dialog';
import { Toggle } from '../ui/toggle';
import CalendarEventList from './calendar-event-list';

interface SchoolCalendarProps {
  onDateSelect?: (date: string) => void;
  planView?: CurriculumPlanView | null;
  holidays?: Holiday[];
  subThemes?: SubTheme[];
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

function CalendarHolidayDayButton({
  day,
  holidays,
  showCurriculums,
  planView,
  children,
  ...props
}: ComponentProps<typeof CalendarDayButton> & {
  holidays: Holiday[];
  showCurriculums: boolean;
  planView?: CurriculumPlanView | null;
}) {
  const pills = showCurriculums ? getMatchingHolidays(day.date, holidays) : [];
  const iso = format(day.date, 'yyyy-MM-dd');
  const position = planView?.positions[iso];
  const item = planView?.items[iso];
  const hasCurriculum = position != null;

  return (
    <CalendarDayButton day={day} {...props}>
      {showCurriculums && (hasCurriculum || pills.length > 0) ? (
        <div className="pointer-events-none absolute inset-0 flex flex-col items-start gap-0.5 p-1.5 text-left">
          <span className="text-xs opacity-70">{children}</span>
          {pills.length > 0 && (
            <span className="w-full truncate rounded bg-red-100/80 px-0.5 text-[0.6rem] leading-4 text-red-500">
              {pills[0].reason}
            </span>
          )}
          {item && (
            <span
              title={item.name}
              className="w-full truncate rounded bg-primary/10 px-0.5 text-[0.6rem] leading-4 text-primary md:inline"
            >
              <span className="hidden md:inline">
                Hari {position} · {item.subTheme?.theme?.name}:{' '}
                {item.subTheme?.name}
              </span>
              <span className="md:hidden">
                {item.subTheme?.theme?.name}: {item.subTheme?.name}
              </span>
            </span>
          )}
        </div>
      ) : (
        children
      )}
    </CalendarDayButton>
  );
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
  onDateSelect,
  planView,
  holidays = [],
  subThemes,
}: SchoolCalendarProps) {
  const [date, setDate] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(startOfMonth(new Date()));
  const [eventDates, setEventDates] = useState<Set<string>>(new Set());
  const [showCurriculums, setShowCurriculums] = useState(false);
  const [upsertOpen, setUpsertOpen] = useState(false);
  const [upsertDate, setUpsertDate] = useState<string | null>(null);

  const todayIso = useMemo(() => format(new Date(), 'yyyy-MM-dd'), []);
  const gate = useMemo(
    () => buildGateState(planView ?? null, todayIso),
    [planView, todayIso]
  );

  // Fetch dates that have events — cover overflow days from adjacent months
  useEffect(() => {
    // Widen by ~6 days to catch the week overflow into prev/next month
    // (fixedWeeks renders up to 6 weeks; 6 days covers the edge)
    const start = format(subDays(startOfMonth(currentMonth), 6), 'yyyy-MM-dd');
    const end = format(addDays(endOfMonth(currentMonth), 6), 'yyyy-MM-dd');

    getCalendarEventDates(start, end).then((result) => {
      if (result.success) {
        setEventDates(new Set(result.data));
      }
    });
  }, [currentMonth]);

  const modifiers = useMemo(() => {
    const inCurrentMonth = (day: Date) =>
      day.getMonth() === currentMonth.getMonth() &&
      day.getFullYear() === currentMonth.getFullYear();
    const isWorkday = (day: Date) => {
      const dow = day.getDay();
      return dow >= 1 && dow <= 5 && !isHoliday(day, holidays);
    };
    const isUnfilledWorkday = (day: Date) => {
      const iso = format(day, 'yyyy-MM-dd');
      return planView?.positions[iso] != null && planView.items[iso] == null;
    };

    return {
      weekend: { dayOfWeek: [0, 6] },
      holiday: (day: Date) => isHoliday(day, holidays),
      hasEvent: (day: Date) => eventDates.has(format(day, 'yyyy-MM-dd')),
      showCurriculums: showCurriculums,
      showCurriculumWorkday:
        showCurriculums &&
        ((day: Date) =>
          isWorkday(day) && inCurrentMonth(day) && isUnfilledWorkday(day)),
      showCurriculumOverflow:
        showCurriculums &&
        ((day: Date) => isWorkday(day) && !inCurrentMonth(day)),
    };
  }, [holidays, eventDates, showCurriculums, currentMonth, planView]);

  const modifiersClassNames = useMemo(
    () => ({
      weekend: 'text-red-500!',
      holiday: 'bg-red-100 text-red-500!',
      hasEvent:
        '[&_button]:after:absolute [&_button]:after:bottom-0.75 [&_button]:md:after:bottom-3.5 [&_button]:after:left-1/2 [&_button]:after:-translate-x-1/2 [&_button]:md:after:h-2 [&_button]:after:h-1.5 [&_button]:after:w-[90%] [&_button]:after:rounded-full [&_button]:after:bg-muted-foreground/80 [&_button]:after:content-[""]',
      showCurriculums:
        '[&_button]:md:justify-start [&_button]:md:items-start [&_button]:md:text-left [&_button]:md:pl-1.5 [&_button]:md:pt-1.5',
      showCurriculumWorkday: 'bg-warning/40',
      showCurriculumOverflow: 'bg-warning/15',
    }),
    []
  );

  const matchingHolidays = useMemo(
    () => getMatchingHolidays(date, holidays),
    [date, holidays]
  );

  const selectedIso = format(date, 'yyyy-MM-dd');
  const selectedPosition = planView?.positions[selectedIso];
  const selectedItem = planView?.items[selectedIso];
  const isSelectedWorkday = selectedPosition != null;
  const selectedTerm = findCoveringTerm(planView?.terms ?? [], selectedIso);
  const selectedBlocked =
    !!selectedTerm && gate.statusByTerm[selectedTerm.id] === 'blocked';

  const handleDaySelect = (day: Date | undefined) => {
    if (!day) return;
    const iso = format(day, 'yyyy-MM-dd');
    setDate(day);
    onDateSelect?.(iso);
    // Open batch upsert for an unfilled workday in an editable term
    if (planView?.positions[iso] != null && planView.items[iso] == null) {
      const term = findCoveringTerm(planView.terms, iso);
      const blocked = term && gate.statusByTerm[term.id] === 'blocked';
      if (!blocked) {
        setUpsertDate(iso);
        setUpsertOpen(true);
      }
    }
  };

  const handleMonthChange = (month: Date) => {
    setCurrentMonth(startOfMonth(month));
  };

  const jumpToFirstEmpty = () => {
    if (!gate.blockingFirstEmptyDate) return;
    const target = new Date(gate.blockingFirstEmptyDate + 'T00:00:00');
    setDate(target);
    setCurrentMonth(startOfMonth(target));
  };

  return (
    <div className="w-full my-2 md:px-6 md:h-[calc(100%-1rem)]">
      <Card className="md:flex md:flex-row w-full md:h-full md:p-0 mx-auto">
        <CardContent className="md:pb-4 md:pt-4 md:pr-0 md:basis-[65%] md:w-[65%] md:self-stretch flex items-center justify-center">
          <Calendar
            key={`calendar-${holidays.length}`}
            month={currentMonth}
            mode="single"
            selected={date}
            onSelect={handleDaySelect}
            onMonthChange={handleMonthChange}
            components={{
              DayButton: (props) => (
                <CalendarHolidayDayButton
                  {...props}
                  holidays={holidays}
                  showCurriculums={showCurriculums}
                  planView={planView}
                />
              ),
            }}
            className="rounded-lg border-2 w-full! [--cell-size:min(2.5rem,100%)] [&_td]:border [&_th]:border [&_.rdp-day]:min-w-0 md:h-full! md:[&_.rdp-months]:h-full! md:[&_.rdp-month]:h-full! md:[&_.rdp-month\_grid]:flex! md:[&_.rdp-month\_grid]:flex-1! md:[&_.rdp-month\_grid]:flex-col! md:[&_.rdp-weeks]:flex! md:[&_.rdp-weeks]:flex-1! md:[&_.rdp-weeks]:flex-col! md:[&_.rdp-week]:grow! md:[&_.rdp-week]:min-h-12! md:[&_.rdp-day]:aspect-auto! md:[&_.rdp-day\_button]:aspect-auto! md:[&_.rdp-day\_button]:h-full!"
            required
            fixedWeeks
            locale={id}
            modifiers={modifiers}
            modifiersClassNames={modifiersClassNames}
          />
        </CardContent>
        <CardFooter className="rounded-bl-none md:items-start flex flex-col md:basis-[35%] md:w-[35%]">
          <span className="text-lg font-semibold my-2 w-full text-center">
            {date.toLocaleDateString('id-ID', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </span>
          <ButtonGroup className="*:flex-1 [&_button]:w-full [&_button]:flex w-full!">
            <Button
              variant="default"
              nativeButton={false}
              render={
                <Link href="/dashboard/owner/calendar/create">
                  <HugeiconsIcon icon={Add02Icon} />
                  Kegiatan
                </Link>
              }
            ></Button>
            <AddCustomHoliday hasExisting={matchingHolidays.length > 0} />
            <Button
              render={
                <Toggle
                  pressed={showCurriculums}
                  onPressedChange={setShowCurriculums}
                  className="aria-pressed:bg-[color-mix(in_oklch,var(--primary),#000_15%)] aria-pressed:text-primary-foreground data-[state=on]:bg-[color-mix(in_oklch,var(--primary),#000_15%)] data-[state=on]:text-primary-foreground"
                >
                  <HugeiconsIcon
                    icon={ViewOffSlashIcon}
                    className="group-aria-pressed/toggle:hidden"
                  />
                  <HugeiconsIcon
                    icon={ViewIcon}
                    className="group-aria-pressed/toggle:block hidden"
                  />
                  Kurikulum
                </Toggle>
              }
            />
          </ButtonGroup>
          {showCurriculums && isSelectedWorkday && (
            <ItemGroup className="w-full gap-1!">
              <ItemSeparator />
              {selectedItem ? (
                <Item variant="outline">
                  <ItemHeader>
                    <Badge className="font-medium">
                      {selectedItem.subTheme?.theme?.name ?? '—'}:{' '}
                      {selectedItem.subTheme?.name ?? '—'}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      Hari {selectedPosition}
                    </span>
                  </ItemHeader>
                  <ItemContent>
                    <ItemTitle>{selectedItem.name}</ItemTitle>
                    <ItemDescription className="flex flex-col gap-1">
                      {selectedItem.objective && (
                        <span className="text-xs text-muted-foreground">
                          {selectedItem.objective}
                        </span>
                      )}
                      {selectedItem.itemsToBring && (
                        <span className="text-xs text-muted-foreground">
                          Bawaan: {selectedItem.itemsToBring}
                        </span>
                      )}
                    </ItemDescription>
                  </ItemContent>
                </Item>
              ) : selectedBlocked ? (
                <Item variant="outline">
                  <ItemHeader>
                    <span className="font-semibold text-sm text-muted-foreground">
                      Belum bisa diisi — selesaikan dulu term aktif (
                      {gate.blockingEmptyCount} hari kurikulum belum terisi)
                    </span>
                  </ItemHeader>
                  <ItemContent>
                    <ItemDescription>
                      Term berikutnya baru bisa diisi setelah term aktif terisi
                      penuh.
                    </ItemDescription>
                  </ItemContent>
                  <ItemActions>
                    <Button size="sm" onClick={jumpToFirstEmpty}>
                      Lompat ke hari kosong pertama
                    </Button>
                  </ItemActions>
                </Item>
              ) : (
                <Item variant="outline">
                  <ItemHeader>
                    <span className="font-semibold text-sm text-warning">
                      Kurikulum belum diisi
                    </span>
                  </ItemHeader>
                  <ItemContent>
                    <ItemDescription>
                      Hari ini belum memiliki item kurikulum.
                    </ItemDescription>
                  </ItemContent>
                  <ItemActions>
                    <Button
                      size="sm"
                      onClick={() => {
                        setUpsertDate(selectedIso);
                        setUpsertOpen(true);
                      }}
                    >
                      Isi Kurikulum
                    </Button>
                  </ItemActions>
                </Item>
              )}
            </ItemGroup>
          )}
          {showCurriculums && gate.createNextTermNeeded && (
            <ItemGroup className="w-full gap-1!">
              <ItemSeparator />
              <Item variant="outline">
                <ItemContent>
                  <ItemDescription>
                    Kurikulum term ini sudah lengkap — buat term baru untuk
                    melanjutkan.
                  </ItemDescription>
                </ItemContent>
                <ItemActions>
                  <Button
                    size="sm"
                    nativeButton={false}
                    render={
                      <Link href="/dashboard/owner/term/create">
                        Buat Term Baru
                      </Link>
                    }
                  />
                </ItemActions>
              </Item>
            </ItemGroup>
          )}
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
                    <ItemContent>
                      <Badge variant="default">Kustom</Badge>
                    </ItemContent>
                    <ItemActions>Edit</ItemActions>
                  </Item>
                ))}
            </ItemGroup>
          )}
          <CalendarEventList date={format(date, 'yyyy-MM-dd')} />
        </CardFooter>
      </Card>
      {planView && subThemes && subThemes.length > 0 && upsertDate && (
        <BatchUpsertModal
          planView={planView}
          subThemes={subThemes}
          open={upsertOpen}
          onOpenChange={setUpsertOpen}
          defaultDate={upsertDate}
          onSaved={() => setShowCurriculums(true)}
        />
      )}
    </div>
  );
}
