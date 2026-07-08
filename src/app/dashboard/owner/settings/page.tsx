'use client';

import { useEffect, useState } from 'react';

import { toast } from 'sonner';

import {
  getReminderConfig,
  toggleCaptureReminder,
  toggleScheduleReminder,
} from '@/lib/actions/reminder-settings';

// VAPID public key from build-time env
const VAPID_PUBLIC_KEY =
  typeof process !== 'undefined'
    ? process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || ''
    : '';

export default function OwnerSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [captureEnabled, setCaptureEnabled] = useState(true);
  const [scheduleEnabled, setScheduleEnabled] = useState(true);
  const [notificationStatus, setNotificationStatus] = useState<
    'prompt' | 'granted' | 'denied' | 'unsupported'
  >('prompt');
  const [swSupported, setSwSupported] = useState(true);

  async function loadConfig() {
    setLoading(true);
    const result = await getReminderConfig();
    if (result.success) {
      setCaptureEnabled(result.data.captureReminderEnabled);
      setScheduleEnabled(result.data.scheduleReminderEnabled);
    } else {
      toast.error(result.error || 'Gagal memuat pengaturan');
    }
    setLoading(false);
  }

  useEffect(() => {
    const init = async () => {
      // Compute initial states without calling setState mid-effect
      const notifStatus: 'prompt' | 'granted' | 'denied' | 'unsupported' =
        typeof window !== 'undefined' && 'Notification' in window
          ? (Notification.permission as 'granted' | 'denied')
          : 'unsupported';

      const supportsSw =
        typeof window !== 'undefined' && 'serviceWorker' in navigator;

      // Batch state updates
      setNotificationStatus(notifStatus);
      setSwSupported(supportsSw);

      await loadConfig();
    };

    init();
  }, []);

  async function handleToggleCapture() {
    const newValue = !captureEnabled;
    setCaptureEnabled(newValue);
    const result = await toggleCaptureReminder(newValue);
    if (!result.success) {
      setCaptureEnabled(!newValue);
      toast.error(result.error || 'Gagal menyimpan pengaturan');
    } else {
      toast.success(
        newValue
          ? 'Pengingat capture tertunda diaktifkan'
          : 'Pengingat capture tertunda dinonaktifkan'
      );
    }
  }

  async function handleToggleSchedule() {
    const newValue = !scheduleEnabled;
    setScheduleEnabled(newValue);
    const result = await toggleScheduleReminder(newValue);
    if (!result.success) {
      setScheduleEnabled(!newValue);
      toast.error(result.error || 'Gagal menyimpan pengaturan');
    } else {
      toast.success(
        newValue
          ? 'Pengingat jadwal mingguan diaktifkan'
          : 'Pengingat jadwal mingguan dinonaktifkan'
      );
    }
  }

  async function handleRequestPermission() {
    if (!('Notification' in window)) {
      toast.error('Browser tidak mendukung notifikasi');
      return;
    }

    try {
      const permission = await Notification.requestPermission();

      if (permission === 'granted') {
        setNotificationStatus('granted');
        toast.success('Notifikasi diizinkan');
        await registerServiceWorker();
      } else if (permission === 'denied') {
        setNotificationStatus('denied');
        toast.error('Notifikasi ditolak. Aktifkan melalui pengaturan browser.');
      }
    } catch {
      toast.error('Gagal meminta izin notifikasi');
    }
  }

  async function registerServiceWorker() {
    if (!('serviceWorker' in navigator)) return;

    try {
      const registration = await navigator.serviceWorker.register('/sw.js');

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertVapidKey(VAPID_PUBLIC_KEY) as BufferSource,
      });

      const response = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(subscription.toJSON()),
      });

      if (response.ok) {
        toast.success('Berlangganan notifikasi berhasil');
      } else {
        toast.error('Gagal menyimpan langganan notifikasi');
      }
    } catch (error) {
      console.error('[SW] Registration or subscription failed:', error);
    }
  }

  async function handleUnsubscribe() {
    if (!('serviceWorker' in navigator)) return;

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        const endpoint = subscription.endpoint;
        await subscription.unsubscribe();

        await fetch('/api/push/unsubscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoint }),
        });

        toast.success('Berhenti berlangganan notifikasi');
      }
    } catch (error) {
      console.error('[Push] Unsubscribe failed:', error);
      toast.error('Gagal berhenti berlangganan');
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8 p-4">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900">Pengaturan</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Kelola notifikasi dan pengingat
        </p>
      </div>

      {/* Notification Permission */}
      <section className="rounded-lg border border-zinc-200 bg-white p-4">
        <h2 className="mb-4 text-lg font-medium text-zinc-900">
          Izin Notifikasi
        </h2>

        {!swSupported && (
          <div className="rounded-md bg-amber-50 p-3 text-sm text-amber-800">
            Browser ini tidak mendukung Service Worker. Fitur notifikasi tidak
            tersedia. Pengingat akan ditampilkan di dashboard.
          </div>
        )}

        <div className="flex items-center justify-between rounded-md bg-zinc-50 p-3">
          <div>
            <p className="text-sm font-medium text-zinc-900">
              Notifikasi Browser
            </p>
            <p className="text-xs text-zinc-500">
              {notificationStatus === 'granted'
                ? 'Notifikasi sudah diizinkan'
                : notificationStatus === 'denied'
                  ? 'Notifikasi ditolak — pengingat akan muncul di dashboard'
                  : notificationStatus === 'unsupported'
                    ? 'Browser tidak mendukung notifikasi'
                    : 'Izinkan notifikasi untuk menerima pengingat'}
            </p>
          </div>

          {notificationStatus === 'granted' ? (
            <button
              type="button"
              onClick={handleUnsubscribe}
              className="rounded-md bg-red-50 px-3 py-1.5 text-sm font-medium text-red-700 transition-colors hover:bg-red-100"
            >
              Berhenti
            </button>
          ) : notificationStatus === 'denied' ? (
            <span className="rounded-md bg-zinc-100 px-3 py-1.5 text-sm text-zinc-500">
              Ditolak
            </span>
          ) : notificationStatus === 'prompt' ? (
            <button
              type="button"
              onClick={handleRequestPermission}
              className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-blue-700"
            >
              Izinkan Notifikasi
            </button>
          ) : null}
        </div>

        {notificationStatus === 'denied' && (
          <div className="mt-2 rounded-md bg-blue-50 p-3 text-sm text-blue-800">
            Notifikasi tidak dapat dikirim karena izin ditolak. Jumlah capture
            tertunda akan ditampilkan sebagai badge di dashboard Owner.
          </div>
        )}
      </section>

      {/* Reminder Settings */}
      <section className="rounded-lg border border-zinc-200 bg-white p-4">
        <h2 className="mb-4 text-lg font-medium text-zinc-900">
          Pengaturan Pengingat
        </h2>

        {loading ? (
          <div className="space-y-4">
            <div className="flex animate-pulse items-center justify-between rounded-md bg-zinc-50 p-3">
              <div className="space-y-1">
                <div className="h-4 w-40 rounded bg-zinc-200" />
                <div className="h-3 w-64 rounded bg-zinc-200" />
              </div>
              <div className="h-6 w-12 rounded-full bg-zinc-200" />
            </div>
            <div className="flex animate-pulse items-center justify-between rounded-md bg-zinc-50 p-3">
              <div className="space-y-1">
                <div className="h-4 w-40 rounded bg-zinc-200" />
                <div className="h-3 w-64 rounded bg-zinc-200" />
              </div>
              <div className="h-6 w-12 rounded-full bg-zinc-200" />
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Capture-pending toggle */}
            <div className="flex items-center justify-between rounded-md bg-zinc-50 p-3">
              <div>
                <p className="text-sm font-medium text-zinc-900">
                  Capture Tertunda
                </p>
                <p className="text-xs text-zinc-500">
                  Kirim pengingat 15 menit setelah sesi berakhir jika ada
                  capture yang tertunda
                </p>
              </div>
              <label className="relative inline-flex cursor-pointer items-center">
                <input
                  type="checkbox"
                  checked={captureEnabled}
                  onChange={handleToggleCapture}
                  className="peer sr-only"
                />
                <div className="h-6 w-11 rounded-full bg-zinc-300 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-zinc-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-blue-600 peer-checked:after:translate-x-full peer-checked:after:border-white" />
              </label>
            </div>

            {/* Schedule-entry toggle */}
            <div className="flex items-center justify-between rounded-md bg-zinc-50 p-3">
              <div>
                <p className="text-sm font-medium text-zinc-900">
                  Jadwal Mingguan
                </p>
                <p className="text-xs text-zinc-500">
                  Kirim pengingat hari Kamis pagi jika jadwal minggu depan belum
                  diisi
                </p>
              </div>
              <label className="relative inline-flex cursor-pointer items-center">
                <input
                  type="checkbox"
                  checked={scheduleEnabled}
                  onChange={handleToggleSchedule}
                  className="peer sr-only"
                />
                <div className="h-6 w-11 rounded-full bg-zinc-300 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-zinc-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-blue-600 peer-checked:after:translate-x-full peer-checked:after:border-white" />
              </label>
            </div>
          </div>
        )}
      </section>

      {/* Info */}
      <section className="rounded-lg border border-zinc-200 bg-white p-4">
        <h2 className="mb-2 text-lg font-medium text-zinc-900">
          Tentang Pengingat
        </h2>
        <ul className="space-y-2 text-sm text-zinc-600">
          <li>
            &bull; <strong>Capture Tertunda:</strong> Muncul 15 menit setelah
            sesi berakhir jika masih ada murid yang belum dicapture.
          </li>
          <li>
            &bull; <strong>Jadwal Mingguan:</strong> Muncul setiap hari Kamis
            pagi jika jadwal minggu depan belum diisi.
          </li>
          <li>
            &bull; Jika notifikasi ditolak, jumlah capture tertunda akan muncul
            sebagai badge di halaman Dashboard Owner.
          </li>
          <li>
            &bull; Log pengingat akan dibersihkan secara otomatis setelah 30
            hari.
          </li>
        </ul>
      </section>
    </div>
  );
}

/**
 * Convert a base64 encoded VAPID public key to Uint8Array.
 */
function convertVapidKey(k: string): Uint8Array {
  const padding = '='.repeat((4 - (k.length % 4)) % 4);
  const base64 = (k + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; ++i) arr[i] = raw.charCodeAt(i);
  return arr;
}
