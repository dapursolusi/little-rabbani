'use client';

import type { ReactNode } from 'react';

/**
 * Form contract for DataTable create (SaveModal). Not serializable data — the
 * create form must be a client component that resolves its own Zod schema
 * (Zod instances can't cross the Server→Client boundary). Render it directly.
 */
export interface TableFormProps {
  /** Client-rendered create form, e.g. <KidForm mode="create" ... />. */
  createForm: ReactNode;
  meta?: { label: string; domain?: string };
}
