'use client';

import { type ReactNode, useState } from 'react';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

import {
  Delete02Icon,
  Edit04Icon,
  More03Icon,
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { toast } from 'sonner';

import { ConfirmDialog } from '@/components/sections/confirm-dialog';
import { buttonVariants } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import { cn } from '@/lib/utils';

interface DataTableRowActionsProps {
  id: string;
  toastMessage?: {
    success: {
      edit: string;
      delete: string;
    };
    failed: {
      edit: string;
      delete: string;
      system: string;
    };
  };
  actions?: {
    editHref?: string;
    edit?: (id: string) => Promise<unknown> | void;
    delete: (id: string) => Promise<unknown> | void;
  };
  dialogMessage?: {
    delete: {
      title?: string;
      description?: string;
      confirmText?: string;
    };
  };
  dataName?: string;
  /** Extra dropdown menu items rendered between Edit and Hapus. */
  extendedActions?: ReactNode;
}

export function DataTableRowActions({
  id,
  toastMessage,
  actions,
  dialogMessage,
  dataName,
  extendedActions,
}: DataTableRowActionsProps) {
  const router = useRouter();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleDelete() {
    setIsDeleting(true);
    try {
      const result: Promise<unknown> = actions?.delete
        ? (actions.delete(id) as Promise<unknown>)
        : Promise.resolve(undefined);
      const resolvedResult = await result;
      if (resolvedResult) {
        toast.success(toastMessage?.success?.delete || 'Data berhasil dihapus');
        router.refresh();
      } else {
        toast.error(toastMessage?.failed?.delete || 'Gagal menghapus data');
      }
    } catch {
      toast.error(toastMessage?.failed?.system || 'Terjadi kesalahan sistem');
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          className={cn(
            buttonVariants({ variant: 'ghost', size: 'icon-sm' }),
            'bg-transparent! hover:bg-muted!'
          )}
          aria-label="Buka menu baris tabel"
        >
          <HugeiconsIcon icon={More03Icon} />
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="min-w-max px-1.5 **:hover:font-semibold!"
        >
          {actions?.editHref ? (
            <DropdownMenuItem
              render={
                <Link href={actions?.editHref}>
                  <HugeiconsIcon icon={Edit04Icon} />
                  Edit
                </Link>
              }
            />
          ) : (
            <DropdownMenuItem onClick={() => actions?.edit?.(id)}>
              <HugeiconsIcon icon={Edit04Icon} />
              Edit
            </DropdownMenuItem>
          )}
          {extendedActions}
          <DropdownMenuItem
            onClick={() => setShowDeleteConfirm(true)}
            className="text-destructive hover:bg-destructive! hover:text-white!"
          >
            <HugeiconsIcon icon={Delete02Icon} /> Hapus
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ConfirmDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        onConfirm={handleDelete}
        title={dialogMessage?.delete?.title || `Menghapus Data ${dataName}`}
        description={
          dialogMessage?.delete?.description ||
          `Yakin ingin menghapus data ${dataName}? Tindakan ini tidak bisa dibatalkan.`
        }
        confirmText={dialogMessage?.delete?.confirmText || 'Ya, Hapus'}
        variant="destructive"
        loading={isDeleting}
      />
    </>
  );
}
