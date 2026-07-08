import { Badge } from '@/components/ui/badge';

/**
 * Shared getStatusBadge helper for report statuses.
 * Used across daily, monthly, and quarterly reports.
 */
export function getStatusBadge(status: string) {
  switch (status) {
    case 'draft':
      return (
        <Badge
          variant="outline"
          className="border-amber-300 text-amber-700 bg-amber-50"
        >
          Draft
        </Badge>
      );
    case 'sent':
      return (
        <Badge
          variant="default"
          className="bg-green-100 text-green-700 hover:bg-green-100"
        >
          ✓ Terkirim
        </Badge>
      );
    case 'final':
      return (
        <Badge
          variant="default"
          className="bg-green-100 text-green-700 hover:bg-green-100"
        >
          ✓ Final
        </Badge>
      );
    case 'stale':
      return (
        <Badge
          variant="default"
          className="bg-purple-100 text-purple-700 hover:bg-purple-100"
        >
          ⚠️ Perlu Diperbarui
        </Badge>
      );
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}
