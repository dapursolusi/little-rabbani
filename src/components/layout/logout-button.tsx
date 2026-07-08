'use client';

import { useCallback } from 'react';

import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';

import { authClient } from '@/lib/auth-client';

export function LogoutButtonClient() {
  const router = useRouter();

  const handleLogout = useCallback(async () => {
    await authClient.signOut();
    router.push('/login');
    router.refresh();
  }, [router]);

  return (
    <Button onClick={handleLogout} variant="outline">
      Keluar
    </Button>
  );
}
