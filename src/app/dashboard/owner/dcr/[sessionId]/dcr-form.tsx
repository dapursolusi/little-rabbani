'use client';

import { useCallback, useState } from 'react';

import { useRouter } from 'next/navigation';

import { Delete04Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
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
import { Textarea } from '@/components/ui/textarea';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

import { createActivityFromUnplanned, saveDcr } from '@/lib/actions/dcr';

interface IDcrActivity {
  id: string;
  activityId: string | null;
  activityName: string;
  activityNameOther: string | null;
  deviation: 'done' | 'skipped' | 'modified';
  wasPlanned: boolean;
}

interface IDcrFormProps {
  sessionId: string;
  initialActivities: IDcrActivity[];
  existingDcrId: string | null;
  learningNotes: string;
  isEditing: boolean;
}

const DEVIATION_OPTIONS: Array<{
  value: IDcrActivity['deviation'];
  label: string;
}> = [
  { value: 'done', label: 'Done' },
  { value: 'skipped', label: 'Skipped' },
  { value: 'modified', label: 'Modified' },
];

export function DcrForm({
  sessionId,
  initialActivities,
  learningNotes: initialNotes,
  isEditing,
}: IDcrFormProps) {
  const router = useRouter();
  const [activities, setActivities] =
    useState<IDcrActivity[]>(initialActivities);
  const [learningNotes, setLearningNotes] = useState(initialNotes);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showAddUnplanned, setShowAddUnplanned] = useState(false);
  const [unplannedName, setUnplannedName] = useState('');
  const [showCatalogPrompt, setShowCatalogPrompt] = useState<{
    name: string;
  } | null>(null);
  const [isAddingToCatalog, setIsAddingToCatalog] = useState(false);
  const [showCreateSuccess, setShowCreateSuccess] = useState(false);

  // Handle deviation change for an activity
  const handleDeviationChange = useCallback(
    (activityId: string, newDeviation: IDcrActivity['deviation']) => {
      setActivities((prev) =>
        prev.map((a) =>
          a.id === activityId ? { ...a, deviation: newDeviation } : a
        )
      );
    },
    []
  );

  // Handle adding an unplanned activity
  const handleAddUnplanned = useCallback(() => {
    if (!unplannedName.trim()) {
      toast.error('Nama aktivitas wajib diisi');
      return;
    }

    const newActivity: IDcrActivity = {
      id: `unplanned-${Date.now()}`,
      activityId: null,
      activityName: unplannedName.trim(),
      activityNameOther: unplannedName.trim(),
      deviation: 'done',
      wasPlanned: false,
    };

    setActivities((prev) => [...prev, newActivity]);
    setUnplannedName('');
    setShowAddUnplanned(false);
    toast.success('Aktivitas tidak terencana ditambahkan');
  }, [unplannedName]);

  // Handle removing an unplanned activity
  const handleRemoveActivity = useCallback((activityId: string) => {
    setActivities((prev) => prev.filter((a) => a.id !== activityId));
  }, []);

  // Handle form submission
  const handleSubmit = useCallback(async () => {
    if (activities.length === 0) {
      toast.error('Setidaknya satu aktivitas diperlukan');
      return;
    }

    setIsProcessing(true);
    try {
      const formData = new FormData();
      formData.append('sessionId', sessionId);
      formData.append('learningNotes', learningNotes);

      const activitiesPayload = activities.map((a) => ({
        activityId: a.activityId,
        activityNameOther: a.activityNameOther,
        deviation: a.deviation,
        wasPlanned: a.wasPlanned,
      }));
      formData.append('activities', JSON.stringify(activitiesPayload));

      const result = await saveDcr(formData);

      if (result.success) {
        toast.success(
          isEditing
            ? 'Laporan harian berhasil diperbarui'
            : 'Laporan harian berhasil disimpan'
        );

        // Check for unplanned activities to prompt add-to-catalog
        const unplanned = result.data.unplannedActivities;
        if (unplanned && unplanned.length > 0) {
          setShowCatalogPrompt({
            name: unplanned[0].activityNameOther ?? '',
          });
        } else {
          setShowCreateSuccess(true);
        }

        router.refresh();
      } else {
        toast.error(result.error);
      }
    } catch {
      toast.error('Terjadi kesalahan sistem');
    } finally {
      setIsProcessing(false);
    }
  }, [activities, sessionId, learningNotes, isEditing, router]);

  // Handle adding unplanned activity to catalog
  const handleAddToCatalog = useCallback(async () => {
    if (!showCatalogPrompt) return;

    setIsAddingToCatalog(true);
    try {
      const result = await createActivityFromUnplanned(showCatalogPrompt.name);
      if (result.success) {
        toast.success(
          `"${showCatalogPrompt.name}" berhasil ditambahkan ke katalog`
        );
      } else {
        toast.error(result.error);
      }
    } catch {
      toast.error('Gagal menambahkan ke katalog');
    } finally {
      setIsAddingToCatalog(false);
      setShowCatalogPrompt(null);
      setShowCreateSuccess(true);
    }
  }, [showCatalogPrompt]);

  // Handle dismissing catalog prompt
  const handleDismissCatalogPrompt = useCallback(() => {
    setShowCatalogPrompt(null);
    setShowCreateSuccess(true);
  }, []);

  return (
    <div className="space-y-6">
      {/* Activities List */}
      <div className="space-y-3">
        <h2 className="text-base font-medium text-foreground">
          Aktivitas ({activities.length})
        </h2>

        {activities.length === 0 && (
          <div className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
            Belum ada aktivitas. Tambahkan aktivitas di bawah.
          </div>
        )}

        {/* Activity rows */}
        {activities.map((activity, index) => (
          <div
            key={activity.id}
            className="flex flex-col gap-2 rounded-lg border bg-background p-3 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-muted-foreground">
                  #{index + 1}
                </span>
                <span className="font-medium text-foreground">
                  {activity.activityName}
                </span>
                {!activity.wasPlanned && (
                  <Badge
                    variant="outline"
                    className="bg-purple-100 text-purple-700"
                  >
                    Tidak Terencana
                  </Badge>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Deviation selector */}
              <ToggleGroup
                value={[activity.deviation]}
                onValueChange={(value) => {
                  if (value.length > 0)
                    handleDeviationChange(
                      activity.id,
                      value[value.length - 1] as 'done' | 'skipped' | 'modified'
                    );
                }}
              >
                {DEVIATION_OPTIONS.map((opt) => (
                  <ToggleGroupItem
                    key={opt.value}
                    value={opt.value}
                    size="sm"
                    className="text-xs"
                  >
                    {opt.label}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>

              {/* Remove button (only for unplanned activities) */}
              {!activity.wasPlanned && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground hover:text-destructive"
                  onClick={() => handleRemoveActivity(activity.id)}
                >
                  <HugeiconsIcon icon={Delete04Icon} data-icon="inline-start" />
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Add Unplanned Activity button */}
      <div>
        {showAddUnplanned ? (
          <div className="flex flex-col gap-3 rounded-lg border border-dashed bg-muted p-4">
            <div className="space-y-2">
              <Label htmlFor="unplanned-name">
                Nama Aktivitas Tidak Terencana{' '}
                <span className="text-destructive">*</span>
              </Label>
              <Input
                id="unplanned-name"
                value={unplannedName}
                onChange={(e) => setUnplannedName(e.target.value)}
                placeholder="Cth: Kunjungan dokter gigi, Lomba mewarnai"
                autoFocus
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowAddUnplanned(false);
                  setUnplannedName('');
                }}
                disabled={isProcessing}
              >
                Batal
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={handleAddUnplanned}
                disabled={isProcessing || !unplannedName.trim()}
              >
                Tambahkan
              </Button>
            </div>
          </div>
        ) : (
          <Button
            variant="outline"
            type="button"
            onClick={() => setShowAddUnplanned(true)}
            disabled={isProcessing}
          >
            + Tambah Aktivitas Tidak Terencana
          </Button>
        )}
      </div>

      {/* Learning Notes */}
      <div className="space-y-2">
        <Label htmlFor="learning-notes">Catatan Pembelajaran</Label>
        <Textarea
          id="learning-notes"
          placeholder="Catatan tambahan tentang proses pembelajaran hari ini (opsional)"
          value={learningNotes}
          onChange={(e) => setLearningNotes(e.target.value)}
          rows={3}
          disabled={isProcessing}
        />
      </div>

      {/* Submit */}
      <div className="flex justify-end">
        <Button
          onClick={handleSubmit}
          disabled={isProcessing || activities.length === 0}
          className="min-w-[160px]"
        >
          {isProcessing
            ? 'Menyimpan...'
            : isEditing
              ? 'Simpan Perubahan'
              : 'Simpan Laporan'}
        </Button>
      </div>

      {/* Prompt to add to catalog dialog */}
      <Dialog
        open={!!showCatalogPrompt}
        onOpenChange={(open) => !open && handleDismissCatalogPrompt()}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Tambahkan ke Katalog?</DialogTitle>
            <DialogDescription>
              Aktivitas &quot;{showCatalogPrompt?.name}&quot; belum ada di
              katalog aktivitas. Apakah Anda ingin menambahkannya?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button
              variant="outline"
              onClick={handleDismissCatalogPrompt}
              disabled={isAddingToCatalog}
            >
              Tidak
            </Button>
            <Button
              variant="default"
              onClick={handleAddToCatalog}
              disabled={isAddingToCatalog}
            >
              {isAddingToCatalog ? 'Menambahkan...' : 'Ya, Tambahkan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Success dialog */}
      <Dialog open={showCreateSuccess} onOpenChange={setShowCreateSuccess}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>
              {isEditing
                ? 'Laporan Berhasil Diperbarui'
                : 'Laporan Berhasil Disimpan'}
            </DialogTitle>
            <DialogDescription>
              Laporan harian kelas untuk sesi ini telah{' '}
              {isEditing ? 'diperbarui' : 'disimpan'}.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => setShowCreateSuccess(false)}>
              Lanjutkan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
