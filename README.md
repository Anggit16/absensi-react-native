# AbsensiPro — Enterprise Attendance & Payroll Mobile App

Aplikasi mobile multi-role (Owner, Admin/HRD, Karyawan) untuk presensi berbasis geofence,
pengajuan cuti/izin/sakit/resign, persetujuan dua tahap, dan rekap payroll.

Saat ini **frontend Expo/React Native (SDK 58 + TypeScript) terhubung penuh ke backend
Laravel 13 + MySQL 8** (repo terpisah `absensi-api`). Seluruh data bersumber dari server
(API token Bearer), bukan dari memori perangkat.

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
npx.cmd expo lint
```

## Akun demo

| Role | Email | Password |
| --- | --- | --- |
| Owner | `owner@absensipro.id` | `owner123` |
| Admin/HRD | `hrd@absensipro.id` | `hrd123` |
| Karyawan (Andi Pratama) | `karyawan@absensipro.id` | `karyawan123` |

Akun-akun bawaan ini adalah data demo server (Laravel `absensi-api`) yang dipakai untuk
pengujian role. Di halaman login tersedia tombol masuk cepat untuk ketiga akun tersebut.

## Fitur utama

- **Login & sesi** — autentikasi token Bearer ke backend, token disimpan di penyimpanan aman
  (`expo-secure-store` di native, `localStorage` di web), penanganan 401 otomatis.
- **Dashboard per role** — KPI kehadiran, antrean persetujuan, payroll, aksi cepat.
- **Absensi** — GPS real via `expo-location`, selfie kamera via `expo-image-picker`, validasi
  geofence di sisi server (radius, mock location), absen masuk/pulang, status tepat waktu/telat,
  riwayat absensi dengan filter. Waktu resmi absensi memakai server.
- **Pengajuan** — cuti tahunan, cuti sakit, izin, cuti tanpa gaji, dan resign, dengan validasi kuota
  dan lampiran nama berkas (unggah file masih belum tersedia).
- **Persetujuan dua tahap** — `PENDING_HRD -> PENDING_OWNER -> FULLY_APPROVED` atau `REJECTED`.
  HRD hanya memverifikasi tahap pertama; Owner hanya melihat pengajuan yang sudah lolos HRD.
- **Aturan cuti & payroll** — kuota tahunan dipotong **satu kali** saat Owner menyetujui final
  (`balanceApplied`). Cuti tanpa gaji memotong gaji pokok harian; izin memotong komponen gaji.
- **Manajemen HRD (Owner)** — tambah/ubah/nonaktifkan/hapus akun HRD dan atur komponen gaji bulanan.
- **Master data (HRD)** — karyawan, role & jam kerja, lokasi kerja dengan radius geofence.
- **Kuota cuti (HRD)** — lihat sisa cuti seluruh karyawan dan catat penyesuaian saldo.
- **Monitoring absensi (HRD/Owner)** — kehadiran hari ini, status, lokasi, jarak GPS aktual.
- **Payroll** — rekap per periode, rincian per karyawan/HRD, filter, dan ekspor belum tersedia
  (hanya tampilan rekap).
- **Surat pengajuan** — pratinjau payload siap-render setelah `FULLY_APPROVED`; PDF final + QR
  verifikasi masih fase berikutnya.
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
6. Semua nominal payroll adalah estimasi; belum ada transfer dana.

## Struktur proyek

```
App.tsx                     SafeAreaProvider > AppProvider > ToastProvider > RootNavigator
src/
  api/                      client fetch (token, error, FormData), endpoint wrappers, mapper,
                            tokenStore (SecureStore/localStorage), mappers (API -> domain)
  components/
    common/                 Screen, Header, Button, TextField, SelectField, DateField, Card,
                            Badge, Feedback, Section, Modal, Toast, dll.
    approval/               ApprovalTimeline
    attendance/             AttendanceRow
    dashboard/              QuickActions
    submissions/            SubmissionCard
  constants/                label, warna badge, aturan cuti/payroll, akun demo
  navigation/               RootNavigator (stack), Tabs (bottom tabs per role), types
  screens/
    auth/                   LoginScreen
    employee/               dashboard, absensi, riwayat, pengajuan
    hrd/                    dashboard, monitoring, karyawan, role, lokasi, kuota cuti
    owner/                  dashboard, manajemen HRD, komponen gaji
    shared/                 menu, profil, payroll, detail payroll, persetujuan, detail pengajuan,
                            pratinjau surat, pengaturan perusahaan, edit profil
  store/AppProvider.tsx     seluruh state dari API + aksi async + selector bisnis
  theme/                    token warna, spacing, radius, tipografi, shadow
  types/                    tipe domain
  utils/                    tanggal, format Rupiah, payroll, validasi, geo (jarak GPS)
```

## Backend Laravel + MySQL

Backend ada di folder `D:\MY PROJECT\opencode\absensi-api` (Laravel 13, MySQL 8/Laragon,
Sanctum Bearer token, prefix `/api/v1`, 51 test lulus).

```powershell
cd D:\MY PROJECT\opencode\absensi-api
php artisan migrate:fresh --seed
php artisan serve --host=0.0.0.0 --port=8000
```

Lalu di aplikasi ini:

```powershell
copy .env.example .env     # sesuaikan EXPO_PUBLIC_API_URL
npx.cmd expo start
```

Klien API (`src/api/index.ts`, `src/api/client.ts`, `src/api/mappers.ts`, `src/api/tokenStore.ts`):

- `src/api/client.ts` — `request()`, `setAuthToken()`, `ApiError` (pesan validasi siap tampil).
- `src/api/index.ts` — `api.login`, `api.me`, `api.checkIn`, `api.checkOut`, `api.submissions`,
  `api.decideSubmission`, `api.payroll`, `api.finalizePayroll`, dan lainnya.
- `src/api/mappers.ts` — pemetaan respons API ke tipe domain aplikasi.
- `src/api/tokenStore.ts` — penyimpanan token (SecureStore native / localStorage web).

Pemetaan URL: emulator Android `http://10.0.2.2:8000/api/v1`, simulator iOS `http://127.0.0.1:8000/api/v1`,
perangkat fisik `http://<IP-LAN>:8000/api/v1`.

Dokumentasi kontrak lengkap: `D:\MY PROJECT\opencode\absensi-api\docs\API.md`.

## Batasan (penting)

- Payroll masih dihitung di sisi aplikasi (`src/utils/payroll.ts`) dari data yang dimuat dari API;
  endpoint payroll server sudah tersedia tetapi belum dipakai layar payroll.
- Surat dari API berupa payload siap-render; generator PDF final + QR image belum ada.
- Push notification belum dikirim (tabel `device_tokens` sudah disiapkan di backend).
- Verifikasi biometrik/liveness selfie belum ada (foto disimpan di server, bukan dicocokkan).

## Langkah lanjutan

1. Ganti sisa perhitungan payroll server ke `PayrollScreen` (`api.payroll`).
2. PDF surat resmi + QR, lalu push notification antrean persetujuan.
3. Verifikasi biometrik/liveness (dengan `expo-camera` + library wajah) setelah kamera real.
4. Offline queue / retry dan polling dashboard untuk aplikasi real-time.

## Perintah verifikasi

```powershell
npx.cmd tsc --noEmit
npx.cmd expo lint
npx.cmd expo-doctor
```
