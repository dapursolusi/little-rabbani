import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

import { auth } from '@/lib/auth';

export type ActionResult<T = void> =
  | { success: true; data: T; error?: never }
  | { success: false; data?: never; error: string };

/**
 * Check that the current user is authenticated as an Owner.
 * Redirects to login if unauthenticated, returns error if not Owner.
 */
export async function requireOwner(): Promise<
  { authorized: true; userId: string } | { authorized: false; error: string }
> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect('/login');
  }

  if (session.user.role !== 'owner') {
    return {
      authorized: false,
      error: 'Akses ditolak. Hanya Owner yang dapat melakukan tindakan ini.',
    };
  }

  return { authorized: true, userId: session.user.id };
}
