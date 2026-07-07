'use client';

import { useState } from 'react';

import { useRouter } from 'next/navigation';

import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import { createTerm, updateTerm } from '@/lib/actions/term';
import type { TermFormData } from '@/lib/actions/term';

interface ITermFormProps {
  mode: 'create' | 'edit';
  initialData?: TermFormData & { id?: string };
}

export function TermForm({ mode, initialData }: ITermFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isEdit = mode === 'edit';

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setErrors({});

    const formData = new FormData(event.currentTarget);

    try {
      const result = isEdit
        ? await updateTerm(initialData!.id!, formData)
        : await createTerm(formData);

      if (result.success) {
        toast.success(
          isEdit ? 'Term berhasil diperbarui' : 'Term berhasil dibuat'
        );
        router.push('/dashboard/owner/term');
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
      {/* Nama */}
      <div className="space-y-2">
        <Label htmlFor="name">
          Nama Term <span className="text-destructive">*</span>
        </Label>
        <Input
          id="name"
          name="name"
          defaultValue={initialData?.name ?? ''}
          placeholder="Cth: Semester 1 2025"
          required
          aria-invalid={!!errors.name}
        />
        {errors.name && (
          <p className="text-xs text-destructive">{errors.name}</p>
        )}
      </div>

      {/* Tanggal Mulai */}
      <div className="space-y-2">
        <Label htmlFor="startDate">
          Tanggal Mulai <span className="text-destructive">*</span>
        </Label>
        <Input
          id="startDate"
          name="startDate"
          type="date"
          defaultValue={initialData?.startDate ?? ''}
          required
        />
      </div>

      {/* Tanggal Selesai */}
      <div className="space-y-2">
        <Label htmlFor="endDate">
          Tanggal Selesai <span className="text-destructive">*</span>
        </Label>
        <Input
          id="endDate"
          name="endDate"
          type="date"
          defaultValue={initialData?.endDate ?? ''}
          required
        />
      </div>

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
          {isSubmitting
            ? 'Menyimpan...'
            : isEdit
              ? 'Simpan Perubahan'
              : 'Tambah Term'}
        </Button>
      </div>
    </form>
  );
}
