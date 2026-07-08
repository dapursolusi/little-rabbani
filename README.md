# Little Rabbani — Preschool LMS

Aplikasi **Learning Management System (LMS)** untuk TK/PAUD Islami. Phase 1 mencakup manajemen data master, pencatatan harian kegiatan siswa, laporan orang tua, laporan bulanan/triwulan, dan sistem pengingat.

Dibangun dengan **Next.js 16**, **BetterAuth**, **Drizzle ORM + Neon Postgres**, dan **shadcn/ui (base-nova)**.

> Proyek ini awalnya menggunakan [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app) sebagai template dasar.

---

## Fitur (Phase 1 — 6 Milestone)

### M1 — Scaffold + Auth

- Skema database lengkap (Owner, Teacher, Kid, Guardian, Term, Session, Activity Catalog, Attendance, Report, dll.)
- BetterAuth + Google OAuth (peran **Owner** dan **Teacher**)
- Proteksi rute proxy berdasarkan role
- Halaman login + dashboard shell

### M2 — Master Data

- **CRUD Santri (Kid)** & **Wali (Guardian)** — data anak dan orang tua/wali
- **CRUD Term/Session** — tahun ajaran dan semester
- **Activity Catalog** — katalog aktivitas harian dengan **impor CSV**

### M3 — Daily Capture

- **Weekly Schedule** — jadwal mingguan per grup/kelas
- **Daily Class Report** — laporan harian kelas
- **Teacher Capture** — pencatatan observasi guru dalam 2 pass (Pass 1 / Pass 2)
- **Conflict handling** — deteksi bentrok data antar teacher
- **Offline queue (Dexie/IndexedDB)** — tetap bisa mencatat saat offline

### M4 — Daily Parent Report

- **OpenRouter AI client** dengan fallback chain (deepseek-v4-flash → fallback model)
- Generate laporan harian per siswa untuk dibagikan ke orang tua
- **Copy-to-clipboard** dan **mark-as-sent** workflow

### M5 — Monthly & Quarterly Reports

- **Monthly report** — statistik bulanan + narasi AI otomatis
- **Quarterly report** — PDF 3 seksi (Perubahan / Peningkatan / Rekomendasi) menggunakan `react-pdf`

### M6 — Reminders

- **Browser push notifications** (web-push / VAPID)
- **Cron endpoint** untuk pengiriman terjadwal
- **Pengaturan pengingat** di dashboard Owner
- **Pending-capture banner** untuk Teacher (5s polling)

---

## Tech Stack

| Layer                 | Teknologi                                                            |
| --------------------- | -------------------------------------------------------------------- |
| **Runtime**           | bun 1.3.x, Node.js 22+, Next.js 16, React 19                         |
| **Auth**              | BetterAuth + Google OAuth (roles: Owner, Teacher)                    |
| **Database**          | Neon Postgres + Drizzle ORM                                          |
| **AI / LLM**          | OpenRouter (deepseek-v4-flash) — narasi laporan                      |
| **UI**                | shadcn/ui (base-nova / `@base-ui/react` / hugeicons), Tailwind CSS 4 |
| **PDF**               | `@react-pdf/renderer` — laporan triwulan                             |
| **Push Notification** | web-push / VAPID — pengingat browser                                 |
| **Offline**           | Dexie.js + IndexedDB — antrean offline                               |
| **Testing**           | Vitest (unit), Playwright (E2E)                                      |
| **Code quality**      | TypeScript strict, ESLint, Prettier, Husky, commitlint, lint-staged  |
| **Env safety**        | `@t3-oss/env-nextjs` + zod                                           |

---

## Persiapan & Menjalankan

### Prasyarat

- **bun** 1.3.x ([install](https://bun.sh/docs/installation))

### Setup

```bash
# 1. Clone repository
git clone <repo-url>
cd little-rabbani

# 2. Install dependencies
bun install

# 3. Setup environment variables
cp .env.example .env
# Isi variabel berikut (lihat bagian Environment Variables)

# 4. Setup database
bun run db:push    # Migrasi skema ke database

# 5. Jalankan development server
bun run dev
```

### Environment Variables

Semua variabel lingkungan divalidasi di `env.mjs`. Yang wajib diisi:

| Variable               | Keterangan                                 |
| ---------------------- | ------------------------------------------ |
| `DATABASE_URL`         | Connection string Neon Postgres            |
| `BETTERAUTH_SECRET`    | Secret untuk session encryption            |
| `GOOGLE_CLIENT_ID`     | Client ID Google OAuth                     |
| `GOOGLE_CLIENT_SECRET` | Client Secret Google OAuth                 |
| `OPENROUTER_API_KEY`   | API key OpenRouter untuk AI narasi laporan |
| `VAPID_PUBLIC_KEY`     | Public key VAPID untuk push notification   |
| `VAPID_PRIVATE_KEY`    | Private key VAPID untuk push notification  |

### Scripts

| Command               | Keterangan                       |
| --------------------- | -------------------------------- |
| `bun run dev`         | Jalankan dev server              |
| `bun run build`       | Build production                 |
| `bun run lint`        | ESLint check                     |
| `bun run lint:fix`    | ESLint + auto-fix                |
| `bun run format`      | Prettier — format semua file     |
| `bun run typecheck`   | `tsc --noEmit` — cek tipe        |
| `bun run test`        | Vitest (watch mode)              |
| `bun run test:run`    | Vitest (single run)              |
| `bun run test:e2e`    | Playwright — tes E2E             |
| `bun run db:push`     | Drizzle — push skema ke database |
| `bun run db:generate` | Drizzle — generate migrasi       |
| `bun run db:migrate`  | Drizzle — jalankan migrasi       |
| `bun run db:studio`   | Drizzle Studio — GUI database    |

---

## Struktur Direktori

```
src/
├── app/                   → App Router (halaman & API route)
│   ├── (auth)/            → Halaman login
│   ├── (dashboard)/       → Dashboard Owner & Teacher
│   └── api/               → Cron, web-push, dll.
├── components/
│   ├── layout/            → Header, Sidebar, dll.
│   ├── sections/          → Komponen fitur per halaman
│   └── ui/                → shadcn/base-nova (auto-generated)
├── lib/
│   ├── actions/           → Server Actions
│   ├── services/          → Service layer
│   └── ...                → metadata, pii, feature-flags, utils
├── types/                 → Shared TypeScript types
├── db/                    → Drizzle schema & migrations
drizzle/                   → Migrations (auto-generated)
tests/                     → Unit tests (Vitest)
e2e/                       → E2E tests (Playwright)
docs/                      → Dokumentasi tambahan
```

---

## Lisensi

Lihat file [LICENSE](./LICENSE).
