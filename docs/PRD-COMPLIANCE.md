# Laporan Kepatuhan & Peta Modul — PRD AbsensiPro

Dokumen ini menjadi acuan perbandingan antara **PRD.md** (di repo ini) dan implementasi
saat ini. Gunakan sebagai **sumber kebenaran** selama proses pengembangan.

Tanggal laporan: 2026-11-03 (sesi integrasi backend + penyempurnaan UI).

---

## 1. Ringkasan status pengembangan

| Area | Status | Catatan |
| --- | --- | --- |
| Backend API (Laravel + MySQL) | **Lengkap & teruji** | 51 test / 153 assertion lulus (`absensi-api`). |
| Frontend Expo → API | **Terintegrasi** | `src/api/*`, `src/store/AppProvider.tsx`, `src/api/mappers.ts`, `src/api/tokenStore.ts` aktif. |
| Absensi (GPS + selfie + geofence) | **Terintegrasi** | `expo-location` + `expo-image-picker`; validasi geofence di server; mock location ditolak. |
| Payroll | **Terintegrasi** | Layar payroll (rekap/detail/dashboard) sekarang memakai data payroll server; breakdown komponen masih ditampilkan dari baris server. |
| Dokumen/PDF/QR | **Selesai** | PDF surat resmi + QR verifikasi publik (`letters/verify/{token}`); tombol cetak di layar "Pratinjau surat" mengunduh PDF dari server. |
| Push notification | **Belum** | Tabel `device_tokens` sudah disiapkan backend. |
| Verifikasi biometrik/liveness | **Belum** | Foto selfie disimpan di server, tanpa pencocokan wajah. |

---

## 2. Peta kebutuhan PRD → modul

| ID PRD | Kebutuhan inti | Status implementasi |
| --- | --- | --- |
| FR-AUTH-01/02 | Login email/username + password hashed; akun INACTIVE ditolak. | Backend + klien. |
| FR-LOC-01/02/03 | Multi-tenant, geofence, lokasi role, radius. | Backend + klien `expo-location`; lokasi diambil dari penugasan server. |
| FR-ATT-01/02/03/04 | Check-in/out w/ lat/lng, selfie, mock-location, jam server. | Check-in & check-out kini membawa bukti GPS + selfie; server mencatat `check_out_latitude/longitude/distance_meters/selfie`. |
| FR-SUB-01…06 | Pengajuan cuti/izin/sakit/resign, kuota, riwayat, HRD/Owner. | Lengkap via API + UI. |
| FR-APP-01/02 | Dashboard KPI + notifikasi antrean. | Dashboard API; notifikasi push belum. |
| FR-PAY-01…06 | Payroll per periode, potongan, finalisasi. | Server + UI; perhitungan sebagian di aplikasi. |

---

## 3. Alur sistem (ringkas)

```
App (Expo) -> src/api/client.ts -> src/api/index.ts -> Laravel /api/v1
Laravel -> AttendanceService/LeaveBalanceService/PayrollService -> MySQL
Tenant isolation: App\Models\Concerns\BelongsToCompany (global scope) + role middleware.
```

Alur persetujuan: Karyawan buat submission → HRD APPROVE → OWNER APPROVE → FULLY_APPROVED →
saldo cuti dipotong (balanceApplied) → payroll diproses → surat.

Alur absensi: GPS perangkat + selfie kamera → POST check-in/out (multipart) → server hitung
jarak (haversine) → validasi radius → simpan + audit log → status LATE + denda.

---

## 4. Kebutuhan yang belum jelas (open questions / keputusan produk)

1. **Rumus payroll final** (gaji pokok bulanan vs harian, hari kerja perusahaan, BPJS/lembur) —
   perlu persetujuan pemihak sebelum dimasukkan ke sistem produksi.
2. **Kuota cuti**: apakah hari libur nasional/EW harus di-exclude dari perhitungan hari cuti?
3. **Surat dokter**: batas ukuran file surat + format (PDF) sebelum dianggap lengkap.
4. **Finalisasi payroll**: siapa yang mem-final (Owner vs HRD) dan syarat bukti timesheet.
5. **Push**: channel (FCM/APNs) dan payload notifikasi approval.
6. **Timezone**: `APP_TIMEZONE=Asia/Jakarta` sudah dipakai; perlu konfirmasi rollout.

---

## 5. Roadmap implementasi bertahap

| Fase | Fokus | Status |
| --- | --- | --- |
| 1. Backend + kontrak | Laravel API, DB, test, dokumentasi | **Selesai** (51 test lulus) |
| 2. Klien mobile + store | `src/api/*`, AppProvider API-backed, token aman, mappers | **Selesai** |
| 3. Bukti absensi fisik | GPS + selfie + geofence + mock detection | **Selesai** (inti server) |
| 4. Payroll konsolidasi | Pindah perhitungan payroll ke server | **Selesai** |
| 5. Dokumen & notifikasi | PDF + QR + FCM/APNs | **PDF + QR selesai**; FCM/APNs menunggu kredensial. |
| 6. Produksi | CI, deploy backend, rate limit, audit, monitoring | **Perlu** |

---

## 6. Instruksi untuk AI Agent

1. Baca dokumen ini dan `PRD.md` sebelum mengubah kode.
2. Jangan menambah fitur di luar PRD tanpa persetujuan pengguna.
3. Jangan mengembalikan implementasi ke "mode mock"/"simulasi" jika sudah terintegrasi API.
4. Setiap perubahan perilaku bisnis harus memperbarui dokumen ini.
