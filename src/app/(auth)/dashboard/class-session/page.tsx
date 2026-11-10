import { classSessionColumns } from '@/features/class-session/columns';
import ClassSessionForm from '@/features/class-session/components/form';
import * as classSessionService from '@/features/class-session/services';

import { DataTable } from '@/components/table/data-table';

export default async function ClassSessionListPage() {
  const classSessions = await classSessionService.getClassSessions();

  return (
    <DataTable
      data={classSessions}
      columns={classSessionColumns}
      meta={{ label: 'Sesi Kelas', domain: 'class-session' }}
      createForm={{
        createForm: <ClassSessionForm />,
        meta: { label: 'Sesi Kelas', domain: 'class-session' },
      }}
      emptyState={{
        createFreshRow: {
          type: 'form',
          form: <ClassSessionForm />,
          meta: { label: 'Sesi Kelas', domain: 'class-session' },
        },
      }}
    />
  );
}
