# AbsensiPro — Demo Absensi, Persetujuan & Payroll (Expo + TypeScript)

Aplikasi mobile multi-role (Owner, Admin/HRD, Karyawan) untuk presensi, pengajuan cuti/izin/sakit/resign,
persetujuan dua tahap, dan rekap payroll. **Seluruh data adalah mock di memori aplikasi** — tidak ada
backend, API eksternal, GPS asli, kamera asli, atau PDF resmi.

## Menjalankan di Windows

Prasyarat: Node.js 20+ dan npm.

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

## Batasan (penting)

- Data hanya tersimpan di memori; restart aplikasi mengembalikan seed awal.
- GPS, kamera/selfie, lampiran, dan cetak surat adalah **simulasi** (tidak ada izin native, bukan
  anti fake-GPS, bukan verifikasi biometrik).
- Bukan PDF resmi, tidak ada QR/tanda tangan digital.
- Autentikasi demo menyimpan password sebagai teks biasa; jangan dipakai di produksi.
- Satu perusahaan (single tenant) pada data demo; model data sudah memiliki `companyId`.

## Langkah lanjutan backend/native

- Backend + database (mis. PostgreSQL) dengan autentikasi JWT, refresh token, dan RBAC per `companyId`.
- Penyimpanan file (selfie, surat dokter) di object storage dengan signed URL.
- Validasi geofence di server + deteksi mock location (native) dan kebijakan privasi lokasi.
- PDF resmi (mis. server-side PDF) + QR verifikasi + audit trail persetujuan.
- Payroll finalisasi, payslip, integrasi transfer bank/pajak/BPJS.
- Push notification antrean persetujuan dan pengingat absensi.
