'use client';

import { useContext, useState } from 'react';

import { useRouter } from 'next/navigation';

import { toast } from 'sonner';

import DefaultFormFields from '@/components/shared/form/default-form-field';
import { Modal } from '@/components/shared/modal';
import { Button } from '@/components/ui/button';
import { DialogFooter } from '@/components/ui/dialog';

import { EditFormContext } from './data-table-context';
import { DataTableRowActions } from './data-table-row-action';

interface RowActionsDialogProps {
  id: string;
  rowName: string;
  title: string;
  description: string;
  initialData: Record<string, unknown>;
  updateAction: (
    id: string,
    data: Record<string, unknown>
  ) => Promise<{ success: boolean; error?: string }>;
  deleteAction: (id: string) => void;
}

export function RowActionsDialog({
  id,
  rowName,
  title,
  description,
  initialData,
  updateAction,
  deleteAction,
}: RowActionsDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const { schemaKey, formFields } = useContext(EditFormContext);

  return (
    <>
      <DataTableRowActions
        id={id}
        actions={{
          edit: () => setOpen(true),
          delete: deleteAction,
        }}
        rowName={rowName}
      />
      <Modal
        title={title}
        description={description}
        open={open}
        onOpenChange={setOpen}
        content={
          <DefaultFormFields
            schemaKey={schemaKey}
            formFields={formFields}
            initialData={initialData}
            onSubmit={async (data) => {
              const result = await updateAction(id, data);
              if (result.success) {
                toast.success(`${title} berhasil diperbarui`);
                setOpen(false);
                router.refresh();
              } else {
                toast.error(result.error);
              }
            }}
          >
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>
                Batal
              </Button>
              <Button type="submit">Simpan</Button>
            </DialogFooter>
          </DefaultFormFields>
        }
      />
    </>
  );
}
