'use client';

import { useState } from 'react';

import { useRouter } from 'next/navigation';

import { createKid, updateKid } from '@/features/kid/actions';
import type { KidFormData } from '@/features/kid/schema';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface IKidFormProps {
  mode: 'create' | 'edit';
  initialData?: KidFormData & { id?: string };
  guardians: Array<{ id: string; name: string }>;
  terms: Array<{ id: string; name: string; isActive: boolean }>;
}

const STATUS_OPTIONS = [
  { value: 'waiting', label: 'Menunggu' },
  { value: 'enrolled', label: 'Terdaftar' },
  { value: 'alumni', label: 'Alumni' },
] as const;

export function KidForm({
  mode,
  initialData,
  guardians,
  terms,
}: IKidFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [selectedStatus, setSelectedStatus] = useState(
    initialData?.status ?? 'waiting'
  );
  const [selectedTermId, setSelectedTermId] = useState(
    initialData?.enrolledTermId ?? ''
  );
  const [selectedGuardianId, setSelectedGuardianId] = useState(
    initialData?.guardianId ?? ''
  );

  const isEdit = mode === 'edit';
  const activeTerms = terms.filter((t) => t.isActive);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setErrors({});

    const formData = new FormData(event.currentTarget);

    // Set status from our controlled state
    formData.set('status', selectedStatus);
    // Set guardian from our controlled state
    formData.set('guardianId', selectedGuardianId);
    if (!selectedGuardianId) {
      setErrors((prev) => ({
        ...prev,
        guardianId: 'Wali murid wajib dipilih',
      }));
      setIsSubmitting(false);
      return;
    }

    if (selectedStatus === 'enrolled' && selectedTermId) {
      formData.set('enrolledTermId', selectedTermId);
    } else {
      formData.delete('enrolledTermId');
    }

    try {
      const result = isEdit
        ? await updateKid(initialData!.id!, formData)
        : await createKid(formData);

      if (result.success) {
        toast.success(
          isEdit ? 'Murid berhasil diperbarui' : 'Murid berhasil dibuat'
        );
        router.push('/dashboard/owner/kid');
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
          Nama <span className="text-destructive">*</span>
        </Label>
        <Input
          id="name"
          name="name"
          defaultValue={initialData?.name ?? ''}
          placeholder="Nama lengkap murid"
          required
          aria-invalid={!!errors.name}
        />
        {errors.name && (
          <p className="text-xs text-destructive">{errors.name}</p>
        )}
      </div>

      {/* Tanggal Lahir */}
      <div className="space-y-2">
        <Label htmlFor="dob">
          Tanggal Lahir <span className="text-destructive">*</span>
        </Label>
        <Input
          id="dob"
          name="dob"
          type="date"
          defaultValue={initialData?.dob ?? ''}
          required
        />
      </div>

      {/* Wali Murid */}
      <div className="space-y-2">
        <Label htmlFor="guardianId-select">
          Wali Murid <span className="text-destructive">*</span>
        </Label>
        {guardians.length === 0 ? (
          <div className="rounded-md border border-warning/30 bg-warning/10 px-3 py-2 text-sm text-warning">
            Belum ada wali murid. Tambah wali murid terlebih dahulu.
          </div>
        ) : (
          <Select
            value={selectedGuardianId}
            onValueChange={(v: string | null) => {
              if (v) setSelectedGuardianId(v);
            }}
          >
            <SelectTrigger id="guardianId">
              <SelectValue placeholder="Pilih wali murid" />
            </SelectTrigger>
            <SelectContent>
              {guardians.map((g) => (
                <SelectItem key={g.id} value={g.id}>
                  {g.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Status */}
      <div className="space-y-2">
        <Label htmlFor="status-select">Status</Label>
        <Select
          value={selectedStatus}
          onValueChange={(v: string | null) => {
            if (v) {
              setSelectedStatus(v as 'waiting' | 'enrolled' | 'alumni');
              if (v !== 'enrolled') {
                setSelectedTermId('');
              }
            }
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Pilih status" />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Term enrolled (only visible if status is enrolled) */}
      {selectedStatus === 'enrolled' && (
        <div className="space-y-2">
          <Label htmlFor="enrolledTermId-select">Term Terdaftar</Label>
          {activeTerms.length === 0 ? (
            <div className="rounded-md border border-warning/20 bg-warning/10 px-3 py-2 text-sm text-warning">
              Belum ada term aktif. Aktifkan term terlebih dahulu.
            </div>
          ) : (
            <Select
              value={selectedTermId}
              onValueChange={(v: string | null) => v && setSelectedTermId(v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Pilih term" />
              </SelectTrigger>
              <SelectContent>
                {activeTerms.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
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
          {isSubmitting
            ? 'Menyimpan...'
            : isEdit
              ? 'Simpan Perubahan'
              : 'Tambah Murid'}
        </Button>
      </div>
    </form>
  );
}
