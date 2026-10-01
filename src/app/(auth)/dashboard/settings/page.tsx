import { headers } from 'next/headers';
import Link from 'next/link';
import { redirect } from 'next/navigation';

import { PageBreadcrumbs } from '@/components/shared/page-breadcrumbs';
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

import { auth } from '@/lib/auth';
import { baseMetadata } from '@/lib/metadata';

export const metadata = { ...baseMetadata, title: 'Pengaturan' };

export default async function SettingsPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect('/login');

  return (
    <div className="p-4 sm:p-6 max-w-2xl">
      <PageBreadcrumbs
        segments={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Pengaturan' },
        ]}
      />
      <h1 className="text-2xl font-semibold mt-4 mb-6">Pengaturan</h1>
      <div className="grid gap-4">
        <Link href="/dashboard/settings/report-template">
          <Card className="hover:bg-accent/50 transition-colors cursor-pointer">
            <CardHeader>
              <CardTitle>Template Laporan Harian</CardTitle>
              <CardDescription>
                Atur template laporan harian untuk laporan kelas.
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>
      </div>
    </div>
  );
}
