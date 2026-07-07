'use client';

import { useCallback } from 'react';

import { useRouter } from 'next/navigation';

import { authClient } from '@/lib/auth-client';

export function LogoutButtonClient() {
  const router = useRouter();

  const handleLogout = useCallback(async () => {
    await authClient.signOut();
    router.push('/login');
    router.refresh();
  }, [router]);

  return (
    <button
      onClick={handleLogout}
      className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 shadow-sm transition-colors hover:bg-zinc-50 active:bg-zinc-100"
    >
      Keluar
    </button>
  );
}
