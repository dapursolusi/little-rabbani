/**
 * Simple feature flag system for safe rollouts.
 *
 * Flags are evaluated at build/request time and can be toggled
 * via environment variables. This enables agent-authored code
 * to ship behind flags without affecting all users immediately.
 *
 * Usage:
 *   import { featureFlags } from '@/lib/feature-flags';
 *
 *   if (featureFlags.isEnabled('new-dashboard')) {
 *     return <NewDashboard />;
 *   }
 *   return <LegacyDashboard />;
 */

export type FeatureFlag =
  'new-dashboard' | 'new-auth-flow' | 'new-onboarding' | 'experimental-search';

const FLAG_ENV_MAP: Record<FeatureFlag, string> = {
  'new-dashboard': 'FF_NEW_DASHBOARD',
  'new-auth-flow': 'FF_NEW_AUTH_FLOW',
  'new-onboarding': 'FF_NEW_ONBOARDING',
  'experimental-search': 'FF_EXPERIMENTAL_SEARCH',
};

/** Default flag states — disabled unless explicitly enabled. */
const DEFAULT_FLAGS: Record<FeatureFlag, boolean> = {
  'new-dashboard': false,
  'new-auth-flow': false,
  'new-onboarding': false,
  'experimental-search': false,
};

export class FeatureFlags {
  private flags: Record<string, boolean>;

  constructor(overrides?: Partial<Record<FeatureFlag, boolean>>) {
    this.flags = { ...DEFAULT_FLAGS };

    // Apply environment variable overrides (e.g., FF_NEW_DASHBOARD=1)
    for (const [flag, envVar] of Object.entries(FLAG_ENV_MAP)) {
      const envValue = process.env[envVar];
      if (envValue !== undefined) {
        this.flags[flag] = envValue === '1' || envValue === 'true';
      }
    }

    // Apply programmatic overrides (for testing or per-request context)
    if (overrides) {
      for (const [flag, value] of Object.entries(overrides)) {
        this.flags[flag] = value;
      }
    }
  }

  isEnabled(flag: FeatureFlag): boolean {
    return this.flags[flag] ?? false;
  }

  isDisabled(flag: FeatureFlag): boolean {
    return !this.isEnabled(flag);
  }

  allFlags(): Record<string, boolean> {
    return { ...this.flags };
  }
}

/** Singleton instance for use throughout the app. */
export const featureFlags = new FeatureFlags();
