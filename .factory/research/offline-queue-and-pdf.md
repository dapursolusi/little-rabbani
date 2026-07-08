# Research: Offline Queue (Dexie.js) + PDF Generation (react-pdf) + Web Push Notifications

> **Date:** 2026-07-07
> **Project:** Little Rabbai — Preschool LMS
> **Context:** Monthly/Quarterly report generation (005-monthly-quarterly-reports.md spec), offline observation capture, browser push for WhatsApp-reminder fallback.

---

## 1. Dexie.js Offline Write Queue (IndexedDB)

### Status

Both `dexie@4.4.4` and `dexie-react-hooks@4.4.0` are already installed. No additional packages needed.

### 1.1 Database Schema Design — Observation Capture Queue

The spec calls for an offline queue that stores observations locally until sync is possible. Here is the recommended schema:

```typescript
// src/lib/db.ts
import { Dexie, type EntityTable } from 'dexie';

export interface ObservationQueueItem {
  id?: number; // Auto-incremented primary key
  kid_id: string; // UUID from server
  session_id: string; // UUID from server
  field_data: Record<string, unknown>; // The observation payload
  version: number; // Optimistic concurrency (starts at 1)
  createdAt: string; // ISO 8601
  syncedAt: string | null; // ISO 8601 when synced, null if pending
  retryCount: number; // How many times sync has been attempted
  lastError: string | null; // Debug info if sync failed
  status: 'pending' | 'syncing' | 'synced' | 'failed';
  idempotencyKey: string; // UUID v4 — prevents duplicate sync
}

const db = new Dexie('LittleRabbani') as Dexie & {
  observationQueue: EntityTable<ObservationQueueItem, 'id'>;
};

// Schema declaration (version 1)
db.version(1).stores({
  observationQueue:
    '++id, kid_id, session_id, status, createdAt, [kid_id+session_id]',
});

export { db };
```

**Key schema decisions:**

- `++id` — Auto-incrementing primary key (IndexedDB default)
- `[kid_id+session_id]` — Compound index for fast lookups per kid+session
- `status` index — Allows efficient querying of pending items
- `createdAt` index — For ordering and pagination

### 1.2 Online/Offline Detection

Use a custom hook to track connectivity state:

```typescript
// src/hooks/useOnlineStatus.ts
'use client';

import { useEffect, useState } from 'react';

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}
```

### 1.3 Sync-on-Reconnect Flow

Create a sync manager that triggers when the app comes back online:

```typescript
// src/lib/sync-manager.ts
import { db } from './db';

export class SyncManager {
  private isSyncing = false;

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => this.sync());
    }
  }

  async sync() {
    if (this.isSyncing) return;
    this.isSyncing = true;

    try {
      const pendingItems = await db.observationQueue
        .where('status')
        .anyOf('pending', 'failed')
        .toArray();

      for (const item of pendingItems) {
        try {
          // Mark as syncing
          await db.observationQueue.update(item.id!, { status: 'syncing' });

          // Send to server
          const response = await fetch('/api/observations', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              idempotencyKey: item.idempotencyKey,
              kid_id: item.kid_id,
              session_id: item.session_id,
              field_data: item.field_data,
              version: item.version,
            }),
          });

          if (!response.ok) throw new Error(`HTTP ${response.status}`);

          // Mark as synced
          await db.observationQueue.update(item.id!, {
            status: 'synced',
            syncedAt: new Date().toISOString(),
          });
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : String(error);
          await db.observationQueue.update(item.id!, {
            status: 'failed',
            retryCount: item.retryCount + 1,
            lastError: errorMessage,
          });
        }
      }
    } finally {
      this.isSyncing = false;
    }
  }
}

// Singleton
export const syncManager =
  typeof window !== 'undefined' ? new SyncManager() : null;
```

### 1.4 Reactive UI with useLiveQuery

Use `useLiveQuery` to show pending queue items in the UI:

```typescript
// src/components/observations/OfflineIndicator.tsx
'use client';

import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';

export function OfflineIndicator() {
  const isOnline = useOnlineStatus();

  const pendingCount = useLiveQuery(
    () => db.observationQueue.where('status').equals('pending').count(),
    [],
    0 // default while loading
  );

  if (isOnline && pendingCount === 0) return null;

  return (
    <div className={`fixed bottom-4 right-4 rounded-lg px-4 py-2 text-sm shadow-lg ${
      isOnline ? 'bg-blue-500 text-white' : 'bg-amber-500 text-white'
    }`}>
      {isOnline
        ? `Syncing ${pendingCount} pending observations...`
        : 'You are offline — observations saved locally'}
    </div>
  );
}
```

### 1.5 Queue Management Best Practices

**Idempotency Keys:**

```typescript
// When enqueuing an observation:
import { v4 as uuidv4 } from 'uuid';

// or crypto.randomUUID()

async function enqueueObservation(
  data: Omit<ObservationQueueItem, 'id' | 'idempotencyKey'>
) {
  // Server deduplicates by idempotencyKey — safe to retry
  const idempotencyKey = crypto.randomUUID();

  // If online, try direct send with fallback
  if (navigator.onLine) {
    try {
      const res = await fetch('/api/observations', {/* ... */});
      if (res.ok) return;
    } catch {
      // Fall through to queue
    }
  }

  await db.observationQueue.add({
    ...data,
    idempotencyKey,
    status: 'pending',
    retryCount: 0,
    lastError: null,
    createdAt: new Date().toISOString(),
    syncedAt: null,
  });
}
```

**Retry with exponential backoff:**

```typescript
// In sync(), before sending, check retryCount:
const MAX_RETRIES = 5;
if (item.retryCount >= MAX_RETRIES) {
  // Too many failures — flag for manual review
  await db.observationQueue.update(item.id!, { status: 'failed' });
  continue;
}
```

**Dedup strategy:** The compound index `[kid_id+session_id]` enables queries like "has this kid+session already been queued" before adding a duplicate. For stronger dedup, the `idempotencyKey` UUID is the server-side defense.

**Conflict handling:** The `version` field supports optimistic concurrency. When the server receives an observation, it checks `version` against the current DB version. If there is a conflict, the server returns a 409 and the SyncManager can re-queue with an updated version or flag for manual resolution.

**Cleanup:** Periodically delete synced items older than 30 days:

```typescript
async function cleanOldSyncedItems() {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 30);

  await db.observationQueue
    .where('syncedAt')
    .below(cutoff.toISOString())
    .and((item) => item.status === 'synced')
    .delete();
}
```

---

## 2. @react-pdf/renderer for Quarterly Report PDFs

### Status

`@react-pdf/renderer` is **NOT installed yet**. Must add via `bun add @react-pdf/renderer`.

Latest version: `4.5.1` (published 2026-04-15)

### 2.1 Compatibility

| Concern        | Status                                                                           |
| -------------- | -------------------------------------------------------------------------------- |
| React 19       | Compatible since v4.1.0                                                          |
| Next.js 16     | Compatible (Next.js >= 14.1.1 fixes the `ba.Component is not a constructor` bug) |
| React Compiler | No known issues with react-pdf v4.x                                              |
| Bun runtime    | Reported working (no official support, but community reports success)            |

**Critical configuration:** `@react-pdf/renderer` must be listed as a server external package:

```typescript
// next.config.ts
const nextConfig: NextConfig = {
  reactCompiler: true,
  experimental: {
    serverComponentsExternalPackages: ['@react-pdf/renderer'],
  },
};
```

Without this, Next.js App Router will try to bundle react-pdf into the client bundle and fail with `TypeError: ba.Component is not a constructor`.

### 2.2 PDF Component Pattern

Basic reusable template matching the quarterly report spec (three sections):

```typescript
// src/lib/reports/quarterly-report-pdf.tsx
import { Document, Page, View, Text, StyleSheet, Font } from '@react-pdf/renderer';

// Optional: register custom fonts
// Font.register({ family: 'Inter', src: '/fonts/Inter-Regular.ttf' });

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Helvetica',
    fontSize: 11,
    lineHeight: 1.5,
  },
  header: {
    fontSize: 20,
    marginBottom: 20,
    fontWeight: 'bold',
    color: '#1a1a2e',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
    marginTop: 16,
    color: '#333',
    borderBottom: '1 solid #ccc',
    paddingBottom: 4,
  },
  body: {
    marginBottom: 12,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
});

interface QuarterlyReportProps {
  kidName: string;
  termName: string;
  sections: {
    changes: string;
    improvements: string;
    recommendations: string;
  };
  stats: {
    attendancePct: number;
    moodDistribution: Record<string, number>;
    activityCount: number;
  };
}

export function QuarterlyReportPDF({ kidName, termName, sections, stats }: QuarterlyReportProps) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.header}>
          Laporan Perkembangan {kidName} — {termName}
        </Text>

        {/* Stats Summary */}
        <Text style={styles.sectionTitle}>Ringkasan Statistik</Text>
        <View style={styles.body}>
          <View style={styles.statsRow}>
            <Text>Kehadiran:</Text>
            <Text>{stats.attendancePct}%</Text>
          </View>
          <View style={styles.statsRow}>
            <Text>Total Aktivitas:</Text>
            <Text>{stats.activityCount}</Text>
          </View>
        </View>

        {/* Section 1: What Changed */}
        <Text style={styles.sectionTitle}>Apa yang Berubah?</Text>
        <Text style={styles.body}>{sections.changes}</Text>

        {/* Section 2: What Improved */}
        <Text style={styles.sectionTitle}>Apa yang Meningkat?</Text>
        <Text style={styles.body}>{sections.improvements}</Text>

        {/* Section 3: Recommendations */}
        <Text style={styles.sectionTitle}>Rekomendasi</Text>
        <Text style={styles.body}>{sections.recommendations}</Text>
      </Page>
    </Document>
  );
}
```

### 2.3 Server-Side PDF Generation (Route Handler)

The recommended approach for quarterly reports — render in an API route or server action and return the buffer:

```typescript
// src/app/api/reports/quarterly/[kidId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { renderToBuffer } from '@react-pdf/renderer';
import { QuarterlyReportPDF } from '@/lib/reports/quarterly-report-pdf';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ kidId: string }> }
) {
  const { kidId } = await params;
  const searchParams = request.nextUrl.searchParams;
  const termId = searchParams.get('termId');

  if (!termId) {
    return NextResponse.json({ error: 'termId is required' }, { status: 400 });
  }

  try {
    // Fetch data from DB
    const kidData = await getKidData(kidId);
    const termData = await getTermData(termId);
    const sections = await generateReportSections(kidId, termId);
    const stats = await computeQuarterlyStats(kidId, termId);

    // Render PDF to Buffer
    const pdfBuffer = await renderToBuffer(
      <QuarterlyReportPDF
        kidName={kidData.name}
        termName={termData.name}
        sections={sections}
        stats={stats}
      />
    );

    // Return as downloadable PDF
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="laporan-${kidData.name}-${termData.name}.pdf"`,
      },
    });
  } catch (error) {
    console.error('PDF generation failed:', error);
    return NextResponse.json(
      { error: 'PDF generation failed. Please try again.' },
      { status: 500 }
    );
  }
}
```

### 2.4 Client-Side Download

Trigger the server-side PDF from a client component:

```typescript
// src/components/reports/DownloadQuarterlyReport.tsx
'use client';

import { useState } from 'react';
import { toast } from 'sonner';

interface Props {
  kidId: string;
  termId: string;
}

export function DownloadQuarterlyReport({ kidId, termId }: Props) {
  const [isGenerating, setIsGenerating] = useState(false);

  async function handleDownload() {
    setIsGenerating(true);
    try {
      const response = await fetch(
        `/api/reports/quarterly/${kidId}?termId=${termId}`
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to generate PDF');
      }

      // Create a blob and trigger download
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `laporan-${kidId}-${termId}.pdf`;
      a.click();
      URL.revokeObjectURL(url);

      toast.success('Report downloaded successfully');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to generate PDF');
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <button
      onClick={handleDownload}
      disabled={isGenerating}
      className="rounded-lg bg-blue-600 px-4 py-2 text-white disabled:opacity-50"
    >
      {isGenerating ? 'Generating PDF...' : 'Download Quarterly Report'}
    </button>
  );
}
```

### 2.5 Storage Strategy

Per the spec: store PDF as base64 in Neon for v1.

```typescript
// After generating the buffer:
const pdfBase64 = pdfBuffer.toString('base64');

// Store in quarterly_report_snapshots.pdf_url column
await db.insert(quarterlyReportSnapshots).values({
  kidId,
  termId,
  pdfUrl: `data:application/pdf;base64,${pdfBase64}`,
  // ...
});
```

For production scale beyond Neon's ~1GB free tier, migrate to object storage (S3/R2). But for v1 with small PDFs (a few KB each), base64 in the DB is fine.

### 2.6 Alternative: Puppeteer / Browser Print

**Simplest alternative:** Use `puppeteer` (or `@sparticuz/chromium` on serverless) to render HTML to PDF.

| Approach                | Pros                                                 | Cons                                               |
| ----------------------- | ---------------------------------------------------- | -------------------------------------------------- |
| `@react-pdf/renderer`   | React components, bundle-free PDF, works server-side | Bundle size, Yoga layout dependency                |
| `puppeteer`             | Full CSS support, pixel-perfect from HTML            | Heavy (~300MB Chromium), cold starts on serverless |
| `html2canvas` + `jspdf` | Client-side only, no server cost                     | Lower quality, no server-side generation           |

**Recommendation:** Stick with `@react-pdf/renderer` as planned in the spec. It's much lighter than Puppeteer and works well for programmatic PDF layout. Puppeteer would be overkill for a report with three text sections and simple stats.

---

## 3. Web Push Notifications (VAPID)

### Status

Not installed. Requires:

- `bun add web-push` (server-side, latest v3.6.7)
- Service worker file at `public/sw.js`
- VAPID key pair generation

### 3.1 VAPID Key Generation

```bash
bunx web-push generate-vapid-keys
```

Add to environment variables:

```env
# .env / env.mjs additions
NEXT_PUBLIC_VAPID_PUBLIC_KEY=BH_xxxxxxxxxxxxx
VAPID_PRIVATE_KEY=yyyyyyyyyyyyyyyyy
```

### 3.2 Service Worker

```javascript
// public/sw.js
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};
  const {
    title = 'Little Rabbai',
    body,
    icon = '/icon-192.png',
    url = '/',
  } = data;

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon,
      badge: '/icon-192.png',
      tag: 'little-rabbani',
      data: { url },
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const urlToOpen = event.notification.data?.url || '/';

  event.waitUntil(
    clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((windows) => {
        const existingWindow = windows.find(
          (w) => w.url.includes(urlToOpen) && 'focus' in w
        );
        if (existingWindow) return existingWindow.focus();
        if (clients.openWindow) return clients.openWindow(urlToOpen);
      })
  );
});
```

### 3.3 Service Worker Registration in Next.js App Router

Since Next.js App Router places static files in `public/`, the service worker is served at `/sw.js`:

```typescript
// src/lib/push-notifications.ts
export async function registerServiceWorker() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
    });
    return registration;
  } catch (error) {
    console.error('Service worker registration failed:', error);
    return false;
  }
}
```

### 3.4 Subscribe to Push Notifications

```typescript
// src/lib/push-notifications.ts (continued)
export async function subscribeToPushNotifications() {
  const registration = await registerServiceWorker();
  if (!registration) return null;

  try {
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(
        process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!
      ),
    });

    // Store subscription on the server
    const response = await fetch('/api/notifications/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(subscription.toJSON()),
    });

    if (!response.ok) throw new Error('Failed to store subscription');
    return subscription;
  } catch (error) {
    console.error('Push subscription failed:', error);
    return null;
  }
}

// Utility: convert VAPID public key from base64 to Uint8Array
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}
```

### 3.5 Server-Side API Routes

**Subscribe endpoint:**

```typescript
// src/app/api/notifications/subscribe/route.ts
import { NextRequest, NextResponse } from 'next/server';

import { db } from '@/lib/db';

// Drizzle DB

export async function POST(request: NextRequest) {
  try {
    const subscription = await request.json();

    await db.insert(pushSubscriptionsTable).values({
      endpoint: subscription.endpoint,
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
      createdAt: new Date(),
      isActive: true,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to store subscription:', error);
    return NextResponse.json(
      { error: 'Failed to store subscription' },
      { status: 500 }
    );
  }
}
```

**Unsubscribe endpoint:**

```typescript
// src/app/api/notifications/unsubscribe/route.ts
export async function POST(request: NextRequest) {
  try {
    const { endpoint } = await request.json();
    await db
      .update(pushSubscriptionsTable)
      .set({ isActive: false })
      .where(eq(pushSubscriptionsTable.endpoint, endpoint));
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to remove subscription' },
      { status: 500 }
    );
  }
}
```

### 3.6 Sending Push from the Server

```typescript
// src/lib/notifications/send-push.ts
import webpush from 'web-push';

import { db, eq, pushSubscriptionsTable } from '@/lib/db';

webpush.setVapidDetails(
  'mailto:admin@littlerabbani.com',
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

export async function sendPushNotification(
  title: string,
  body: string,
  url: string = '/'
) {
  const subscriptions = await db
    .select()
    .from(pushSubscriptionsTable)
    .where(eq(pushSubscriptionsTable.isActive, true));

  const results = { success: 0, failed: 0 };

  for (const sub of subscriptions) {
    try {
      await webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: { p256dh: sub.p256dh, auth: sub.auth },
        },
        JSON.stringify({ title, body, url })
      );
      results.success++;
    } catch (error: any) {
      // 410 Gone / 404 Not Found — subscription expired
      if (error.statusCode === 410 || error.statusCode === 404) {
        await db
          .update(pushSubscriptionsTable)
          .set({ isActive: false })
          .where(eq(pushSubscriptionsTable.endpoint, sub.endpoint));
      }
      results.failed++;
    }
  }

  return results;
}
```

### 3.7 DB Schema for Subscriptions

```sql
CREATE TABLE push_subscriptions (
  id SERIAL PRIMARY KEY,
  endpoint VARCHAR(500) UNIQUE NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_active BOOLEAN DEFAULT TRUE
);
```

### 3.8 Permission Denied Fallback

If the user denies push permission, there is no way to request it again programmatically (browser blocks `Notification.requestPermission()` after denial). The recommended fallback:

```typescript
export async function trySubscribe() {
  const permission = Notification.permission;

  if (permission === 'denied') {
    // Show a UI hint explaining how to re-enable in browser settings
    return { success: false, reason: 'denied' };
  }

  if (permission === 'granted') {
    return {
      success: true,
      subscription: await subscribeToPushNotifications(),
    };
  }

  // 'default' — never asked, or dismissed
  const result = await Notification.requestPermission();
  if (result === 'granted') {
    return {
      success: true,
      subscription: await subscribeToPushNotifications(),
    };
  }

  return { success: false, reason: result };
}
```

### 3.9 Localhost Development

Web Push notifications work on localhost in Chrome and Firefox (Push API is exempt from the HTTPS requirement for localhost). VAPID keys work the same as production.

**Caveat:** For push to actually deliver on localhost:

1. The dev server must be reachable (next dev on localhost:3000 works)
2. The service worker must be registered and active
3. Browser must be running (push arrives even when tab is closed, but browser must be open)
4. For iOS Safari, HTTPS + home screen app is required — localhost won't work on iOS

---

## Summary of Installation Requirements

| Package               | Command                             | Purpose                               |
| --------------------- | ----------------------------------- | ------------------------------------- |
| `@react-pdf/renderer` | `bun add @react-pdf/renderer`       | PDF generation for quarterly reports  |
| `web-push`            | `bun add web-push`                  | Server-side push notification sending |
| _(none)_              | `bunx web-push generate-vapid-keys` | Generate VAPID key pair               |

**Already installed:**

- `dexie@4.4.4` — Offline IndexedDB wrapper
- `dexie-react-hooks@4.4.0` — Reactive hook for Dexie queries

**Config changes needed:**

- `next.config.ts`: Add `serverComponentsExternalPackages: ['@react-pdf/renderer']`
- `env.mjs`: Add `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`
- Create `public/sw.js` for push notification service worker

**Key decisions from this research:**

1. Offline queue uses a simple pending/synced model with idempotency keys for dedup at the server level
2. PDF generation is server-only (route handler), not client-side — avoids bundle size concerns
3. Push notifications use web-push VAPID flow with the subscription stored in a DB table
4. All three patterns work with React 19, Next.js 16, and the React Compiler
