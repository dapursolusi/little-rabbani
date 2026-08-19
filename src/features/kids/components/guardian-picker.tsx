'use client';

import { useEffect, useState } from 'react';

import {
  type GuardianSearchResult,
  searchGuardians,
} from '@/features/kids/actions';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type GuardianPickerProps = {
  value?: string;
  onChange: (id: string) => void;
  invalid?: boolean;
  summary?: GuardianSearchResult;
};

export default function GuardianPicker({
  value,
  onChange,
  invalid,
  summary,
}: GuardianPickerProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<GuardianSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [picked, setPicked] = useState<GuardianSearchResult | undefined>();

  // Debounced search: 300ms after typing stops, fetch matching guardians.
  // Short queries reset in the input's onChange, not here (set-state-in-effect).
  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) return;
    let active = true;
    const timer = setTimeout(async () => {
      if (active) setLoading(true);
      try {
        const res = await searchGuardians(q);
        if (active) {
          if (res.success) {
            setResults(res.data);
            setError('');
          } else {
            setResults([]);
            setError(res.error);
          }
        }
      } catch {
        if (active) {
          setResults([]);
          setError('Gagal mencari wali');
        }
      } finally {
        if (active) setLoading(false);
      }
    }, 300);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [query]);

  // A `value` with no matching summary (remount after mode toggle, or edit
  // re-pick) is stale — clear it so validation blocks submit until re-pick.
  const current = picked ?? summary;
  useEffect(() => {
    if (value && current?.id !== value) {
      onChange('');
    }
  }, [value, current, onChange]);

  if (value && current?.id === value) {
    // Selected state: show a read-only summary (cached search pick or edit-mode summary).
    return (
      <div className="space-y-2 rounded-lg border p-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="font-medium">{current?.name}</p>
            <p className="text-sm text-muted-foreground">{current?.phone}</p>
            {current?.email ? (
              <p className="text-sm text-muted-foreground">{current.email}</p>
            ) : null}
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onChange('')}
          >
            Ganti
          </Button>
        </div>
        {current?.kids.length ? (
          <div className="flex flex-wrap gap-1">
            {current.kids.map((kid) => (
              <Badge key={kid.id} variant="secondary">
                {kid.name}
              </Badge>
            ))}
          </div>
        ) : null}
      </div>
    );
  }

  const trimmed = query.trim();
  return (
    <div className="space-y-2">
      <Input
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          // Reset search state immediately on short/empty input.
          if (e.target.value.trim().length < 2) {
            setResults([]);
            setLoading(false);
            setError('');
          }
        }}
        placeholder="Cari wali berdasarkan nama atau nomor telepon…"
        aria-invalid={invalid}
      />
      {loading ? (
        <p className="text-sm text-muted-foreground">Mencari…</p>
      ) : null}
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {!loading && !error && results.length > 0 ? (
        <ul className="divide-y overflow-hidden rounded-lg border">
          {results.map((g) => (
            <li key={g.id}>
              <button
                type="button"
                className="w-full px-3 py-2 text-left hover:bg-muted"
                onClick={() => {
                  setPicked(g);
                  onChange(g.id);
                }}
              >
                <p className="text-sm font-medium">{g.name}</p>
                <p className="text-xs text-muted-foreground">{g.phone}</p>
                {g.kids.length > 0 ? (
                  <div className="mt-1 flex flex-wrap gap-1">
                    {g.kids.map((kid) => (
                      <Badge key={kid.id} variant="secondary">
                        {kid.name}
                      </Badge>
                    ))}
                  </div>
                ) : null}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      {!loading && !error && trimmed.length >= 2 && results.length === 0 ? (
        <p className="text-sm text-muted-foreground">Wali tidak ditemukan</p>
      ) : null}
    </div>
  );
}
