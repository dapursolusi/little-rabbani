import { termColumns } from '@/features/term/columns';
import TermForm from '@/features/term/components/form';
import * as termService from '@/features/term/services';

import { DataTable } from '@/components/shared/table/data-table';

export default async function TermListPage() {
  const terms = await termService.getTerms();

  return (
    <DataTable
      data={terms ?? []}
      columns={termColumns}
      meta={{ label: 'Batch', domain: 'term' }}
      createForm={{
        createForm: <TermForm />,
        meta: { label: 'Batch', domain: 'term' },
      }}
      emptyState={{
        createFreshRow: {
          type: 'form',
          form: <TermForm />,
          meta: { label: 'Batch', domain: 'term' },
        },
      }}
    />
  );
}
