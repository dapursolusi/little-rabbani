import { kidColumns } from '@/features/kid/columns';
import * as kidService from '@/features/kid/services';

import { DataTable } from '@/components/shared/table/data-table';

import { baseMetadata } from '@/lib/metadata';

export const metadata = { ...baseMetadata, title: 'Murid' };

export default async function KidListPage() {
  const kids = await kidService.getKids();

  return (
    <DataTable
      columns={kidColumns}
      data={kids.items}
      meta={{ label: 'Murid', domain: 'kid' }}
      createHref="/dashboard/kid/create"
      emptyState={{
        createFreshRow: {
          type: 'href',
          href: '/dashboard/kid/create',
        },
      }}
    />
  );
}
