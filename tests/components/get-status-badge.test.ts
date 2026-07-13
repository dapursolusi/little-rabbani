import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { getStatusBadge } from '@/components/shared/get-status-badge';

describe('getStatusBadge', () => {
  it('renders the Indonesian label for a known status', () => {
    render(getStatusBadge('sent'));
    expect(screen.getByText('Terkirim')).toBeDefined();
  });

  it('renders the raw status string for an unknown status', () => {
    render(getStatusBadge('unexpected'));
    expect(screen.getByText('unexpected')).toBeDefined();
  });

  it('renders Final for the final status', () => {
    render(getStatusBadge('final'));
    expect(screen.getByText('Final')).toBeDefined();
  });

  it('renders Perlu Diperbarui for the stale status', () => {
    render(getStatusBadge('stale'));
    expect(screen.getByText('Perlu Diperbarui')).toBeDefined();
  });
});
