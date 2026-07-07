'use client';

import { useState } from 'react';

import { useRouter } from 'next/navigation';

import { toast } from 'sonner';

import { ConfirmDialog } from '@/components/sections/confirm-dialog';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import { deleteSession, updateSessionHoliday } from '@/lib/actions/term';

interface ISessionActionsProps {
  sessionId: string;
  termId: string;
  isHoliday: boolean;
}

export function SessionActions({
  sessionId,
  termId,
  isHoliday,
}: ISessionActionsProps) {
  const router = useRouter();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleDelete() {
    setIsDeleting(true);
    try {
      const result = await deleteSession(sessionId);
      if (result.success) {
        toast.success('Sesi berhasil dihapus');
        router.refresh();
      } else {
        toast.error(result.error);
      }
    } catch {
      toast.error('Terjadi kesalahan sistem');
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  }

  async function handleToggleHoliday() {
    try {
      const result = await updateSessionHoliday(sessionId, {
        isHoliday: !isHoliday,
        holidayReason: isHoliday ? null : 'Hari Libur',
      });
      if (result.success) {
        toast.success(isHoliday ? 'Libur dibatalkan' : 'Sesi ditandai libur');
        router.refresh();
      } else {
        toast.error(result.error);
      }
    } catch {
      toast.error('Terjadi kesalahan sistem');
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger>
          <Button variant="ghost" size="sm">
            <span className="sr-only">Buka menu</span>
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 5v.01M12 12v.01M12 19v.01"
              />
            </svg>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            onClick={() =>
              router.push(
                `/dashboard/owner/session/${sessionId}/edit?termId=${termId}`
              )
            }
          >
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleToggleHoliday}>
            {isHoliday ? 'Hapus Libur' : 'Tandai Libur'}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setShowDeleteConfirm(true)}>
            Hapus
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ConfirmDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        onConfirm={handleDelete}
        title="Hapus Sesi?"
        description="Yakin ingin menghapus sesi ini? Tindakan ini tidak bisa dibatalkan."
        confirmText="Ya, Hapus"
        variant="destructive"
        loading={isDeleting}
      />
    </>
  );
}
