import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import {
  TextFilter,
  textFilterFn,
} from '@/components/shared/table/filters/text-filter';

const stubColumn = {} as never;

describe('TextFilter component', () => {
  it('renders an input with current value', () => {
    render(
      <TextFilter column={stubColumn} value="Ahmad" onChange={() => {}} />
    );
    const input = screen.getByRole('textbox') as HTMLInputElement;
    expect(input.value).toBe('Ahmad');
  });

  it('debounces onChange (300ms)', async () => {
    vi.useFakeTimers();
    const onChange = vi.fn();
    render(
      <TextFilter column={stubColumn} value={undefined} onChange={onChange} />
    );
    fireEvent.change(screen.getByRole('textbox'), {
      target: { value: 'test' },
    });
    expect(onChange).not.toHaveBeenCalled();
    vi.advanceTimersByTime(300);
    expect(onChange).toHaveBeenCalledWith('test');
    vi.useRealTimers();
  });

  it('calls onChange with undefined for empty input', async () => {
    vi.useFakeTimers();
    const onChange = vi.fn();
    render(
      <TextFilter column={stubColumn} value="something" onChange={onChange} />
    );
    fireEvent.change(screen.getByRole('textbox'), {
      target: { value: '' },
    });
    vi.advanceTimersByTime(300);
    expect(onChange).toHaveBeenCalledWith(undefined);
    vi.useRealTimers();
  });
});

describe('textFilterFn', () => {
  it('matches case-insensitive substring', () => {
    const row = { getValue: () => 'Ahmad Fauzi' };
    expect(textFilterFn(row as never, 'name', 'ahmad', () => {})).toBe(true);
    expect(textFilterFn(row as never, 'name', 'FAUZI', () => {})).toBe(true);
    expect(textFilterFn(row as never, 'name', 'Budi', () => {})).toBe(false);
  });

  it('handles null cell value', () => {
    const row = { getValue: () => null };
    expect(textFilterFn(row as never, 'name', 'test', () => {})).toBe(false);
  });
});
