'use client';

import { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';

export const pushParam = ({
  key,
  value,
  router,
}: {
  key: string;
  value: string | null;
  router: AppRouterInstance;
}) => {
  const params = new URLSearchParams(window.location.search);
  params.set(key, value ?? '');
  router.push(`?${params.toString()}`);
};
