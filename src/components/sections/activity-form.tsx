'use client';

import { useState } from 'react';

import { useRouter } from 'next/navigation';

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

import { createActivity, updateActivity } from '@/lib/actions/activity';
import { getCategoryOptions } from '@/lib/activity-utils';

interface IActivityFormProps {
  mode: 'create' | 'edit';
  initialData?: {
    id?: string;
    name: string;
    category: string;
  };
}

export function ActivityForm({ mode, initialData }: IActivityFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [selectedCategory, setSelectedCategory] = useState<string>(
    initialData?.category ?? 'lainnya'
  );

  const isEdit = mode === 'edit';
  const categoryOptions = getCategoryOptions();

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setErrors({});

    const formData = new FormData(event.currentTarget);
    formData.set('category', selectedCategory);

    try {
      const result = isEdit
        ? await updateActivity(initialData!.id!, formData)
        : await createActivity(formData);

      if (result.success) {
        toast.success(
          isEdit ? 'Aktivitas berhasil diperbarui' : 'Aktivitas berhasil dibuat'
        );
        router.push('/dashboard/owner/activity');
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
          Nama Aktivitas <span className="text-destructive">*</span>
        </Label>
        <Input
          id="name"
          name="name"
          defaultValue={initialData?.name ?? ''}
          placeholder="Cth: Mewarnai"
          required
          aria-invalid={!!errors.name}
        />
        {errors.name && (
          <p className="text-xs text-destructive">{errors.name}</p>
        )}
      </div>

      {/* Kategori */}
      <div className="space-y-2">
        <Label htmlFor="category-select">Kategori</Label>
        <Select
          value={selectedCategory}
          onValueChange={(v: string | null) => v && setSelectedCategory(v)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Pilih kategori" />
          </SelectTrigger>
          <SelectContent>
            {categoryOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
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
              : 'Tambah Aktivitas'}
        </Button>
      </div>
    </form>
  );
}
