import Link from 'next/link';

import {
  Alert01Icon,
  ArrowLeft01Icon,
  UserGroupIcon,
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';

import { EmptyState } from '@/components/shared/empty-state';

import { getSessionWithKids } from '@/lib/actions/capture';
import { baseMetadata } from '@/lib/metadata';

import { CaptureRosterClient } from './capture-roster';

export const metadata = { ...baseMetadata, title: 'Observasi Murid' };

interface ICaptureSessionPageProps {
  params: Promise<{ sessionId: string }>;
}

export default async function CaptureSessionPage({
  params,
}: ICaptureSessionPageProps) {
  const { sessionId } = await params;

  // ponytail: [sessionId] route — sessionId is used as sessionTypeId with today's date
  const today = new Date().toISOString().split('T')[0];
  const result = await getSessionWithKids(today, sessionId);

  if (!result.success) {
    return (
      <div className="p-4 sm:p-6">
        <Link
          href="/dashboard/teacher/capture"
          className="mb-4 inline-flex items-center gap-1 text-sm text-primary hover:underline"
        >
          <HugeiconsIcon icon={ArrowLeft01Icon} className="h-4 w-4" />
          Kembali
        </Link>
        <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-6 text-center">
          <HugeiconsIcon
            icon={Alert01Icon}
            className="mx-auto mb-2 h-6 w-6 text-destructive"
          />
          <p className="font-medium text-destructive">{result.error}</p>
        </div>
      </div>
    );
  }

  const { date, sessionType, kids } = result.data;

  return (
    <div className="flex min-h-screen flex-col bg-muted">
      {/* Sticky header */}
      <div className="sticky top-0 z-10 border-b border bg-background">
        <div className="flex items-center gap-2 px-4 py-3">
          <Link
            href="/dashboard/teacher/capture"
            className="flex items-center gap-1 text-sm text-primary hover:underline"
          >
            <HugeiconsIcon icon={ArrowLeft01Icon} className="h-4 w-4" />
            Kembali
          </Link>
        </div>
        <div className="px-4 pb-3">
          <h1 className="text-lg font-semibold text-foreground">
            Observasi Murid
          </h1>
          <p className="text-sm text-muted-foreground">
            {date} — {sessionType.start} — {sessionType.end}
            {sessionType.name && ` • ${sessionType.name}`}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {kids.length} murid terdaftar
          </p>
        </div>
      </div>

      <main className="flex-1">
        <CaptureRosterClient
          sessionId={sessionId}
          sessionDate={date}
          kids={kids.map((k) => ({
            id: k.id,
            name: k.name,
            captureState: k.captureState,
            observation: k.observation
              ? {
                  id: k.observation.id,
                  mood: k.observation.mood,
                  appetite: k.observation.appetite,
                  presence: k.observation.presence,
                  absenceReason: k.observation.absenceReason,
                  version: k.observation.version,
                  notes: k.observation.notes.map((n) => ({
                    id: n.id,
                    text: n.text,
                    createdAt: n.createdAt.toISOString(),
                  })),
                }
              : null,
          }))}
          isPass2Unlocked={false}
        />
      </main>

      {kids.length === 0 && (
        <div className="px-4 py-16">
          <EmptyState
            icon={<HugeiconsIcon icon={UserGroupIcon} className="h-12 w-12" />}
            title="Tidak ada anak di sesi ini"
          />
        </div>
      )}
    </div>
  );
}
