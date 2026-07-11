import { redirect } from 'next/navigation';

import { baseMetadata } from '@/lib/metadata';

import { CaptureSessionPickerClient } from './_client';
import { getTeacherSessions } from './actions';

export const metadata = { ...baseMetadata, title: 'Observasi Murid' };

export default async function CaptureSessionPickerPage() {
  const result = await getTeacherSessions();

  if (!result.success) {
    if (result.error === 'redirect') {
      redirect('/login');
    }
    return (
      <div className="p-4 text-center text-destructive">{result.error}</div>
    );
  }

  return <CaptureSessionPickerClient />;
}
