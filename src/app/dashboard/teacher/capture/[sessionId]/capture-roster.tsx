'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import {
  ArrowLeft01Icon,
  BoltIcon,
  Cancel01Icon,
  CheckmarkCircle01Icon,
  CheckmarkCircle02Icon,
  ChevronRightIcon,
  CircleLock01Icon,
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { toast } from 'sonner';

import { ConflictDialog } from '@/components/sections/conflict-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

import {
  getKidObservation,
  getPass2Activities,
  getPass2Status,
  savePass1Observation,
  savePass2Observation,
} from '@/lib/actions/capture';
import { isBrowserOnline, setOnConflictCallback } from '@/lib/capture-offline';
import type { IConflictData } from '@/lib/capture-offline';
import { estimateStorageUsage, saveObservationOffline } from '@/lib/db/dexie';
import { generateIdempotencyKey } from '@/lib/idempotency';

// ─────────────── Types ───────────────

type TPresence = 'present_full' | 'late' | 'early_pickup' | 'absent';
type TAbsenceReason = 'sick' | 'family' | 'permission' | 'other';
type TAppetite = 'good' | 'moderate' | 'poor';

interface IObservationNote {
  id: string;
  text: string;
  createdAt: string;
}

interface IObservation {
  id: string;
  mood: number;
  appetite: TAppetite;
  presence: TPresence;
  absenceReason: TAbsenceReason | null;
  version: number;
  notes: IObservationNote[];
}

interface IKidData {
  id: string;
  name: string;
  captureState: 'captured' | 'uncaptured';
  observation: IObservation | null;
}

interface ICaptureRosterClientProps {
  sessionId: string;
  sessionDate: string;
  kids: IKidData[];
  isPass2Unlocked: boolean;
}

interface IDcrActivity {
  id: string;
  activityId: string | null;
  activityNameOther: string | null;
  deviation: string;
  wasPlanned: boolean;
  activity: {
    id: string;
    name: string;
    category: string;
  } | null;
}

// ─────────────── Constants ───────────────

const MOOD_EMOJIS = [
  { value: 1, emoji: '😢', label: 'Sangat Sedih' },
  { value: 2, emoji: '😟', label: 'Sedih' },
  { value: 3, emoji: '😐', label: 'Biasa' },
  { value: 4, emoji: '😊', label: 'Senang' },
  { value: 5, emoji: '😄', label: 'Sangat Senang' },
];

const APPETITE_OPTIONS: Array<{ value: TAppetite; label: string }> = [
  { value: 'good', label: 'Baik' },
  { value: 'moderate', label: 'Sedang' },
  { value: 'poor', label: 'Kurang' },
];

const PRESENCE_OPTIONS: Array<{ value: TPresence; label: string }> = [
  { value: 'present_full', label: 'Hadir' },
  { value: 'late', label: 'Terlambat' },
  { value: 'early_pickup', label: 'Dijemput Lebih Awal' },
  { value: 'absent', label: 'Tidak Hadir' },
];

const ABSENCE_REASON_OPTIONS: Array<{
  value: TAbsenceReason;
  label: string;
}> = [
  { value: 'sick', label: 'Sakit' },
  { value: 'family', label: 'Keperluan Keluarga' },
  { value: 'permission', label: 'Izin' },
  { value: 'other', label: 'Lainnya' },
];

const ABSENCE_REASON_LABELS: Record<TAbsenceReason, string> = {
  sick: 'Sakit',
  family: 'Keperluan Keluarga',
  permission: 'Izin',
  other: 'Lainnya',
};

const PRESENCE_LABELS: Record<TPresence, string> = {
  present_full: 'Hadir',
  late: 'Terlambat',
  early_pickup: 'Dijemput Lebih Awal',
  absent: 'Tidak Hadir',
};

// ─────────────── Main Component ───────────────

export function CaptureRosterClient({
  sessionId,
  sessionDate,
  kids: initialKids,
  isPass2Unlocked: initialPass2Unlocked,
}: ICaptureRosterClientProps) {
  const [kids, setKids] = useState(initialKids);
  const [selectedKid, setSelectedKid] = useState<IKidData | null>(null);
  const [activeTab, setActiveTab] = useState<'pass1' | 'pass2'>('pass1');
  const [isPass2Unlocked, setIsPass2Unlocked] = useState(initialPass2Unlocked);
  const [dcrActivities, setDcrActivities] = useState<IDcrActivity[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const pass2CheckedRef = useRef(false);

  // Pass 1 form state
  const [mood, setMood] = useState<number>(3);
  const [appetite, setAppetite] = useState<TAppetite>('good');
  const [presence, setPresence] = useState<TPresence>('present_full');
  const [absenceReason, setAbsenceReason] = useState<TAbsenceReason | ''>('');
  const [otherAbsenceReason, setOtherAbsenceReason] = useState('');
  const [notes, setNotes] = useState('');
  const [existingNotes, setExistingNotes] = useState<IObservationNote[]>([]);
  const [validationError, setValidationError] = useState('');

  // Offline queue and conflict state
  const [isOffline, setIsOffline] = useState(
    typeof navigator !== 'undefined' ? !navigator.onLine : false
  );
  const [conflictData, setConflictData] = useState<IConflictData | null>(null);
  const [isConflictDialogOpen, setIsConflictDialogOpen] = useState(false);

  // Pass 2 form state
  const [participations, setParticipations] = useState<
    Record<string, 'yes' | 'no'>
  >({});

  // Check Pass 2 status
  useEffect(() => {
    if (pass2CheckedRef.current) return;
    pass2CheckedRef.current = true;

    getPass2Status(sessionId).then((result) => {
      if (result.success && result.data.isDcrCaptured) {
        setIsPass2Unlocked(true);
        // Fetch DCR activities for Pass 2
        getPass2Activities(sessionId).then((actResult) => {
          if (actResult.success) {
            setDcrActivities(actResult.data);
          }
        });
      }
    });
  }, [sessionId]);

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Wire up setOnConflictCallback so offline conflicts surface in UI
  useEffect(() => {
    setOnConflictCallback((conflict: IConflictData) => {
      setConflictData(conflict);
      setIsConflictDialogOpen(true);
    });
    return () => setOnConflictCallback(null);
  }, []);

  // Handle kid selection
  const handleSelectKid = useCallback(
    async (kid: IKidData) => {
      setSelectedKid(kid);
      setActiveTab('pass1');
      setValidationError('');

      if (kid.observation) {
        setMood(kid.observation.mood);
        setAppetite(kid.observation.appetite);
        setPresence(kid.observation.presence);
        setAbsenceReason(kid.observation.absenceReason ?? '');
        setOtherAbsenceReason('');
        setExistingNotes(kid.observation.notes || []);
        setNotes('');
      } else {
        setMood(3);
        setAppetite('good');
        setPresence('present_full');
        setAbsenceReason('');
        setOtherAbsenceReason('');
        setExistingNotes([]);
        setNotes('');
      }

      // Fetch latest Pass 2 data if needed
      if (pass2CheckedRef.current) {
        const result = await getPass2Status(sessionId);
        if (result.success && result.data.isDcrCaptured) {
          setIsPass2Unlocked(true);
          const actResult = await getPass2Activities(sessionId);
          if (actResult.success) {
            setDcrActivities(actResult.data);
          }
        }
      }

      // Fetch existing Pass 2 participations
      try {
        const participationResult = await fetch(
          `/api/capture/participation?kidId=${kid.id}&date=${sessionDate}`
        );
        const pData = await participationResult.json();
        if (pData.success && pData.data) {
          const partMap: Record<string, 'yes' | 'no'> = {};
          for (const p of pData.data) {
            partMap[p.dcrActivityId] = p.participated;
          }
          setParticipations(partMap);
        } else {
          setParticipations({});
        }
      } catch {
        setParticipations({});
      }
    },
    [sessionId]
  );

  // Handle back to roster
  const handleBackToRoster = useCallback(() => {
    setSelectedKid(null);
    setValidationError('');
  }, []);

  // Handle mood selection
  const handleMoodSelect = useCallback((value: number) => {
    setMood(value);
    setValidationError('');
  }, []);

  // Handle presence change
  const handlePresenceChange = useCallback((value: TPresence) => {
    setPresence(value);
    setValidationError('');
    if (value !== 'absent') {
      setAbsenceReason('');
    }
  }, []);

  // Handle absence reason change
  const handleAbsenceReasonChange = useCallback((value: TAbsenceReason) => {
    setAbsenceReason(value);
    setOtherAbsenceReason('');
    setValidationError('');
  }, []);

  // Handle conflict resolution when conflict dialog resolves
  const handleConflictResolved = useCallback(() => {
    setIsConflictDialogOpen(false);
    setConflictData(null);
    toast.success('Konflik berhasil diselesaikan');

    // Update roster state optimistically
    if (selectedKid) {
      setKids((prev) =>
        prev.map((k) =>
          k.id === selectedKid.id
            ? { ...k, captureState: 'captured' as const }
            : k
        )
      );
    }
  }, [selectedKid]);

  // Handle Pass 1 save
  const handleSavePass1 = useCallback(async () => {
    // VAL-CAPTURE-021: Absence reason required when absent
    if (presence === 'absent' && !absenceReason) {
      setValidationError('Alasan ketidakhadiran wajib diisi');
      return;
    }

    setIsSaving(true);
    setValidationError('');

    try {
      // VAL-CAPTURE-036: When offline, save to IndexedDB queue
      if (!isBrowserOnline()) {
        // VAL-CAPTURE-041: Check quota before offline save
        try {
          const usage = await estimateStorageUsage();
          if (usage.isQuotaExceeded) {
            setValidationError(
              'Penyimpanan offline penuh — tidak dapat menyimpan data baru'
            );
            toast.error('Penyimpanan offline penuh');
            setIsSaving(false);
            return;
          }
          if (usage.isNearQuota) {
            toast.warning(
              'Penyimpanan offline hampir penuh — segera sinkronkan data'
            );
          }
        } catch {
          // Quota check failed, proceed anyway
        }

        const idempotencyKey = generateIdempotencyKey(
          selectedKid!.id,
          sessionId
        );

        await saveObservationOffline({
          kidId: selectedKid!.id,
          sessionId,
          date: sessionDate,
          sessionTypeId: '', // resolved server-side on sync
          teacherId: 'local',
          mood,
          appetite,
          presence,
          absenceReason: absenceReason || null,
          notes:
            absenceReason === 'other' && otherAbsenceReason.trim()
              ? (notes.trim() ? notes.trim() + '\n' : '') +
                `Alasan lain: ${otherAbsenceReason.trim()}`
              : notes.trim(),
          capturedAt: new Date().toISOString(),
          idempotencyKey,
          version: selectedKid?.observation?.version ?? 0,
        });

        // VAL-CAPTURE-036: Optimistic UI - mark kid captured immediately
        setKids((prev) =>
          prev.map((k) =>
            k.id === selectedKid!.id
              ? {
                  ...k,
                  captureState: 'captured' as const,
                }
              : k
          )
        );

        toast.success(
          'Tersimpan secara offline — akan tersinkronisasi saat online'
        );
        if (notes.trim()) {
          setExistingNotes((prev) => [
            ...prev,
            {
              id: `temp-${Date.now()}`,
              text: notes.trim(),
              createdAt: new Date().toISOString(),
            },
          ]);
          setNotes('');
        }
        setIsSaving(false);
        return;
      }

      // Online save
      const formData = new FormData();
      formData.append('kidId', selectedKid!.id);
      formData.append('sessionId', sessionId);
      formData.append('date', sessionDate);
      formData.append('mood', String(mood));
      formData.append('appetite', appetite);
      formData.append('presence', presence);
      if (absenceReason) {
        formData.append('absenceReason', absenceReason);
      }
      let finalNotes = notes.trim();
      // Include custom reason text when "other" selected (VAL-CAPTURE-021)
      if (absenceReason === 'other' && otherAbsenceReason.trim()) {
        finalNotes =
          (finalNotes ? finalNotes + '\n' : '') +
          `Alasan lain: ${otherAbsenceReason.trim()}`;
      }
      if (finalNotes) {
        formData.append('notes', finalNotes);
      }
      // Send client's known version for optimistic locking
      if (selectedKid?.observation?.version !== undefined) {
        formData.append('version', String(selectedKid.observation.version));
      }

      const result = await savePass1Observation(formData);

      if (result.success) {
        // VAL-CAPTURE-031: Check if result was a deduplication
        if (!result.data.deduplicated) {
          toast.success('Observasi berhasil disimpan');
        }

        // Update the kid's capture state in roster
        setKids((prev) =>
          prev.map((k) =>
            k.id === selectedKid!.id
              ? {
                  ...k,
                  captureState: 'captured' as const,
                  observation: {
                    id: result.data.id,
                    mood,
                    appetite,
                    presence,
                    absenceReason: absenceReason
                      ? (absenceReason as TAbsenceReason)
                      : null,
                    version: result.data.version,
                    notes: notes.trim()
                      ? [
                          ...existingNotes,
                          {
                            id: `temp-${Date.now()}`,
                            text: notes.trim(),
                            createdAt: new Date().toISOString(),
                          },
                        ]
                      : existingNotes,
                  },
                }
              : k
          )
        );

        setExistingNotes((prev) =>
          notes.trim()
            ? [
                ...prev,
                {
                  id: `temp-${Date.now()}`,
                  text: notes.trim(),
                  createdAt: new Date().toISOString(),
                },
              ]
            : prev
        );
        setNotes('');
      } else {
        // VAL-CAPTURE-031/035: Version conflict detected
        if (
          result.error &&
          result.error.toLowerCase().includes('sudah diubah')
        ) {
          // Fetch server values for conflict UI
          try {
            const serverObs = await getKidObservation(
              selectedKid!.id,
              sessionId
            );

            if (serverObs.success && serverObs.data) {
              const conflict: IConflictData = {
                type: 'conflict',
                kidId: selectedKid!.id,
                sessionId,
                serverFields: {
                  mood: serverObs.data.mood,
                  appetite: serverObs.data.appetite,
                  presence: serverObs.data.presence,
                },
                localFields: {
                  mood,
                  appetite,
                  presence,
                },
                serverNotes: (serverObs.data.notes ?? []).map(
                  (n: { text: string }) => n.text
                ),
                localNotes: notes.trim() ? [notes.trim()] : [],
                serverVersion: serverObs.data.version,
                localVersion: selectedKid?.observation?.version ?? 0,
                syncQueueId: 0,
              };
              setConflictData(conflict);
              setIsConflictDialogOpen(true);
            }
          } catch {
            // Can't fetch server data, show generic error
            setValidationError(result.error);
            toast.error(result.error);
          }
        } else {
          setValidationError(result.error);
          toast.error(result.error);
        }
      }
    } catch {
      setValidationError('Terjadi kesalahan sistem');
      toast.error('Terjadi kesalahan sistem');
    } finally {
      setIsSaving(false);
    }
  }, [
    selectedKid,
    sessionId,
    mood,
    appetite,
    presence,
    absenceReason,
    notes,
    existingNotes,
  ]);

  // Handle Pass 2 participation toggle
  const handleParticipationToggle = useCallback(
    (dcrActivityId: string, value: 'yes' | 'no') => {
      setParticipations((prev) => {
        const next: Record<string, 'yes' | 'no'> = { ...prev };
        if (next[dcrActivityId] === value) {
          delete next[dcrActivityId];
        } else {
          next[dcrActivityId] = value;
        }
        return next;
      });
    },
    []
  );

  // Handle Pass 2 save
  const handleSavePass2 = useCallback(async () => {
    if (!selectedKid) return;

    setIsSaving(true);
    try {
      // Build activities payload - only include the ones that are set
      const activitiesPayload = Object.entries(participations)
        .filter(([, value]) => value === 'yes' || value === 'no')
        .map(([dcrActivityId, participated]) => ({
          dcrActivityId,
          participated,
        }));

      const formData = new FormData();
      formData.append('kidId', selectedKid.id);
      formData.append('sessionId', sessionId);
      formData.append('activities', JSON.stringify(activitiesPayload));

      const result = await savePass2Observation(formData);

      if (result.success) {
        toast.success('Partisipasi berhasil disimpan');
      } else {
        toast.error(result.error);
      }
    } catch {
      toast.error('Terjadi kesalahan sistem');
    } finally {
      setIsSaving(false);
    }
  }, [selectedKid, sessionId, participations]);

  // ─────────────── Render: Kid detail view ───────────────

  if (selectedKid) {
    const isAbsent = presence === 'absent';

    return (
      <>
        <div className="flex flex-col">
          {/* Kid header */}
          <div className="border-b border bg-background px-4 py-3">
            <Button
              variant="link"
              size="sm"
              onClick={handleBackToRoster}
              className="mb-1 px-0"
              data-icon="inline-start"
            >
              <HugeiconsIcon icon={ArrowLeft01Icon} />
              Kembali ke daftar
            </Button>
            <h2 className="text-lg font-semibold text-foreground">
              {selectedKid.name}
            </h2>
            {selectedKid.captureState === 'captured' && (
              <p className="flex items-center gap-1 text-xs text-success">
                <HugeiconsIcon icon={CheckmarkCircle01Icon} />
                Sudah diobservasi{' '}
                {selectedKid.observation?.version &&
                  `(v${selectedKid.observation.version})`}
              </p>
            )}
          </div>

          {/* Tab: Pass 1 / Pass 2 */}
          <Tabs
            value={activeTab}
            onValueChange={(value) => {
              if (value === 'pass2' && !isPass2Unlocked) return;
              setActiveTab(value as 'pass1' | 'pass2');
            }}
            className="border-b border bg-background"
          >
            <TabsList
              className="w-full rounded-none bg-transparent"
              variant="line"
            >
              <TabsTrigger value="pass1" className="flex-1">
                Pass 1
              </TabsTrigger>
              <TabsTrigger
                value="pass2"
                className="flex-1"
                disabled={!isPass2Unlocked}
              >
                <span className="flex items-center gap-1">
                  Pass 2
                  {!isPass2Unlocked && (
                    <HugeiconsIcon icon={CircleLock01Icon} />
                  )}
                </span>
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {/* VAL-CAPTURE-023: Pass 2 locked - banner */}
          {!isPass2Unlocked && activeTab === 'pass2' && (
            <div className="bg-warning/10 px-4 py-3 text-center text-sm font-medium text-warning">
              Menunggu laporan kelas
            </div>
          )}

          {/* VAL-CAPTURE-026: Absent kid message */}
          {isAbsent && activeTab === 'pass2' && (
            <div className="bg-blue-50 px-4 py-3 text-center text-sm text-blue-700">
              Anak tidak hadir — partisipasi tidak diperlukan
            </div>
          )}

          {/* Validation error */}
          {validationError && (
            <div className="bg-destructive/10 px-4 py-2 text-center text-sm text-destructive">
              {validationError}
            </div>
          )}

          {/* Content area */}
          <div className="flex-1 px-4 py-4">
            {/* ─── Pass 1 Form ─── */}
            {activeTab === 'pass1' && (
              <div className="space-y-6">
                {/* Mood selector - VAL-CAPTURE-019: 5-level emoji */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-muted-foreground">
                    Mood
                  </label>
                  <ToggleGroup
                    value={[String(mood)]}
                    onValueChange={(value) => {
                      if (value.length) handleMoodSelect(Number(value[0]));
                    }}
                    className="flex justify-between gap-1"
                  >
                    {MOOD_EMOJIS.map((opt) => (
                      <ToggleGroupItem
                        key={opt.value}
                        value={String(opt.value)}
                        className="flex flex-col items-center gap-1 rounded-xl p-3 aria-pressed:bg-primary/10 aria-pressed:ring-2 aria-pressed:ring-primary aria-pressed:scale-105"
                        aria-label={opt.label}
                      >
                        <span className="text-2xl">{opt.emoji}</span>
                        <span className="text-[10px] text-muted-foreground">
                          {opt.label}
                        </span>
                      </ToggleGroupItem>
                    ))}
                  </ToggleGroup>
                </div>

                {/* Appetite selector - VAL-CAPTURE-020: 3-level */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-muted-foreground">
                    Nafsu Makan
                  </label>
                  <RadioGroup
                    value={appetite}
                    onValueChange={(value) => {
                      setAppetite(value as TAppetite);
                      setValidationError('');
                    }}
                    className="flex gap-2"
                  >
                    {APPETITE_OPTIONS.map((opt) => (
                      <div key={opt.value} className="flex-1">
                        <RadioGroupItem
                          value={opt.value}
                          id={`appetite-${opt.value}`}
                          className="peer sr-only"
                        />
                        <Label
                          htmlFor={`appetite-${opt.value}`}
                          className={`flex cursor-pointer items-center justify-center rounded-lg py-2.5 text-sm font-medium transition-all peer-data-[checked]:ring-2 ${opt.value === 'good' ? 'peer-data-[checked]:bg-success/10 peer-data-[checked]:text-success peer-data-[checked]:ring-success/40' : opt.value === 'moderate' ? 'peer-data-[checked]:bg-warning/10 peer-data-[checked]:text-warning peer-data-[checked]:ring-warning/40' : 'peer-data-[checked]:bg-destructive/10 peer-data-[checked]:text-destructive peer-data-[checked]:ring-destructive/40'} bg-muted text-muted-foreground hover:bg-muted`}
                        >
                          {opt.label}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>

                {/* Presence selector - VAL-CAPTURE-018 */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-muted-foreground">
                    Kehadiran
                  </label>
                  <RadioGroup
                    value={presence}
                    onValueChange={(value) =>
                      handlePresenceChange(value as TPresence)
                    }
                    className="grid grid-cols-2 gap-2"
                  >
                    {PRESENCE_OPTIONS.map((opt) => (
                      <div key={opt.value}>
                        <RadioGroupItem
                          value={opt.value}
                          id={`presence-${opt.value}`}
                          className="peer sr-only"
                        />
                        <Label
                          htmlFor={`presence-${opt.value}`}
                          className={`flex cursor-pointer items-center justify-center rounded-lg py-2.5 text-sm font-medium transition-all peer-data-[checked]:ring-2 ${opt.value === 'absent' ? 'peer-data-[checked]:bg-destructive/10 peer-data-[checked]:text-destructive peer-data-[checked]:ring-destructive/40' : opt.value === 'late' ? 'peer-data-[checked]:bg-warning/10 peer-data-[checked]:text-warning peer-data-[checked]:ring-warning/40' : opt.value === 'early_pickup' ? 'peer-data-[checked]:bg-blue-100 peer-data-[checked]:text-blue-700 peer-data-[checked]:ring-blue-400' : 'peer-data-[checked]:bg-success/10 peer-data-[checked]:text-success peer-data-[checked]:ring-success/40'} bg-muted text-muted-foreground hover:bg-muted`}
                        >
                          {opt.label}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>

                {/* Absence reason (only shown when absent) - VAL-CAPTURE-021 */}
                {presence === 'absent' && (
                  <div>
                    <label className="mb-2 block text-sm font-medium text-muted-foreground">
                      Alasan Ketidakhadiran{' '}
                      <span className="text-destructive">*</span>
                    </label>
                    <RadioGroup
                      value={absenceReason}
                      onValueChange={(value) =>
                        handleAbsenceReasonChange(value as TAbsenceReason)
                      }
                      className="grid grid-cols-2 gap-2"
                    >
                      {ABSENCE_REASON_OPTIONS.map((opt) => (
                        <div key={opt.value}>
                          <RadioGroupItem
                            value={opt.value}
                            id={`absence-${opt.value}`}
                            className="peer sr-only"
                          />
                          <Label
                            htmlFor={`absence-${opt.value}`}
                            className="flex cursor-pointer items-center justify-center rounded-lg py-2.5 text-sm font-medium transition-all peer-data-[checked]:bg-destructive/10 peer-data-[checked]:text-destructive peer-data-[checked]:ring-2 peer-data-[checked]:ring-destructive/40 bg-muted text-muted-foreground hover:bg-muted"
                          >
                            {opt.label}
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                    {/* Free-text field for "other" reason (VAL-CAPTURE-021) */}
                    {absenceReason === 'other' && (
                      <Input
                        type="text"
                        value={otherAbsenceReason}
                        onChange={(e) => setOtherAbsenceReason(e.target.value)}
                        placeholder="Tulis alasan ketidakhadiran..."
                        className="mt-2"
                      />
                    )}
                  </div>
                )}

                {/* Notes - optional, append-only (VAL-CAPTURE-053) */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-muted-foreground">
                    Catatan
                  </label>

                  {/* Existing notes */}
                  {existingNotes.length > 0 && (
                    <div className="mb-3 space-y-1.5">
                      {existingNotes.map((note) => (
                        <div
                          key={note.id}
                          className="rounded-lg bg-muted p-2.5 text-sm text-muted-foreground"
                        >
                          <p>{note.text}</p>
                          <p className="mt-0.5 text-[10px] text-muted-foreground">
                            {new Date(note.createdAt).toLocaleString('id-ID')}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}

                  <Textarea
                    placeholder="Tambahkan catatan (opsional)"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={2}
                    disabled={isSaving}
                  />
                  <p className="mt-1 text-[10px] text-muted-foreground">
                    Catatan bersifat kumulatif — tidak akan menghapus catatan
                    sebelumnya
                  </p>
                </div>

                {/* Save button */}
                <Button
                  onClick={handleSavePass1}
                  disabled={isSaving}
                  className="w-full"
                >
                  {isSaving
                    ? 'Menyimpan...'
                    : selectedKid.captureState === 'captured'
                      ? 'Simpan Perubahan'
                      : 'Simpan Observasi'}
                </Button>
              </div>
            )}

            {/* ─── Pass 2 Form ─── */}
            {activeTab === 'pass2' && isPass2Unlocked && !isAbsent && (
              <div className="space-y-4">
                {/* VAL-CAPTURE-025: Yes/no per activity */}
                {dcrActivities.length === 0 ? (
                  <div className="rounded-lg border border-dashed border p-6 text-center text-sm text-muted-foreground">
                    Belum ada aktivitas untuk sesi ini
                  </div>
                ) : (
                  <div className="space-y-2">
                    {dcrActivities.map((act) => {
                      const dcaId = act.id;
                      const activityName =
                        act.activity?.name ??
                        act.activityNameOther ??
                        'Aktivitas';
                      const currentValue = participations[dcaId];

                      return (
                        <div
                          key={dcaId}
                          className="flex items-center justify-between rounded-lg border bg-background p-3"
                        >
                          <div className="flex-1">
                            <span className="text-sm font-medium text-foreground">
                              {activityName}
                            </span>
                            {!act.wasPlanned && (
                              <Badge
                                variant="outline"
                                className="ml-2 bg-purple-50 text-purple-700 text-[10px]"
                              >
                                Tidak Terencana
                              </Badge>
                            )}
                          </div>
                          <ToggleGroup
                            value={currentValue ? [currentValue] : []}
                            onValueChange={(value) => {
                              if (value.length)
                                handleParticipationToggle(
                                  dcaId,
                                  value[0] as 'yes' | 'no'
                                );
                            }}
                          >
                            <ToggleGroupItem
                              value="yes"
                              size="sm"
                              className="text-xs aria-pressed:bg-success/10 aria-pressed:text-success aria-pressed:ring-2 aria-pressed:ring-success/40"
                            >
                              Ya
                            </ToggleGroupItem>
                            <ToggleGroupItem
                              value="no"
                              size="sm"
                              className="text-xs aria-pressed:bg-destructive/10 aria-pressed:text-destructive aria-pressed:ring-2 aria-pressed:ring-destructive/40"
                            >
                              Tidak
                            </ToggleGroupItem>
                          </ToggleGroup>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Save button */}
                <Button
                  onClick={handleSavePass2}
                  disabled={isSaving}
                  className="w-full"
                >
                  {isSaving ? 'Menyimpan...' : 'Simpan Partisipasi'}
                </Button>
              </div>
            )}

            {/* Absent message in Pass 2 (VAL-CAPTURE-026) */}
            {activeTab === 'pass2' && isAbsent && (
              <div className="flex flex-col items-center justify-center py-8">
                <HugeiconsIcon
                  icon={CheckmarkCircle02Icon}
                  className="h-12 w-12 text-blue-300"
                />
                <p className="mt-3 text-sm text-blue-600">
                  Anak tidak hadir — partisipasi tidak diperlukan
                </p>
              </div>
            )}
          </div>
        </div>

        {/* VAL-CAPTURE-032/038: Conflict dialog */}
        <ConflictDialog
          conflict={conflictData}
          isOpen={isConflictDialogOpen}
          onClose={() => {
            setIsConflictDialogOpen(false);
            setConflictData(null);
          }}
          onResolved={handleConflictResolved}
        />
      </>
    );
  }

  // ─────────────── Render: Roster view ───────────────

  return (
    <>
      <div className="divide-y divide-border">
        {/* VAL-CAPTURE-039: Offline indicator on roster */}
        {isOffline && (
          <div className="flex items-center justify-center gap-1 bg-warning px-4 py-1.5 text-center text-xs font-medium text-warning-foreground">
            <HugeiconsIcon icon={BoltIcon} />
            Offline — data akan tersimpan secara lokal
          </div>
        )}

        {/* Pass 2 lock banner (shown on roster level) - VAL-CAPTURE-023 */}
        {!isPass2Unlocked && (
          <div className="flex items-center justify-center gap-1.5 bg-warning/10 px-4 py-2.5 text-center text-sm font-medium text-warning">
            <HugeiconsIcon icon={CircleLock01Icon} />
            Menunggu laporan kelas — Pass 2 belum tersedia
          </div>
        )}

        {kids.map((kid) => {
          const obs = kid.observation;
          const isCaptured = kid.captureState === 'captured';
          const absenceReasonDisplay =
            obs?.presence === 'absent'
              ? (ABSENCE_REASON_LABELS[obs.absenceReason as TAbsenceReason] ??
                null)
              : null;

          return (
            <Button
              key={kid.id}
              type="button"
              variant="ghost"
              onClick={() => handleSelectKid(kid)}
              className="flex w-full items-center gap-3 px-4 py-3.5 text-left h-auto rounded-none transition-colors hover:bg-muted active:bg-muted"
              data-icon="inline-end"
            >
              {/* Capture state indicator */}
              <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                  isCaptured
                    ? 'bg-success/10 text-success'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                <HugeiconsIcon
                  icon={isCaptured ? CheckmarkCircle01Icon : Cancel01Icon}
                />
              </div>

              {/* Kid name */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {kid.name}
                </p>
                {/* Show presence info for captured kids */}
                {obs && (
                  <p className="text-xs text-muted-foreground">
                    {PRESENCE_LABELS[obs.presence as TPresence]}
                  </p>
                )}
              </div>

              {/* Absence reason badge - VAL-CAPTURE-029 */}
              {absenceReasonDisplay && (
                <Badge variant="destructive" className="shrink-0 text-[10px]">
                  {absenceReasonDisplay}
                </Badge>
              )}

              {/* Chevron */}
              <HugeiconsIcon
                icon={ChevronRightIcon}
                className="shrink-0 text-muted-foreground"
              />
            </Button>
          );
        })}
      </div>

      {/* VAL-CAPTURE-032/038: Conflict dialog */}
      <ConflictDialog
        conflict={conflictData}
        isOpen={isConflictDialogOpen}
        onClose={() => {
          setIsConflictDialogOpen(false);
          setConflictData(null);
        }}
        onResolved={handleConflictResolved}
      />
    </>
  );
}
