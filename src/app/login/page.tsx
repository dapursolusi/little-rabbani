import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

import { auth } from '@/lib/auth';
import { baseMetadata } from '@/lib/metadata';

import { LoginForm } from './login-form';

export const metadata = { ...baseMetadata, title: 'Masuk' };

export default async function LoginPage(props: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const searchParams = await props.searchParams;
  const error = searchParams.error as string | undefined;

  // If there's a valid session, redirect to dashboard
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (session) {
    const role = session.user.role as string;
    if (role === 'owner') {
      redirect('/dashboard/owner');
    } else {
      redirect('/dashboard/teacher');
    }
  }

  return <LoginForm error={error} />;
}
