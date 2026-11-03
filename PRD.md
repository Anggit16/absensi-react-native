---
document_type: Product Requirements Document
intended_for: OpenCode and other AI coding agents
language: id
project_name: Enterprise Multi-Company Attendance & Payroll Mobile App
status: Baseline Requirements
version: 1
---

# PRD --- Enterprise Multi-Company Attendance & Payroll Mobile App

> **Tujuan dokumen:** Menjadi sumber acuan utama bagi AI coding agent
> (khususnya OpenCode) untuk memahami tujuan produk, aktor, hak akses,
> alur bisnis, kebutuhan fungsional, aturan validasi, dan batasan
> implementasi. Baca dokumen ini sebelum membuat atau mengubah kode.

## 0. Instruksi untuk AI Coding Agent

Dokumen ini menjelaskan kebutuhan produk, bukan instruksi untuk langsung
membangun seluruh aplikasi sekaligus.

### 0.1 Cara bekerja

1.  **Pelajari repository terlebih dahulu.** Periksa struktur folder,
    `package.json`, konfigurasi framework, navigation, state management,
    API client, database, dan komponen yang sudah tersedia.
2.  **Identifikasi kondisi proyek saat ini.** Tentukan apakah repository
    masih kosong, sudah memiliki frontend, backend, atau keduanya.
    Jangan mengasumsikan teknologi sudah terpasang jika belum ditemukan.
3.  **Gunakan PRD ini sebagai acuan kebutuhan produk.** Jika
    implementasi yang sudah ada berbeda dari PRD, jelaskan perbedaannya
    sebelum mengubah bagian yang berdampak besar.
4.  **Jangan mengarang aturan bisnis.** Jika detail belum ditentukan,
    tandai sebagai `OPEN QUESTION` dan gunakan implementasi sementara
    hanya setelah menjelaskan asumsi serta meminta persetujuan bila
    keputusan tersebut berdampak pada data, payroll, approval, atau
    keamanan.
5.  **Jangan menghapus atau menimpa kode yang sudah berfungsi tanpa
    alasan yang jelas.** Pertahankan pola arsitektur dan konvensi
    repository jika masih layak.
6.  **Kerjakan secara bertahap dan terukur.** Selesaikan satu modul,
    jalankan pemeriksaan yang relevan, lalu laporkan file yang
    dibuat/diubah, hasil pengujian, dan pekerjaan tersisa.
7.  **Jangan membuat backend palsu seolah-olah sudah terhubung.** Jika
    backend belum tersedia, gunakan mock data/service yang terisolasi
    dan beri label jelas. Jangan menyimpan data sensitif di frontend.
8.  **Jaga konsistensi UI.** Gunakan design system, komponen reusable,
    navigasi, tipografi, spacing, dan status visual yang konsisten.
9.  **Terapkan otorisasi pada sisi server.** Menyembunyikan menu di
    frontend bukan pengganti validasi role dan tenant pada backend.
10. **Jangan menganggap semua fitur harus selesai dalam satu eksekusi.**
    Buat rencana implementasi, prioritaskan fondasi, lalu lanjutkan
    sesuai instruksi pengguna.

### 0.2 Format laporan setiap tahap

Setelah menyelesaikan tahap, laporkan: - Ringkasan pekerjaan. -
Modul/fitur yang selesai. - File baru dan file yang diubah. - Keputusan
teknis dan asumsi yang digunakan. - Perintah pengujian yang dijalankan
beserta hasilnya. - Kendala atau `OPEN QUESTION`. - Rekomendasi langkah
berikutnya.

### 0.3 Kriteria umum kualitas

-   Kode mudah dipelihara dan mengikuti konvensi proyek.
-   Komponen UI dapat digunakan kembali.
-   Kondisi loading, kosong, berhasil, gagal, dan akses ditolak
    ditangani.
-   Validasi dilakukan di frontend dan backend.
-   Data antarperusahaan tidak boleh saling terlihat atau terubah.
-   Perhitungan uang menggunakan presisi/tipe data yang sesuai, bukan
    floating point yang tidak aman untuk nilai finansial.
-   Perubahan database memiliki migration dan aturan integritas yang
    sesuai dengan framework yang digunakan.
-   Fitur penting memiliki pengujian.

------------------------------------------------------------------------

## 1. Ringkasan Produk

### 1.1 Identitas produk

  -----------------------------------------------------------------------
  Elemen                              Keterangan
  ----------------------------------- -----------------------------------
  Nama produk                         Enterprise Multi-Company Attendance
                                      & Payroll Mobile App

  Jenis produk                        Aplikasi manajemen SDM, absensi,
                                      pengajuan, dan payroll

  Platform utama                      Mobile app Android dan iOS
                                      menggunakan React Native

  Platform tambahan                   Web Admin bersifat opsional /
                                      menggunakan shared API

  Model bisnis                        Multi-tenant / SaaS

  Pengguna utama                      Owner, Admin/HRD, Karyawan

  Database yang direkomendasikan      PostgreSQL / Supabase

  Bahasa dokumen                      Indonesia
  -----------------------------------------------------------------------

### 1.2 Visi produk

Menyediakan solusi manajemen SDM berbasis mobile untuk berbagai
perusahaan. Sistem mengelola absensi karyawan menggunakan GPS geofencing
dan foto selfie langsung, mengelola pengajuan cuti/izin/sakit/resign
dengan dua tingkat persetujuan, serta menghitung estimasi dan
rekapitulasi gaji harian maupun bulanan.

### 1.3 Masalah yang ingin diselesaikan

-   Proses absensi perlu memiliki verifikasi lokasi dan bukti foto.
-   Perusahaan membutuhkan pemantauan kehadiran karyawan secara
    terpusat.
-   Pengajuan cuti, izin, sakit, dan resign perlu memiliki alur
    pemeriksaan yang tercatat.
-   Saldo cuti perlu dikelola dan diperbarui berdasarkan keputusan
    pengajuan.
-   Karyawan dan pengelola perusahaan membutuhkan informasi gaji serta
    rekapitulasi yang transparan.

### 1.4 Tujuan utama

1.  **Keamanan absensi:** Mengurangi kecurangan absensi melalui validasi
    geofence, selfie kamera langsung, deteksi mock location, dan waktu
    dari server.
2.  **Transparansi payroll:** Menampilkan estimasi gaji harian dan
    proyeksi akumulasi gaji bulanan.
3.  **Akuntabilitas approval:** Memastikan pengajuan diperiksa HRD
    terlebih dahulu dan memperoleh keputusan akhir Owner.
4.  **Manajemen cuti:** Mengelola kuota tahunan, saldo terpakai, dan
    saldo tersisa.
5.  **Multi-tenant:** Memastikan data setiap perusahaan terisolasi.

### 1.5 Di luar cakupan yang sudah ditetapkan

Hal berikut belum didefinisikan secara rinci dan tidak boleh dianggap
sebagai kebutuhan final tanpa konfirmasi: - Integrasi transfer gaji ke
bank atau payment gateway. - Perhitungan pajak, BPJS, potongan pinjaman,
dan komponen payroll legal lainnya. - Integrasi biometrik wajah untuk
mencocokkan identitas. - Sinkronisasi offline penuh. - Integrasi dengan
perangkat fingerprint atau mesin absensi fisik. - Portal publik
pendaftaran perusahaan, paket berlangganan, dan billing SaaS.

------------------------------------------------------------------------

## 2. Aktor, Role, dan Hak Akses

Sistem memiliki tiga level pengguna utama.

### 2.1 Owner

Owner merupakan pemilik perusahaan dan pemegang persetujuan akhir.

Tanggung jawab: - Mengelola akun Admin/HRD. - Mengelola komponen gaji
HRD. - Memantau ringkasan perusahaan. - Melihat rekap absensi dan
payroll perusahaan. - Memberikan keputusan akhir atas pengajuan yang
telah disetujui HRD. - Mengelola pengaturan perusahaan sesuai
kewenangannya.

### 2.2 Admin / HRD

HRD mengelola operasional SDM harian.

Tanggung jawab: - Mengelola data karyawan. - Membuat role/jabatan
kustom. - Mengatur lokasi kerja dan parameter absensi. - Mengatur skema
gaji role/karyawan. - Mengatur kuota cuti. - Memantau absensi. -
Melakukan verifikasi tahap pertama atas pengajuan karyawan.

### 2.3 Karyawan

Karyawan menggunakan aplikasi untuk aktivitas personal.

Tanggung jawab: - Melakukan absen masuk dan pulang. - Melihat riwayat
absensi. - Melihat estimasi gaji. - Melihat kuota cuti. - Mengajukan
cuti, izin, sakit, atau resign. - Melihat status pengajuan. - Mencetak
surat PDF hanya jika pengajuan telah disetujui sepenuhnya.

### 2.4 Matriks hak akses

  ---------------------------------------------------------------------------------
  Modul / Fitur                         Owner        Admin / HRD           Karyawan
  ------------------------ ------------------ ------------------ ------------------
  Kelola akun HRD dan gaji                 Ya              Tidak              Tidak
  HRD                                                            

  Kelola akun karyawan                     Ya                 Ya              Tidak

  Kelola dynamic roles                     Ya                 Ya              Tidak

  Kelola lokasi kantor                     Ya                 Ya              Tidak

  Atur skema gaji                          Ya                 Ya              Tidak

  Kelola kuota cuti                        Ya                 Ya      Melihat saldo
                                                                            sendiri

  Monitoring absensi        Global perusahaan  Global perusahaan    Riwayat sendiri

  Mengajukan                            Tidak              Tidak                 Ya
  cuti/izin/sakit/resign                                         

  Approval tahap 1                      Tidak                 Ya              Tidak

  Approval tahap 2                         Ya              Tidak              Tidak

  Cetak surat pengajuan                    Ya                 Ya     Ya, jika fully
                                                                           approved

  Absen masuk/pulang                 Opsional           Opsional                 Ya

  Lihat rekap gaji          Global perusahaan  Global perusahaan       Data pribadi
  ---------------------------------------------------------------------------------

**Aturan akses:** Semua permintaan data harus dibatasi berdasarkan
`company_id` dan hak akses pengguna. Karyawan hanya dapat mengakses data
personal miliknya. HRD hanya mengakses data perusahaan tempatnya
bekerja. Owner memiliki akses dalam tenant perusahaannya sendiri, bukan
seluruh tenant SaaS.

------------------------------------------------------------------------

## 3. Arsitektur Produk dan Konsep Multi-Tenant

### 3.1 Konsep tenant

-   Satu tenant merepresentasikan satu perusahaan.
-   Setiap perusahaan memiliki satu akun Owner awal yang dibuat ketika
    tenant didaftarkan/dibuat.
-   Owner membuat dan mengelola akun HRD.
-   HRD membuat dan mengelola akun karyawan.
-   Data perusahaan, pengguna, role, lokasi, absensi, pengajuan, kuota
    cuti, dan payroll harus memiliki relasi tenant yang jelas.
-   Pengguna tidak boleh dapat mengakses tenant lain dengan mengganti ID
    pada URL, request body, atau parameter API.

### 3.2 Isolasi data

Implementasikan isolasi tenant pada backend/database, bukan hanya pada
tampilan frontend.

Persyaratan: - Setiap query data tenant harus menggunakan konteks tenant
yang tervalidasi. - Validasi kepemilikan relasi dilakukan di server. -
Gunakan foreign key dan constraint yang sesuai. - Jika menggunakan
Supabase, pertimbangkan Row Level Security (RLS) untuk tabel yang
terekspos melalui API. - Jangan mempercayai `company_id` yang dikirim
bebas oleh client; tentukan tenant dari sesi/token pengguna yang telah
diverifikasi.

### 3.3 Rekomendasi teknologi

Teknologi yang direkomendasikan dalam rancangan awal: - Mobile: React
Native untuk Android dan iOS. - Styling: NativeWind (Tailwind CSS for
React Native). - Navigasi: React Navigation, kombinasi Native Stack dan
Bottom Tab. - Backend/database: PostgreSQL atau Supabase. - Geospatial:
PostGIS jika dibutuhkan untuk perhitungan geofence di database. -
Kamera: `react-native-vision-camera` atau pendekatan Expo yang sesuai
dengan workflow proyek. - Lokasi: `react-native-geolocation-service`
atau Expo Location. - PDF: library PDF yang kompatibel dengan target
platform.

**Catatan agent:** Rekomendasi di atas bukan izin untuk mengganti stack
repository. Periksa stack yang sudah digunakan dan usulkan perubahan
jika diperlukan. Pilih Expo atau Bare React Native berdasarkan kebutuhan
native module dan kondisi proyek; jangan mencampur keduanya tanpa alasan
teknis.

------------------------------------------------------------------------

## 4. Kebutuhan Fungsional

### 4.1 Autentikasi dan pengelolaan akun

**FR-AUTH-01 --- Login** - Pengguna dapat login menggunakan
email/username dan password sesuai rancangan autentikasi. - Sistem
memverifikasi kredensial melalui backend. - Setelah login, sistem
mengarahkan pengguna ke dashboard sesuai `user_level`. - Pengguna
nonaktif tidak dapat menggunakan fitur yang memerlukan autentikasi.

**FR-AUTH-02 --- Pembuatan akun Owner** - Setiap tenant baru memperoleh
satu akun Owner awal. - Kredensial awal harus dibuat melalui proses
aman. - Jangan menanam password default yang sama untuk seluruh
perusahaan.

**FR-AUTH-03 --- Pengelolaan akun HRD** - Owner dapat menambah,
mengubah, dan menonaktifkan akun HRD. - Owner dapat menentukan komponen
gaji HRD.

**FR-AUTH-04 --- Pengelolaan akun karyawan** - HRD dan Owner dapat
menambah, mengubah, dan menonaktifkan akun karyawan sesuai kewenangan. -
Data karyawan ditautkan ke role/jabatan yang berlaku. - Akun harus
terikat ke tenant yang benar.

### 4.2 Dynamic Role dan pengaturan kerja

**FR-ROLE-01** - Owner/HRD dapat membuat role kustom, misalnya Sales
Field, Software Engineer, Operator Pabrik, dan Admin Finance. - Role
terikat pada perusahaan.

**FR-ROLE-02** Setiap role dapat memiliki parameter: - Jam masuk. - Jam
pulang. - Toleransi keterlambatan. - Lokasi kerja atau proyek. -
Latitude dan longitude. - Radius geofence dalam meter. - Komponen gaji
yang berlaku.

**FR-ROLE-03** - Sistem harus memungkinkan role diubah dan
dinonaktifkan. - Perubahan role tidak boleh merusak histori absensi atau
payroll yang telah tercatat.

### 4.3 Lokasi kantor dan geofencing

**FR-LOC-01** - HRD/Owner dapat membuat dan mengelola lokasi
kantor/proyek. - Lokasi menyimpan nama, latitude, longitude, dan radius
meter. - Karyawan hanya dapat absen jika memenuhi aturan lokasi yang
berlaku.

**FR-LOC-02** - Sistem mengambil koordinat perangkat ketika karyawan
melakukan absensi. - Backend memvalidasi jarak koordinat karyawan
terhadap lokasi kerja. - Gunakan Haversine atau PostGIS untuk
perhitungan jarak. - Radius yang diperbolehkan mengikuti konfigurasi
lokasi/role.

**FR-LOC-03** - Jika lokasi berada di luar radius, absensi ditolak dan
alasan ditampilkan. - Jika izin lokasi tidak diberikan atau koordinat
tidak tersedia, sistem tidak boleh menganggap lokasi valid.

### 4.4 Smart Attendance --- GPS dan selfie

**FR-ATT-01 --- Absen masuk** - Karyawan menekan tombol Absen Masuk. -
Aplikasi meminta/mengambil lokasi perangkat. - Aplikasi membuka kamera
untuk mengambil selfie langsung. - Data dikirim ke backend untuk
divalidasi. - Waktu absensi menggunakan waktu server, bukan jam lokal
perangkat. - Jika valid, sistem menyimpan waktu, koordinat, foto, dan
status absensi.

**FR-ATT-02 --- Absen pulang** - Karyawan dapat melakukan absen pulang
setelah memiliki catatan absen masuk yang valid. - Aplikasi mengambil
lokasi dan selfie kembali. - Sistem menyimpan waktu, koordinat, dan foto
pulang. - Sistem menghitung data keterlambatan dan komponen gaji sesuai
aturan yang ditetapkan.

**FR-ATT-03 --- Kamera wajib** - Pengambilan foto harus melalui kamera
langsung. - Pemilihan foto dari galeri dinonaktifkan untuk alur selfie
absensi. - Backend menyimpan referensi file foto dengan kontrol akses
yang sesuai.

**FR-ATT-04 --- Anti-fake GPS** - Aplikasi perlu mendeteksi indikasi
mock location pada platform yang mendukung. - Jika mock location
terdeteksi, proses absensi diblokir atau ditandai sesuai kebijakan. -
Jangan menyatakan sistem 100% kebal terhadap spoofing; dokumentasikan
batasan deteksi setiap platform.

**FR-ATT-05 --- Monitoring** - Owner dan HRD dapat melihat daftar
absensi harian. - Data monitoring mencakup identitas karyawan, waktu
masuk/pulang, status, koordinat/peta, dan foto selfie sesuai hak
akses. - Monitoring menampilkan kondisi data terbaru yang tersedia dari
server.

**FR-ATT-06 --- Status** Status absensi minimal perlu mendukung: -
`ON_TIME` - `LATE` - `ABSENT` - `ON_LEAVE` atau status cuti yang
disepakati

Status final dan relasinya dengan status pengajuan perlu dikonfirmasi
pada bagian Open Questions.

### 4.5 Dashboard karyawan

**FR-EMP-DASH-01** Dashboard karyawan menampilkan: - Nama karyawan,
role, dan perusahaan. - Status kehadiran hari ini. - Jam masuk dan jam
pulang. - Status tepat waktu/terlambat. - Status GPS atau informasi
lokasi yang relevan. - Estimasi gaji hari ini. - Proyeksi gaji bulan
berjalan. - Total kuota cuti, cuti terpakai, dan sisa cuti. - Daftar
pengajuan terakhir beserta statusnya.

### 4.6 Manajemen kuota cuti

**FR-LEAVE-01** - Owner/HRD dapat mengatur kuota cuti tahunan per role
atau per karyawan. - Contoh kuota awal dalam rancangan adalah 12 hari
per tahun; nilai ini harus dapat dikonfigurasi. - Saldo cuti dicatat per
karyawan dan per tahun.

**FR-LEAVE-02** - Owner/HRD dapat melakukan adjustment saldo cuti. -
Adjustment harus menyimpan nilai perubahan, alasan, pelaku, dan waktu
perubahan agar dapat diaudit. - Jenis adjustment dapat mencakup bonus
cuti atau penyesuaian khusus.

**FR-LEAVE-03** - Karyawan dapat melihat kuota total, jumlah terpakai,
dan saldo tersisa. - Sistem harus mencegah saldo terpakai melebihi
kuota, kecuali kebijakan khusus secara eksplisit ditentukan.

### 4.7 Pengajuan cuti, izin, sakit, dan resign

**FR-SUB-01 --- Pengajuan cuti** Form mencakup: - Jenis cuti: tahunan,
sakit, tanpa gaji, atau khusus. - Tanggal mulai dan tanggal selesai. -
Alasan. - Lampiran berkas jika diperlukan.

**FR-SUB-02 --- Pengajuan izin** - Karyawan dapat mengajukan izin,
misalnya terlambat atau keperluan pribadi. - Form memuat jenis izin,
tanggal/waktu atau durasi, alasan, dan lampiran bila diperlukan.

**FR-SUB-03 --- Pengajuan sakit** - Karyawan dapat mengajukan sakit. -
Surat dokter wajib dilampirkan untuk kategori cuti sakit sesuai aturan
awal.

**FR-SUB-04 --- Pengajuan resign** - Form memuat alasan dan tanggal
efektif resign.

**FR-SUB-05 --- Validasi kuota** - Sebelum pengajuan cuti tahunan
diterima untuk proses approval, sistem memeriksa saldo cuti. - Jika
jumlah hari yang diminta lebih besar daripada saldo tersedia, sistem
menolak pengajuan dan menampilkan pesan bahwa kuota tidak mencukupi. -
Perhitungan hari cuti (hari kalender atau hari kerja), hari libur, dan
pengajuan yang saling tumpang tindih perlu mengikuti kebijakan yang
ditetapkan.

**FR-SUB-06 --- Riwayat** - Karyawan dapat melihat daftar pengajuan,
rincian, status approval, catatan HRD/Owner, dan waktu keputusan. - HRD
dan Owner dapat melihat pengajuan sesuai tenant dan kewenangannya.

### 4.8 Dual Approval Workflow

Pengajuan karyawan menggunakan dua tahap persetujuan.

**Alur utama:**

1.  Karyawan mengisi dan mengirim pengajuan.
2.  Sistem melakukan validasi awal, termasuk validasi kuota untuk cuti
    tahunan.
3.  Jika valid, status menjadi `PENDING_HRD`.
4.  HRD memeriksa alasan dan lampiran.
5.  Jika HRD menolak, status akhir menjadi `REJECTED`.
6.  Jika HRD menyetujui, pengajuan masuk ke tahap Owner dengan status
    `PENDING_OWNER`.
7.  Owner memeriksa pengajuan.
8.  Jika Owner menolak, status akhir menjadi `REJECTED`.
9.  Jika Owner menyetujui, status menjadi `FULLY_APPROVED`.
10. Setelah persetujuan penuh, sistem menjalankan efek bisnis yang
    relevan, misalnya pemotongan saldo cuti tahunan dan pencatatan
    status cuti pada absensi.
11. Tombol cetak PDF diaktifkan.

**Aturan penting:** - Owner tidak boleh menyetujui pengajuan yang belum
lolos tahap HRD. - HRD tidak boleh melakukan persetujuan final tahap
Owner. - Keputusan approval harus menyimpan aktor, catatan, dan
timestamp. - Operasi approval dan pembaruan saldo cuti harus aman dari
pemrosesan ganda. - Pengajuan yang sudah diproses tidak boleh mengurangi
saldo cuti lebih dari satu kali.

**Status yang digunakan pada alur:**

  -----------------------------------------------------------------------
  Status                  Makna                   Aksi berikutnya
  ----------------------- ----------------------- -----------------------
  `PENDING_HRD`           Menunggu pemeriksaan    HRD approve/reject
                          HRD                     

  `PENDING_OWNER`         HRD menyetujui;         Owner approve/reject
                          menunggu Owner          

  `REJECTED`              Ditolak oleh salah satu Tidak dapat dicetak
                          approver                

  `FULLY_APPROVED`        Disetujui HRD dan Owner Efek bisnis dijalankan;
                                                  PDF tersedia
  -----------------------------------------------------------------------

### 4.9 Aturan cuti dan pengaruh terhadap payroll

Aturan awal yang harus diakomodasi:

  -------------------------------------------------------------------------
  Jenis pengajuan     Potong kuota cuti Pengaruh gaji     Ketentuan
                      tahunan?                            
  ------------------- ----------------- ----------------- -----------------
  Cuti tahunan        Ya                Tidak dipotong    Mengurangi saldo
                                                          kuota; gaji
                                                          harian dihitung
                                                          penuh

  Cuti sakit dengan   Tidak             Tidak dipotong    Surat dokter
  surat dokter                                            wajib; gaji tetap
                                                          penuh

  Cuti tanpa gaji     Tidak             Gaji tanggal      Tidak mengurangi
                                        tersebut nol      saldo cuti
                                                          tahunan

  Izin pribadi        Tidak             Dapat dipotong    Berdasarkan
                                        penuh/parsial     durasi dan
                                                          kebijakan

  Cuti khusus         Tidak             Tidak dipotong    Menggunakan jatah
  (duka/melahirkan)                                       khusus di luar
                                                          saldo tahunan
  -------------------------------------------------------------------------

**Penting:** Detail perhitungan izin parsial, definisi hari kerja, dan
komponen gaji untuk tiap jenis cuti belum lengkap. Jangan membuat
formula final sebelum aturan tersebut dikonfirmasi.

### 4.10 Payroll dan rekapitulasi gaji

**FR-PAY-01** - Sistem mendukung skema gaji harian dan/atau bulanan. -
Komponen yang disebutkan dalam rancangan: - Gaji pokok harian/bulanan. -
Tunjangan makan harian. - Tunjangan transport harian. - Denda
keterlambatan per menit. - Insentif jika dikonfigurasi.

**FR-PAY-02** - HRD/Owner mengatur komponen gaji berdasarkan role atau
karyawan. - Sistem menghitung estimasi gaji harian. - Sistem menampilkan
proyeksi gaji bulanan. - Sistem menyediakan rekap untuk Owner, HRD, dan
karyawan sesuai hak akses.

**FR-PAY-03** - Gaji harian dihitung berdasarkan kehadiran dan kebijakan
cuti/izin. - Keterlambatan dapat mengurangi gaji berdasarkan denda per
menit jika kebijakan tersebut aktif. - Cuti tanpa gaji menghasilkan
nilai gaji nol untuk tanggal terkait sesuai aturan awal. - Cuti tahunan
dan sakit yang memenuhi ketentuan tidak mengurangi gaji sesuai aturan
awal.

**FR-PAY-04** - Simpan rincian komponen perhitungan agar hasil payroll
dapat ditelusuri. - Perubahan skema gaji tidak boleh mengubah histori
payroll yang sudah ditutup/dikonfirmasi tanpa proses koreksi yang
tercatat.

**OPEN QUESTION:** Formula final payroll, pembulatan, periode payroll,
hari kerja, prorata gaji bulanan, lembur, pajak, dan proses penguncian
periode belum ditentukan.

### 4.11 Cetak dokumen PDF

**FR-PDF-01** - Pengajuan memiliki tombol cetak surat pada halaman
riwayat/detail. - PDF memuat kop perusahaan, identitas karyawan, jenis
dan detail pengajuan, tanggal, serta status persetujuan. - Dokumen dapat
memuat QR Code untuk verifikasi persetujuan.

**FR-PDF-02 --- Aturan akses cetak**

  Status             Tombol cetak
  ------------------ --------------
  `PENDING_HRD`      Disabled
  `PENDING_OWNER`    Disabled
  `REJECTED`         Disabled
  `FULLY_APPROVED`   Enabled

**FR-PDF-03** - QR Code harus mengarah ke mekanisme verifikasi yang
aman. - Jangan menaruh password, token sesi, atau data sensitif langsung
di QR Code. - Validasi status approval dilakukan di server saat PDF
dibuat/diakses.

------------------------------------------------------------------------

## 5. Alur Sistem Utama

### 5.1 Alur onboarding perusahaan

1.  Tenant/perusahaan dibuat.
2.  Sistem membuat akun Owner awal.
3.  Owner login.
4.  Owner membuat akun HRD.
5.  HRD membuat role dan lokasi kerja.
6.  HRD membuat akun karyawan dan menghubungkannya ke role.
7.  Karyawan login dan menggunakan aplikasi.

### 5.2 Alur absensi masuk

1.  Karyawan membuka dashboard.
2.  Sistem menampilkan status absensi hari ini.
3.  Karyawan menekan Absen Masuk.
4.  Aplikasi memeriksa izin lokasi dan mengambil koordinat.
5.  Aplikasi memeriksa indikasi mock location sesuai kemampuan platform.
6.  Aplikasi membuka kamera dan mengambil selfie langsung.
7.  Data dikirim ke backend.
8.  Backend memvalidasi autentikasi, tenant, jadwal, lokasi, radius, dan
    data foto.
9.  Backend mengambil timestamp server.
10. Jika lolos validasi, backend menyimpan catatan absensi dan
    mengembalikan hasil.
11. Dashboard memperbarui status kehadiran.

### 5.3 Alur absensi pulang

1.  Karyawan membuka dashboard.
2.  Sistem memastikan ada absensi masuk yang valid.
3.  Karyawan menekan Absen Pulang.
4.  Aplikasi mengambil koordinat dan selfie.
5.  Backend memvalidasi lokasi dan data.
6.  Backend menyimpan timestamp pulang dari server.
7.  Sistem menghitung keterlambatan/komponen gaji yang relevan sesuai
    aturan.
8.  Dashboard dan riwayat diperbarui.

### 5.4 Alur pengajuan dan approval

``` text
KARYAWAN
   |
   v
Isi dan kirim pengajuan
   |
   v
Validasi sistem (termasuk saldo cuti jika relevan)
   |
   +---- Tidak valid ----> Pengajuan ditolak saat validasi
   |
   v
PENDING_HRD
   |
   +---- HRD Reject -----> REJECTED
   |
   v HRD Approve
PENDING_OWNER
   |
   +---- Owner Reject ---> REJECTED
   |
   v Owner Approve
FULLY_APPROVED
   |
   +----> Perbarui saldo cuti jika cuti tahunan
   +----> Catat status cuti pada absensi jika relevan
   +----> Aktifkan cetak PDF
```

### 5.5 Alur pencetakan surat

1.  Pengguna membuka detail pengajuan.
2.  Sistem memeriksa status terkini dari backend.
3.  Jika status bukan `FULLY_APPROVED`, tombol cetak tetap nonaktif.
4.  Jika status `FULLY_APPROVED`, pengguna yang berhak dapat meminta
    PDF.
5.  Backend memvalidasi ulang status dan hak akses.
6.  Sistem menghasilkan atau mengirim dokumen PDF.

------------------------------------------------------------------------

## 6. Struktur Navigasi dan Halaman

Gunakan Native Stack + Bottom Tab Navigator atau pola navigasi setara
yang sesuai dengan repository.

``` text
Root Navigation
├── Auth Stack
│   └── Login
├── Owner Navigation
│   ├── Dashboard / Executive Summary
│   ├── HRD Management
│   ├── Final Approval
│   └── Company Settings
├── HRD Navigation
│   ├── Dashboard / Live Attendance Monitor
│   ├── Employee Management
│   ├── Dynamic Role & Work Setup
│   ├── Office / Project Locations
│   ├── Payroll Setup
│   ├── Leave Allocation
│   ├── HRD Approval
│   └── Profile
└── Employee Navigation
    ├── Home Dashboard
    ├── Attendance History
    ├── Submission Hub
    ├── Submission Detail / Status Tracker
    └── Profile
```

### 6.1 Dashboard karyawan --- komponen utama

1.  Header berisi nama karyawan, role, dan perusahaan.
2.  Card absensi berisi status hari ini, indikator lokasi, dan tombol
    absen masuk/pulang sesuai kondisi.
3.  Ringkasan finansial berisi estimasi gaji hari ini dan proyeksi bulan
    ini.
4.  Card cuti berisi kuota total, terpakai, dan tersisa.
5.  Daftar pengajuan terbaru beserta status.
6.  Tombol cetak hanya aktif untuk pengajuan `FULLY_APPROVED`.

Angka contoh seperti `Rp150.000`, `Rp4.500.000`, dan `8/12 hari` hanya
contoh tampilan, bukan data default atau nilai bisnis tetap.

------------------------------------------------------------------------

## 7. Rancangan Data dan Entitas

Database yang direkomendasikan adalah PostgreSQL/Supabase. Skema berikut
merupakan rancangan awal konseptual, bukan migration final. Sesuaikan
tipe data, naming, constraint, dan relasi dengan stack proyek.

### 7.1 Entitas inti

  ------------------------------------------------------------------------
  Entitas                 Fungsi                   Atribut penting
  ----------------------- ------------------------ -----------------------
  `companies`             Data tenant/perusahaan   id, company_name,
                                                   created_at

  `users`                 Akun Owner, HRD,         id, company_id,
                          karyawan                 role_id, full_name,
                                                   email, password_hash,
                                                   user_level, is_active

  `roles`                 Role/jabatan kustom      id, company_id,
                                                   role_name, salary
                                                   settings, leave quota

  `office_locations`      Lokasi kantor/proyek     id, company_id,
                                                   location_name,
                                                   latitude, longitude,
                                                   radius_meters

  `leave_allocations`     Saldo cuti tahunan       id, user_id,
                                                   company_id, year,
                                                   total_quota, used_quota

  `attendances`           Log absensi              id, user_id,
                                                   company_id, date,
                                                   clock-in/out,
                                                   coordinates, photo
                                                   references,
                                                   late_minutes, salary,
                                                   status

  `submissions`           Pengajuan                id, user_id,
                          cuti/izin/sakit/resign   company_id, category,
                                                   leave_type, reason,
                                                   attachment, dates,
                                                   total_days, approval
                                                   data
  ------------------------------------------------------------------------

### 7.2 Relasi dan integritas

-   `companies` memiliki banyak `users`, `roles`, `office_locations`,
    `attendances`, dan `submissions`.
-   `users` terhubung ke satu tenant dan dapat terhubung ke role sesuai
    desain role pengguna.
-   `leave_allocations` terhubung ke satu pengguna dan satu tahun.
-   `attendances` terhubung ke pengguna dan tenant.
-   `submissions` terhubung ke pengguna dan tenant.
-   Pastikan relasi lintas tenant tidak dapat dibuat.
-   Gunakan unique constraint untuk saldo cuti per pengguna per tahun.
-   Gunakan transaksi database untuk approval yang memengaruhi saldo
    cuti dan absensi.

### 7.3 Catatan terhadap rancangan SQL awal

SQL pada dokumen sumber merupakan gambaran awal. Sebelum membuat
migration: - Pastikan desain role pengguna tidak rancu antara
`user_level` (OWNER/HRD/EMPLOYEE) dan role pekerjaan dinamis. - Pastikan
unique email sesuai kebijakan: global unik atau unik per tenant. -
Pastikan status attendance konsisten dengan status cuti. - Pertimbangkan
tabel audit log untuk perubahan saldo, approval, dan konfigurasi
payroll. - Pertimbangkan pemisahan tabel komponen payroll dari tabel
role jika kebutuhan berkembang. - Pastikan timestamp dan nominal uang
menggunakan tipe yang sesuai. - Jangan memakai generated column atau
fitur database tertentu tanpa memastikan kompatibilitas provider.

------------------------------------------------------------------------

## 8. Keamanan, Privasi, dan Audit

### 8.1 Keamanan autentikasi dan otorisasi

-   Password harus di-hash dengan algoritma yang sesuai.
-   Token/sesi disimpan dengan mekanisme aman sesuai platform.
-   Backend memvalidasi role dan tenant untuk setiap endpoint.
-   Pengguna nonaktif tidak boleh melakukan aksi.
-   Cegah IDOR dengan memvalidasi kepemilikan setiap resource.

### 8.2 Keamanan absensi

-   Timestamp absensi berasal dari server.
-   Validasi koordinat dan radius dilakukan di server.
-   Foto selfie diambil melalui kamera langsung pada alur aplikasi.
-   File foto tidak boleh dapat diakses publik tanpa kontrol.
-   Mock-location detection merupakan sinyal mitigasi, bukan jaminan
    anti-kecurangan mutlak.
-   Catat alasan penolakan absensi untuk audit.

### 8.3 Keamanan approval dan payroll

-   Simpan identitas approver, status, catatan, dan timestamp.
-   Gunakan transaksi database untuk perubahan status dan saldo.
-   Cegah approval ganda atau pengurangan saldo ganda.
-   Catat perubahan konfigurasi gaji dan adjustment cuti.
-   Batasi akses data gaji berdasarkan role dan tenant.

### 8.4 Privasi

-   Tampilkan lokasi dan foto hanya kepada pihak yang berwenang.
-   Terapkan kebijakan retensi data untuk foto dan dokumen.
-   Jangan mencatat password, token, atau informasi sensitif ke log.
-   Sediakan penanganan akses file yang memerlukan autentikasi.

------------------------------------------------------------------------

## 9. Design System Awal

### 9.1 Palet warna

  Kegunaan             Warna              Hex
  -------------------- ------------------ -----------
  Primary corporate    Slate/Navy gelap   `#0F172A`
  Secondary accent     Emerald green      `#10B981`
  Warning              Amber gold         `#F59E0B`
  Danger               Rose red           `#EF4444`
  Neutral background   Ghost white        `#F8FAFC`

### 9.2 Pedoman UI/UX

-   Tampilan mobile-first dan responsif terhadap ukuran layar.
-   Gunakan komponen reusable untuk card, input, tombol, modal,
    tabel/list, dan status.
-   Gunakan warna status secara konsisten: approved, pending, rejected,
    late, dan absent.
-   Sediakan feedback loading, success, error, empty state, dan
    permission denied.
-   Form memiliki label, validasi, dan pesan kesalahan yang jelas.
-   Hindari menampilkan informasi finansial atau personal milik pengguna
    lain.
-   Pastikan navigasi dan aksi sesuai role.

------------------------------------------------------------------------

## 10. Non-Functional Requirements

  -----------------------------------------------------------------------
  ID                      Kategori                Kebutuhan
  ----------------------- ----------------------- -----------------------
  NFR-01                  Security                Isolasi data tenant dan
                                                  validasi otorisasi
                                                  backend

  NFR-02                  Reliability             Proses approval dan
                                                  pembaruan saldo
                                                  konsisten serta
                                                  idempotent

  NFR-03                  Usability               Alur absensi dan
                                                  pengajuan mudah
                                                  dipahami

  NFR-04                  Performance             Dashboard dan daftar
                                                  data menggunakan
                                                  query/pagination yang
                                                  wajar

  NFR-05                  Compatibility           Mendukung target
                                                  Android/iOS yang
                                                  ditentukan proyek

  NFR-06                  Maintainability         Struktur modul dan
                                                  komponen mudah
                                                  dikembangkan

  NFR-07                  Auditability            Perubahan approval,
                                                  payroll, dan kuota
                                                  dapat ditelusuri

  NFR-08                  Privacy                 Foto, lokasi, dan data
                                                  gaji hanya dapat
                                                  diakses pihak berwenang

  NFR-09                  Accuracy                Perhitungan jarak,
                                                  waktu, saldo, dan
                                                  nominal mengikuti
                                                  aturan yang telah
                                                  disepakati

  NFR-10                  Resilience              Penanganan jaringan
                                                  gagal dan retry tidak
                                                  membuat transaksi ganda
  -----------------------------------------------------------------------

------------------------------------------------------------------------

## 11. Roadmap Implementasi

Rencana awal sumber membagi pekerjaan ke dalam sekitar 10 minggu. Durasi
aktual perlu disesuaikan dengan kapasitas tim dan kondisi repository.

  -----------------------------------------------------------------------
  Fase              Perkiraan         Fokus             Hasil yang
                                                        diharapkan
  ----------------- ----------------- ----------------- -----------------
  1                 Minggu 1--2       Fondasi,          Struktur proyek,
                                      autentikasi,      database awal,
                                      tenant            login, Owner

  2                 Minggu 3--4       Dynamic roles dan HRD, karyawan,
                                      master data       role, lokasi
                                                        kerja

  3                 Minggu 5--6       Smart attendance  GPS, geofence,
                                                        selfie,
                                                        monitoring

  4                 Minggu 7--8       Cuti dan dual     Kuota, pengajuan,
                                      approval          approval, status

  5                 Minggu 9          Payroll           Estimasi harian
                                                        dan rekap bulanan

  6                 Minggu 10         Audit dan         Pengujian,
                                      deployment        perbaikan
                                                        keamanan, rilis
  -----------------------------------------------------------------------

### 11.1 Urutan prioritas teknis

1.  Repository assessment dan keputusan arsitektur.
2.  Auth, tenant context, dan role authorization.
3.  Master data: perusahaan, pengguna, role, lokasi.
4.  Absensi dan penyimpanan bukti.
5.  Pengajuan dan dual approval.
6.  Kuota cuti dan efek approval.
7.  Payroll.
8.  PDF.
9.  Audit, pengujian menyeluruh, dan deployment.

Urutan ini merupakan rekomendasi dependensi implementasi; agent harus
menyesuaikannya dengan kondisi proyek dan arahan pengguna.

------------------------------------------------------------------------

## 12. Acceptance Criteria

Fitur dianggap memenuhi kebutuhan awal apabila kriteria berikut dapat
dibuktikan.

### 12.1 Auth dan tenant

-   [ ] Owner, HRD, dan karyawan dapat login sesuai akun aktif.
-   [ ] Pengguna diarahkan ke dashboard berdasarkan level akses.
-   [ ] Pengguna dari tenant A tidak dapat membaca atau mengubah data
    tenant B.
-   [ ] Akun nonaktif tidak dapat melakukan aksi terlindungi.

### 12.2 Master data

-   [ ] Owner dapat mengelola akun HRD.
-   [ ] HRD dapat mengelola akun karyawan.
-   [ ] HRD/Owner dapat membuat role dan lokasi kerja.
-   [ ] Parameter role dan lokasi tersimpan serta dapat digunakan saat
    absensi.

### 12.3 Absensi

-   [ ] Karyawan dapat melakukan absen masuk dengan lokasi dan selfie.
-   [ ] Karyawan dapat melakukan absen pulang setelah absen masuk valid.
-   [ ] Absensi di luar radius ditolak.
-   [ ] Timestamp berasal dari server.
-   [ ] Owner/HRD dapat melihat catatan absensi sesuai tenant.
-   [ ] Foto dan koordinat hanya dapat diakses oleh pihak berwenang.

### 12.4 Cuti dan approval

-   [ ] Karyawan dapat mengajukan cuti/izin/sakit/resign sesuai form.
-   [ ] Pengajuan cuti tahunan dengan saldo tidak cukup ditolak.
-   [ ] HRD dapat menyetujui atau menolak tahap pertama.
-   [ ] Owner hanya menerima pengajuan yang lolos HRD.
-   [ ] Owner dapat menyetujui atau menolak tahap akhir.
-   [ ] Saldo cuti hanya diperbarui sesuai aturan setelah approval
    penuh.
-   [ ] Pengulangan request tidak mengurangi saldo lebih dari satu kali.

### 12.5 Payroll dan PDF

-   [ ] Dashboard menampilkan estimasi gaji sesuai data dan aturan yang
    disepakati.
-   [ ] Rekap payroll mengikuti hak akses pengguna.
-   [ ] Tombol PDF nonaktif sebelum `FULLY_APPROVED`.
-   [ ] PDF dapat dibuat untuk pengajuan yang telah disetujui penuh.
-   [ ] PDF memuat data pengajuan dan informasi verifikasi yang valid.

------------------------------------------------------------------------

## 13. Open Questions --- Wajib Dikonfirmasi Sebelum Implementasi Final

Bagian ini sengaja disediakan agar AI agent tidak mengambil keputusan
bisnis yang belum disepakati.

1.  **Pendaftaran tenant:** Apakah pembuatan perusahaan dilakukan
    melalui super admin/platform operator, registrasi mandiri, atau
    proses manual?
2.  **Web Admin:** Apakah web admin benar-benar akan dibuat, atau
    seluruh fungsi Owner/HRD tersedia di aplikasi mobile?
3.  **Role pekerjaan vs level akun:** Apakah `OWNER`, `HRD`, dan
    `EMPLOYEE` merupakan level akses tetap, sedangkan jabatan pekerjaan
    adalah dynamic role terpisah?
4.  **Email pengguna:** Apakah email harus unik secara global atau cukup
    unik dalam satu perusahaan?
5.  **Multi-lokasi:** Apakah satu karyawan dapat memiliki beberapa
    lokasi kerja atau hanya satu lokasi utama?
6.  **Jadwal kerja:** Apakah jadwal dapat berbeda per hari, shift, atau
    lokasi?
7.  **Hari cuti:** Apakah kuota dan durasi cuti dihitung berdasarkan
    hari kalender atau hari kerja? Bagaimana akhir pekan dan hari libur
    nasional?
8.  **Pengajuan tumpang tindih:** Apakah pengajuan yang tanggalnya
    bertabrakan dengan pengajuan lain harus ditolak?
9.  **Waktu pemotongan kuota:** Apakah kuota dikurangi saat Owner
    menyetujui, atau saat cuti benar-benar berlangsung? Bagaimana jika
    pengajuan yang sudah disetujui dibatalkan?
10. **Cuti sakit:** Apakah seluruh cuti sakit wajib surat dokter? Apakah
    ada batas hari?
11. **Cuti khusus:** Bagaimana kuota cuti khusus dikelola dan apakah
    setiap jenis memiliki batas tertentu?
12. **Izin parsial:** Bagaimana menghitung pemotongan gaji berdasarkan
    jam izin?
13. **Payroll:** Apa formula gaji harian/bulanan, tunjangan, denda
    keterlambatan, pembulatan, dan prorata?
14. **Periode payroll:** Apakah rekap bulanan mengikuti tanggal kalender
    atau periode khusus perusahaan?
15. **Lembur dan hari libur:** Apakah lembur, kerja akhir pekan, dan
    hari libur masuk cakupan?
16. **Approval resign:** Apakah pengajuan resign juga wajib melewati HRD
    lalu Owner, dan apakah akun karyawan otomatis dinonaktifkan pada
    tanggal efektif?
17. **Pembatalan pengajuan:** Apakah karyawan dapat membatalkan
    pengajuan yang masih pending atau yang telah disetujui?
18. **Foto absensi:** Berapa lama foto disimpan dan siapa yang boleh
    mengunduhnya?
19. **Deteksi fake GPS:** Bagaimana kebijakan untuk perangkat yang tidak
    mendukung deteksi mock location atau memberikan hasil yang tidak
    pasti?
20. **PDF/QR:** Apakah QR Code memverifikasi dokumen melalui halaman
    publik dengan token acak, atau melalui aplikasi internal?
21. **Notifikasi:** Apakah notifikasi approval menggunakan push
    notification, email, atau keduanya?
22. **Offline:** Apakah absensi harus bisa dilakukan ketika tidak ada
    koneksi internet? Rancangan saat ini belum menetapkan mode offline.

------------------------------------------------------------------------

## 14. Aturan untuk Perubahan PRD

Jika pengguna meminta perubahan kebutuhan: 1. Perbarui bagian PRD yang
relevan. 2. Periksa dampak perubahan terhadap role, alur, database,
keamanan, UI, dan acceptance criteria. 3. Tandai kebutuhan yang berubah
agar tidak terjadi konflik antarbagian. 4. Jangan menghapus keputusan
yang sudah disetujui tanpa instruksi. 5. Jika ada dua aturan yang
bertentangan, tunjukkan konflik dan minta keputusan pengguna.

## 15. Instruksi Awal Saat PRD Dibaca OpenCode

Saat pertama kali menerima tugas di repository ini:

1.  Baca seluruh `PRD.md`.
2.  Periksa seluruh struktur repository dan file konfigurasi penting.
3.  Ringkas pemahaman tentang produk, stack aktual, modul, aktor, dan
    alur utama.
4.  Buat daftar perbedaan antara kondisi repository dan kebutuhan PRD.
5.  Buat rencana implementasi bertahap beserta dependensi dan
    file/folder yang diperkirakan terpengaruh.
6.  Sebutkan `OPEN QUESTION` yang menghalangi implementasi.
7.  **Jangan langsung mengimplementasikan semua modul.** Tunggu arahan
    pengguna mengenai fase atau modul yang akan dikerjakan, kecuali
    pengguna sudah memberikan instruksi implementasi yang spesifik.

------------------------------------------------------------------------

**Akhir dokumen PRD.**
