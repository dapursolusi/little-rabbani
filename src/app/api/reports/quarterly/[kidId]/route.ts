import { NextRequest, NextResponse } from 'next/server';

import { and, eq } from 'drizzle-orm';

import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { kid, quarterlyReportSnapshot, term } from '@/lib/db/schema';
import { formatTermPeriod, generateQuarterlyPdf } from '@/lib/pdf/generate-pdf';

/**
 * GET /api/reports/quarterly/[kidId]?termId=xxx
 *
 * Returns the quarterly report PDF for a given kid and term.
 * - If a finalized PDF exists in the DB (base64), returns it directly.
 * - Otherwise, generates a new PDF from the saved sections and returns it.
 * - If react-pdf fails, falls back to a JSON response with the report data
 *   for an HTML view (VAL-QUARTERLY-009).
 *
 * Owner-only: Teacher access returns 403 (VAL-QUARTERLY-012).
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ kidId: string }> }
) {
  const { kidId } = await params;
  const { searchParams } = new URL(request.url);
  const termId = searchParams.get('termId');

  if (!termId) {
    return NextResponse.json(
      { error: 'Parameter termId diperlukan' },
      { status: 400 }
    );
  }

  // Auth check
  const session = await auth.api.getSession({
    headers: request.headers,
  });

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (session.user.role !== 'owner') {
    return NextResponse.json(
      { error: 'Akses Diblokir. Hanya Owner yang dapat mengunduh PDF.' },
      { status: 403 }
    );
  }

  // Get kid info
  const kidData = await db.query.kid.findFirst({
    where: eq(kid.id, kidId),
    columns: { id: true, name: true },
  });

  if (!kidData) {
    return NextResponse.json(
      { error: 'Murid tidak ditemukan' },
      { status: 404 }
    );
  }

  // Get term info
  const termData = await db.query.term.findFirst({
    where: eq(term.id, termId),
    columns: { id: true, name: true, startDate: true, endDate: true },
  });

  if (!termData) {
    return NextResponse.json(
      { error: 'Term tidak ditemukan' },
      { status: 404 }
    );
  }

  // Get the quarterly report
  const report = await db.query.quarterlyReportSnapshot.findFirst({
    where: and(
      eq(quarterlyReportSnapshot.kidId, kidId),
      eq(quarterlyReportSnapshot.termId, termId)
    ),
  });

  if (!report) {
    return NextResponse.json(
      {
        error:
          'Laporan trivulan belum dibuat. Generate laporan terlebih dahulu.',
      },
      { status: 404 }
    );
  }

  const sections = report.sectionsJson as {
    changes?: string;
    improvements?: string;
    recommendations?: string;
  } | null;

  if (!sections) {
    return NextResponse.json(
      { error: 'Laporan trivulan belum memiliki konten.' },
      { status: 400 }
    );
  }

  // Helper to create PDF response
  const buildPdfResponse = (data: Uint8Array, name: string) => {
    const fileName = `laporan-trivulan-${name.toLowerCase().replace(/\s+/g, '-')}-${termData.name.toLowerCase().replace(/\s+/g, '-')}.pdf`;

    return new NextResponse(
      new ReadableStream({
        start(controller) {
          controller.enqueue(data);
          controller.close();
        },
      }),
      {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${fileName}"`,
        },
      }
    );
  };

  const kidNameSlug = kidData.name;

  // If PDF data already exists, return it
  if (report.pdfData) {
    const pdfData = Uint8Array.from(atob(report.pdfData), (c) =>
      c.charCodeAt(0)
    );
    return buildPdfResponse(pdfData, kidNameSlug);
  }

  // Generate PDF on the fly
  const pdfBuffer = await generateQuarterlyPdf({
    kidName: kidData.name,
    termName: termData.name,
    termPeriod: formatTermPeriod(termData.startDate, termData.endDate),
    sections: {
      changes: sections.changes ?? '',
      improvements: sections.improvements ?? '',
      recommendations: sections.recommendations ?? '',
    },
    stats: report.statsJson as
      import('@/lib/actions/quarterly-report').IQuarterlyStats | null,
  });

  // VAL-QUARTERLY-009: react-pdf failure — fallback to HTML view
  if (!pdfBuffer) {
    return NextResponse.json(
      {
        error: 'Gagal membuat PDF. Laporan dapat dilihat dalam tampilan HTML.',
        report: {
          kidName: kidData.name,
          termName: termData.name,
          termPeriod: formatTermPeriod(termData.startDate, termData.endDate),
          sections,
          stats: report.statsJson,
        },
        fallback: true,
      },
      { status: 200 }
    );
  }

  // Store the generated PDF as base64 in DB (VAL-QUARTERLY-007)
  const base64Str = Buffer.from(pdfBuffer).toString('base64');
  await db
    .update(quarterlyReportSnapshot)
    .set({
      pdfData: base64Str,
      updatedAt: new Date(),
    })
    .where(eq(quarterlyReportSnapshot.id, report.id));

  return buildPdfResponse(pdfBuffer, kidNameSlug);
}
