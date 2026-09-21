'use client';

import { useCallback, useEffect, useState } from 'react';

import { useRouter } from 'next/navigation';

import { ClassSession } from '@/features/class-session/types';
import { LeanKid } from '@/features/kid/types';
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

import * as kidEnrollmentAction from '../actions';
import {
  NewKidIdsContext,
  UpdateModeContext,
  kidEnrollmentColumns,
  kidEnrollmentSessionColumn,
  kidEnrollmentUpdateActionColumn,
} from '../columns';
import { KidToBeEnrolled } from '../schema';
import { KidEnrollment } from '../types';
import UpdateEnrolledKids from './update-enrolled-kids';

export default function KidEnrollmentClient({
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
  const [isUpdateMode, setIsUpdateMode] = useState<boolean>(false);
  // const [isAddKidModalOpen, setIsAddKidModalOpen] = useState<boolean>(false);
  const [availableKids, setAvailableKids] = useState<LeanKid[]>([]);
  const [enrolledKids, setEnrolledKids] = useState(data);
  const [created, setCreated] = useState<KidToBeEnrolled[]>([]);

  const [updated, setUpdated] = useState<Map<string, KidEnrollment>>(new Map());

  const [deleted, setDeleted] = useState<Set<string>>(new Set());

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
    ? [
        ...kidEnrollmentColumns,
        kidEnrollmentSessionColumn,
        ...(isUpdateMode ? [kidEnrollmentUpdateActionColumn] : []),
      ]
    : [
        ...kidEnrollmentColumns,
        ...(isUpdateMode ? [kidEnrollmentUpdateActionColumn] : []),
      ];

  const newKidIds = new Set(created.map((k) => k.kidId));
  const createdIds = new Set(created.map((k) => k.kidId));
  const deletedIds = deleted;
  const hasChanges = created.length > 0 || updated.size > 0 || deleted.size > 0;

  const handleRemoveNew = useCallback(
    (kidId: string) => {
      const kidData = enrolledKids.find((k) => k.kidId === kidId);
      if (kidData) {
        setAvailableKids((current) => [
          ...current,
          { id: kidData.kidId, name: kidData.kid.name },
        ]);
      }
      setCreated((prev) => prev.filter((k) => k.kidId !== kidId));
      setEnrolledKids((prev) => prev.filter((k) => k.kidId !== kidId));
    },
    [enrolledKids]
  );

  const handleToggleDeleted = useCallback((enrollmentId: string) => {
    setDeleted((prev) => {
      const next = new Set(prev);
      if (next.has(enrollmentId)) {
        next.delete(enrollmentId);
      } else {
        next.add(enrollmentId);
      }
      return next;
    });
  }, []);

  const handleUpdateToggle = useCallback(() => {
    setIsUpdateMode((prev) => !prev);
    if (isUpdateMode) {
      // Exiting update mode — reset all local state
      setCreated([]);
      setUpdated(new Map());
      setDeleted(new Set());
      setEnrolledKids(data);
    }
  }, [isUpdateMode, data]);

  // Fetch available kids when entering update mode
  useEffect(() => {
    if (!isUpdateMode) return;
    const fetchAvailable = async () => {
      const result = await kidEnrollmentAction.getAvailableKids({
        termId: selectedTermId ?? '',
        classSessionId: selectedClassSessionId ?? '',
      });
      if (result.success) {
        setAvailableKids(result.data);
      }
    };
    fetchAvailable();
  }, [isUpdateMode, selectedTermId, selectedClassSessionId]);

  const handleAdd = useCallback(
    async (kidIds: Set<string>) => {
      const selectedKids = availableKids.filter((kid) => kidIds.has(kid.id));
      const newEnrollments: KidToBeEnrolled[] = selectedKids.map((kid) => ({
        kidId: kid.id,
        status: 'enrolled',
      }));

      setEnrolledKids((current) => {
        const newKids: KidEnrollment[] = selectedKids.map((kid) => ({
          id: crypto.randomUUID(),
          termId: selectedTermId ?? '',
          classSessionId: selectedClassSessionId ?? '',
          kidId: kid.id,
          status: 'enrolled',
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
          kid: { id: kid.id, name: kid.name },
          classSession: { name: '' },
          term: { name: '' },
        }));
        return [...newKids, ...current];
      });

      setCreated((current) => [...current, ...newEnrollments]);

      // Remove just-added kids from available list locally (not saved to DB yet,
      // so a re-fetch would return them again)
      setAvailableKids((current) =>
        current.filter((kid) => !kidIds.has(kid.id))
      );
    },
    [selectedTermId, selectedClassSessionId, availableKids]
  );

  return (
    <div className="p-4 sm:p-6 flex flex-col gap-4">
      <div className="flex gap-4 items-center justify-between">
        <div className="flex flex-col gap-4 items-start">
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
                {selectedTermId === currentTermId && (
                  <Badge>Sedang Berjalan</Badge>
                )}
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
        </div>
        <Separator orientation="vertical" />
        <div className="flex flex-col gap-4 items-start">
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
        </div>
      </div>
      <Separator />
      <NewKidIdsContext.Provider value={newKidIds}>
        <UpdateModeContext.Provider
          value={{
            isUpdateMode,
            createdIds,
            deletedIds,
            onRemoveNew: handleRemoveNew,
            onToggleDeleted: handleToggleDeleted,
          }}
        >
          <DataTable
            columns={columns}
            data={enrolledKids}
            getRowClassName={(row) =>
              deletedIds.has((row as KidEnrollment).id)
                ? 'opacity-50'
                : undefined
            }
            meta={{
              label: 'Pendaftaran Murid',
              customActionLabel: 'Update',
              customActionIcon: DatabaseSyncIcon,
              domain: 'registration',
            }}
            createForm={{
              meta: {
                label: 'Pendaftaran Murid',
                domain: 'registration',
              },
              createForm: <div></div>,
            }}
            emptyStateIcon={ContractsIcon}
            toolbar={{
              showAll: !isUpdateMode,
            }}
            customAction={
              <UpdateEnrolledKids
                isUpdateMode={isUpdateMode}
                onUpdateToggle={handleUpdateToggle}
                kids={availableKids}
                onAdd={handleAdd}
                selectedClassSessionId={selectedClassSessionId ?? 'all'}
                hasChanges={hasChanges}
              />
            }
          />
        </UpdateModeContext.Provider>
      </NewKidIdsContext.Provider>
    </div>
  );
}
