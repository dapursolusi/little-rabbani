# Manual Alur Kerja Little Rabbani

**Aplikasi Manajemen PAUD/TK — Little Rabbani Preschool LMS**

Dokumen ini menjelaskan alur kerja lengkap untuk dua peran pengguna: **Owner** (Pemilik/Pengelola) dan **Teacher** (Guru). Semua teks antarmuka menggunakan Bahasa Indonesia.

---

## 1. Alur Kerja Owner (Pemilik)

Owner memiliki akses penuh ke semua fitur, termasuk administrasi dan observasi seperti guru.

### 1.1 Setup Awal (Satu Kali)

Langkah-langkah ini dilakukan satu kali di awal term (periode) baru.

#### 1.1.1 Buat Term

1. Buka menu **Term** → `/dashboard/owner/term`
2. Klik **Buat Term Baru**
3. Isi nama term (contoh: "Term 1 2025/2026"), tanggal mulai, dan tanggal selesai
4. Centang **Aktif** jika ini adalah term yang sedang berjalan
5. Klik **Simpan** — notasi toast akan muncul sebagai konfirmasi

> **Catatan:** Hanya satu term yang boleh aktif dalam satu waktu. Term aktif digunakan untuk mendaftarkan murid dan menentukan sesi yang tampil.

#### 1.1.2 Buat Sesi (Session)

1. Buka menu **Sesi** → `/dashboard/owner/session`
2. Klik **Buat Sesi Baru**
3. Pilih **Term** (term yang sudah dibuat)
4. Isi:
   - **Tanggal** — tanggal sesi
   - **Jam Mulai** dan **Jam Selesai** — waktu sesi berlangsung
   - **Label** (opsional) — contoh: "Pagi" atau "Sore"
   - **Libur** — centang jika sesi ini libur, dan isi alasan libur
5. Klik **Simpan**

#### 1.1.3 Buat Aktivitas (Activity)

1. Buka menu **Aktivitas** → `/dashboard/owner/activity`
2. Klik **Buat Aktivitas Baru**
3. Isi **Nama Aktivitas** (contoh: "Mewarnai", "Membaca Iqra", "Bermain Bebas")
4. Pilih **Kategori** (jika tersedia)
5. Klik **Simpan**

#### 1.1.4 Atur Jadwal Mingguan (Schedule)

1. Buka menu **Jadwal** → `/dashboard/owner/schedule`
2. Pilih **Term** dan **Sesi** yang ingin dijadwalkan
3. Tambahkan aktivitas-aktivitas yang direncanakan untuk sesi tersebut
4. Atur urutan dan durasi masing-masing aktivitas
5. Klik **Simpan Jadwal**

> Jadwal ini akan menjadi template untuk DCR (Laporan Harian Kelas).

### 1.2 Manajemen Murid

#### 1.2.1 Tambah Murid

1. Buka menu **Murid** → `/dashboard/owner/kid`
2. Klik **Tambah Murid Baru**
3. Isi data murid: nama lengkap, tanggal lahir, jenis kelamin, alamat
4. Pilih **Term** untuk mendaftarkan murid ke term aktif
5. Status akan otomatis menjadi **Enrolled**
6. Klik **Simpan**

#### 1.2.2 Tambah Wali Murid (Guardian)

1. Buka menu **Wali Murid** → `/dashboard/owner/guardian`
2. Klik **Tambah Wali Murid**
3. Isi data wali: nama, nomor telepon, email, alamat
4. Klik **Simpan**

#### 1.2.3 Hubungkan Murid dengan Wali

1. Buka detail murid di menu **Murid**
2. Pada bagian "Wali Murid", klik **Pilih Wali Murid**
3. Cari dan pilih wali yang sudah didaftarkan
4. Klik **Simpan**

#### 1.2.4 Daftarkan Murid ke Term

Saat membuat atau mengedit murid:

1. Pilih **Term Aktif** pada field "Term Pendaftaran"
2. Status murid akan berubah menjadi **Enrolled**
3. Murid yang **Enrolled** akan muncul di roster observasi guru

### 1.3 Alur Harian Owner

#### 1.3.1 Cek Laporan Harian Kelas (DCR)

1. Buka menu **Laporan Harian** (yang pertama, untuk DCR) → `/dashboard/owner/dcr`
2. Pilih sesi yang sudah lewat dengan status **Belum** (label kuning)
3. Isi laporan kelas:
   - Review aktivitas yang direncanakan dari jadwal
   - Tandai **deviasi** untuk setiap aktivitas: `done` (selesai), `skipped` (dilewati), atau `modified` (dimodifikasi)
   - Tambah aktivitas **tidak terencana** jika ada kegiatan di luar jadwal
   - Isi **Catatan Pembelajaran** (learning notes) — opsional
4. Klik **Simpan Laporan**

> DCR yang sudah dibuat akan membuka akses **Pass 2** untuk guru (partisipasi aktivitas per murid).

#### 1.3.2 Review Observasi Guru

1. Buka menu **Laporan Harian** (DCR) untuk melihat ringkasan kelas
2. Data observasi per murid (mood, nafsu makan, kehadiran) tercatat di sistem
3. Owner dapat melihat detail observasi melalui halaman laporan harian orang tua

#### 1.3.3 Generate Laporan Harian Orang Tua

1. Buka menu **Laporan Harian** (yang kedua, untuk laporan wali) → `/dashboard/owner/reports/daily`
2. Pilih sesi yang sudah lewat
3. Klik **Generate Laporan** untuk membuat laporan untuk semua murid sekaligus
4. Sistem akan:
   - Mengumpulkan data observasi (Pass 1 & Pass 2)
   - Menghasilkan narasi AI menggunakan OpenRouter (deepseek-v4-flash) untuk setiap murid
5. Setelah selesai, status setiap murid akan menjadi **Draft**

#### 1.3.4 Edit dan Kirim Laporan Harian

1. Klik nama murid untuk memperluas detail laporan
2. Review data observasi terstruktur (mood, nafsu makan, kehadiran, aktivitas)
3. Edit **Narasi** sesuai kebutuhan
4. Klik **Simpan Narasi**
5. Jika sudah sesuai, klik **Tandai Terkirim** — status berubah menjadi **✓ Terkirim**
6. Gunakan tombol **Salin Laporan** untuk menyalin teks laporan ke clipboard (untuk dikirim ke WhatsApp atau media lain)

### 1.4 Alur Bulanan

#### 1.4.1 Generate Laporan Bulanan

1. Buka menu **Laporan Bulanan** → `/dashboard/owner/reports/monthly`
2. Akan muncul daftar murid terdaftar dengan grid bulan-bulan dalam term
3. Klik bulan yang ingin digenerate untuk murid tertentu
4. Klik **Generate Laporan** — sistem akan mengumpulkan data observasi sebulan terakhir dan menghasilkan narasi AI

#### 1.4.2 Review dan Edit Narasi

1. Setelah generate, review narasi AI yang terdiri dari beberapa bagian
2. Edit narasi sesuai kebutuhan
3. Klik **Simpan**

#### 1.4.3 Finalisasi

1. Jika laporan sudah sesuai, klik **Finalisasi Laporan**
2. Status berubah dari **Draft** menjadi **✓ Final**
3. Jika ada data baru setelah finalisasi, status akan berubah menjadi **⚠️ Perlu Diperbarui** — generate ulang diperlukan

### 1.5 Alur Trivulanan (Quarterly)

#### 1.5.1 Generate Laporan Trivulanan

1. Buka menu **Laporan Trivulanan** → `/dashboard/owner/reports/quarterly`
2. Pilih term dan murid yang ingin dibuatkan laporan
3. Klik **Generate Laporan**
4. Sistem akan:
   - Menghitung statistik trivulan (kehadiran, distribusi mood, distribusi nafsu makan, partisipasi aktivitas)
   - Membandingkan dengan term sebelumnya (jika ada snapshot)
   - Menghasilkan 3 bagian narasi AI

#### 1.5.2 Review 3 Bagian Narasi

1. **Perubahan** — ringkasan perubahan yang diamati selama trivulan
2. **Peningkatan** — area di mana murid menunjukkan peningkatan
3. **Rekomendasi** — saran untuk orang tua dan pengajar

#### 1.5.3 Edit dan Finalisasi

1. Edit setiap bagian narasi sesuai kebutuhan menggunakan textarea yang tersedia
2. Klik **Simpan Bagian** untuk menyimpan perubahan
3. Jika sudah sesuai, klik **✓ Finalisasi Laporan**
4. Status berubah menjadi **✓ Final**

#### 1.5.4 Download PDF

1. Setelah laporan difinalisasi, klik **⬇ Download PDF**
2. Sistem akan menghasilkan file PDF yang dapat diunduh
3. Jika PDF gagal dibuat (misal: library PDF tidak tersedia), tampilan HTML akan ditampilkan sebagai fallback

### 1.6 Observasi sebagai Owner

Owner juga dapat melakukan observasi langsung seperti guru.

1. Buka URL langsung: `/dashboard/teacher/capture`
   > **Catatan:** Menu ini tidak muncul di navigasi Owner secara default. Owner harus mengakses URL tersebut secara langsung.
2. Pilih sesi yang sudah berlangsung
3. Lihat roster murid dan lakukan observasi
4. Alurnya sama persis dengan alur guru (lihat bagian 2.3)

### 1.7 Pengaturan (Settings)

1. Buka menu **Pengaturan** → `/dashboard/owner/settings`
2. **Izin Notifikasi Browser:**
   - Klik **Izinkan Notifikasi** untuk mengaktifkan notifikasi browser
   - Jika ditolak, pengingat akan muncul sebagai badge di dashboard
3. **Pengaturan Pengingat:**
   - **Capture Tertunda** — Kirim pengingat 15 menit setelah sesi berakhir jika ada capture yang tertunda
   - **Jadwal Mingguan** — Kirim pengingat hari Kamis pagi jika jadwal minggu depan belum diisi
4. Log pengingat dibersihkan otomatis setelah 30 hari

---

## 2. Alur Kerja Teacher (Guru)

### 2.1 Login

1. Buka halaman login: `/login`
2. Klik **Masuk dengan Google** (Google OAuth)
3. Pilih akun Google yang terdaftar sebagai guru
4. Setelah berhasil login, akan diarahkan ke dashboard guru

### 2.2 Dashboard Guru

1. Setelah login, tampilan dashboard guru: `/dashboard/teacher`
2. **Jadwal Hari Ini** — menampilkan jadwal sesi hari ini
   - Menampilkan daftar sesi yang dijadwalkan untuk hari ini
   - Hanya sesi dari term aktif yang ditampilkan
3. **Banner Capture Tertunda** — jika ada murid yang belum diobservasi, banner akan muncul di bagian atas dengan jumlah capture tertunda
   - Tap banner untuk langsung pergi ke halaman observasi
   - Banner diperbarui setiap 5 detik (polling)
4. **Navigasi:**
   - **Jadwal** → kembali ke dashboard
   - **Observasi** → halaman pemilihan sesi untuk capture

### 2.3 Capturing Observations (Pass 1 & Pass 2)

Proses observasi terdiri dari dua tahap: **Pass 1** (pagi/saat sesi) dan **Pass 2** (setelah DCR diisi).

#### 2.3.1 Pilih Sesi

1. Klik **Observasi** di navigasi → `/dashboard/teacher/capture`
2. Akan muncul daftar sesi yang dikelompokkan per term
3. Sesi yang sudah berakhir dan bukan hari libur akan berlabel **Buka** (hijau) dan bisa diklik
4. Sesi yang belum dimulai berlabel **Akan Datang** (abu-abu, tidak bisa diklik)
5. Sesi libur berlabel **Libur** (merah, tidak bisa diklik)
6. Klik sesi yang tersedia untuk melihat roster murid

#### 2.3.2 Roster Murid

1. Halaman roster menampilkan daftar semua murid yang terdaftar di term tersebut
2. Setiap murid memiliki indikator:
   - **✓** (hijau) — sudah diobservasi
   - **✗** (abu-abu) — belum diobservasi
3. Murid yang tidak hadir akan ditampilkan dengan badge alasan ketidakhadiran
4. Jika tidak ada murid terdaftar, akan muncul pesan "Tidak ada anak di sesi ini"
5. Indikator **Offline** akan muncul di bagian atas jika koneksi terputus

#### 2.3.3 Pass 1 — Observasi Pagi

1. Klik nama murid untuk memulai observasi
2. Pada tab **Pass 1**, isi data berikut:

   **a. Mood (Suasana Hati) — skala 1-5:**
   - 😢 Sangat Sedih (1)
   - 😟 Sedih (2)
   - 😐 Biasa (3)
   - 😊 Senang (4)
   - 😄 Sangat Senang (5)

   **b. Nafsu Makan — 3 level:**
   - **Baik** (hijau)
   - **Sedang** (kuning)
   - **Kurang** (merah)

   **c. Kehadiran — 4 opsi:**
   - **Hadir** — murid hadir penuh
   - **Terlambat** — murid datang terlambat
   - **Dijemput Lebih Awal** — murid pulang lebih awal
   - **Tidak Hadir** — murid tidak masuk

   **d. Alasan Ketidakhadiran** (hanya jika memilih "Tidak Hadir"):
   - Sakit
   - Keperluan Keluarga
   - Izin
   - Lainnya (dengan input teks bebas)

   **e. Catatan (opsional):**
   - Tambahkan catatan tekstual
   - Catatan bersifat **append-only** (kumulatif) — tidak menghapus catatan sebelumnya

3. Klik **Simpan Observasi** (atau **Simpan Perubahan** jika sudah pernah diobservasi)
4. Toast notifikasi akan muncul sebagai konfirmasi

#### 2.3.4 Pass 2 — Partisipasi Aktivitas

1. **Pass 2 terkunci** (🔒) sampai Owner/DCR mengisi Laporan Harian Kelas (DCR)
2. Setelah DCR diisi, tab Pass 2 akan terbuka
3. Pilih murid yang hadir (murid tidak hadir otomatis skip Pass 2 — lihat VAL-CAPTURE-026)
4. Untuk setiap aktivitas yang tercatat di DCR, pilih:
   - **Ya 👍** — murid berpartisipasi
   - **Tidak** — murid tidak berpartisipasi
5. Aktivitas **Tidak Terencana** (unplanned) akan ditandai dengan badge ungu
6. Klik **Simpan Partisipasi**
7. Toast notifikasi akan muncul sebagai konfirmasi

### 2.4 Mode Offline

Aplikasi mendukung operasi offline penuh untuk observasi:

1. Saat koneksi terputus, indikator **⚡ Offline** akan muncul
2. Data observasi disimpan secara lokal di **IndexedDB**
3. Semua fungsi capture tetap berjalan normal di mode offline
4. Data akan tersinkronisasi secara otomatis saat koneksi kembali
5. Peringatan akan muncul jika penyimpanan offline hampir penuh

### 2.5 Konflik Data

Jika ada perubahan data oleh pengguna lain (misal: Owner mengedit observasi yang sama):

1. Saat menyimpan, sistem mendeteksi versi data yang berbeda (optimistic locking)
2. Dialog konflik akan muncul menampilkan:
   - Data di server (versi terbaru)
   - Data lokal yang ingin disimpan
3. Pengguna dapat memilih untuk menggunakan data server atau menimpa dengan data lokal
4. Setelah konflik diselesaikan, data akan tersinkronisasi

---

## 3. Catatan Penting

### 3.1 Peran dan Akses

- **Owner** dapat mengakses SEMUA fungsi, termasuk:
  - Manajemen data master (murid, wali, term, sesi, aktivitas, jadwal)
  - Laporan (DCR, harian, bulanan, trivulanan)
  - Pengaturan dan notifikasi
  - Observasi capture (di URL `/dashboard/teacher/capture`)
- **Teacher** hanya memiliki akses ke:
  - Dashboard jadwal
  - Observasi capture (Pass 1 & Pass 2)

### 3.2 Teknis

- **AI Narasi:** Menggunakan OpenRouter (deepseek-v4-flash) untuk menghasilkan narasi laporan
- **Autentikasi:** Google OAuth — login di `/login`
- **Notifikasi:** Browser Push Notification + Service Worker (`/sw.js`)
- **Feature Flags:** Dikelola di `src/lib/feature-flags.ts` — toggle via env var `FF_*`
- **PII Handling:** Data pribadi murid/wali otomatis terdeteksi dan diamankan

### 3.3 Alur Ketergantungan

```
Term Aktif → Murid Enrolled → Sesi Dibuat → Observasi Pass 1
                                                    ↓
                                              DCR (Owner)
                                                    ↓
                                         Observasi Pass 2 (Guru)
                                                    ↓
                                    Laporan Harian Orang Tua (Owner)
                                                    ↓
                                    Laporan Bulanan / Trivulanan
```

### 3.4 Status Laporan

| Status              | Arti                                 | Tindakan             |
| :------------------ | :----------------------------------- | :------------------- |
| Draft               | Laporan tersimpan, belum final       | Edit → Finalisasi    |
| ✓ Final             | Laporan sudah difinalisasi           | Tidak perlu tindakan |
| ⚠️ Perlu Diperbarui | Data baru ditambahkan setelah final  | Generate ulang       |
| ✓ Terkirim          | Laporan harian sudah dikirim ke wali | Tidak perlu tindakan |

### 3.5 Tips Penggunaan

- **Toast notifications** mengonfirmasi setiap tindakan — perhatikan toast untuk memastikan data tersimpan
- Semua formulir melakukan validasi di sisi server — isi data dengan benar untuk menghindari error
- Laporan dapat diedit kapan saja sebelum difinalisasi
- Untuk laporan harian, gunakan tombol **Salin Laporan** untuk mengirim ke orang tua via WhatsApp atau media lain
- Pastikan term aktif sudah diatur sebelum mendaftarkan murid dan membuat sesi
