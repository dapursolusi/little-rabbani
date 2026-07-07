'use client';

import { useState } from 'react';

import { useRouter } from 'next/navigation';

import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

import { updateSession } from '@/lib/actions/term';

interface ISessionEditFormProps {
  initialData: {
    id: string;
    termId: string;
    date: string;
    startTime: string;
    endTime: string;
    label: string;
    isHoliday: boolean;
    holidayReason: string;
  };
}

export function SessionEditForm({ initialData }: ISessionEditFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isHoliday, setIsHoliday] = useState(initialData.isHoliday);
  const [errors, setErrors] = useState<Record<string, string>>({});

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setErrors({});

    const formData = new FormData(event.currentTarget);
    formData.set('termId', initialData.termId);
    formData.set('isHoliday', isHoliday ? 'true' : 'false');
    if (!isHoliday) {
      formData.delete('holidayReason');
    }

    try {
      const result = await updateSession(initialData.id, formData);
      if (result.success) {
        toast.success('Sesi berhasil diperbarui');
        router.push(`/dashboard/owner/session?termId=${initialData.termId}`);
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
      {/* Tanggal */}
      <div className="space-y-2">
        <Label htmlFor="date">
          Tanggal <span className="text-destructive">*</span>
        </Label>
        <Input
          id="date"
          name="date"
          type="date"
          defaultValue={initialData.date}
          required
          aria-invalid={!!errors.date}
        />
      </div>

      {/* Jam Mulai */}
      <div className="space-y-2">
        <Label htmlFor="startTime">
          Jam Mulai <span className="text-destructive">*</span>
        </Label>
        <Input
          id="startTime"
          name="startTime"
          type="time"
          defaultValue={initialData.startTime}
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
          name="endTime"
          type="time"
          defaultValue={initialData.endTime}
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
          name="label"
          defaultValue={initialData.label}
          required
          aria-invalid={!!errors.label}
        />
      </div>

      {/* Hari Libur Toggle */}
      <div className="flex items-center gap-2">
        <input
          id="isHoliday"
          name="isHoliday"
          type="checkbox"
          checked={isHoliday}
          onChange={(e) => setIsHoliday(e.target.checked)}
          className="h-4 w-4 rounded border-zinc-300"
        />
        <Label htmlFor="isHoliday">Tandai sebagai hari libur</Label>
      </div>

      {isHoliday && (
        <div className="space-y-2">
          <Label htmlFor="holidayReason">Alasan Libur</Label>
          <Textarea
            id="holidayReason"
            name="holidayReason"
            defaultValue={initialData.holidayReason}
            placeholder="Cth: Hari Libur Nasional"
          />
        </div>
      )}

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
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Menyimpan...' : 'Simpan Perubahan'}
        </Button>
      </div>
    </form>
  );
}
