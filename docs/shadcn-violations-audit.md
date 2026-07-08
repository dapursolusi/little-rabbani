# Shadcn Violations Audit Report

> Generated: 2026-07-08
> Scope: `src/app/` and `src/components/` (excluding `src/components/ui/` auto-generated)

---

## 1. Raw `<button>` Tags (should use shadcn `<Button>`)

20 occurrences across 9 files.

### `src/app/(auth)/login/login-form.tsx`

- **Line 65**: Retry button after OAuth error
  ```tsx
  <button onClick={handleRetry} disabled={isLoading} className="mt-3 inline-flex ...">
  ```
- **Line 101**: Google sign-in button
  ```tsx
  <button onClick={handleSignIn} disabled={isLoading} className="flex w-full ...">
  ```

### `src/app/dashboard/owner/dcr/[sessionId]/dcr-form.tsx`

- **Line 228**: Deviation selector buttons (done/skipped/modified)
  ```tsx
  <button key={opt.value} type="button" onClick={() => handleDeviationChange(...)}>
  ```

### `src/app/dashboard/owner/reports/daily/[sessionId]/report-client.tsx`

- **Line 455**: Kid row expand/collapse button
  ```tsx
  <button type="button" onClick={() => handleExpandReport(...)}>
  ```

### `src/app/dashboard/owner/settings/page.tsx`

- **Line 206**: Unsubscribe from notifications button
  ```tsx
  <button type="button" onClick={handleUnsubscribe} className="rounded-md bg-red-50 ...">
  ```
- **Line 218**: Request notification permission button
  ```tsx
  <button type="button" onClick={handleRequestPermission} className="rounded-md bg-blue-600 ...">
  ```

### `src/app/dashboard/teacher/capture/[sessionId]/capture-roster.tsx`

- **Line 587**: Back-to-roster link (styled as text link)
- **Line 608**: Pass 1 tab button
- **Line 619**: Pass 2 tab button
- **Line 674**: Mood emoji selector (5 buttons)
- **Line 700**: Appetite selector buttons (3)
- **Line 730**: Presence selector buttons
- **Line 761**: Absence reason selector
- **Line 876**: Participation "Ya" button
- **Line 889**: Participation "Tidak" button
- **Line 987**: Roster list kid selector buttons
  All are `<button type="button" onClick={...}>` with custom Tailwind classes.

### `src/components/layout/logout-button.tsx`

- **Line 19**: Logout button
  ```tsx
  <button onClick={handleLogout} className="rounded-lg border ...">
  ```

### `src/components/sections/csv-import-form.tsx`

- **Line 223**: Import type selector buttons
  ```tsx
  <button key={type.id} type="button" ...>
  ```

### `src/components/sections/offline-indicator.tsx`

- **Line 128**: Sync-now action button inside sticky banner
  ```tsx
  <button type="button" onClick={syncNow} ...>
  ```

### `src/components/sections/session-generate-form.tsx`

- **Line 88**: Day-of-week toggle buttons
  ```tsx
  <button key={day.value} type="button" onClick={() => toggleDay(...)}>
  ```

---

## 2. Raw `<select>` Tags

**None found.** All selections in the codebase use custom button-based implementations or shadcn components. ✅

---

## 3. Raw Checkbox Inputs (should use shadcn `<Checkbox>`)

4 occurrences across 3 files.

### `src/app/dashboard/owner/settings/page.tsx`

- **Lines 273-279**: Capture-pending reminder toggle
  ```tsx
  <input
    type="checkbox"
    checked={captureEnabled}
    onChange={handleToggleCapture}
    className="peer sr-only"
  />
  ```
- **Lines 295-301**: Schedule-entry reminder toggle
  ```tsx
  <input
    type="checkbox"
    checked={scheduleEnabled}
    onChange={handleToggleSchedule}
    className="peer sr-only"
  />
  ```
  ⚠️ These are **hand-rolled toggle switches** using `peer` + `after:` pseudo-elements. Should use shadcn `<Switch>`.

### `src/components/sections/session-edit-form.tsx`

- **Line 127**: Holiday toggle checkbox
  ```tsx
  <input id="isHoliday" name="isHoliday" type="checkbox" ... className="h-4 w-4 rounded border-zinc-300" />
  ```

### `src/components/sections/session-form.tsx`

- **Line 119**: Holiday toggle checkbox
  ```tsx
  <input id="isHoliday" name="isHoliday" type="checkbox" ... className="h-4 w-4 rounded border-zinc-300" />
  ```

✅ `src/components/sections/term-cohort-form.tsx` (line 10) **correctly** imports and uses shadcn `Checkbox`.

---

## 4. Raw `<input>` Tags (non-checkbox)

### `src/app/dashboard/teacher/capture/[sessionId]/capture-roster.tsx`

- **Line 777**: Free-text absence reason input
  ```tsx
  <input type="text" value={otherAbsenceReason} onChange={...} placeholder="Tulis alasan ketidakhadiran..." />
  ```

### `src/components/sections/csv-import-form.tsx`

- **Line 284**: File picker input
  ```tsx
  <input
    ref={fileInputRef}
    id="csv-file"
    type="file"
    accept=".csv"
    onChange={handleFileSelect}
  />
  ```

---

## 5. Divs Styled as Cards (should use shadcn `<Card>`)

38 occurrences across 22 files. Common pattern: `rounded-lg border border-zinc-200 bg-white p-4/6`.

### `src/app/(auth)/login/login-form.tsx`

- **Line 43**: Login form container

### `src/app/dashboard/owner/activity/[id]/edit/page.tsx`

- **Line 34**: Activity edit form container

### `src/app/dashboard/owner/activity/create/page.tsx`

- **Line 19**: Activity create form container

### `src/app/dashboard/owner/dcr/[sessionId]/dcr-form.tsx`

- **Line 206**: Activity row container

### `src/app/dashboard/owner/dcr/page.tsx`

- **Line 89**: DCR session card

### `src/app/dashboard/owner/guardian/[id]/edit/page.tsx`

- **Line 43**: Guardian edit form container

### `src/app/dashboard/owner/guardian/create/page.tsx`

- **Line 19**: Guardian create form container

### `src/app/dashboard/owner/kid/[id]/edit/page.tsx`

- **Line 48**: Kid edit form container

### `src/app/dashboard/owner/kid/create/page.tsx`

- **Line 23**: Kid create form container

### `src/app/dashboard/owner/reports/daily/[sessionId]/report-client.tsx`

- **Line 495**: Report detail card

### `src/app/dashboard/owner/reports/daily/page.tsx`

- **Line 86**: Daily report session card

### `src/app/dashboard/owner/reports/monthly/[kidId]/[month]/report-client.tsx`

- **Line 285**: Generate button band
- **Line 337**: Report content card
- **Line 351**: Stat mini-card

### `src/app/dashboard/owner/reports/monthly/page.tsx`

- **Line 136**: Monthly report kid card

### `src/app/dashboard/owner/reports/quarterly/[kidId]/report-client.tsx`

- **Line 312**: Generate button band
- **Line 362**: Report content card
- **Line 419**: Stat mini-card (attendance)
- **Line 636**: PDF fallback card

### `src/app/dashboard/owner/reports/quarterly/page.tsx`

- **Line 112**: Quarterly report term card

### `src/app/dashboard/owner/schedule/[termId]/page.tsx`

- **Line 115**: Schedule session card

### `src/app/dashboard/owner/schedule/page.tsx`

- **Line 72**: Term schedule card

### `src/app/dashboard/owner/session/[id]/edit/page.tsx`

- **Line 48**: Session edit form container

### `src/app/dashboard/owner/session/create/page.tsx`

- **Line 53**: Session create form container

### `src/app/dashboard/owner/session/generate/page.tsx`

- **Line 64**: Session generate form container

### `src/app/dashboard/owner/session/page.tsx`

- **Line 228**: Session card

### `src/app/dashboard/owner/settings/page.tsx`

- **Line 177**: Notification permission section card
- **Line 237**: Reminder settings section card
- **Line 309**: Info section card

### `src/app/dashboard/owner/term/[id]/cohort/page.tsx`

- **Line 108**: Term cohort detail card

### `src/app/dashboard/owner/term/[id]/edit/page.tsx`

- **Line 32**: Term edit form container

### `src/app/dashboard/owner/term/create/page.tsx`

- **Line 17**: Term create form container

### `src/app/dashboard/teacher/capture/[sessionId]/capture-roster.tsx`

- **Line 860**: Pass 2 activity row container

### `src/app/dashboard/teacher/capture/page.tsx`

- **Line 95**: Completed session card
- **Line 118**: Pending session card

### `src/components/layout/logout-button.tsx`

- **Line 21**: Logout button card-like container

### `src/components/sections/teacher-schedule-view.tsx`

- **Line 123**: Schedule day card

---

## 6. Inline `<svg>` Tags (should use hugeicons via `HugeiconsIcon`)

22 occurrences across 16 files.

| File                                                                    | Line(s)      | Purpose                           |
| ----------------------------------------------------------------------- | ------------ | --------------------------------- |
| `app/(auth)/login/login-form.tsx`                                       | 72, 107, 128 | Spinner SVG, Google logo SVG      |
| `app/dashboard/owner/activity/activity-actions.tsx`                     | 101          | More-vertical icon                |
| `app/dashboard/owner/dcr/[sessionId]/dcr-form.tsx`                      | 257          | Chevron-down icon                 |
| `app/dashboard/owner/guardian/guardian-actions.tsx`                     | 57           | More-vertical icon                |
| `app/dashboard/owner/kid/kid-actions.tsx`                               | 53           | More-vertical icon                |
| `app/dashboard/owner/reports/daily/[sessionId]/report-client.tsx`       | 419, 476     | Loading spinner, chevron icons    |
| `app/dashboard/owner/reports/monthly/[kidId]/[month]/report-client.tsx` | 305          | Loading spinner                   |
| `app/dashboard/owner/reports/quarterly/[kidId]/report-client.tsx`       | 330, 383     | Loading spinner, download icon    |
| `app/dashboard/owner/schedule/[termId]/session-schedule-editor.tsx`     | 288          | Edit/pencil icon                  |
| `app/dashboard/teacher/capture/[sessionId]/capture-roster.tsx`          | 923, 1025    | Check-circle icon, chevron icon   |
| `app/dashboard/teacher/capture/[sessionId]/page.tsx`                    | 116          | Clipboard/calendar icon           |
| `components/sections/offline-indicator.tsx`                             | 87           | Cloud-offline icon                |
| `components/sections/session-actions.tsx`                               | 76           | More-vertical icon                |
| `components/sections/teacher-pending-capture-banner.tsx`                | 63           | Chevron-right icon                |
| `components/sections/teacher-schedule-view.tsx`                         | 88, 162      | Chevron-left, chevron-right icons |
| `components/sections/term-actions.tsx`                                  | 77           | More-vertical icon                |

---

## 7. Raw `<textarea>` Tags

**None found** in non-ui directories. ✅ Only the shadcn auto-generated `Textarea` component exists.

---

## 8. Hand-rolled Skeletons with `animate-pulse` (should use shadcn `<Skeleton>`)

### `src/app/dashboard/owner/settings/page.tsx`

- **Line 244**: Reminder setting skeleton loading state
  ```tsx
  <div className="flex animate-pulse items-center justify-between rounded-md bg-zinc-50 p-3">
  ```
- **Line 251**: Second skeleton loading row
  ```tsx
  <div className="flex animate-pulse items-center justify-between rounded-md bg-zinc-50 p-3">
  ```

---

## 9. Raw `<span>` as Badges (should use shadcn `<Badge>`)

### `src/app/dashboard/owner/dcr/[sessionId]/dcr-form.tsx`

- **Line 217**: "Tidak Terencana" badge
  ```tsx
  <span className="rounded bg-purple-100 px-1.5 py-0.5 text-xs font-medium text-purple-700">
  ```

### `src/app/dashboard/owner/reports/quarterly/page.tsx`

- **Line 118**: "Aktif" status badge
  ```tsx
  <span className="inline-block rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
  ```

### `src/app/dashboard/owner/schedule/[termId]/session-schedule-editor.tsx`

- **Line 245**: "Outing" badge
  ```tsx
  <span className="rounded bg-blue-100 px-1.5 py-0.5 text-xs font-medium text-blue-700">
  ```
- **Line 265**: "Aktivitas" badge
  ```tsx
  <span className="rounded bg-green-100 px-1.5 py-0.5 text-xs font-medium text-green-700">
  ```

### `src/app/dashboard/owner/settings/page.tsx`

- **Line 214**: "Ditolak" status badge
  ```tsx
  <span className="rounded-md bg-zinc-100 px-3 py-1.5 text-sm text-zinc-500">
  ```

### `src/components/sections/push-notification-setup.tsx`

- **Line 83**: Amber notification dot indicator
  ```tsx
  <span className="flex h-2 w-2 rounded-full bg-amber-500" />
  ```

### `src/components/sections/teacher-pending-capture-banner.tsx`

- **Line 58**: Amber pending dot indicator
  ```tsx
  <span className="flex h-2.5 w-2.5 rounded-full bg-amber-500" />
  ```

---

## 10. Hand-rolled Tabs (should use shadcn `<Tabs>`)

### `src/app/dashboard/teacher/capture/[sessionId]/capture-roster.tsx`

- **Lines 128, 608-642**: Custom tab implementation using `activeTab` state and raw `<button>` elements for Pass 1 / Pass 2 switching
  ```tsx
  const [activeTab, setActiveTab] = useState<'pass1' | 'pass2'>('pass1');
  ```
  Tab buttons at lines 608 and 619 are plain `<button>` with conditional border-bottom styling. Tab content switching at lines 665 and 840 uses `activeTab === 'pass1'` conditionals.

✅ `src/components/layout/teacher-tabs.tsx` correctly uses shadcn `<Tabs>`, `<TabsList>`, `<TabsTrigger>`. (Mobile bottom nav uses `<Link>` which is acceptable.)

---

## 11. Hand-rolled Toggle Switches (should use shadcn `<Switch>`)

### `src/app/dashboard/owner/settings/page.tsx`

- **Lines 273-279, 295-301**: Two custom CSS toggle switches
  ```tsx
  <label className="relative inline-flex cursor-pointer items-center">
    <input type="checkbox" ... className="peer sr-only" />
    <div className="h-6 w-11 rounded-full bg-zinc-300 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-zinc-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-blue-600 peer-checked:after:translate-x-full peer-checked:after:border-white" />
  </label>
  ```

---

## Summary Table

| Category                                            | Files Affected       | Occurrences         | Priority |
| --------------------------------------------------- | -------------------- | ------------------- | -------- |
| Raw `<button>`                                      | 9 files              | 20                  | High     |
| Raw `<select>`                                      | 0                    | 0                   | ✅ None  |
| Raw Checkbox (should use `<Checkbox>`)              | 3 files              | 4                   | Medium   |
| Hand-rolled toggle switches (should use `<Switch>`) | 1 file               | 2                   | Medium   |
| Raw text/number `<input>`                           | 2 files              | 2                   | Low      |
| Divs as Cards (should use `<Card>`)                 | 22 files             | 38                  | Medium   |
| Inline `<svg>` (should use hugeicons)               | 16 files             | 22                  | Medium   |
| Raw `<textarea>`                                    | 0                    | 0                   | ✅ None  |
| Hand-rolled Skeletons (should use `<Skeleton>`)     | 1 file               | 2                   | Low      |
| Raw `<span>` as Badges (should use `<Badge>`)       | 5 files              | 7                   | Medium   |
| Hand-rolled Tabs (should use `<Tabs>`)              | 1 file               | 1                   | Medium   |
| **Total**                                           | **~30 unique files** | **~98 occurrences** |          |

### Key Findings

1. **Most widespread**: Divs styled as cards (`rounded-lg border border-zinc-200 bg-white p-4/6`) — 38 occurrences across 22 files.
2. **Most impactful**: Raw `<button>` tags — 20 occurrences across 9 files — should use shadcn `<Button>` for consistent styling and interactive states.
3. **Most complex**: Custom tab implementation in `capture-roster.tsx` — should use shadcn `<Tabs>`.
4. **Design-system gap**: Hand-rolled toggle switches in `settings/page.tsx` — shadcn `<Switch>` is already installed.
5. **Icon inconsistency**: 22 inline `<svg>` tags — should use `HugeiconsIcon` from `@hugeicons/react`.
