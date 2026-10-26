'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { ClassSession } from '@/features/class-session/types';
import { KidEnrollment } from '@/features/kid-enrollment/types';
import { Term } from '@/features/term/types';
import { ChildIcon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';

import FormFieldGenerator from '@/components/shared/form/form-field-generator';
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemHeader,
  ItemTitle,
} from '@/components/ui/item';

import { monthlyReportFormFields } from '../fields';
import { monthlyReportSchema } from '../validation';

interface MonthlyReportClientProps {
  currentTermId: string;
  currentClassSessionId: string;
  currentKids: KidEnrollment[];
  terms: Term[];
  classSessions: ClassSession[];
}

export default function MonthlyReportClient({
  terms,
  classSessions,
  currentKids,
}: MonthlyReportClientProps) {
  const router = useRouter();
  return (
    <div>
      <FormFieldGenerator
        formFields={monthlyReportFormFields({ terms, classSessions, router })}
        initialData={{
          termId: '',
          classSessionId: '',
        }}
        schema={monthlyReportSchema}
        onSubmitAction={() => {}}
      />
      <div className="flex w-full max-w-full flex-col gap-6">
        <ItemGroup className="grid grid-cols-4 gap-4">
          {currentKids.map((ck) => (
            <Item
              key={ck.kid.name}
              variant="outline"
              render={<Link href={`/dashboard/report/kid/${ck.kidId}`}></Link>}
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
    </div>
  );
}
