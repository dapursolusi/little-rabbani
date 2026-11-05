'use client';
import { useOngoingTerm } from '@/contexts/ongoing-term';

import { Badge } from '../ui/badge';

export default function OngoingTermLabel() {
  const { ongoingTerm } = useOngoingTerm();

  return (
    <Badge variant="default" className="ml-auto bg-primary font-light">
      {ongoingTerm?.name}
    </Badge>
  );
}
