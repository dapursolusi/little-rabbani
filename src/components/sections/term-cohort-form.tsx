'use client';

import { useState } from 'react';

import { useRouter } from 'next/navigation';

import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

import { bulkEnrollKids } from '@/lib/actions/term';

interface IWaitingKid {
  id: string;
  name: string;
  guardian: { name: string } | null;
}

interface ITermCohortFormProps {
  termId: string;
  termName: string;
  termIsActive: boolean;
  waitingKids: IWaitingKid[];
}

export function TermCohortForm({
  termId,
  termName,
  termIsActive,
  waitingKids,
}: ITermCohortFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  function toggleKid(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function toggleAll() {
    if (selectedIds.size === waitingKids.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(waitingKids.map((k) => k.id)));
    }
  }

  async function handleEnroll() {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) {
      toast.error('Pilih murid terlebih dahulu');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await bulkEnrollKids(termId, ids);
      if (result.success) {
        toast.success(`${result.data.count} murid berhasil didaftarkan`);
        setSelectedIds(new Set());
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

  if (!termIsActive) {
    return (
      <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-6 text-center text-sm text-amber-700">
        Term &ldquo;{termName}&rdquo; belum aktif. Aktifkan term terlebih dahulu
        untuk mendaftarkan murid.
      </div>
    );
  }

  if (waitingKids.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-zinc-300 bg-zinc-50 py-16">
        <p className="text-zinc-500">Tidak ada murid dalam daftar tunggu</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Checkbox
            id="select-all"
            checked={selectedIds.size === waitingKids.length}
            onCheckedChange={toggleAll}
          />
          <Label htmlFor="select-all" className="text-sm font-medium">
            Pilih Semua ({waitingKids.length} murid)
          </Label>
        </div>
        <Button
          size="sm"
          onClick={handleEnroll}
          disabled={isSubmitting || selectedIds.size === 0}
        >
          {isSubmitting ? 'Mendaftarkan...' : `Daftarkan (${selectedIds.size})`}
        </Button>
      </div>

      <div className="divide-y rounded-lg border border-zinc-200">
        {waitingKids.map((kid) => (
          <label
            key={kid.id}
            className="flex cursor-pointer items-center gap-3 px-4 py-3 hover:bg-zinc-50"
          >
            <Checkbox
              checked={selectedIds.has(kid.id)}
              onCheckedChange={() => toggleKid(kid.id)}
            />
            <div>
              <p className="text-sm font-medium text-zinc-900">{kid.name}</p>
              {kid.guardian && (
                <p className="text-xs text-zinc-500">
                  Wali: {kid.guardian.name}
                </p>
              )}
            </div>
          </label>
        ))}
      </div>
    </div>
  );
}
