import { useState } from 'react';

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
  ongoingTermId,
}: {
  termId: string;
  ongoingTermId?: string;
}) {
  if (!ongoingTermId) return null;
  if (termId === ongoingTermId) return <Badge>Sedang Berjalan</Badge>;
}

export default function TermSelector({
  terms,
  value,
  defaultValue,
  onValueChange,
  ongoingTermId,
}: {
  terms: Term[];
  value?: string;
  defaultValue?: string;
  onValueChange?: (val: string) => void;
  ongoingTermId?: string;
}) {
  const [internalValue, setInternalValue] = useState<string>(
    defaultValue ?? terms[0]?.id ?? ''
  );
  const selectedTermId = value ?? internalValue;
  const handleValueChange = (termId: string | null) => {
    if (!termId) return null;

    if (!value) {
      setInternalValue(termId);
    }

    onValueChange?.(termId);
  };

  return (
    <div className="flex flex-col gap-3 items-start mb-1.5">
      <Label
        htmlFor="term-select"
        className="text-sm font-medium text-muted-foreground"
      >
        Batch
      </Label>
      <Select
        id="term-select"
        onValueChange={handleValueChange}
        value={selectedTermId ?? terms[0]?.id ?? ''}
      >
        <SelectTrigger className="w-full">
          <SelectValue>
            {terms.find((term) => term.id === selectedTermId)?.name ??
              'Pilih Batch'}
            <OngoingTermBadge
              termId={selectedTermId}
              ongoingTermId={ongoingTermId}
            />
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {terms.map((term) => (
            <SelectItem key={term.id} value={term.id}>
              {term.name}
              <OngoingTermBadge
                termId={term.id}
                ongoingTermId={ongoingTermId}
              />
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
