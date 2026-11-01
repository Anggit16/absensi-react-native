# AbsensiPro — Demo Absensi, Persetujuan & Payroll (Expo + TypeScript)

Aplikasi mobile multi-role (Owner, Admin/HRD, Karyawan) untuk presensi, pengajuan cuti/izin/sakit/resign,
persetujuan dua tahap, dan rekap payroll. Saat ini aplikasi berjalan dengan **data mock di memori**,
sementara **backend Laravel 13 + MySQL 8 sudah tersedia** di repo terpisah `absensi-api`
(lihat bagian [Backend Laravel](#backend-laravel--mysql)). GPS, kamera, dan PDF masih simulasi di UI.

## Menjalankan di Windows

Prasyarat: **Node.js 22.13+** (dibutuhkan Expo SDK 58) dan npm.

```powershell
npm.cmd install
npx.cmd expo start          # lalu tekan w untuk web, a untuk Android, i untuk iOS (macOS)
```

Alternatif langsung:

```powershell
npx.cmd expo start --web
npx.cmd expo export --platform web   # build statis ke folder dist/
```

> Jika PowerShell memblokir `npm.ps1`, gunakan `npm.cmd` / `npx.cmd` seperti contoh di atas.

Pemeriksaan kode:

```powershell
npx.cmd tsc --noEmit
npx.cmd expo-doctor
```

## Akun demo

| Role | Email | Password |
| --- | --- | --- |
| Owner | `owner@absensipro.id` | `owner123` |
| Admin/HRD | `hrd@absensipro.id` | `hrd123` |
| Karyawan (Andi Pratama) | `karyawan@absensipro.id` | `karyawan123` |

Di halaman login tersedia tombol masuk cepat untuk ketiga role. Di tab **Profil** tersedia
"Ganti ke akun …" (perpindahan sesi tanpa menghapus data), "Reset data demo", dan "Keluar dari akun".

## Fitur utama

- **Login & sesi demo** — validasi email/username, akun nonaktif ditolak, pergantian akun demo.
- **Dashboard per role** — KPI kehadiran, antrean persetujuan, payroll, aksi cepat.
- **Absensi simulasi** — pilih lokasi, simulasi GPS dalam/luar radius (geofence), selfie simulasi,
  absen masuk/pulang, status tepat waktu/telat, riwayat absensi dengan filter.
- **Pengajuan** — cuti tahunan, cuti sakit, izin, cuti tanpa gaji, dan resign, dengan validasi kuota
  dan lampiran surat dokter (simulasi).
- **Persetujuan dua tahap** — `PENDING_HRD → PENDING_OWNER → FULLY_APPROVED` atau `REJECTED`.
  HRD hanya memverifikasi tahap pertama; Owner hanya melihat pengajuan yang sudah lolos HRD.
- **Aturan cuti ↔ payroll** — kuota tahunan dipotong **satu kali** saat persetujuan final
  (`balanceApplied`). Cuti tanpa gaji memotong gaji pokok harian; izin memotong komponen simulasi;
  keterlambatan memotong denda per menit.
- **Manajemen HRD (Owner)** — tambah/ubah/nonaktifkan/hapus akun HRD dan atur komponen gaji bulanan.
- **Master data (HRD)** — karyawan, role & jam kerja, lokasi kerja dengan radius geofence.
- **Kuota cuti (HRD)** — lihat sisa cuti seluruh karyawan dan catat penyesuaian saldo.
- **Monitoring absensi (HRD/Owner)** — kehadiran hari ini, status, lokasi, jarak simulasi.
- **Payroll** — rekap per periode, rincian per karyawan/HRD, filter, dan ekspor tidak tersedia
  (hanya tampilan simulasi).
- **Surat pengajuan** — pratinjau hanya aktif setelah `FULLY_APPROVED`; tombol cetak terkunci untuk
  status lain. Tidak ada PDF resmi/QR verifikasi.
- **Profil** — edit data pribadi, riwayat, kuota cuti, dan logout.

## Aturan bisnis penting

1. Kuota cuti tahunan baru berkurang setelah Owner menyetujui (final). Flag `balanceApplied`
   mencegah pemotongan ganda.
2. Penolakan HRD menghentikan alur; pengajuan tidak masuk daftar Owner.
3. Owner tidak dapat memproses pengajuan sebelum tahap HRD selesai; status terminal tidak dapat
   diproses ulang.
4. HRD tidak dapat mengelola akun HRD lain; hanya Owner yang dapat membuat akun HRD dan mengatur
   komponen gajinya.
5. Master karyawan, role, dan lokasi hanya dapat diubah HRD. Owner memiliki akses baca.
6. Semua nominal payroll adalah simulasi; tidak ada transfer dana.

## Struktur proyek

```
App.tsx                     SafeAreaProvider → AppProvider → ToastProvider → RootNavigator
src/
  components/
    common/                 Screen, Header, Button, TextField, SelectField, DateField, Card,
                            Badge, Feedback, Section, Modal, Toast, dll.
    approval/               ApprovalTimeline
    attendance/             AttendanceRow
    dashboard/              QuickActions
    submissions/            SubmissionCard
  constants/                label, warna badge, aturan cuti/payroll, akun demo
  data/seed.ts              data mock deterministik (12 user, 5 role, 3 lokasi, absensi, pengajuan)
  navigation/               RootNavigator (stack), Tabs (bottom tabs per role), types
  screens/
    auth/                   LoginScreen
    employee/               dashboard, absensi, riwayat, pengajuan
    hrd/                    dashboard, monitoring, karyawan, role, lokasi, kuota cuti
    owner/                  dashboard, manajemen HRD, komponen gaji
    shared/                 menu, profil, payroll, detail payroll, persetujuan, detail pengajuan,
                            pratinjau surat, pengaturan perusahaan, edit profil
  store/AppProvider.tsx     seluruh state mock + aturan bisnis + selector
  theme/                    token warna, spacing, radius, tipografi, shadow
  types/                    tipe domain
  utils/                    tanggal, format Rupiah, payroll, validasi
```

## Backend Laravel + MySQL

Backend ada di folder saudara `D:\MY PROJECT\opencode\absensi-api` (Laravel 13, MySQL 8/Laragon,
Sanctum token, 48 endpoint `/api/v1`, 50 test lulus). Ringkasan:

```powershell
cd D:\MY PROJECT\opencode\absensi-api
php artisan migrate:fresh --seed
php artisan serve --host=0.0.0.0 --port=8000
```

Lalu di aplikasi ini:

```powershell
copy .env.example .env     # sesuaikan EXPO_PUBLIC_API_URL
npm.cmd start
```

Klien API siap pakai ada di `src/api/`:

- `src/api/client.ts` — `request()`, `setAuthToken()`, `ApiError` (pesan validasi siap tampil).
- `src/api/index.ts` — `api.login`, `api.me`, `api.checkIn`, `api.submissions`,
  `api.decideSubmission`, `api.payroll`, `api.finalizePayroll`, dan lainnya.

Pemetaan URL: emulator Android `http://10.0.2.2:8000/api/v1`, simulator iOS
`http://127.0.0.1:8000/api/v1`, perangkat fisik `http://<IP-LAN>:8000/api/v1`.

Dokumentasi kontrak lengkap: `absensi-api/docs/API.md`.

## Batasan (penting)

- `AppProvider` masih memakai seed mock; lapisan `src/api/` sudah tersedia tetapi belum
  menggantikan store. Migrasi store adalah langkah berikutnya.
- Token disimpan di memori proses; untuk produksi gunakan `expo-secure-store`.
- GPS, kamera/selfie, lampiran, dan cetak surat masih **simulasi** di UI.
- Surat dari API baru berupa payload siap-render (belum PDF final + QR image).
- Push notification belum dikirim (tabel `device_tokens` sudah disiapkan di backend).

## Langkah lanjutan

1. Migrasi `AppProvider` ke `src/api/` (auth → absensi → pengajuan → payroll), mulai dari login.
2. Ganti data mock bertahap sambil mempertahankan 31 layar yang ada.
3. Token aman (`expo-secure-store`) + penanganan 401 otomatis.
4. Kamera & GPS asli: `expo-location`, `expo-camera`, `expo-image-manipulator` (kompresi sebelum upload).
5. PDF surat resmi + QR, lalu push notification antrean persetujuan.
