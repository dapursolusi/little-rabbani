import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

import { auth } from '@/lib/auth';

export type ActionResult<T = void> =
  | { success: true; data: T; error?: never }
  | { success: false; data?: never; error: string };

/** Wrap the ActionResult in an auth gate — the single "is this an owner?" check. */
export async function requireOwner<T>(handler: () => Promise<T>) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect('/login');
  }

  if (session.user.role !== 'owner') {
    return {
      success: false as const,
      error: 'Akses ditolak. Hanya Owner yang dapat melakukan tindakan ini.',
    };
  }

  return handler();
}
