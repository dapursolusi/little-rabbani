import { redirect } from 'next/navigation';

import { baseMetadata } from '@/lib/metadata';

export const metadata = { ...baseMetadata, title: 'Edit Tipe Sesi' };

export default function EditSessionRedirect() {
  redirect('/dashboard/owner/session-type');
}
