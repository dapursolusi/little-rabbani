'use client';

import { useCallback, useEffect, useRef, useState } from 'react';



import { useRouter } from 'next/navigation';



import { toast } from 'sonner';



import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';



import { GuardianSearchResult, createKid, searchGuardians, updateKid } from '../../../../src/features/kids/actions';


















interface KidFormProps {
  mode: 'create' | 'edit';
  initialData: {
    id?: string;
    kid: {
      name: string;
      nickName: string;
      gender: 'male' | 'female' | '';
      dob: string;
      relationship: string;
    };
    guardian: {
      id?: string;
      name: string;
      phone: string;
      email: string;
      secondContactName: string;
      secondContactPhone: string;
    };
  };
}

const GENDER_OPTIONS = [
  { value: 'male', label: 'Laki-laki' },
  { value: 'female', label: 'Perempuan' },
];

const RELATIONSHIP_OPTIONS: Record<string, string> = {
  mother: 'Ibu',
  father: 'Ayah',
  sibling: 'Kakak / Adik',
  grandparent: 'Kakek / Nenek',
  aunt_uncle: 'Bibi / Paman',
  other: 'Wali',
};

export function KidForm({ mode, initialData }: KidFormProps) {
  const router = useRouter();
  const isEdit = mode === 'edit';

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [useExisting, setUseExisting] = useState(isEdit);
  const [guardianQuery, setGuardianQuery] = useState('');
  const [guardianResults, setGuardianResults] = useState<
    GuardianSearchResult[]
  >([]);
  const [selectedGuardian, setSelectedGuardian] =
    useState<GuardianSearchResult | null>(
      isEdit && initialData.guardian.id
        ? {
            id: initialData.guardian.id,
            name: initialData.guardian.name,
            phone: initialData.guardian.phone,
            email: initialData.guardian.email,
            secondContactName: initialData.guardian.secondContactName,
            secondContactPhone: initialData.guardian.secondContactPhone,
            kids: [],
          }
        : null
    );

  const [kid, setKid] = useState(initialData.kid);
  const [guardian, setGuardian] = useState(initialData.guardian);

  // debounce the existing-guardian search
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevPhone = useRef(initialData.guardian.phone);

  const runSearch = useCallback(async (q: string) => {
    if (!q.trim()) {
      setGuardianResults([]);
      return;
    }
    const res = await searchGuardians(q.trim());
    setGuardianResults(res.success ? res.data : []);
  }, []);

  useEffect(() => {
    if (!useExisting) return;
    searchTimer.current = setTimeout(() => void runSearch(guardianQuery), 300);
    return () => {
      if (searchTimer.current) clearTimeout(searchTimer.current);
    };
  }, [guardianQuery, useExisting, runSearch]);

  // phone-change warning on edit
  useEffect(() => {
    if (isEdit && guardian.phone && guardian.phone !== prevPhone.current) {
      toast.warning(
        'Nomor telepon wali berubah — pembaruan ini berlaku untuk semua murid yang terhubung dengan wali ini.'
      );
    }
  }, [guardian.phone, isEdit]);

  function handlePick(g: GuardianSearchResult) {
    setSelectedGuardian(g);
    setGuardian({
      id: g.id,
      name: g.name,
      phone: g.phone,
      email: g.email ?? '',
      secondContactName: g.secondContactName ?? '',
      secondContactPhone: g.secondContactPhone ?? '',
    });
    setGuardianQuery('');
    setGuardianResults([]);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      const payload = {
        ...kid,
        relationship: kid.relationship,
        ...(useExisting && selectedGuardian
          ? { guardianId: selectedGuardian.id }
          : {
              guardianName: guardian.name,
              guardianPhone: guardian.phone,
              guardianEmail: guardian.email || null,
              guardianSecondContactName: guardian.secondContactName || null,
              guardianSecondContactPhone: guardian.secondContactPhone || null,
            }),
      };

      const result = isEdit
        ? await updateKid(initialData.id!, payload)
        : await createKid(payload);

      if (result.success) {
        toast.success(
          isEdit ? 'Murid berhasil diperbarui' : 'Murid berhasil dibuat'
        );
        router.push('/dashboard/kid');
        router.refresh();
      } else {
        toast.error(result.error);
      }
    } catch {
      toast.error('Terjadi kesalahan sistem');
    } finally {
      setIsSubmitting(false);
    }
  }

  function set(group: 'kid' | 'guardian', key: string, value: string) {
    if (group === 'kid') {
      setKid((s) => ({ ...s, [key]: value }));
    } else {
      setGuardian((s) => ({ ...s, [key]: value }));
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* ── Guardian section ── */}
      <section className="space-y-4">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-base font-semibold">Data Wali</h2>
          <button
            type="button"
            onClick={() => {
              setUseExisting((v) => !v);
              setSelectedGuardian(null);
              setGuardianResults([]);
            }}
            className="text-sm text-primary underline underline-offset-4 hover:text-primary/80"
          >
            {useExisting ? 'Isi data wali baru' : 'Gunakan wali yang sudah ada'}
          </button>
        </div>

        {useExisting ? (
          <div className="space-y-3">
            <div>
              <Label htmlFor="guardian-search">Cari wali</Label>
              <Input
                id="guardian-search"
                value={guardianQuery}
                onChange={(e) => setGuardianQuery(e.target.value)}
                placeholder="Cari nama atau nomor telepon wali"
              />
            </div>
            {guardianResults.length > 0 && (
              <ul className="divide-y divide-border rounded-lg border">
                {guardianResults.map((g) => (
                  <li key={g.id}>
                    <button
                      type="button"
                      onClick={() => handlePick(g)}
                      className="flex w-full flex-col items-start gap-0.5 px-3 py-2.5 text-left hover:bg-muted"
                    >
                      <span className="font-medium">{g.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {g.phone}
                      </span>
                      {g.kids && g.kids.length > 0 && (
                        <span className="text-xs text-muted-foreground">
                          Anak: {g.kids.map((k) => k.name).join(', ')}
                        </span>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {selectedGuardian && (
              <div className="rounded-lg border bg-muted/40 p-3 text-sm">
                <p className="font-medium">
                  Wali terpilih: {selectedGuardian.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {selectedGuardian.phone}
                </p>
                {selectedGuardian.kids && selectedGuardian.kids.length > 0 && (
                  <p className="text-xs text-muted-foreground">
                    Anak: {selectedGuardian.kids.map((k) => k.name).join(', ')}
                  </p>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="g-name">
                Nama <span className="text-destructive">*</span>
              </Label>
              <Input
                id="g-name"
                value={guardian.name}
                onChange={(e) => set('guardian', 'name', e.target.value)}
                placeholder="Nama lengkap wali"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="g-phone">
                Nomor Telepon <span className="text-destructive">*</span>
              </Label>
              <Input
                id="g-phone"
                value={guardian.phone}
                onChange={(e) => set('guardian', 'phone', e.target.value)}
                placeholder="08xxxxxxxxxx"
                inputMode="tel"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="g-email">Email</Label>
              <Input
                id="g-email"
                type="email"
                value={guardian.email}
                onChange={(e) => set('guardian', 'email', e.target.value)}
                placeholder="email@contoh.com"
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="g-second-name">Kontak Kedua (Nama)</Label>
              <Input
                id="g-second-name"
                value={guardian.secondContactName}
                onChange={(e) =>
                  set('guardian', 'secondContactName', e.target.value)
                }
                placeholder="Nama kontak darurat"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="g-second-phone">Kontak Kedua (Telepon)</Label>
              <Input
                id="g-second-phone"
                value={guardian.secondContactPhone}
                onChange={(e) =>
                  set('guardian', 'secondContactPhone', e.target.value)
                }
                placeholder="08xxxxxxxxxx"
                inputMode="tel"
              />
            </div>
          </div>
        )}
      </section>

      <Separator />

      {/* ── Kid section ── */}
      <section className="space-y-4">
        <h2 className="text-base font-semibold">Data Murid</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="k-name">
              Nama <span className="text-destructive">*</span>
            </Label>
            <Input
              id="k-name"
              value={kid.name}
              onChange={(e) => set('kid', 'name', e.target.value)}
              placeholder="Contoh: Adi Wijaya Kusuma"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="k-nickname">Nama Panggilan</Label>
            <Input
              id="k-nickname"
              value={kid.nickName}
              onChange={(e) => set('kid', 'nickName', e.target.value)}
              placeholder="Contoh: Adi"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="k-gender">
              Jenis Kelamin <span className="text-destructive">*</span>
            </Label>
            <select
              id="k-gender"
              value={kid.gender}
              onChange={(e) => set('kid', 'gender', e.target.value)}
              required
              className="flex h-10 w-full items-center rounded-md border border-input bg-transparent px-3 text-sm shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="" disabled>
                Pilih jenis kelamin
              </option>
              {GENDER_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="k-dob">
              Tanggal Lahir <span className="text-destructive">*</span>
            </Label>
            <Input
              id="k-dob"
              type="date"
              value={kid.dob}
              onChange={(e) => set('kid', 'dob', e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="k-relationship">
              Hubungan dengan Wali <span className="text-destructive">*</span>
            </Label>
            <select
              id="k-relationship"
              value={kid.relationship}
              onChange={(e) => set('kid', 'relationship', e.target.value)}
              required
              className="flex h-10 w-full items-center rounded-md border border-input bg-transparent px-3 text-sm shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="" disabled>
                Pilih hubungan
              </option>
              {Object.entries(RELATIONSHIP_OPTIONS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isSubmitting}
        >
          Batal
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting
            ? 'Menyimpan...'
            : isEdit
              ? 'Simpan Perubahan'
              : 'Tambah Murid'}
        </Button>
      </div>

      <Separator />
    </form>

    
  );
}
