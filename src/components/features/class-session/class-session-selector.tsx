import { useState } from 'react';

import { ClassSession } from '@/features/class-session/types';

import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function ClassSessionSelector({
  classSessions,
  value,
  defaultValue,
  onValueChange,
}: {
  classSessions: ClassSession[];
  value?: string;
  defaultValue?: string;
  onValueChange?: (val: string) => void;
}) {
  const [internalValue, setInternalValue] = useState<string>(
    defaultValue ?? classSessions[0]?.id ?? ''
  );
  const selectedClassSessionId = value ?? internalValue;
  const handleValueChange = (classSessionId: string | null) => {
    if (!classSessionId) return null;

    if (!value) {
      setInternalValue(classSessionId);
    }

    onValueChange?.(classSessionId);
  };
  return (
    <div className="flex flex-col gap-3 items-start mb-1.5">
      <Label
        htmlFor="class-session-select"
        className="text-sm font-medium text-muted-foreground"
      >
        Sesi Kelas
      </Label>
      <Select
        id="class-session-select"
        onValueChange={handleValueChange}
        value={selectedClassSessionId ?? 'Pilih Sesi Kelas'}
      >
        <SelectTrigger className="w-full">
          <SelectValue>
            {selectedClassSessionId
              ? classSessions.find((cs) => cs.id === selectedClassSessionId)
                  ?.name
              : 'Pilih Semua Sesi Kelas'}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Pilih Semua Sesi Kelas</SelectItem>
          {classSessions.map((cs) => (
            <SelectItem key={cs.id} value={cs.id}>
              {cs.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
