import { redirect } from 'next/navigation';

import { baseMetadata } from '@/lib/metadata';

export const metadata = { ...baseMetadata, title: 'Buat Tipe Sesi' };

export default function CreateSessionRedirect() {
  redirect('/dashboard/owner/session-type/create');
}
