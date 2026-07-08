import Link from 'next/link';

import { UserGroupIcon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';

import { getSessionWithKids } from '@/lib/actions/capture';
import { formatDate } from '@/lib/format';
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
  const result = await getSessionWithKids(sessionId);

  // Blocked state (holiday, before session start)
  if (!result.success) {
    return (
      <div className="p-4 sm:p-6">
        <Link
          href="/dashboard/teacher/capture"
          className="mb-4 inline-block text-sm text-primary hover:underline"
        >
          &larr; Kembali
        </Link>
        <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
          <p className="font-medium text-red-700">⚠️ {result.error}</p>
        </div>
      </div>
    );
  }

  const { session, kids } = result.data;

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50">
      {/* Sticky header */}
      <div className="sticky top-0 z-10 border-b border-zinc-200 bg-white">
        <div className="flex items-center gap-2 px-4 py-3">
          <Link
            href="/dashboard/teacher/capture"
            className="text-sm text-primary hover:underline"
          >
            &larr; Kembali
          </Link>
        </div>
        <div className="px-4 pb-3">
          <h1 className="text-lg font-semibold text-zinc-900">
            Observasi Murid
          </h1>
          <p className="text-sm text-zinc-500">
            {formatDate(session.date)} — {session.startTime} — {session.endTime}
            {session.label && ` • ${session.label}`}
          </p>
          <p className="mt-1 text-xs text-zinc-400">
            {kids.length} murid terdaftar
          </p>
        </div>
      </div>

      <main className="flex-1">
        {/* VAL-CAPTURE-017: Roster with per-kid capture state */}
        <CaptureRosterClient
          sessionId={sessionId}
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

      {/* No kids - empty roster (VAL-CAPTURE-027) */}
      {kids.length === 0 && (
        <div className="flex flex-col items-center justify-center px-4 py-16">
          <HugeiconsIcon
            icon={UserGroupIcon}
            className="h-12 w-12 text-zinc-300"
          />
          <p className="mt-4 text-sm text-zinc-500">
            Tidak ada anak di sesi ini
          </p>
        </div>
      )}
    </div>
  );
}
