'use client';

import { useCallback, useState } from 'react';

import { authClient } from '@/lib/auth-client';

interface ILoginFormProps {
  error?: string;
  redirect?: string;
}

export function LoginForm({ error, redirect: redirectUrl }: ILoginFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [oauthError, setOauthError] = useState<string | null>(null);

  const handleSignIn = useCallback(async () => {
    setIsLoading(true);
    setOauthError(null);

    try {
      await authClient.signIn.social({
        provider: 'google',
        callbackURL: redirectUrl ?? '/',
      });
    } catch {
      setOauthError(
        'Gagal masuk dengan Google. Silakan coba lagi atau hubungi Owner.'
      );
    } finally {
      setIsLoading(false);
    }
  }, [redirectUrl]);

  const handleRetry = useCallback(() => {
    setOauthError(null);
    void handleSignIn();
  }, [handleSignIn]);

  const accessDenied = error === 'access_denied';

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4">
      <div className="w-full max-w-sm rounded-lg border border-zinc-200 bg-white p-8 shadow-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-semibold text-zinc-900">
            Little Rabbani
          </h1>
          <p className="mt-2 text-sm text-zinc-500">Masuk untuk melanjutkan</p>
        </div>

        {accessDenied && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-center">
            <p className="text-sm font-medium text-red-800">
              Akun Anda tidak terdaftar
            </p>
            <p className="mt-1 text-xs text-red-600">
              Hubungi Owner untuk akses
            </p>
          </div>
        )}

        {oauthError && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-center">
            <p className="text-sm font-medium text-red-800">{oauthError}</p>
            <button
              onClick={handleRetry}
              disabled={isLoading}
              className="mt-3 inline-flex items-center gap-1.5 rounded-md bg-red-100 px-3 py-1.5 text-sm font-medium text-red-700 transition-colors hover:bg-red-200 disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <svg
                    className="h-4 w-4 animate-spin"
                    viewBox="0 0 24 24"
                    fill="none"
                    aria-hidden="true"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  Memproses...
                </>
              ) : (
                'Coba Lagi'
              )}
            </button>
          </div>
        )}

        <button
          onClick={handleSignIn}
          disabled={isLoading}
          className="flex w-full items-center justify-center gap-3 rounded-lg border border-zinc-300 bg-white px-4 py-2.5 text-sm font-medium text-zinc-700 shadow-sm transition-colors hover:bg-zinc-50 active:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isLoading ? (
            <svg
              className="h-5 w-5 animate-spin text-zinc-400"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
          ) : (
            <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
          )}
          {isLoading ? 'Memproses...' : 'Masuk dengan Google'}
        </button>
      </div>
    </div>
  );
}
