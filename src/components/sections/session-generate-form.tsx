'use client';

import { useState } from 'react';

import { useRouter } from 'next/navigation';

import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import { generateRecurringSessions } from '@/lib/actions/term';

const DAYS = [
  { value: 'monday', label: 'Senin' },
  { value: 'tuesday', label: 'Selasa' },
  { value: 'wednesday', label: 'Rabu' },
  { value: 'thursday', label: 'Kamis' },
  { value: 'friday', label: "Jum'at" },
  { value: 'saturday', label: 'Sabtu' },
  { value: 'sunday', label: 'Minggu' },
];

interface ISessionGenerateFormProps {
  termId: string;
  startDate: string;
  endDate: string;
}

export function SessionGenerateForm({
  termId,
  startDate,
  endDate,
}: ISessionGenerateFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('10:00');
  const [label, setLabel] = useState('Kelas Reguler');

  function toggleDay(day: string) {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (selectedDays.length === 0) {
      toast.error('Pilih minimal satu hari');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await generateRecurringSessions(termId, {
        daysOfWeek: selectedDays,
        startTime,
        endTime,
        label,
      });

      if (result.success) {
        toast.success(`${result.data.count} sesi berhasil dibuat`);
        router.push(`/dashboard/owner/session?termId=${termId}`);
        router.refresh();
      } else {
        toast.error(result.error);
      }
    } catch {
      toast.error('Terjadi kesalahan sistem');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Hari */}
      <div className="space-y-2">
        <Label>
          Hari <span className="text-destructive">*</span>
        </Label>
        <div className="flex flex-wrap gap-2">
          {DAYS.map((day) => (
            <button
              key={day.value}
              type="button"
              onClick={() => toggleDay(day.value)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                selectedDays.includes(day.value)
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
              }`}
            >
              {day.label}
            </button>
          ))}
        </div>
      </div>

      {/* Jam Mulai */}
      <div className="space-y-2">
        <Label htmlFor="startTime">
          Jam Mulai <span className="text-destructive">*</span>
        </Label>
        <Input
          id="startTime"
          type="time"
          value={startTime}
          onChange={(e) => setStartTime(e.target.value)}
          required
        />
      </div>

      {/* Jam Selesai */}
      <div className="space-y-2">
        <Label htmlFor="endTime">
          Jam Selesai <span className="text-destructive">*</span>
        </Label>
        <Input
          id="endTime"
          type="time"
          value={endTime}
          onChange={(e) => setEndTime(e.target.value)}
          required
        />
      </div>

      {/* Label */}
      <div className="space-y-2">
        <Label htmlFor="label">
          Label <span className="text-destructive">*</span>
        </Label>
        <Input
          id="label"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="Cth: Kelas Reguler"
          required
        />
      </div>

      <p className="text-xs text-zinc-500">
        Rentang tanggal: {startDate} — {endDate}
      </p>

      {/* Tombol Aksi */}
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isSubmitting}
        >
          Batal
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting || selectedDays.length === 0}
        >
          {isSubmitting ? 'Membuat...' : 'Generate Sesi'}
        </Button>
      </div>
    </form>
  );
}
