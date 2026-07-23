'use client';

import { useCallback, useEffect, useState } from 'react';

import { useRouter } from 'next/navigation';

import {
  createCalendarEvent,
  deleteCalendarEvent,
  getCalendarEvents,
} from '@/features/calendar/actions';
import { getActiveSubThemes } from '@/features/theme/actions';
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

import type { ResolvedSessionType } from '@/lib/session-type-resolver';

interface IScheduleItem {
  id: string;
  startDate: string | null;
  sessionTypeId: string | null;
  subThemeId: string | null;
  name: string | null;
  indoor: boolean;
  location: string | null;
  itemsToBring: string | null;
  permissionRequired: boolean;
  sortOrder: number;
  subTheme?: {
    id: string;
    name: string;
    theme: { id: string; name: string; color: string | null } | null;
  } | null;
}

interface ISubTheme {
  id: string;
  name: string;
  themeId: string;
  theme?: { name: string };
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
  const [subThemes, setSubThemes] = useState<ISubTheme[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(
    null
  );
  const [isProcessing, setIsProcessing] = useState(false);

  // Add item form
  const [selectedSubThemeId, setSelectedSubThemeId] = useState('');
  const [indoor, setIndoor] = useState(true);
  const [location, setLocation] = useState('');
  const [itemsToBring, setItemsToBring] = useState('');
  const [permissionRequired, setPermissionRequired] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadScheduleData() {
      setIsLoading(true);
      try {
        const [itemsResult, subThemesResult] = await Promise.all([
          getCalendarEvents(date, sessionTypeId),
          getActiveSubThemes(),
        ]);

        if (cancelled) return;

        if (itemsResult.success) {
          setItems(itemsResult.data as IScheduleItem[]);
        }

        if (subThemesResult.success) {
          setSubThemes(subThemesResult.data);
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

  const resetForm = useCallback(() => {
    setSelectedSubThemeId('');
    setIndoor(true);
    setLocation('');
    setItemsToBring('');
    setPermissionRequired(false);
  }, []);

  async function handleAddItem() {
    if (!selectedSubThemeId) {
      toast.error('Pilih sub tema terlebih dahulu');
      return;
    }

    setIsProcessing(true);
    try {
      const formData = new FormData();
      formData.set('date', date);
      formData.set('sessionTypeId', sessionTypeId);
      formData.set('sessionId', sessionId);
      formData.set('subThemeId', selectedSubThemeId);
      formData.set('indoor', indoor ? 'true' : 'false');
      formData.set('location', location);
      formData.set('itemsToBring', itemsToBring);
      formData.set('permissionRequired', permissionRequired ? 'true' : 'false');

      const result = await createCalendarEvent(formData);
      if (result.success) {
        toast.success('Kegiatan berhasil ditambahkan');
        setShowAddDialog(false);
        resetForm();
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

      const result = await deleteCalendarEvent(formData);
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
          Belum ada kegiatan untuk sesi ini
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
                <div className="flex items-center gap-2">
                  <span
                    className={`rounded px-1.5 py-0.5 text-xs font-medium ${
                      item.indoor
                        ? 'bg-green-100 text-green-700'
                        : 'bg-amber-100 text-amber-700'
                    }`}
                  >
                    {item.indoor ? 'Indoor' : 'Outdoor'}
                  </span>
                  <span className="font-medium text-foreground">
                    {item.subTheme?.name || 'Kegiatan tidak tersedia'}
                  </span>
                  {item.subTheme?.theme && (
                    <span className="text-xs text-muted-foreground">
                      {item.subTheme.theme.name}
                    </span>
                  )}
                </div>
                {item.location && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    Lokasi: {item.location}
                  </p>
                )}
                {item.itemsToBring && (
                  <p className="text-xs text-muted-foreground">
                    Bawaan: {item.itemsToBring}
                  </p>
                )}
                {item.permissionRequired && (
                  <p className="mt-0.5 flex items-center gap-1 text-xs text-warning">
                    <HugeiconsIcon icon={Alert01Icon} className="size-3" />
                    Izin orang tua diperlukan
                  </p>
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

      {/* Add button */}
      {!isLocked && (
        <div className="flex gap-2">
          <Dialog
            open={showAddDialog}
            onOpenChange={(open) => {
              setShowAddDialog(open);
              if (!open) resetForm();
            }}
          >
            <DialogTrigger>
              <Button variant="outline" size="sm" type="button">
                + Kegiatan
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Tambah Kegiatan</DialogTitle>
                <DialogDescription>
                  Pilih sub tema dan atur detail kegiatan untuk sesi ini
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div className="space-y-2">
                  <Label htmlFor="subTheme-select">Pilih Sub Tema</Label>
                  <Select
                    value={selectedSubThemeId}
                    onValueChange={(v) => v && setSelectedSubThemeId(v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih sub tema..." />
                    </SelectTrigger>
                    <SelectContent>
                      {subThemes.length === 0 ? (
                        <div className="px-2 py-4 text-center text-sm text-muted-foreground">
                          Belum ada sub tema di katalog
                        </div>
                      ) : (
                        subThemes.map((st) => (
                          <SelectItem key={st.id} value={st.id}>
                            {st.name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    id="item-indoor"
                    checked={indoor}
                    onCheckedChange={(v: boolean) => setIndoor(v)}
                  />
                  <Label htmlFor="item-indoor">Kegiatan Indoor</Label>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="item-location">Lokasi</Label>
                  <Input
                    id="item-location"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Cth: Kebun Binatang, Taman Kota"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="item-bring-items">Barang Bawaan</Label>
                  <Textarea
                    id="item-bring-items"
                    value={itemsToBring}
                    onChange={(e) => setItemsToBring(e.target.value)}
                    placeholder="Cth: Topi, bekal, air minum"
                    rows={2}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    id="item-permission"
                    checked={permissionRequired}
                    onCheckedChange={(v: boolean) => setPermissionRequired(v)}
                  />
                  <Label htmlFor="item-permission">
                    Izin orang tua diperlukan
                  </Label>
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowAddDialog(false);
                    resetForm();
                  }}
                  disabled={isProcessing}
                >
                  Batal
                </Button>
                <Button
                  onClick={handleAddItem}
                  disabled={isProcessing || !selectedSubThemeId}
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
