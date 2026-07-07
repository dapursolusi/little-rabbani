'use client';

import { useState } from 'react';

import { useRouter } from 'next/navigation';

import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import { createGuardian, updateGuardian } from '@/lib/actions/guardian';
import type { GuardianFormData } from '@/lib/actions/guardian';

interface IGuardianFormProps {
  mode: 'create' | 'edit';
  initialData?: GuardianFormData & { id?: string };
}

export function GuardianForm({ mode, initialData }: IGuardianFormProps) {
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
        ? await updateGuardian(initialData!.id!, formData)
        : await createGuardian(formData);

      if (result.success) {
        toast.success(
          isEdit
            ? 'Wali murid berhasil diperbarui'
            : 'Wali murid berhasil dibuat'
        );
        router.push('/dashboard/owner/guardian');
        router.refresh();
      } else {
        toast.error(result.error);
        if (result.error.includes('Nama') || result.error.includes('nama')) {
          setErrors((prev) => ({ ...prev, name: result.error }));
        } else if (
          result.error.includes('Telepon') ||
          result.error.includes('telepon')
        ) {
          setErrors((prev) => ({ ...prev, phone: result.error }));
        }
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
          Nama <span className="text-destructive">*</span>
        </Label>
        <Input
          id="name"
          name="name"
          defaultValue={initialData?.name ?? ''}
          placeholder="Nama lengkap wali murid"
          required
          aria-invalid={!!errors.name}
        />
        {errors.name && (
          <p className="text-xs text-destructive">{errors.name}</p>
        )}
      </div>

      {/* Nomor Telepon */}
      <div className="space-y-2">
        <Label htmlFor="phone">
          Nomor Telepon <span className="text-destructive">*</span>
        </Label>
        <Input
          id="phone"
          name="phone"
          defaultValue={initialData?.phone ?? ''}
          placeholder="08123456789"
          required
          aria-invalid={!!errors.phone}
        />
        {errors.phone && (
          <p className="text-xs text-destructive">{errors.phone}</p>
        )}
      </div>

      {/* Email */}
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          defaultValue={initialData?.email ?? ''}
          placeholder="email@contoh.com"
        />
      </div>

      {/* Kontak Kedua - Nama */}
      <div className="space-y-2">
        <Label htmlFor="secondContactName">Nama Kontak Kedua</Label>
        <Input
          id="secondContactName"
          name="secondContactName"
          defaultValue={initialData?.secondContactName ?? ''}
          placeholder="Nama kontak darurat"
        />
      </div>

      {/* Kontak Kedua - Telepon */}
      <div className="space-y-2">
        <Label htmlFor="secondContactPhone">Nomor Telepon Kontak Kedua</Label>
        <Input
          id="secondContactPhone"
          name="secondContactPhone"
          defaultValue={initialData?.secondContactPhone ?? ''}
          placeholder="08123456789"
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
              : 'Tambah Wali Murid'}
        </Button>
      </div>
    </form>
  );
}
