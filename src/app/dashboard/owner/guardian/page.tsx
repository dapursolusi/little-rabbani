import { getGuardians } from '@/features/guardian/actions';
import { guardianColumns } from '@/features/guardian/components/columns';

import { DataTable } from '@/components/shared/table/data-table';

import { baseMetadata } from '@/lib/metadata';

export const metadata = { ...baseMetadata, title: 'Wali Murid' };

const PAGE_SIZE = 50;

interface IGuardianListPageProps {
  searchParams: Promise<{ search?: string; page?: string }>;
}

export default async function GuardianListPage({
  searchParams,
}: IGuardianListPageProps) {
  const { search, page } = await searchParams;
  const currentPage = Math.max(1, Number(page) || 1);
  const offset = (currentPage - 1) * PAGE_SIZE;

  const result = await getGuardians({ search, limit: PAGE_SIZE, offset });

  if (!result.success) {
    return (
      <div className="p-4 text-center text-destructive">{result.error}</div>
    );
  }

  const guardians = result.data;

  return (
    <section className="p-4 sm:p-6">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Wali Murid</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Kelola data wali murid
          </p>
        </div>
      </div>
      <div className="overflow-x-auto rounded-lg">
        <DataTable
          columns={guardianColumns}
          data={guardians}
          meta={{ label: metadata.title }}
        />
      </div>
    </section>
  );
}
