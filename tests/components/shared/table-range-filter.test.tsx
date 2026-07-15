import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import {
  RangeFilter,
  rangeFilterFn,
} from '@/components/shared/table/filters/range-filter';

const stubColumn = {} as never;

describe('RangeFilter component', () => {
  it('renders min and max inputs', () => {
    render(
      <RangeFilter column={stubColumn} value={undefined} onChange={() => {}} />
    );
    expect(screen.getByLabelText('Nilai minimum')).toBeDefined();
    expect(screen.getByLabelText('Nilai maksimum')).toBeDefined();
  });

  it('calls onChange with range on min input', () => {
    let value: unknown = undefined;
    render(
      <RangeFilter
        column={stubColumn}
        value={undefined}
        onChange={(v) => {
          value = v;
        }}
      />
    );
    fireEvent.change(screen.getByLabelText('Nilai minimum'), {
      target: { value: '3' },
    });
    expect(value).toEqual({ min: 3 });
  });

  it('calls onChange with range on max input', () => {
    let value: unknown = undefined;
    render(
      <RangeFilter
        column={stubColumn}
        value={undefined}
        onChange={(v) => {
          value = v;
        }}
      />
    );
    fireEvent.change(screen.getByLabelText('Nilai maksimum'), {
      target: { value: '10' },
    });
    expect(value).toEqual({ max: 10 });
  });
});

describe('rangeFilterFn', () => {
  it('filters rows within range', () => {
    const row = { getValue: () => 5 };
    expect(
      rangeFilterFn(row as never, 'age', { min: 3, max: 7 }, () => {})
    ).toBe(true);
    expect(
      rangeFilterFn(row as never, 'age', { min: 6, max: 10 }, () => {})
    ).toBe(false);
    expect(rangeFilterFn(row as never, 'age', { min: 3 }, () => {})).toBe(true);
    expect(rangeFilterFn(row as never, 'age', { max: 7 }, () => {})).toBe(true);
  });

  it('returns false for NaN cell value', () => {
    const row = { getValue: () => 'not a number' };
    expect(rangeFilterFn(row as never, 'name', { min: 3 }, () => {})).toBe(
      false
    );
  });
});
