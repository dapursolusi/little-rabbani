'use client';

import { useEffect, useState } from 'react';

import { Input } from '@/components/ui/input';

interface ISearchInputProps {
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  debounceMs?: number;
}

export function SearchInput({
  placeholder = 'Cari...',
  value,
  onChange,
  debounceMs = 300,
}: ISearchInputProps) {
  const [localValue, setLocalValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      onChange(localValue);
    }, debounceMs);
    return () => clearTimeout(timer);
  }, [localValue, debounceMs, onChange]);

  // Sync external value changes
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      setLocalValue(value);
    });
    return () => cancelAnimationFrame(frame);
  }, [value]);

  return (
    <Input
      type="text"
      placeholder={placeholder}
      value={localValue}
      onChange={(e) => setLocalValue(e.target.value)}
      className="max-w-xs"
    />
  );
}
