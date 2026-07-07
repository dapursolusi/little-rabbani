import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock the db module before importing auth
vi.mock('@/lib/db', () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('Auth configuration', () => {
  beforeEach(() => {
    // Set required env vars for testing
    process.env.DATABASE_URL = 'postgres://test:test@localhost:5432/test';
    process.env.BETTER_AUTH_SECRET =
      'test-secret-that-is-at-least-32-chars-long!!';
    process.env.GOOGLE_CLIENT_ID = 'test-client-id.apps.googleusercontent.com';
    process.env.GOOGLE_CLIENT_SECRET = 'test-client-secret';
    process.env.NEXT_PUBLIC_BETTER_AUTH_URL = 'http://localhost:3000';
    process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000';
  });

  it('should load the auth module without errors', async () => {
    const { auth } = await import('@/lib/auth');
    expect(auth).toBeDefined();
    expect(typeof auth).toBe('object');
    expect(typeof auth.handler).toBe('function');
    expect(auth.api).toBeDefined();
  });

  it('should load the auth client module without errors', async () => {
    const { authClient } = await import('@/lib/auth-client');
    expect(authClient).toBeDefined();
    // signIn may be a function or object depending on better-auth version
    // Just verify it exists and has expected method shape
    expect(
      typeof authClient.signIn === 'function' ||
        typeof authClient.signIn === 'object'
    ).toBe(true);
    expect(typeof authClient.signOut).toBe('function');
  });

  it('should export GET and POST from auth route handler', async () => {
    const mod = await import('@/app/api/auth/[...all]/route');
    expect(typeof mod.GET).toBe('function');
    expect(typeof mod.POST).toBe('function');
  });

  it('should configure role additionalFields with input:false', async () => {
    const { auth } = await import('@/lib/auth');
    // Verify the auth instance has the options with correct additionalFields
    const options = (auth as unknown as { options?: Record<string, unknown> })
      .options;
    expect(options).toBeDefined();
    const user = options!.user as Record<string, unknown>;
    expect(user).toBeDefined();
    const additionalFields = user.additionalFields as Record<string, unknown>;
    expect(additionalFields).toBeDefined();
    expect(additionalFields.role).toBeDefined();
    const roleField = additionalFields.role as {
      type?: string;
      input?: boolean;
    };
    expect(roleField.type).toBe('string');
    expect(roleField.input).toBe(false);
  });

  it('should configure Google OAuth social provider', async () => {
    const { auth } = await import('@/lib/auth');
    const options = (auth as unknown as { options?: Record<string, unknown> })
      .options;
    expect(options).toBeDefined();
    const socialProviders = options!.socialProviders as Record<string, unknown>;
    expect(socialProviders).toBeDefined();
    expect(socialProviders.google).toBeDefined();
    const googleProvider = socialProviders.google as Record<string, unknown>;
    expect(googleProvider.clientId).toBe(
      'test-client-id.apps.googleusercontent.com'
    );
    expect(googleProvider.disableImplicitSignUp).toBe(true);
  });
});
