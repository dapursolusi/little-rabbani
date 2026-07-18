import { getGuardians } from '@/features/guardian/actions';
import { createKid, getKids } from '@/features/kid/actions';
import { kidColumns } from '@/features/kid/components/columns';
import { kidFields } from '@/features/kid/fields';
import { Kid } from '@/features/kid/types';
import { getTerms } from '@/features/term/actions';

import { DataTable } from '@/components/shared/table/data-table';

import { baseMetadata } from '@/lib/metadata';

export const metadata = { ...baseMetadata, title: 'Murid' };

interface IKidListPageProps {
  searchParams: Promise<{ search?: string }>;
}

export default async function KidListPage({ searchParams }: IKidListPageProps) {
  const { search } = await searchParams;

  const result = await getKids({ ...(search ? { search } : {}), limit: 1000 });

  if (!result.success) {
    return (
      <div className="p-4 text-center text-destructive">{result.error}</div>
    );
  }

  const kids = result.data as unknown as Kid[];
  const guardians = await getGuardians();

  const terms = await getTerms();

  return (
    <div className="p-4 sm:p-6">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Murid</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Kelola data murid
          </p>
        </div>
      </div>
      <div className="overflow-x-auto rounded-lg">
        <DataTable
          columns={kidColumns}
          data={kids}
          meta={{
            label: metadata.title,
          }}
          form={{
            schemaKey: 'kid',
            initialData: {
              name: '',
              dob: '',
              guardianId: '',
              status: 'enrolled' as const,
              enrolledTermId: '',
            },
            formFields: kidFields({
              guardians: guardians?.data || [],
              enrolledTerms: terms?.data || [],
            }),
            onSubmit: createKid,
          }}
        />
      </div>
    </div>
  );
}
