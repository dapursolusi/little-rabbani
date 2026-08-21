import { getTerms } from '@/features/term/actions';
import { termColumns } from '@/features/term/components/columns';
import TermForm from '@/features/term/components/form';

import { DataTable } from '@/components/shared/table/data-table';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default async function TermListPage() {
  const result = await getTerms();
  console.log('result', result);
  if (!result.success) {
    return (
      <Alert>
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>Gagal memuat data</AlertDescription>
      </Alert>
    );
  }

  return (
    <DataTable
      data={result.data}
      columns={termColumns}
      meta={{ label: 'Batch', domain: 'term' }}
      createForm={{
        createForm: <TermForm />,
        meta: { label: 'Batch', domain: 'term' },
      }}
    />
  );
}
