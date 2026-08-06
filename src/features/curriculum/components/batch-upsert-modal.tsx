'use client';

import * as React from 'react';

import { useRouter } from 'next/navigation';

import { SubTheme } from '@/features/theme/types';
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

import { formatDateShort } from '@/lib/format';
import { cn } from '@/lib/utils';

import { BatchUpsertRow, batchUpsert } from '../actions';
import { findCoveringTerm } from '../gate';
import { type CurriculumPlanView } from '../plan-view';

type Preset = '1w' | '2w' | '1m' | 'term';

const PRESETS: Array<{ value: Preset; label: string }> = [
  { value: '1w', label: '1 Minggu' },
  { value: '2w', label: '2 Minggu' },
  { value: '1m', label: '1 Bulan' },
  { value: 'term', label: 'Sisa Term' },
];

const PRESET_DAYS: Record<'1w' | '2w' | '1m', number> = {
  '1w': 7,
  '2w': 14,
  '1m': 30,
};

interface BatchRow {
  key: string;
  id?: string;
  sortOrder: number;
  date: string;
  subThemeId: string;
  name: string;
  objective: string;
  indoor: boolean;
  itemsToBring: string;
}

interface BatchUpsertModalProps {
  planView: CurriculumPlanView;
  subThemes: SubTheme[];
  open: boolean;
  onOpenChange: (v: boolean) => void;
  defaultDate: string;
  onSaved?: () => void;
}

function toIso(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function generateKey() {
  return Math.random().toString(36).slice(2, 9);
}

function presetEndDate(
  planView: CurriculumPlanView,
  defaultDate: string,
  preset: Preset
): Date | null {
  const anchor = new Date(defaultDate + 'T00:00:00');
  const coveringId = findCoveringTerm(planView.terms, defaultDate)?.id;
  const coveringTerm = coveringId
    ? planView.terms.find((t) => t.id === coveringId)
    : undefined;
  const termEnd = coveringTerm
    ? new Date(coveringTerm.endDate + 'T00:00:00')
    : null;

  if (preset === 'term') {
    return termEnd;
  }

  // Clamp window to covering term end so candidate dates never leak into the
  // next term. Next-term dates would reuse sortOrder numbers and batchUpsert
  // would misclassify blanks as updates of current-term items.
  const presetEnd = new Date(anchor);
  presetEnd.setDate(anchor.getDate() + PRESET_DAYS[preset]);
  if (termEnd && presetEnd > termEnd) return termEnd;
  return presetEnd;
}

/**
 * 1-based workday position → 0-based sortOrder. planView.positions is the
 * workday number (1, 2, 3…); curriculum sortOrder is 0-based everywhere else
 * (create starts at 0, reorder treats 0 as first). A 1-based sortOrder would
 * make batchUpsert's existingBySort matching silently overwrite the *next*
 * workday's item. Exported for test.
 */
export function positionToSortOrder(position: number): number {
  return position - 1;
}

function rowFromDay(planView: CurriculumPlanView, iso: string): BatchRow {
  const seed = planView.items[iso];
  return {
    key: generateKey(),
    id: seed?.id,
    sortOrder: positionToSortOrder(planView.positions[iso]),
    date: iso,
    subThemeId: seed?.subThemeId ?? '',
    name: seed?.name ?? '',
    objective: seed?.objective ?? '',
    indoor: seed?.indoor ?? false,
    itemsToBring: seed?.itemsToBring ?? '',
  };
}

function seedRows(
  planView: CurriculumPlanView,
  defaultDate: string,
  preset: Preset
): BatchRow[] {
  const end = presetEndDate(planView, defaultDate, preset);
  if (!end) return [];

  const rows: BatchRow[] = [];
  for (
    let d = new Date(defaultDate + 'T00:00:00');
    d <= end;
    d.setDate(d.getDate() + 1)
  ) {
    const iso = toIso(d);
    if (planView.positions[iso] == null) continue;
    rows.push(rowFromDay(planView, iso));
  }
  return rows;
}

export function BatchUpsertModal({
  planView,
  subThemes,
  open,
  onOpenChange,
  defaultDate,
  onSaved,
}: BatchUpsertModalProps) {
  const router = useRouter();
  const [preset, setPreset] = React.useState<Preset>('1w');
  const [rows, setRows] = React.useState<BatchRow[]>(() =>
    seedRows(planView, defaultDate, '1w')
  );
  const [showDiff, setShowDiff] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);

  // base-ui controlled Dialog fires onOpenChange only for user-initiated
  // close or imperative setOpen — never for a programmatic change to the
  // `open` prop. So reseed via effect keyed on [open, defaultDate]: fires on
  // first open and on reopen with a new defaultDate whether the caller
  // remounts or keeps the modal mounted. Resets to fresh state each open.
  React.useEffect(() => {
    if (!open) return;
    // Reseed on open is the only way to catch programmatic controlled opens
    // (base-ui bypasses onOpenChange for prop-driven opens). The cascading
    // render risk is nil: state only changes when open flips, never per-render.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPreset('1w');
    setRows(seedRows(planView, defaultDate, '1w'));
    setShowDiff(false);
    setSubmitting(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- deliberate: reseed on open, planView/preset intentionally excluded
  }, [open, defaultDate]);

  function handleOpenChange(v: boolean | ((prev: boolean) => boolean)) {
    if (typeof v === 'boolean') onOpenChange(v);
  }

  // Stable under React Compiler: derived from defaultDate, not a mutable handle.
  const termId = React.useMemo(
    () => findCoveringTerm(planView.terms, defaultDate)?.id ?? null,
    [planView.terms, defaultDate]
  );

  function changePreset(next: Preset) {
    setPreset(next);
    setRows(seedRows(planView, defaultDate, next));
  }

  function updateRow(key: string, partial: Partial<BatchRow>) {
    setRows((prev) =>
      prev.map((r) => (r.key === key ? { ...r, ...partial } : r))
    );
  }

  function isTouched(row: BatchRow): boolean {
    const seed = planView.items[row.date];
    if (!seed) return row.subThemeId.trim() !== '' || row.name.trim() !== '';
    return (
      row.subThemeId !== seed.subThemeId ||
      row.name.trim() !== seed.name ||
      row.objective.trim() !== (seed.objective ?? '') ||
      row.indoor !== seed.indoor ||
      row.itemsToBring.trim() !== (seed.itemsToBring ?? '')
    );
  }

  function hasContent(row: BatchRow): boolean {
    return Boolean(row.subThemeId) && Boolean(row.name.trim());
  }

  const validRows = rows.filter(hasContent);
  const inserts = validRows.filter((r) => !r.id);
  const updates = validRows.filter((r) => r.id && isTouched(r));
  const hasChanges = inserts.length > 0 || updates.length > 0;

  function openDiff() {
    if (!termId) {
      toast.error('Tidak dapat menentukan term untuk tanggal ini');
      return;
    }
    if (!hasChanges) {
      toast.error('Tidak ada perubahan yang perlu disimpan');
      return;
    }
    setShowDiff(true);
  }

  async function handleSave() {
    if (submitting) return;
    if (!termId) {
      toast.error('Tidak dapat menentukan term untuk tanggal ini');
      return;
    }
    setSubmitting(true);
    try {
      // Save only what the diff lists — inserts + touched updates — so
      // untouched filled rows don't churn updatedAt or inflate the count.
      const payload: BatchUpsertRow[] = [...inserts, ...updates].map((r) => ({
        id: r.id,
        sortOrder: r.sortOrder,
        subThemeId: r.subThemeId,
        name: r.name.trim(),
        objective: r.objective.trim() || undefined,
        indoor: r.indoor ? 'true' : 'false',
        itemsToBring: r.itemsToBring.trim() || undefined,
      }));

      const result = await batchUpsert(termId, payload);
      if (result.success) {
        toast.success(
          `Kurikulum disimpan: ${result.data.inserted} baru, ${result.data.updated} diperbarui`
        );
        setShowDiff(false);
        onOpenChange(false);
        // Reveal what was just saved: the calendar overlay is opt-in
        // (Kurikulum toggle) — flip it on so filled days are visible.
        onSaved?.();
        router.refresh();
      } else {
        toast.error(result.error);
      }
    } catch {
      toast.error('Gagal menyimpan kurikulum');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <Modal
        title="Isi Massal Kurikulum"
        open={open}
        onOpenChange={handleOpenChange}
        content={
          <div className="space-y-4">
            <div className="flex gap-1 rounded-lg bg-muted p-1">
              {PRESETS.map((p) => (
                <Button
                  key={p.value}
                  variant="ghost"
                  size="sm"
                  onClick={() => changePreset(p.value)}
                  className={cn(
                    'flex-1',
                    preset === p.value &&
                      'bg-background text-foreground shadow-sm'
                  )}
                >
                  {p.label}
                </Button>
              ))}
            </div>

            <div className="max-h-[70vh] space-y-4 overflow-y-auto">
              {rows.map((row) => (
                <div key={row.key} className="space-y-2 rounded-lg border p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">
                      Hari {row.sortOrder + 1} · {formatDateShort(row.date)}
                      {row.id ? ' (ada)' : ' (baru)'}
                    </span>
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
                            {st.theme
                              ? `${st.theme.name} — ${st.name}`
                              : st.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium">
                      Nama Aktivitas
                    </label>
                    <Input
                      value={row.name}
                      onChange={(e) =>
                        updateRow(row.key, { name: e.target.value })
                      }
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
            </div>

            <DialogFooter>
              <DialogClose render={<Button variant="outline">Batal</Button>} />
              <Button onClick={openDiff} disabled={!hasChanges}>
                Lanjutkan
              </Button>
            </DialogFooter>
          </div>
        }
      />

      <Modal
        title="Konfirmasi Perubahan"
        open={showDiff}
        onOpenChange={setShowDiff}
        content={
          <div className="space-y-4">
            {inserts.length > 0 && (
              <div className="space-y-1">
                <p className="text-sm font-medium">Baru ({inserts.length})</p>
                <ul className="space-y-1 text-sm">
                  {inserts.map((r) => (
                    <li key={r.key}>
                      {formatDateShort(r.date)} — {r.name}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {updates.length > 0 && (
              <div className="space-y-1">
                <p className="text-sm font-medium">
                  Diperbarui ({updates.length})
                </p>
                <ul className="space-y-1 text-sm">
                  {updates.map((r) => (
                    <li key={r.key}>
                      {formatDateShort(r.date)} — {r.name}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <DialogFooter>
              <DialogClose
                render={
                  <Button variant="outline" onClick={() => setShowDiff(false)}>
                    Batal
                  </Button>
                }
              />
              <Button onClick={handleSave} disabled={submitting}>
                {submitting ? 'Menyimpan…' : 'Simpan'}
              </Button>
            </DialogFooter>
          </div>
        }
      />
    </>
  );
}
