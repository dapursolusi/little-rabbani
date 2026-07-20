'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

import {
  createHoliday,
  deleteHoliday,
  getHolidays,
} from '@/features/holiday/actions';
import type { Holiday } from '@/features/holiday/types';
import { toast } from 'sonner';

import { Calendar } from '@/components/reui/calendar';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';

// ████████ Types ████████

interface IHolidayCalendarViewProps {
  termId: string;
}

// ████████ Helpers ████████

function formatDate(dateStr: string): string {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function holidaysForDate(date: Date, holidays: Holiday[]): Holiday[] {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return holidays.filter((h) => {
    const start = new Date(h.startDate + 'T00:00:00');
    const end = new Date(h.endDate + 'T00:00:00');
    return d >= start && d <= end;
  });
}

// █████████ Add-holiday dialog █████████

function AddHolidayDialog({
  open,
  onOpenChange,
  termId,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  termId: string;
  onSuccess: () => void;
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [scope, setScope] = useState('custom');

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSubmitting(true);
    setErrors({});

    const form = new FormData(e.currentTarget);
    const input: Record<string, unknown> = {
      termId,
      reason: form.get('reason') as string,
      startDate: form.get('startDate') as string,
      endDate: form.get('endDate') as string,
      scope,
    };

    try {
      const result = await createHoliday(input);
      if (result.success) {
        toast.success('Hari libur berhasil ditambahkan');
        onOpenChange(false);
        onSuccess();
      } else {
        setErrors({ form: result.error });
        toast.error(result.error);
      }
    } catch {
      toast.error('Terjadi kesalahan sistem');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Tambah Hari Libur</DialogTitle>
            <DialogDescription>
              Masukkan informasi hari libur baru.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {errors.form && (
              <p className="rounded-md bg-destructive/10 p-2 text-sm text-destructive">
                {errors.form}
              </p>
            )}

            {/* Reason */}
            <div className="space-y-2">
              <Label htmlFor="reason">
                Alasan Libur <span className="text-destructive">*</span>
              </Label>
              <Input
                id="reason"
                name="reason"
                placeholder="Cth: Libur Nasional"
                required
              />
            </div>

            {/* Start date */}
            <div className="space-y-2">
              <Label htmlFor="startDate">
                Tanggal Mulai <span className="text-destructive">*</span>
              </Label>
              <Input id="startDate" name="startDate" type="date" required />
            </div>

            {/* End date */}
            <div className="space-y-2">
              <Label htmlFor="endDate">
                Tanggal Selesai <span className="text-destructive">*</span>
              </Label>
              <Input id="endDate" name="endDate" type="date" required />
            </div>

            {/* Scope */}
            <div className="space-y-2">
              <Label htmlFor="scope">
                Cakupan <span className="text-destructive">*</span>
              </Label>
              <Select
                value={scope}
                onValueChange={(v: string | null) => v !== null && setScope(v)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Pilih cakupan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="national">Nasional</SelectItem>
                  <SelectItem value="custom">Kustom</SelectItem>
                  <SelectItem value="term">Term</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Batal
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Menyimpan...' : 'Tambah Libur'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// █████████ Holiday list dialog █████████

function HolidayListDialog({
  open,
  onOpenChange,
  holidays,
  onDelete,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  holidays: Holiday[];
  onDelete: (id: string) => void;
}) {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      const result = await deleteHoliday(id);
      if (result.success) {
        toast.success('Hari libur berhasil dihapus');
        onDelete(id);
      } else {
        toast.error(result.error);
      }
    } catch {
      toast.error('Terjadi kesalahan sistem');
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Hari Libur</DialogTitle>
          <DialogDescription>
            {holidays.length === 0
              ? 'Tidak ada hari libur pada tanggal ini'
              : `${holidays.length} hari libur pada tanggal ini`}
          </DialogDescription>
        </DialogHeader>
        <div className="max-h-64 space-y-3 overflow-y-auto py-2">
          {holidays.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Tidak ada libur
            </p>
          ) : (
            holidays.map((h) => (
              <div
                key={h.id}
                className="flex items-start justify-between gap-2 rounded-lg border p-3"
              >
                <div className="min-w-0 flex-1 space-y-1">
                  <p className="text-sm font-medium">{h.reason}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(h.startDate)}
                    {h.startDate !== h.endDate && ` — ${formatDate(h.endDate)}`}
                  </p>
                  <span className="inline-block rounded-full bg-muted px-2 py-0.5 text-[10px] uppercase text-muted-foreground">
                    {h.scope === 'national'
                      ? 'Nasional'
                      : h.scope === 'custom'
                        ? 'Kustom'
                        : 'Term'}
                  </span>
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDelete(h.id)}
                  disabled={deletingId === h.id}
                >
                  {deletingId === h.id ? '...' : 'Hapus'}
                </Button>
              </div>
            ))
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Tutup
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// █████████ Main component █████████

export function HolidayCalendarView({ termId }: IHolidayCalendarViewProps) {
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showListDialog, setShowListDialog] = useState(false);

  // ── Fetch ──

  const fetchRef = useRef(() => {});

  useEffect(() => {
    fetchRef.current = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await getHolidays(termId);
        if (result.success) {
          setHolidays(result.data);
        } else {
          setError(result.error);
        }
      } catch {
        setError('Gagal memuat data libur');
      } finally {
        setIsLoading(false);
      }
    };

    fetchRef.current();
  }, [termId]);

  // ── Handlers ──

  function handleDayClick(date: Date) {
    const matching = holidaysForDate(date, holidays);
    if (matching.length > 0) {
      setSelectedDate(date);
      setShowListDialog(true);
    }
  }

  // ── Calendar modifiers ──

  const today = useMemo(() => new Date(new Date().toDateString()), []);
  const holidayDateSet = useMemo(() => {
    const set = new Set<string>();
    for (const h of holidays) {
      const start = new Date(h.startDate + 'T00:00:00');
      const end = new Date(h.endDate + 'T00:00:00');
      const cur = new Date(start);
      while (cur <= end) {
        set.add(cur.toDateString());
        cur.setDate(cur.getDate() + 1);
      }
    }
    return set;
  }, [holidays]);

  const modifiers = {
    greyedPast: (date: Date) => date < today,
    hasHoliday: (date: Date) => holidayDateSet.has(date.toDateString()),
  } satisfies Record<string, (date: Date) => boolean>;

  const modifiersClassNames = {
    greyedPast: 'text-muted-foreground opacity-50 pointer-events-none',
    hasHoliday:
      'relative after:absolute after:bottom-[2px] after:left-1/2 after:-translate-x-1/2 after:h-1.5 after:w-1.5 after:rounded-full after:bg-warning after:content-[""]',
  };

  // ── Loading state ──

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-9 w-36" />
        <Skeleton className="h-[300px] w-full" />
      </div>
    );
  }

  // ── Error state ──

  if (error) {
    return (
      <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4 text-center">
        <p className="text-sm text-destructive">{error}</p>
        <Button
          variant="outline"
          size="sm"
          className="mt-2"
          onClick={() => void fetchRef.current()}
        >
          Coba Lagi
        </Button>
      </div>
    );
  }

  // ── Render ──

  const selectedHolidays =
    selectedDate != null ? holidaysForDate(selectedDate, holidays) : [];

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {holidays.length > 0
            ? `${holidays.length} hari libur tercatat`
            : 'Belum ada hari libur'}
        </p>
      </div>

      {/* Calendar */}
      <div className="flex justify-center">
        <Calendar
          mode="single"
          modifiers={modifiers}
          modifiersClassNames={modifiersClassNames}
          onDayClick={(date: Date) => handleDayClick(date)}
          className="rounded-lg border bg-card p-2"
        />
      </div>

      {/* Add dialog */}
      <AddHolidayDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        termId={termId}
        onSuccess={() => void fetchRef.current()}
      />

      {/* Holiday list dialog */}
      <HolidayListDialog
        open={showListDialog}
        onOpenChange={setShowListDialog}
        holidays={selectedHolidays}
        onDelete={() => void fetchRef.current()}
      />
    </div>
  );
}
