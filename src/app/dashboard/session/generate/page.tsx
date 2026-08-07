import { redirect } from 'next/navigation';

import { baseMetadata } from '@/lib/metadata';

export const metadata = { ...baseMetadata, title: 'Tipe Sesi' };

export default function GenerateSessionRedirect() {
  redirect('/dashboard/owner/session-type');
}
