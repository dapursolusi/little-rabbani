'use client';

import { type ReactNode, useState } from 'react';

import { useRouter } from 'next/navigation';

import type { FormField } from '@/types/field';
import { toast } from 'sonner';
import type { ZodObject, ZodRawShape } from 'zod';

import FormFieldGenerator from '@/components/shared/form/form-field-generator';
import { Modal } from '@/components/shared/modal';
import { Button } from '@/components/ui/button';
import { DialogFooter } from '@/components/ui/dialog';

import { DataTableRowActions } from './data-table-row-action';

interface RowActionsDialogProps {
  id: string;
  rowName: string;
  title: string;
  description: string;
  deleteAction: (id: string) => void;
  /** Link the row's Edit action to a dedicated edit page. */
  editHref?: string;
  /** Inline-edit dialog props (mutually exclusive with editHref). */
  initialData?: Record<string, unknown>;
  schema?: ZodObject<ZodRawShape>;
  formFields?: FormField[];
  updateAction?: (
    id: string,
    data: Record<string, unknown>
  ) => Promise<{ success: boolean; error?: string }>;
  /** Extra dropdown menu items rendered between Edit and Hapus. */
  extendedActions?: ReactNode;
}

export function RowActionsDialog({
  id,
  rowName,
  title,
  description,
  deleteAction,
  editHref,
  initialData,
  schema,
  formFields,
  updateAction,
  extendedActions,
}: RowActionsDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const inlineEdit = Boolean(editHref) === false;

  return (
    <>
      <DataTableRowActions
        id={id}
        actions={{
          editHref,
          ...(inlineEdit ? { edit: () => setOpen(true) } : {}),
          delete: deleteAction,
        }}
        dataName={rowName}
        extendedActions={extendedActions}
      />
      {inlineEdit && schema && formFields && updateAction && (
        <Modal
          title={title}
          description={description}
          open={open}
          onOpenChange={setOpen}
          content={
            <FormFieldGenerator
              schema={schema}
              formFields={formFields}
              initialData={initialData ?? {}}
              isEditing
              meta={{ label: title }}
              onSubmit={async (data) => {
                const result = await updateAction(
                  id,
                  data as Record<string, unknown>
                );
                if (result.success) {
                  toast.success(`${title} berhasil diperbarui`);
                  setOpen(false);
                  router.refresh();
                } else {
                  toast.error(result.error);
                }
              }}
              submitChildren={
                <DialogFooter>
                  <Button variant="outline" onClick={() => setOpen(false)}>
                    Batal
                  </Button>
                  <Button type="submit">Simpan</Button>
                </DialogFooter>
              }
            />
          }
        />
      )}
    </>
  );
}
