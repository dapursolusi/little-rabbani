import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

import { reportTemplateService } from '@/features/daily-class-report/services';

import { auth } from '@/lib/auth';
import { baseMetadata } from '@/lib/metadata';

import ReportTemplateClient from './client';

export const metadata = { ...baseMetadata, title: 'Template Laporan' };

export default async function ReportTemplatePage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect('/login');
  if (session.user.role !== 'owner') redirect('/dashboard');

  const template =
    (await reportTemplateService.getDefaultTemplate()).content ?? '';

  return <ReportTemplateClient initialContent={template} />;
}
