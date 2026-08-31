import * as kidAction from '@/features/kid/actions';
import { kidColumns } from '@/features/kid/columns';
import { Kid } from '@/features/kid/types';

import { DataTable } from '@/components/shared/table/data-table';

import { baseMetadata } from '@/lib/metadata';

export const metadata = { ...baseMetadata, title: 'Murid' };

export default async function KidListPage() {
  const result = await kidAction.getKids();

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
