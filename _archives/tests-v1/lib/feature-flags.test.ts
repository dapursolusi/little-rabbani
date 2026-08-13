import { describe, expect, it } from 'vitest';

import { FeatureFlags, featureFlags } from '@/lib/feature-flags';

describe('FeatureFlags', () => {
  it('disables all flags by default', () => {
    const ff = new FeatureFlags();
    expect(ff.isEnabled('new-dashboard')).toBe(false);
    expect(ff.isEnabled('new-auth-flow')).toBe(false);
    expect(ff.isEnabled('experimental-search')).toBe(false);
  });

  it('respects programmatic overrides', () => {
    const ff = new FeatureFlags({ 'new-dashboard': true });
    expect(ff.isEnabled('new-dashboard')).toBe(true);
    expect(ff.isEnabled('new-auth-flow')).toBe(false);
  });

  it('isDisabled returns opposite of isEnabled', () => {
    const ff = new FeatureFlags();
    expect(ff.isDisabled('new-dashboard')).toBe(true);
    expect(ff.isDisabled('new-auth-flow')).toBe(true);
  });

  it('allFlags returns all flag states', () => {
    const ff = new FeatureFlags({ 'new-dashboard': true });
    const all = ff.allFlags();
    expect(all['new-dashboard']).toBe(true);
    expect(all['new-auth-flow']).toBe(false);
    expect(all['experimental-search']).toBe(false);
  });

  it('singleton instance exists with expected API', () => {
    expect(featureFlags.isEnabled).toBeInstanceOf(Function);
    expect(featureFlags.isDisabled).toBeInstanceOf(Function);
    expect(featureFlags.allFlags).toBeInstanceOf(Function);
  });
});
