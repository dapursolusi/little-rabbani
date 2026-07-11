'use client';

import { useState } from 'react';

import { useRouter } from 'next/navigation';

import { MoreVerticalIcon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { toast } from 'sonner';

import { ConfirmDialog } from '@/components/sections/confirm-dialog';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import { restoreActivity, softDeleteActivity } from '@/lib/actions/activity';

interface IActivityActionsProps {
  activityId: string;
  isDeleted: boolean;
}

export function ActivityActions({
  activityId,
  isDeleted,
}: IActivityActionsProps) {
  const router = useRouter();
  const [showArchiveConfirm, setShowArchiveConfirm] = useState(false);
  const [showRestoreConfirm, setShowRestoreConfirm] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  async function handleArchive() {
    setIsProcessing(true);
    try {
      const result = await softDeleteActivity(activityId);
      if (result.success) {
        toast.success('Aktivitas berhasil diarsipkan');
        router.refresh();
      } else {
        toast.error(result.error);
      }
    } catch {
      toast.error('Terjadi kesalahan sistem');
    } finally {
      setIsProcessing(false);
      setShowArchiveConfirm(false);
    }
  }

  async function handleRestore() {
    setIsProcessing(true);
    try {
      const result = await restoreActivity(activityId);
      if (result.success) {
        toast.success('Aktivitas berhasil dipulihkan');
        router.refresh();
      } else {
        toast.error(result.error);
      }
    } catch {
      toast.error('Terjadi kesalahan sistem');
    } finally {
      setIsProcessing(false);
      setShowRestoreConfirm(false);
    }
  }

  if (isDeleted) {
    return (
      <>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowRestoreConfirm(true)}
        >
          Pulihkan
        </Button>

        <ConfirmDialog
          open={showRestoreConfirm}
          onOpenChange={setShowRestoreConfirm}
          onConfirm={handleRestore}
          title="Pulihkan Aktivitas?"
          description="Aktivitas ini akan muncul kembali di daftar aktif."
          confirmText="Ya, Pulihkan"
          variant="default"
          loading={isProcessing}
        />
      </>
    );
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger>
          <Button variant="ghost" size="sm" aria-label="Buka menu aktivitas">
            <span className="sr-only">Buka menu aktivitas</span>
            <HugeiconsIcon icon={MoreVerticalIcon} />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            onClick={() =>
              router.push(`/dashboard/owner/activity/${activityId}/edit`)
            }
          >
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setShowArchiveConfirm(true)}>
            Arsipkan
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ConfirmDialog
        open={showArchiveConfirm}
        onOpenChange={setShowArchiveConfirm}
        onConfirm={handleArchive}
        title="Arsipkan Aktivitas?"
        description="Aktivitas yang diarsipkan tidak akan muncul di pilihan aktivitas aktif, tetapi tetap terlihat di data lama."
        confirmText="Ya, Arsipkan"
        variant="destructive"
        loading={isProcessing}
      />
    </>
  );
}
