import Link from 'next/link';

import { FileClockIcon, Monocle01Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemHeader,
  ItemTitle,
} from '@/components/ui/item';

import { getSessionsForDcr } from '@/lib/actions/dcr';
import { baseMetadata } from '@/lib/metadata';

export const metadata = { ...baseMetadata, title: 'DCR / Observasi Kelas' };

export default async function DcrPickerPage() {
  const result = await getSessionsForDcr();

  if (!result.success) {
    return (
      <div className="p-4 text-center text-destructive">{result.error}</div>
    );
  }

  const sessions = result.data;

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-foreground">
          DCR / Observasi Kelas
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Buat atau edit laporan harian untuk setiap tipe sesi
        </p>
      </div>

      <ItemGroup className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Item variant="outline" className='bg-primary text-white'>
                <ItemHeader>
                  <HugeiconsIcon icon={Monocle01Icon} />
                </ItemHeader>
                <ItemContent>
                  <ItemTitle>Observasi / Catatan Harian Kelas</ItemTitle>
                  <ItemDescription>Description</ItemDescription>
                </ItemContent>
              </Item>
            }
          />
          <DropdownMenuContent>
            <DropdownMenuGroup>
              <DropdownMenuLabel>Sesi</DropdownMenuLabel>
              {sessions.map((session) => (
                <DropdownMenuItem
                  key={session.id}
                  render={
                    <Link href={`/dashboard/daily/capture/${session.id}`}>
                      {session.name} &#40;{session.start} - {session.end}&#41;
                    </Link>
                  }
                />
              ))}
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>

        <Item variant="outline">
          <ItemHeader>
            <HugeiconsIcon icon={FileClockIcon} />
          </ItemHeader>
          <ItemContent>
            <ItemTitle>Riwayat Aktivitas</ItemTitle>
            <ItemDescription>Description</ItemDescription>
          </ItemContent>
        </Item>
      </ItemGroup>
    </div>
  );
}
