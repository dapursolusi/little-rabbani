'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { ClassSession } from '@/features/class-session/types';
import {
  KidEnrollment,
  KidEnrollmentWithKid,
} from '@/features/kid-enrollment/types';
import { Term } from '@/features/term/types';
import { pushParam } from '@/utils/search-params';
import { ChildIcon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';

import ClassSessionSelector from '@/components/features/class-session/class-session-selector';
import TermSelector from '@/components/features/term/term-selector';
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemHeader,
  ItemTitle,
} from '@/components/ui/item';

interface MonthlyReportClientProps {
  currentTermId: string;
  currentClassSessionId: string;
  enrolledKids: KidEnrollmentWithKid[];
  terms: Term[];
  classSessions: ClassSession[];
}

export default function MonthlyReportClient({
  currentTermId,
  currentClassSessionId,
  terms,
  classSessions,
  enrolledKids,
}: MonthlyReportClientProps) {
  const router = useRouter();
  return (
    <div>
      <TermSelector
        terms={terms}
        onValueChange={(termId) =>
          pushParam({ key: 'termId', value: termId, router })
        }
      />
      <ClassSessionSelector
        classSessions={classSessions}
        value={currentClassSessionId}
        onValueChange={(classSessionId) =>
          pushParam({ key: 'classSessionId', value: classSessionId, router })
        }
      />

      {currentTermId ? (
        <div className="flex w-full max-w-full flex-col gap-6">
          <ItemGroup className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4">
            {enrolledKids.map((ek) => (
              <Item
                key={ek.kid.name}
                variant="outline"
                render={
                  <Link
                    href={`/dashboard/report/kid/${ek.kidId}?termId=${currentTermId}`}
                  ></Link>
                }
              >
                <ItemHeader>
                  {
                    <HugeiconsIcon
                      icon={ChildIcon}
                      className="mx-auto max-h-25 max-w-25 size-full"
                    />
                  }
                </ItemHeader>
                <ItemContent>
                  <ItemTitle>{ek.kid.name}</ItemTitle>
                  <ItemDescription>{ek.kid.nickName}</ItemDescription>
                </ItemContent>
              </Item>
            ))}
          </ItemGroup>
        </div>
      ) : (
        <p>Pilih batch terlebih dahulu!</p>
      )}
    </div>
  );
}
