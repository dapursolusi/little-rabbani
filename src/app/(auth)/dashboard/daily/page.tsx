import {
  Add02Icon,
  GraduateFemaleIcon,
  GraduateMaleIcon,
  MailOpen02Icon,
  MedicalMaskIcon,
  StarIcon,
  StarOff,
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';

import { Modal } from '@/components/shared/modal';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemTitle,
} from '@/components/ui/item';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

export default function DailyClassReportPage() {
  const attendances = [
    { label: 'Hadir', value: 'present', icon: StarIcon, color: 'FFAC2E' },
    { label: 'Absen', value: 'absent', icon: StarOff, color: 'F36E7C' },
    { label: 'Ijin', value: 'excused', icon: MailOpen02Icon, color: '4A90E2' },
    { label: 'Sakit', value: 'sick', icon: MedicalMaskIcon, color: '75C41F' },
  ];
  const moods = [
    { label: '😄 Senang', value: 'happy' },
    { label: '😡 Marah', value: 'angry' },
    { label: '😢 Sedih', value: 'sad' },
    { label: '😨 Takut', value: 'fear' },
    { label: '😒 Bosan', value: 'bored' },
    { label: '🥺 Malu', value: 'shy' },
  ];
  const eating = [
    { label: '🍱 Banyak', value: 'excellent' },
    { label: '🥣 Cukup', value: 'good' },
    { label: '🥄 Sedikit', value: 'fair' },
    { label: '❌ Tidak', value: 'minimal' },
  ];
  return (
    <Tabs
      defaultValue="account"
      className="w-full flex items-center justify-center"
    >
      <TabsList className="w-full">
        <TabsTrigger value="input">Input Harian</TabsTrigger>
        <TabsTrigger value="history">Riwayat</TabsTrigger>
      </TabsList>
      <TabsContent
        value="input"
        className="space-y-4 w-200 flex flex-col justify-center"
      >
        <Label htmlFor="date">Sesi Kelas</Label>
        <Select>
          <SelectTrigger id="date">
            <SelectValue placeholder="Pilih sesi kelas" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem>Sesi Pagi</SelectItem>
            <SelectItem>Sesi Sore</SelectItem>
          </SelectContent>
        </Select>
        <Label htmlFor="theme">Tema</Label>
        <Input id="theme" type="text"></Input>
        <Label htmlFor="sub-theme">Sub Tema</Label>
        <Input id="sub-theme" type="text"></Input>
        <Label htmlFor="description">Deskripsi Kegiatan</Label>
        <Textarea id="description"></Textarea>
        <Separator />
        Observasi Anak-Anak
        <Modal
          title="Obeservasi Anak Sesi Pagi"
          description="Tambahkan obeservasi anak-anak yang hadir pada sesi kelas ini"
          trigger={{
            text: 'Obeservasi Anak Hari ini (15/20)',
            icon: Add02Icon,
          }}
          content={
            <div className="flex flex-col gap-2">
              <Label htmlFor="kid">Nama Anak</Label>
              <Select id="kid">
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Pilih anak" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="remini">Remini</SelectItem>
                  <SelectItem value="ghani">Ghani</SelectItem>
                </SelectContent>
              </Select>

              <Separator />
              <Label htmlFor="attendance">Kehadiran</Label>
              <ToggleGroup
                id="attendance"
                className="w-full grid grid-cols-2 sm:grid-cols-4 items-stretch"
              >
                {attendances.map((item) => (
                  <ToggleGroupItem key={item.value} value={item.value}>
                    <HugeiconsIcon icon={item.icon} color={`#${item.color}`} />{' '}
                    {item.label}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
              <Separator />
              <Label htmlFor="mood">Mood </Label>
              <ToggleGroup
                id="mood"
                className="w-full grid grid-cols-2 sm:grid-cols-4 items-stretch"
              >
                {moods.map((item) => (
                  <ToggleGroupItem
                    key={item.value}
                    value={item.value}
                    className="flex justify-start px-1"
                  >
                    {item.label}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
              <Separator />
              <Label htmlFor="eating">Makan </Label>
              <ToggleGroup
                id="eating"
                className="w-full grid grid-cols-2 sm:grid-cols-4 items-stretch"
              >
                {eating.map((item) => (
                  <ToggleGroupItem
                    key={item.value}
                    value={item.value}
                    className="flex justify-start px-1"
                  >
                    {item.label}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            </div>
          }
        />
        <Accordion defaultValue={['present']}>
          <AccordionItem value="empty">
            <AccordionTrigger>Belum ada Observasi (3)</AccordionTrigger>
            <AccordionContent className="grid sm:grid-cols-2 gap-3">
              <Item variant="outline">
                <ItemContent>
                  <ItemTitle>
                    <div className="flex items-center gap-2">
                      Remini
                      <HugeiconsIcon
                        icon={GraduateFemaleIcon}
                        color="#f523c0"
                      />
                    </div>
                  </ItemTitle>
                </ItemContent>
              </Item>
              <Item variant="outline">
                <ItemContent>
                  <ItemTitle>
                    Ghani
                    <HugeiconsIcon icon={GraduateMaleIcon} color="#4A90E2" />
                  </ItemTitle>
                </ItemContent>
              </Item>
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="present">
            <AccordionTrigger>Hadir (3)</AccordionTrigger>
            <AccordionContent className="grid sm:grid-cols-2 gap-3">
              <Item variant="outline">
                <ItemContent>
                  <ItemTitle>
                    <div className="flex items-center gap-2">
                      Remini
                      <HugeiconsIcon
                        icon={GraduateFemaleIcon}
                        color="#f523c0"
                      />
                    </div>
                  </ItemTitle>
                  <Separator />
                  <ItemDescription className="flex flex-col gap-2">
                    <div className="grid grid-cols-2 gap-2 w-full">
                      <div className="flex items-center gap-2">
                        <Badge>Mood:</Badge> <p>😥 Senang</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Separator orientation="vertical" />
                        <Badge>Makan:</Badge> <p> Banyak</p>
                      </div>
                    </div>
                    <Separator />
                    <div className="flex items-center gap-2">
                      <Badge>Catatan:</Badge>
                      <Separator orientation="vertical" />
                      <p>-</p>
                    </div>
                  </ItemDescription>
                </ItemContent>
              </Item>
              <Item variant="outline">
                <ItemContent>
                  <ItemTitle>
                    Ghani
                    <HugeiconsIcon icon={GraduateMaleIcon} color="#4A90E2" />
                  </ItemTitle>
                  <Separator />
                  <ItemDescription className="flex flex-col gap-2">
                    <div className="grid grid-cols-2 gap-2 w-full">
                      <div className="flex items-center gap-2">
                        <Badge>Mood:</Badge> <p>😥 Sedih</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Separator orientation="vertical" />
                        <Badge>Makan:</Badge> <p>Cukup Banyak</p>
                      </div>
                    </div>
                    <Separator />
                    <div className="flex items-center gap-2">
                      <Badge>Catatan:</Badge>
                      <Separator orientation="vertical" />
                      <p>-</p>
                    </div>
                  </ItemDescription>
                </ItemContent>
              </Item>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
        <div></div>
      </TabsContent>
      <TabsContent value="history">Riwayat </TabsContent>
    </Tabs>
  );
}
