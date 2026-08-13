---
status: proposed
date: 2026-08-07
deciders:
  - User (operator, Narasena)
  - User's wife (product owner)
  - Claude (facilitator)
tags:
  - media
  - storage
  - video
  - photos
  - cloudflare
  - r2
  - resume
  - adr
---

# ADR-021: Media storage for daily class capture — Cloudflare R2 (photos + video), Cloudinary rejected, AWS deferred

## Status

Proposed — pending review before implementation. Captured as `docs/adr/021-media-storage.md`.

## Context

The daily class capture flow (`src/app/dashboard/daily/capture/`) is currently **text-only** (DCR activity toggles + notes). The product owner (user's wife) requires photo/video capture per daily class, at minimum: before class start, before class end, during activities, during breaks. Per-kid photo/video capture is a planned near-term follow-up.

The operator has three goals that pull against each other:

1. **Product quality** — a real school app that will be commercialized across schools.
2. **Cost** — the app is currently ~$0 (Neon free tier, Vercel Hobby, no paid media stack).
3. **Resume value** — "knowing AWS is an essential skill"; the operator wants a bleeding-edge, portfolio-worthy stack.

The core tension: **AWS has the highest resume value but the highest ops load and egress cost; the app has near-zero budget for media.**

### Key discovered constraints

- Cloudinary's free tier is **25 credits**, not 25GB. 1 credit = 1GB storage **or** 1GB video bandwidth. Video delivery consumes credits; heavy use forces the $99/mo plan. **Rejected for cost.**
- Cloudflare Stream bills by **stored/delivered minutes** ($5/1,000 min stored, $1/1,000 min delivered), no free tier. Realistic use → $100+/mo. **Rejected for cost.**
- Cloudflare R2: **10GB free**, then $0.015/GB-mo, **$0 egress forever**. Supports **HTTP range requests** → MP4 partial playback without transcoding. Viable for raw video.
- Cloudflare Workers **Image Resizing**: free on the free plan up to **5,000 unique transformations/mo**, then $0.50/1,000. Only requires Images _storage_ to be paid; images in R2 use the free path.
- Cloudflare Workers Free: **100k req/day, 10ms CPU** — a 1–3ms resize is effectively $0.
- `next/image` on Vercel **does** auto-resize + WebP, but **through Vercel Image Optimization** → image data flows R2→Vercel→browser, hitting Vercel's origin-image budget (5,000/mo free, then $5/1,000). This leaks cost and egress through the app function budget. **Do not use `next/image` for R2-hosted media.**
- AWS S3: ~$0.023/GB-mo, egress ~$0.09/GB (data transfer out to internet). Egress grows linearly with popularity — the exact failure mode for video delivery.

## Decision

### Storage

- **Cloudflare R2** for **all media** — photos _and_ raw video.
- **No Cloudflare Stream**, no transcoding product. Video is stored raw and served via **MP4 + HTTP range requests** (R2 supports). iOS "Most Compatible" source format (H.264 MP4) is the compatibility strategy (see below).
- **No Vercel Image Optimization / `next/image`** for R2-hosted media. Grid thumbnails use **Cloudflare Workers Image Resizing** (edge, $0 at this scale). Raw `<img>`/`<video>` for R2 assets.
- **No Cloudinary.** Rejected on cost (credits not GB; video delivery burns the pool; $99/mo plan).

### Upload path (DB-first, presigned)

- **Private R2 bucket.** Vercel server action signs a short-lived **S3-presigned PUT URL** scoped to a DB row; the teacher's device PUTs **directly to R2**; Vercel never proxies media bytes.
- **DB-first:** a capture row is created first (class, slot, `kidId` if per-kid), then the presigned URL is issued keyed to that row's ID. Orphaned objects are avoided; authz is enforced by _which prefix_ the server signs.
- Server actions guarded by the existing `requireOwner()` pattern (`src/lib/actions/utils.ts`).

### Schema (two tables)

- `classCaptureAsset` — attached to a `dailyClassReport`, has `slot`, no `kidId`.
- `kidCaptureAsset` — attached to a DCR + `kidId`, has `slot`.
- Both share **one** upload/presign/transform machinery (a common `CaptureAsset` type + same server action). Slots as enum: `start | activity | break | end | other`.

### Access model

- Class-level assets: visible to all guardians of that class (shared — same class assets for all guardians, per product decision).
- Per-kid assets: visible only to that kid's guardians.
- All media behind auth + signed URLs; **no public bucket**. Off-app sharing (screenshots) is explicitly out of scope.

### Compatibility & thumbnails

- **iOS "Most Compatible" hint** (Camera → Formats → Most Compatible → MP4/JPEG) shown at capture first-run. This is the compatibility strategy; no client-side conversion lib in v1 (HEIC/HEVC conversion can't fix MOV/HEVC playback anyway and adds a 5MB dep).
- **Thumbnails generated at upload time** via Cloudflare Worker Image Resizing (edge, cached). Industry standard: always have a small version for grids.

## Consequences

### Positive

- **~$0/mo at realistic scale.** R2 free tier covers the first 10GB; Worker resize is free up to 5k transforms. Stream/Cloudinary/MediaConvert costs avoided entirely.
- **No Vercel egress leak.** Media flows R2↔browser; Vercel only signs URLs.
- **S3-portable resume story.** R2 is S3-compatible; the presigned-URL + bucket-prefix architecture is identical to AWS S3. The operator gets "S3-compatible object storage, presigned-upload architecture, edge video delivery" on a real app — the AWS skill, at Cloudflare prices.

### Negative / risks

- **Raw video, no transcoding.** Long videos may not stream smoothly on low-bandwidth connections; no adaptive bitrate. Mitigated by MP4 range requests + the short-clip format (1–2 min). Revisit Cloudflare Stream (on Cloudflare, not Vercel) if playback quality demands it.
- **R2 region/location** not yet pinned (deploy-time knob; likely APAC). Stream is managed infra — location is Cloudflare's concern.
- **Resume tradeoff accepted:** "AWS" is deferred to a _real_ AWS service when the app's next genuine need arrives (e.g. AWS SES for parent email). The S3-portable architecture keeps the story honest without forcing an AWS spend.

## Alternative options considered

1. **AWS S3 + CloudFront + MediaConvert** — highest keyword value; rejected: egress $0.09/GB scales with video popularity, MediaConvert adds ops + cost, heavier to maintain. The resume value is captured via the S3-portable R2 design instead.
2. **Cloudinary** — rejected: credits-not-GB free tier, video delivery burns the pool, $99/mo to grow.
3. **Cloudflare Stream for video** — rejected: $5/1,000 min stored bills by duration, no free tier, realistic use $100+/mo.
4. **One `capture` table with nullable `kidId`** — rejected in favor of two tables (different FKs + authz scopes serve different purposes). Shared machinery keeps the cost of two tables low. Collapse later only if authz converges.

## Decision flow / follow-ups

- Vercel Image Optimization and Cloudinary are **off-limits** for media.
- Storage is the **last step** of the daily capture flow. Build the text-only DCR capture flow first, then layer media on top per this ADR.
- When a real AWS service is needed (e.g. SES for email reminders), revisit the AWS story — that's the moment to add an honest AWS line.
