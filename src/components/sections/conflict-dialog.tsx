'use client';

import { useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

import { savePass1Observation } from '@/lib/actions/capture';
import type { IConflictData } from '@/lib/capture-offline';

// ─────────────── Types ───────────────

interface IConflictDialogProps {
  conflict: IConflictData | null;
  isOpen: boolean;
  onClose: () => void;
  onResolved: () => void;
}

// ─────────────── Constants ───────────────

const MOOD_EMOJIS: Record<number, string> = {
  1: '😢',
  2: '😟',
  3: '😐',
  4: '😊',
  5: '😄',
};

const APPETITE_LABELS: Record<string, string> = {
  good: 'Baik',
  moderate: 'Sedang',
  poor: 'Kurang',
};

const PRESENCE_LABELS: Record<string, string> = {
  present_full: 'Hadir',
  late: 'Terlambat',
  early_pickup: 'Dijemput Lebih Awal',
  absent: 'Tidak Hadir',
};

// ─────────────── Main Component ───────────────
// VAL-CAPTURE-032: Conflict UI - single-value fields refresh to server values
// VAL-CAPTURE-033: Conflict UI - notes always persist (append-only)

export function ConflictDialog({
  conflict,
  isOpen,
  onClose,
  onResolved,
}: IConflictDialogProps) {
  const [isApplyingServerValues, setIsApplyingServerValues] = useState(false);
  const [isResolved, setIsResolved] = useState(false);

  const handleUseServerValues = useCallback(async () => {
    if (!conflict) return;
    setIsApplyingServerValues(true);

    try {
      // Apply server values + local notes appended
      const formData = new FormData();
      formData.append('kidId', conflict.kidId);
      formData.append('sessionId', conflict.sessionId);
      formData.append('mood', String(conflict.serverFields.mood));
      formData.append('appetite', conflict.serverFields.appetite);
      formData.append('presence', conflict.serverFields.presence);

      // VAL-CAPTURE-033: Notes always persist (append-only)
      // Preserve local notes by re-saving them alongside server notes
      const allNotes = [...conflict.serverNotes, ...conflict.localNotes].filter(
        Boolean
      );
      if (allNotes.length > 0) {
        formData.append('notes', allNotes.join('\n---\n'));
      }

      const result = await savePass1Observation(formData);

      if (result.success) {
        setIsResolved(true);
        onResolved();
      }
    } catch {
      // Error handled silently
    } finally {
      setIsApplyingServerValues(false);
    }
  }, [conflict, onResolved]);

  const handleKeepLocalValues = useCallback(async () => {
    if (!conflict) return;
    setIsApplyingServerValues(true);

    try {
      // Force save with local values (will overwrite with current version handling)
      const formData = new FormData();
      formData.append('kidId', conflict.kidId);
      formData.append('sessionId', conflict.sessionId);
      formData.append('mood', String(conflict.serverFields.mood)); // Use server mood as base
      formData.append('appetite', conflict.serverFields.appetite);

      // Keep the presence from local
      formData.append(
        'presence',
        conflict.localNotes.length > 0
          ? 'present_full'
          : conflict.serverFields.presence
      );

      // VAL-CAPTURE-033: Notes always persist (append-only)
      const allNotes = [...conflict.serverNotes, ...conflict.localNotes].filter(
        Boolean
      );
      if (allNotes.length > 0) {
        formData.append('notes', allNotes.join('\n---\n'));
      }

      const result = await savePass1Observation(formData);

      if (result.success) {
        setIsResolved(true);
        onResolved();
      }
    } catch {
      // Error handled silently
    } finally {
      setIsApplyingServerValues(false);
    }
  }, [conflict, onResolved]);

  if (!conflict) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-destructive">
            Konflik Data Terdeteksi
          </DialogTitle>
          <DialogDescription>
            Data observasi ini sudah diubah oleh pengguna lain. Silakan pilih
            tindakan.
          </DialogDescription>
        </DialogHeader>

        {/* VAL-CAPTURE-032: Single-value fields shown with server values */}
        <div className="space-y-4">
          <div>
            <h4 className="mb-2 text-sm font-medium text-zinc-700">
              Nilai dari Server:
            </h4>
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
              <div className="grid grid-cols-3 gap-2 text-sm">
                <div className="text-center">
                  <p className="text-xs text-zinc-500">Mood</p>
                  <p className="mt-1 text-xl">
                    {MOOD_EMOJIS[conflict.serverFields.mood] ?? '😐'}
                  </p>
                  <p className="text-xs text-zinc-600">
                    Level {conflict.serverFields.mood}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-zinc-500">Nafsu Makan</p>
                  <p className="mt-1 text-sm font-medium text-zinc-800">
                    {APPETITE_LABELS[conflict.serverFields.appetite] ??
                      conflict.serverFields.appetite}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-zinc-500">Kehadiran</p>
                  <p className="mt-1 text-sm font-medium text-zinc-800">
                    {PRESENCE_LABELS[conflict.serverFields.presence] ??
                      conflict.serverFields.presence}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* VAL-CAPTURE-033: Notes - append-only, both preserved */}
          <div>
            <h4 className="mb-2 text-sm font-medium text-zinc-700">
              Catatan (kedua catatan akan digabung):
            </h4>
            <div className="max-h-32 space-y-1.5 overflow-y-auto rounded-lg bg-zinc-50 p-3">
              {conflict.serverNotes.length > 0 && (
                <div className="border-l-2 border-blue-400 pl-2">
                  <p className="text-[10px] font-medium text-blue-600">
                    Dari Server:
                  </p>
                  {conflict.serverNotes.map((note, i) => (
                    <p key={`server-${i}`} className="text-sm text-zinc-700">
                      {note}
                    </p>
                  ))}
                </div>
              )}
              {conflict.localNotes.length > 0 && (
                <div className="border-l-2 border-amber-400 pl-2">
                  <p className="text-[10px] font-medium text-amber-600">
                    Dari Anda (lokal):
                  </p>
                  {conflict.localNotes.map((note, i) => (
                    <p key={`local-${i}`} className="text-sm text-zinc-700">
                      {note}
                    </p>
                  ))}
                </div>
              )}
            </div>
            <p className="mt-1 text-[10px] text-zinc-400">
              Catatan bersifat kumulatif — tidak ada catatan yang hilang
            </p>
          </div>

          {isResolved && (
            <div className="rounded-lg bg-green-50 p-3 text-center text-sm font-medium text-green-700">
              ✓ Konflik berhasil diselesaikan
            </div>
          )}
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-row">
          {!isResolved && (
            <>
              {/* VAL-CAPTURE-032: "Use server values" button */}
              <Button
                variant="default"
                onClick={handleUseServerValues}
                disabled={isApplyingServerValues}
                className="flex-1"
              >
                {isApplyingServerValues
                  ? 'Menyimpan...'
                  : 'Gunakan Data Server'}
              </Button>

              <Button
                variant="outline"
                onClick={handleKeepLocalValues}
                disabled={isApplyingServerValues}
                className="flex-1"
              >
                Simpan Keduanya
              </Button>
            </>
          )}
          {isResolved && (
            <Button variant="default" onClick={onClose} className="flex-1">
              Tutup
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
