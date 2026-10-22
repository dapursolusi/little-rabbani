import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

import { ActionResult } from '@/types';

import { auth } from '@/lib/auth';

/** Wrap the ActionResult in an auth gate — the single "is this an owner?" check. */
export async function requireOwner<T>(handler: () => Promise<ActionResult<T>>) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect('/login');
  }

  if (session.user.role !== 'owner') {
    return {
      success: false as const,
      message: 'Akses ditolak. Hanya Owner yang dapat melakukan tindakan ini.',
    };
  }

  return handler();
}
