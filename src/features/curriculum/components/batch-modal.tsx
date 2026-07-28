'use client';

import * as React from 'react';

import { useRouter } from 'next/navigation';

import { SubTheme } from '@/features/theme/types';
import { Add02Icon, Delete02Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { toast } from 'sonner';

import { Modal } from '@/components/shared/modal';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { DialogClose, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

import { createCurriculumItems } from '../actions';

interface BatchRow {
  key: string;
  subThemeId: string;
  name: string;
  objective: string;
  indoor: boolean;
  itemsToBring: string;
}

interface BatchModalProps {
  termId: string;
  subThemes: SubTheme[];
  nextSortOrder: number;
}

function generateKey() {
  return Math.random().toString(36).slice(2, 9);
}

export function BatchModal({
  termId,
  subThemes,
  nextSortOrder,
}: BatchModalProps) {
  const router = useRouter();
  const [rows, setRows] = React.useState<BatchRow[]>([
    {
      key: generateKey(),
      subThemeId: '',
      name: '',
      objective: '',
      indoor: false,
      itemsToBring: '',
    },
  ]);

  function addRow() {
    setRows((prev) => [
      ...prev,
      {
        key: generateKey(),
        subThemeId: '',
        name: '',
        objective: '',
        indoor: false,
        itemsToBring: '',
      },
    ]);
  }

  function removeRow(key: string) {
    setRows((prev) => prev.filter((r) => r.key !== key));
  }

  function updateRow(key: string, partial: Partial<BatchRow>) {
    setRows((prev) =>
      prev.map((r) => (r.key === key ? { ...r, ...partial } : r))
    );
  }

  async function handleSubmit() {
    const valid = rows.filter((r) => r.subThemeId && r.name.trim());
    if (valid.length === 0) {
      toast.error('Isi minimal satu baris dengan sub tema dan nama aktivitas');
      return;
    }

    const inputs = valid.map((r, i) => ({
      termId,
      sortOrder: nextSortOrder + i,
      subThemeId: r.subThemeId,
      name: r.name.trim(),
      objective: r.objective.trim() || null,
      indoor: r.indoor,
      itemsToBring: r.itemsToBring.trim() || null,
    }));

    const result = await createCurriculumItems(inputs);
    if (result.success) {
      toast.success(
        `${result.data.length} item kurikulum berhasil ditambahkan`
      );
      router.refresh();
    } else {
      toast.error(result.error);
    }
  }

  return (
    <Modal
      title="Tambah Massal Kurikulum"
      trigger={{
        icon: Add02Icon,
        text: 'Tambah Massal',
      }}
      content={
        <div className="space-y-4">
          {/* ponytail: simple controlled rows, no react-hook-form for batch */}
          {rows.map((row) => (
            <div key={row.key} className="space-y-2 rounded-lg border p-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">
                  Baris {rows.indexOf(row) + 1}
                </span>
                {rows.length > 1 && (
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => removeRow(row.key)}
                  >
                    <HugeiconsIcon icon={Delete02Icon} className="h-4 w-4" />
                  </Button>
                )}
              </div>

              <div>
                <label className="text-sm font-medium">Sub Tema</label>
                <Select
                  value={row.subThemeId}
                  onValueChange={(v) =>
                    updateRow(row.key, { subThemeId: v ?? '' })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih sub tema" />
                  </SelectTrigger>
                  <SelectContent>
                    {subThemes.map((st) => (
                      <SelectItem key={st.id} value={st.id}>
                        {st.theme ? `${st.theme.name} — ${st.name}` : st.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium">Nama Aktivitas</label>
                <Input
                  value={row.name}
                  onChange={(e) => updateRow(row.key, { name: e.target.value })}
                  placeholder="Nama aktivitas"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Tujuan</label>
                <Textarea
                  value={row.objective}
                  onChange={(e) =>
                    updateRow(row.key, { objective: e.target.value })
                  }
                  placeholder="Tujuan pembelajaran"
                />
              </div>

              <div className="flex items-center gap-2">
                <Checkbox
                  checked={row.indoor}
                  onCheckedChange={(v) =>
                    updateRow(row.key, { indoor: v === true })
                  }
                  id={`indoor-${row.key}`}
                />
                <label htmlFor={`indoor-${row.key}`} className="text-sm">
                  Indoor
                </label>
              </div>

              <div>
                <label className="text-sm font-medium">Perlengkapan</label>
                <Textarea
                  value={row.itemsToBring}
                  onChange={(e) =>
                    updateRow(row.key, { itemsToBring: e.target.value })
                  }
                  placeholder="Perlengkapan yang perlu dibawa"
                />
              </div>
            </div>
          ))}

          <Button variant="outline" onClick={addRow} className="w-full">
            + Tambah Baris
          </Button>

          <DialogFooter>
            <DialogClose render={<Button variant="outline">Batal</Button>} />
            <Button onClick={handleSubmit}>Simpan Semua</Button>
          </DialogFooter>
        </div>
      }
    />
  );
}
