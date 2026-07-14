import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import {
  TextFilter,
  textFilterFn,
} from '@/components/shared/table/filters/text-filter';

describe('TextFilter component', () => {
  it('renders an input with current value', () => {
    render(<TextFilter value="Ahmad" onChange={() => {}} />);
    const input = screen.getByRole('textbox') as HTMLInputElement;
    expect(input.value).toBe('Ahmad');
  });

  it('calls onChange on input', () => {
    let value: unknown = undefined;
    render(
      <TextFilter
        value={undefined}
        onChange={(v) => {
          value = v;
        }}
      />
    );
    fireEvent.change(screen.getByRole('textbox'), {
      target: { value: 'test' },
    });
    expect(value).toBe('test');
  });

  it('calls onChange with undefined for empty input', () => {
    let value: unknown = 'something';
    render(
      <TextFilter
        value="something"
        onChange={(v) => {
          value = v;
        }}
      />
    );
    fireEvent.change(screen.getByRole('textbox'), { target: { value: '' } });
    expect(value).toBeUndefined();
  });
});

describe('textFilterFn', () => {
  it('matches case-insensitive substring', () => {
    const row = { getValue: () => 'Ahmad Fauzi' };
    expect(textFilterFn(row as never, 'name', 'ahmad')).toBe(true);
    expect(textFilterFn(row as never, 'name', 'FAUZI')).toBe(true);
    expect(textFilterFn(row as never, 'name', 'Budi')).toBe(false);
  });

  it('handles null cell value', () => {
    const row = { getValue: () => null };
    expect(textFilterFn(row as never, 'name', 'test')).toBe(false);
  });
});
