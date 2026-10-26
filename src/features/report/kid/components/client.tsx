'use client';

interface KidReportClientProps {
  kidId: string;
}

export default function KidReportClient({ kidId }: KidReportClientProps) {
  return <div>Kid Id: {kidId}</div>;
}
