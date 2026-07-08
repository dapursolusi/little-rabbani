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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

import { deleteGuardian } from '@/lib/actions/guardian';

interface IGuardianActionsProps {
  guardianId: string;
  hasKids: boolean;
}

export function GuardianActions({
  guardianId,
  hasKids,
}: IGuardianActionsProps) {
  const router = useRouter();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleDelete() {
    setIsDeleting(true);
    try {
      const result = await deleteGuardian(guardianId);
      if (result.success) {
        toast.success('Wali murid berhasil dihapus');
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

  return (
    <>
      <DropdownMenu>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <DropdownMenuTrigger>
                <Button
                  variant="ghost"
                  size="sm"
                  aria-label="Buka menu wali murid"
                >
                  <span className="sr-only">Buka menu wali murid</span>
                  <HugeiconsIcon icon={MoreVerticalIcon} className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
            </TooltipTrigger>
            <TooltipContent>
              <p>Buka menu</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            onClick={() =>
              router.push(`/dashboard/owner/guardian/${guardianId}/edit`)
            }
          >
            Edit
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
        title="Hapus Wali Murid?"
        description={
          hasKids
            ? 'Wali murid ini memiliki murid terdaftar. Hapus atau pindahkan murid terlebih dahulu.'
            : 'Yakin ingin menghapus wali murid ini? Tindakan ini tidak bisa dibatalkan.'
        }
        confirmText="Ya, Hapus"
        variant="destructive"
        loading={isDeleting}
      />
    </>
  );
}
