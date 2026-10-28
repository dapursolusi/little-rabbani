import { useState } from 'react';

import { useOngoingTerm } from '@/contexts/ongoing-term';
import { Term } from '@/features/term/types';

import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

function OngoingTermBadge({
  termId,
}: {
  termId: string;
  ongoingTermId?: string;
}) {
  const { ongoingTerm } = useOngoingTerm();
  if (!ongoingTerm?.id) return null;
  if (termId === ongoingTerm.id) return <Badge>Sedang Berjalan</Badge>;
}

export default function TermSelector({
  terms,
  value,
  defaultValue,
  onValueChange,
  showLabel = true,
}: {
  terms: Term[];
  value?: string;
  defaultValue?: string;
  onValueChange?: (val: string) => void;
  showLabel?: boolean;
}) {
  const { ongoingTerm } = useOngoingTerm();
  const [internalValue, setInternalValue] = useState<string>(
    defaultValue ?? ''
  );
  const selectedTermId =
    value !== undefined ? value : internalValue || ongoingTerm?.id || '';
  const handleValueChange = (termId: string | null) => {
    if (termId === null) return;

    if (value === undefined) {
      setInternalValue(termId);
    }

    onValueChange?.(termId);
  };
  console.log({ value, defaultValue, internalValue, selectedTermId });

  return (
    <div className="flex flex-col gap-3 items-start mb-1.5">
      {showLabel && (
        <Label
          htmlFor="term-select"
          className="text-sm font-medium text-muted-foreground"
        >
          Batch
        </Label>
      )}
      <Select
        id="term-select"
        onValueChange={handleValueChange}
        value={selectedTermId}
      >
        <SelectTrigger className="w-full">
          <SelectValue>
            {terms.find((term) => term.id === selectedTermId)?.name ??
              'Pilih Batch'}
            <OngoingTermBadge termId={selectedTermId} />
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {terms.map((term) => (
            <SelectItem key={term.id} value={term.id}>
              {term.name}
              <OngoingTermBadge termId={term.id} />
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
