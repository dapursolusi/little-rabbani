import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import {
  SelectFilter,
  selectFilterFn,
} from '@/components/shared/table/filters/select-filter';

const OPTIONS = [
  { label: 'Terdaftar', value: 'enrolled' },
  { label: 'Menunggu', value: 'waiting' },
  { label: 'Alumni', value: 'alumni' },
];

describe('SelectFilter component', () => {
  it('renders options with "Semua" default', () => {
    render(
      <SelectFilter value={undefined} onChange={() => {}} options={OPTIONS} />
    );
    expect(screen.getByRole('combobox')).toBeDefined();
    expect(screen.getByText('Semua')).toBeDefined();
    expect(screen.getByText('Terdaftar')).toBeDefined();
  });

  it('calls onChange when an option is selected', () => {
    let value: unknown = undefined;
    render(
      <SelectFilter
        value={undefined}
        onChange={(v) => {
          value = v;
        }}
        options={OPTIONS}
      />
    );
    fireEvent.change(screen.getByRole('combobox'), {
      target: { value: 'enrolled' },
    });
    expect(value).toBe('enrolled');
  });

  it('calls onChange with undefined when "Semua" is selected', () => {
    let value: unknown = 'enrolled';
    render(
      <SelectFilter
        value="enrolled"
        onChange={(v) => {
          value = v;
        }}
        options={OPTIONS}
      />
    );
    fireEvent.change(screen.getByRole('combobox'), {
      target: { value: '' },
    });
    expect(value).toBeUndefined();
  });
});

describe('selectFilterFn', () => {
  it('matches exact string value', () => {
    const row = { getValue: () => 'enrolled' };
    expect(selectFilterFn(row as never, 'status', 'enrolled', () => {})).toBe(
      true
    );
    expect(selectFilterFn(row as never, 'status', 'waiting', () => {})).toBe(
      false
    );
  });

  it('returns true for undefined filter value (passthrough)', () => {
    const row = { getValue: () => 'enrolled' };
    expect(selectFilterFn(row as never, 'status', undefined, () => {})).toBe(
      true
    );
  });

  it('returns false for null row value', () => {
    const row = { getValue: () => null };
    expect(selectFilterFn(row as never, 'status', 'enrolled', () => {})).toBe(
      false
    );
  });
});
