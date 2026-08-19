import { getKids } from '@/features/kids/actions';
import { kidColumns } from '@/features/kids/components/columns';
import { Kid } from '@/features/kids/types';

import { DataTable } from '@/components/shared/table/data-table';

import { baseMetadata } from '@/lib/metadata';

export const metadata = { ...baseMetadata, title: 'Murid' };

interface KidListPageProps {
  searchParams: Promise<{ search?: string }>;
}

export default async function KidListPage({ searchParams }: KidListPageProps) {
  const { search } = await searchParams;
  const result = await getKids({ ...(search ? { search } : {}), limit: 1000 });

  if (!result.success) {
    return (
      <div className="p-4 text-center text-destructive">{result.error}</div>
    );
  }

  const kids = result.data as unknown as Kid[];

  return (
    <DataTable
      columns={kidColumns}
      data={kids}
      meta={{ label: 'Murid', domain: 'kid' }}
      createHref="/dashboard/kid/create"
    />
  );
}
