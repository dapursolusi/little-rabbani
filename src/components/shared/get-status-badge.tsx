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
          className="border-warning/30 text-warning bg-warning/10"
        >
          Draft
        </Badge>
      );
    case 'sent':
      return (
        <Badge
          variant="default"
          className="bg-success/10 text-success hover:bg-success/10"
        >
          Terkirim
        </Badge>
      );
    case 'final':
      return (
        <Badge
          variant="default"
          className="bg-success/10 text-success hover:bg-success/10"
        >
          Final
        </Badge>
      );
    case 'stale':
      return (
        <Badge
          variant="default"
          className="bg-warning/10 text-warning hover:bg-warning/10"
        >
          Perlu Diperbarui
        </Badge>
      );
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}
