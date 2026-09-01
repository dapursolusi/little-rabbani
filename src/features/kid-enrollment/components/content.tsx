'use client';

import { useRouter } from 'next/navigation';

import { ClassSession } from '@/features/class-session/types';
import { Term } from '@/features/term/types';
import { ContractsIcon, DatabaseSyncIcon } from '@hugeicons/core-free-icons';

import { DataTable } from '@/components/shared/table/data-table';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';

import { kidEnrollmentColumns, kidEnrollmentSessionColumn } from '../columns';
import { KidEnrollment } from '../types';

export default function KidEnrollmentContent({
  data,
  terms,
  selectedTermId,
  classSessions,
  selectedClassSessionId,
  currentTermId,
}: {
  data: KidEnrollment[];
  terms: Term[];
  selectedTermId?: string;
  classSessions: ClassSession[];
  selectedClassSessionId?: string;
  currentTermId: string;
}) {
  const router = useRouter();

  // Merge into the current query string so pushing one param keeps the others
  // (?termId stays when a class session is picked, and vice versa).
  const pushParam = (
    key: 'termId' | 'classSessionId',
    value: string | null
  ) => {
    const params = new URLSearchParams(window.location.search);
    params.set(key, value ?? '');
    router.push(`?${params.toString()}`);
  };

  const showAllSessions = selectedClassSessionId === 'all';
  const columns = showAllSessions
    ? [...kidEnrollmentColumns, kidEnrollmentSessionColumn]
    : kidEnrollmentColumns;

  return (
    <div className="p-4 sm:p-6 flex flex-col gap-4">
      <Label
        htmlFor="term-select"
        className="text-sm font-medium text-muted-foreground"
      >
        Batch
      </Label>
      <Select
        id="term-select"
        onValueChange={(termId) => pushParam('termId', termId)}
        value={selectedTermId ?? terms[0]?.id ?? ''}
      >
        <SelectTrigger className="w-100">
          <SelectValue>
            {terms.find((term) => term.id === selectedTermId)?.name ??
              'Pilih Batch'}
            {selectedTermId === currentTermId && <Badge>Sedang Berjalan</Badge>}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {terms.map((term) => (
            <SelectItem key={term.id} value={term.id}>
              {term.name}
              {term.id === currentTermId && <Badge>Sedang Berjalan</Badge>}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Separator />
      <Label
        htmlFor="class-session-select"
        className="text-sm font-medium text-muted-foreground"
      >
        Sesi Kelas
      </Label>
      <Select
        id="class-session-select"
        onValueChange={(classSessionId) =>
          pushParam('classSessionId', classSessionId)
        }
        value={selectedClassSessionId ?? 'all'}
      >
        <SelectTrigger className="w-100">
          <SelectValue>
            {selectedClassSessionId
              ? classSessions.find((cs) => cs.id === selectedClassSessionId)
                  ?.name
              : 'Pilih Semua Sesi Kelas'}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Pilih Semua Sesi Kelas</SelectItem>
          {classSessions.map((cs) => (
            <SelectItem key={cs.id} value={cs.id}>
              {cs.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Separator />
      <DataTable
        columns={columns}
        data={data}
        meta={{
          label: 'Pendaftaran Murid',
          customActionLabel: 'Update',
          customActionIcon: DatabaseSyncIcon,
          domain: 'registration',
        }}
        createHref="/dashboard/registration/update"
        emptyStateIcon={ContractsIcon}
      />
    </div>
  );
}
