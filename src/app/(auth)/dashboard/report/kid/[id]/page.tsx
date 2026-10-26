import KidReportClient from '@/features/report/kid/components/client';

export default async function KidReportPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <div>
      <KidReportClient kidId={id} />
    </div>
  );
}
