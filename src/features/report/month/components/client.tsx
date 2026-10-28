'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { useOngoingTerm } from '@/contexts/ongoing-term';
import { ClassSession } from '@/features/class-session/types';
import { KidEnrollment } from '@/features/kid-enrollment/types';
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
  currentKids: KidEnrollment[];
  terms: Term[];
  classSessions: ClassSession[];
}

export default function MonthlyReportClient({
  currentTermId,
  currentClassSessionId,
  terms,
  classSessions,
  currentKids,
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
          <ItemGroup className="grid grid-cols-4 gap-4">
            {currentKids.map((ck) => (
              <Item
                key={ck.kid.name}
                variant="outline"
                render={
                  <Link
                    href={`/dashboard/report/kid/${ck.kidId}?termId=${currentTermId}&classSessionId=${currentClassSessionId}`}
                  ></Link>
                }
              >
                <ItemHeader>
                  {
                    <HugeiconsIcon
                      icon={ChildIcon}
                      size="100"
                      className="text-center"
                    />
                  }
                </ItemHeader>
                <ItemContent>
                  <ItemTitle>{ck.kid.name}</ItemTitle>
                  <ItemDescription>{ck.kid.nickName}</ItemDescription>
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
