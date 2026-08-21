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
  edit: RowActionsEdit;
  extendedActions?: ReactNode;
}

export type RowActionsEdit = RowActionsEditHref | RowActionsEditForm;
export interface RowActionsEditHref {
  href: string;
  action?: never;
  formFields?: never;
  initialData?: never;
  schema?: never;
}

export interface RowActionsEditForm {
  href?: never;
  action: (
    id: string,
    data: Record<string, unknown>
  ) => Promise<{ success: boolean; error?: string }> | void;
  formFields: FormField[];
  initialData: Record<string, unknown>;
  schema: ZodObject<ZodRawShape>;
}

export function RowActionsDialog({
  id,
  rowName,
  title,
  description,
  deleteAction,
  edit,
  extendedActions,
}: RowActionsDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const inlineEdit = Boolean(edit.href as string) === false;

  return (
    <>
      <DataTableRowActions
        id={id}
        actions={{
          editHref: edit.href,
          ...(inlineEdit ? { edit: () => setOpen(true) } : {}),
          delete: deleteAction,
        }}
        dataName={rowName}
        extendedActions={extendedActions}
      />
      {inlineEdit && edit.schema && edit.formFields && edit.action && (
        <Modal
          title={title}
          description={description}
          open={open}
          onOpenChange={setOpen}
          content={
            <FormFieldGenerator
              schema={edit.schema}
              formFields={edit.formFields}
              initialData={edit.initialData ?? {}}
              isEditing
              meta={{ label: title }}
              onSubmit={async (data) => {
                const result = await edit.action(
                  id,
                  data as Record<string, unknown>
                );
                if (result && (result.success as boolean)) {
                  toast.success(`${title} berhasil diperbarui`);
                  setOpen(false);
                  router.refresh();
                } else {
                  toast.error(result?.error);
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
