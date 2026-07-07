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

import { activateTerm, deleteTerm } from '@/lib/actions/term';

interface ITermActionsProps {
  termId: string;
  sessionCount: number;
  isActive: boolean;
}

export function TermActions({
  termId,
  sessionCount,
  isActive,
}: ITermActionsProps) {
  const router = useRouter();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isActivating, setIsActivating] = useState(false);

  async function handleDelete() {
    setIsDeleting(true);
    try {
      const result = await deleteTerm(termId);
      if (result.success) {
        toast.success('Term berhasil dihapus');
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

  async function handleActivate() {
    setIsActivating(true);
    try {
      const result = await activateTerm(termId);
      if (result.success) {
        toast.success('Term berhasil diaktifkan');
        router.refresh();
      } else {
        toast.error(result.error);
      }
    } catch {
      toast.error('Terjadi kesalahan sistem');
    } finally {
      setIsActivating(false);
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
            onClick={() => router.push(`/dashboard/owner/term/${termId}/edit`)}
          >
            Edit
          </DropdownMenuItem>
          {!isActive && (
            <DropdownMenuItem onClick={handleActivate}>
              {isActivating ? 'Mengaktifkan...' : 'Aktifkan'}
            </DropdownMenuItem>
          )}
          <DropdownMenuItem
            onClick={() =>
              router.push(`/dashboard/owner/term/${termId}/cohort`)
            }
          >
            Kelola Murid
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() =>
              router.push(`/dashboard/owner/session?termId=${termId}`)
            }
          >
            Lihat Sesi
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
        title="Hapus Term?"
        description={
          sessionCount > 0
            ? 'Term ini memiliki sesi terdaftar. Hapus sesi terlebih dahulu.'
            : 'Yakin ingin menghapus term ini? Tindakan ini tidak bisa dibatalkan.'
        }
        confirmText="Ya, Hapus"
        variant="destructive"
        loading={isDeleting}
      />
    </>
  );
}
