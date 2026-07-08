import type { Metadata } from 'next';

import { baseMetadata } from '@/lib/metadata';

export const metadata: Metadata = {
  ...baseMetadata,
  title: 'Pengaturan - Owner',
};

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
