import { getClassSessions } from '@/features/class-session/actions';
import { classSessionColumns } from '@/features/class-session/columns';
import ClassSessionForm from '@/features/class-session/components/form';

import { DataTable } from '@/components/shared/table/data-table';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default async function ClassSessionListPage() {
  const result = await getClassSessions();

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
      columns={classSessionColumns}
      meta={{ label: 'Sesi Kelas', domain: 'class-session' }}
      createForm={{
        createForm: <ClassSessionForm />,
        meta: { label: 'Sesi Kelas', domain: 'class-session' },
      }}
    />
  );
}
