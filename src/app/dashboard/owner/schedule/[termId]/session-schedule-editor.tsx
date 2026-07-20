'use client';

import { useEffect, useState } from 'react';

import { useRouter } from 'next/navigation';

import { Alert01Icon, Delete04Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';

import { getActiveActivities } from '@/lib/actions/activity';
import {
  createScheduleItem,
  deleteScheduleItem,
  getScheduleItems,
} from '@/lib/actions/schedule';
import { getCategoryLabel } from '@/lib/activity-utils';
import type { ResolvedSessionType } from '@/lib/session-type-resolver';

interface IScheduleItem {
  id: string;
  date: string | null;
  sessionTypeId: string | null;
  activityId: string | null;
  type: 'activity' | 'outing';
  outingLocation: string | null;
  outingBringItems: string | null;
  outingPermissionRequired: boolean;
  sortOrder: number;
  activity?: {
    id: string;
    name: string;
    category: string;
  } | null;
}

interface IActivity {
  id: string;
  name: string;
  category: string;
}

interface ISessionScheduleEditorProps {
  sessionId: string;
  date: string;
  sessionTypeId: string;
  sessionType: ResolvedSessionType | null;
  isLocked: boolean;
}

export function SessionScheduleEditor({
  sessionId,
  date,
  sessionTypeId,
  sessionType,
  isLocked,
}: ISessionScheduleEditorProps) {
  const router = useRouter();
  const [items, setItems] = useState<IScheduleItem[]>([]);
  const [activities, setActivities] = useState<IActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showOutingDialog, setShowOutingDialog] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(
    null
  );
  const [isProcessing, setIsProcessing] = useState(false);

  // Add outing form
  const [outingLocation, setOutingLocation] = useState('');
  const [outingBringItems, setOutingBringItems] = useState('');
  const [outingPermissionRequired, setOutingPermissionRequired] =
    useState(false);

  // Add activity form
  const [selectedActivityId, setSelectedActivityId] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function loadScheduleData() {
      setIsLoading(true);
      try {
        const [itemsResult, activitiesResult] = await Promise.all([
          getScheduleItems(date, sessionTypeId),
          getActiveActivities(),
        ]);

        if (cancelled) return;

        if (itemsResult.success) {
          setItems(itemsResult.data);
        }

        if (activitiesResult.success) {
          setActivities(activitiesResult.data);
        }
      } catch (err) {
        console.error('Failed to load schedule data:', err);
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    loadScheduleData();

    return () => {
      cancelled = true;
    };
  }, [date, sessionTypeId, refreshKey]);

  async function handleAddActivity() {
    if (!selectedActivityId) {
      toast.error('Pilih aktivitas terlebih dahulu');
      return;
    }

    setIsProcessing(true);
    try {
      const formData = new FormData();
      formData.set('date', date);
      formData.set('sessionTypeId', sessionTypeId);
      formData.set('sessionId', sessionId);
      formData.set('activityId', selectedActivityId);
      formData.set('type', 'activity');

      const result = await createScheduleItem(formData);
      if (result.success) {
        toast.success('Aktivitas berhasil ditambahkan');
        setShowAddDialog(false);
        setSelectedActivityId('');
        await setRefreshKey((k) => k + 1);
        router.refresh();
      } else {
        toast.error(result.error);
      }
    } catch {
      toast.error('Terjadi kesalahan sistem');
    } finally {
      setIsProcessing(false);
    }
  }

  async function handleAddOuting() {
    if (!outingLocation.trim()) {
      toast.error('Lokasi outing wajib diisi');
      return;
    }

    setIsProcessing(true);
    try {
      const formData = new FormData();
      formData.set('date', date);
      formData.set('sessionTypeId', sessionTypeId);
      formData.set('sessionId', sessionId);
      formData.set('type', 'outing');
      formData.set('outingLocation', outingLocation);
      formData.set('outingBringItems', outingBringItems);
      formData.set(
        'outingPermissionRequired',
        outingPermissionRequired ? 'true' : 'false'
      );

      const result = await createScheduleItem(formData);
      if (result.success) {
        toast.success('Outing berhasil ditambahkan');
        setShowOutingDialog(false);
        setOutingLocation('');
        setOutingBringItems('');
        setOutingPermissionRequired(false);
        await setRefreshKey((k) => k + 1);
        router.refresh();
      } else {
        toast.error(result.error);
      }
    } catch {
      toast.error('Terjadi kesalahan sistem');
    } finally {
      setIsProcessing(false);
    }
  }

  async function handleDelete(itemId: string) {
    setIsProcessing(true);
    try {
      const formData = new FormData();
      formData.set('id', itemId);

      const result = await deleteScheduleItem(formData);
      if (result.success) {
        toast.success('Item jadwal berhasil dihapus');
        setShowDeleteConfirm(null);
        await setRefreshKey((k) => k + 1);
        router.refresh();
      } else {
        toast.error(result.error);
      }
    } catch {
      toast.error('Terjadi kesalahan sistem');
    } finally {
      setIsProcessing(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-4">
        <div className="text-sm text-muted-foreground">Memuat jadwal...</div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Session type title */}
      {sessionType && (
        <p className="text-xs text-muted-foreground">
          {sessionType.name} ({sessionType.start} — {sessionType.end})
        </p>
      )}

      {/* No items state */}
      {items.length === 0 && (
        <div className="rounded-md border border-dashed p-4 text-center text-sm text-muted-foreground">
          Belum ada aktivitas atau outing untuk sesi ini
        </div>
      )}

      {/* Items list */}
      {items.length > 0 && (
        <div className="space-y-2">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between rounded-md border bg-background px-3 py-2"
            >
              <div className="flex-1">
                {item.type === 'outing' ? (
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="rounded bg-blue-100 px-1.5 py-0.5 text-xs font-medium text-blue-700">
                        Outing
                      </span>
                      <span className="font-medium text-foreground">
                        {item.outingLocation || 'Lokasi tidak ditentukan'}
                      </span>
                    </div>
                    {item.outingBringItems && (
                      <p className="text-xs text-muted-foreground">
                        Bawaan: {item.outingBringItems}
                      </p>
                    )}
                    {item.outingPermissionRequired && (
                      <p className="text-xs text-warning flex items-center gap-1">
                        <HugeiconsIcon icon={Alert01Icon} className="size-3" />
                        Izin orang tua diperlukan
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="rounded bg-success/10 px-1.5 py-0.5 text-xs font-medium text-success">
                      Aktivitas
                    </span>
                    <span className="font-medium text-foreground">
                      {item.activity?.name || 'Aktivitas tidak tersedia'}
                    </span>
                    {item.activity && (
                      <span className="text-xs text-muted-foreground">
                        {getCategoryLabel(item.activity.category)}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Delete button */}
              {!isLocked && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground hover:text-destructive"
                  onClick={() => setShowDeleteConfirm(item.id)}
                >
                  <HugeiconsIcon icon={Delete04Icon} data-icon="inline-start" />
                </Button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add buttons */}
      {!isLocked && (
        <div className="flex gap-2">
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger>
              <Button variant="outline" size="sm" type="button">
                + Aktivitas
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Tambah Aktivitas</DialogTitle>
                <DialogDescription>
                  Pilih aktivitas dari katalog untuk ditambahkan ke sesi ini
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div className="space-y-2">
                  <Label htmlFor="activity-select">Pilih Aktivitas</Label>
                  <Select
                    value={selectedActivityId}
                    onValueChange={(v) => v && setSelectedActivityId(v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih aktivitas..." />
                    </SelectTrigger>
                    <SelectContent>
                      {activities.length === 0 ? (
                        <div className="px-2 py-4 text-center text-sm text-muted-foreground">
                          Belum ada aktivitas di katalog
                        </div>
                      ) : (
                        activities.map((a) => (
                          <SelectItem key={a.id} value={a.id}>
                            {a.name} — {getCategoryLabel(a.category)}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setShowAddDialog(false)}
                  disabled={isProcessing}
                >
                  Batal
                </Button>
                <Button
                  onClick={handleAddActivity}
                  disabled={isProcessing || !selectedActivityId}
                >
                  {isProcessing ? 'Menambahkan...' : 'Tambah'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={showOutingDialog} onOpenChange={setShowOutingDialog}>
            <DialogTrigger>
              <Button variant="outline" size="sm" type="button">
                + Outing
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Tambah Outing</DialogTitle>
                <DialogDescription>
                  Tambahkan kegiatan outing ke sesi ini
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div className="space-y-2">
                  <Label htmlFor="outing-location">
                    Lokasi Outing <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="outing-location"
                    value={outingLocation}
                    onChange={(e) => setOutingLocation(e.target.value)}
                    placeholder="Cth: Kebun Binatang, Taman Kota"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="outing-bring-items">Barang Bawaan</Label>
                  <Textarea
                    id="outing-bring-items"
                    value={outingBringItems}
                    onChange={(e) => setOutingBringItems(e.target.value)}
                    placeholder="Cth: Topi, bekal, air minum"
                    rows={2}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    id="outing-permission"
                    checked={outingPermissionRequired}
                    onCheckedChange={(v: boolean) =>
                      setOutingPermissionRequired(v)
                    }
                  />
                  <Label htmlFor="outing-permission">
                    Izin orang tua diperlukan
                  </Label>
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setShowOutingDialog(false)}
                  disabled={isProcessing}
                >
                  Batal
                </Button>
                <Button
                  onClick={handleAddOuting}
                  disabled={isProcessing || !outingLocation.trim()}
                >
                  {isProcessing ? 'Menambahkan...' : 'Tambah'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      )}

      {/* Locked message */}
      {isLocked && (
        <p className="text-xs text-muted-foreground">
          Jadwal sudah tidak bisa diubah — sesi sudah dimulai
        </p>
      )}

      {/* Delete confirmation dialog */}
      <Dialog
        open={!!showDeleteConfirm}
        onOpenChange={(open) => !open && setShowDeleteConfirm(null)}
      >
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Hapus Item Jadwal?</DialogTitle>
            <DialogDescription>
              Item jadwal ini akan dihapus dari sesi. Tindakan ini tidak bisa
              dibatalkan.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button
              variant="outline"
              onClick={() => setShowDeleteConfirm(null)}
              disabled={isProcessing}
            >
              Batal
            </Button>
            <Button
              variant="destructive"
              onClick={() =>
                showDeleteConfirm && handleDelete(showDeleteConfirm)
              }
              disabled={isProcessing}
            >
              {isProcessing ? 'Menghapus...' : 'Ya, Hapus'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
