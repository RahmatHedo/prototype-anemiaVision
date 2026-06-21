# Product Requirement Document (PRD) - AnemiaVision Frontend

Dokumen ini mendefinisikan kebutuhan fungsional dan desain antarmuka (UI/UX) untuk frontend mobile application **AnemiaVision** menggunakan React Native. Fokus utama dokumen ini adalah memetakan navigasi, menu/navbar (tab bar), dan alur layar (screen flow) berdasarkan peran pengguna (role) yang sudah ditentukan.

---

## 1. Arsitektur Navigasi Utama (Navbar & Tab Bar)

Aplikasi menggunakan **Role-Based Bottom Navigation Bar**. Setelah login berhasil, aplikasi akan mendeteksi peran pengguna dan memuat susunan navigasi yang disesuaikan secara dinamis.

### Perbandingan Struktur Navbar Antar Role

| No | Tab Kader Sekolah | Tab TBMs (Technical Blood) | Tab Pihak Sekolah | Tab Admin / Tim IT |
| :--- | :--- | :--- | :--- | :--- |
| **Tab 1** | **Beranda** (Home) | **Beranda** (Home / Input Hb) | **Dashboard** (Statistik Sesi) | **Dashboard** (Statistik Sesi) |
| **Tab 2** | **Riwayat** (History List) | **Riwayat Input** (Hb Logs) | **Riwayat Siswi** (Detail Progress) | **Riwayat Siswi** (Detail Progress) |
| **Tab 3** | **Cek Mata** (Floating Camera Button) | *Tidak ada* | *Tidak ada* | **Admin Panel** (Fine-tuning & User) |
| **Tab 4** | **Prioritas** (Triage Alert List) | *Tidak ada* | **Prioritas** (Triage Alert List) | **Prioritas** (Triage Alert List) |
| **Tab 5** | **Profil** (User Settings & Sync) | **Profil** (User Settings & Sync) | **Profil** (User Settings & Sync) | **Profil** (User Settings & Sync) |

---

## 2. Peta Fitur & Alur Layar (Screen Flow) Per Peran

### 2.1. Alur Autentikasi (Semua Peran)
- **Layar Login**:
  - Input: Username/Email & Password.
  - Action: Tombol login dengan *loading state* interaktif.
  - Security: Validasi input client-side.
  - Output: Mengarahkan pengguna ke dashboard khusus sesuai perannya.

---

### 2.2. Role: Kader Sekolah (Fokus Skrining & Deteksi)
Kader sekolah adalah pengguna di lapangan yang mengoperasikan kamera dan mengisi formulir klinis.

#### **Tab 1: Beranda (Home)**
- **Card Ringkasan Hari Ini**: Jumlah siswi diskrining hari ini, jumlah kasus pending sinkronisasi, dan jumlah terdeteksi anemia.
- **Quick Action**: Tombol besar "Mulai Cek Mata" yang mengarah ke fitur kamera.
- **Edukasi Singkat**: Banner info anemia interaktif untuk kader.

#### **Tab 2: Riwayat Skrining (Sesuai Referensi Gambar)**
- **Header**: "Halo, Kak Kader! Daftar Riwayat Skrining Siswi" + Tombol Profil Singkat.
- **Search Bar**: Kolom pencarian `Cari ID Anonim...` (AV-XXXX).
- **Filter Dropdown**:
  - `Tanggal` (Hari ini, Minggu ini, Kustom).
  - `Sesi` (Baseline, Monitoring, Evaluasi).
  - `Hasil` (Semua, No Anemia, Ringan, Sedang, Berat).
- **Daftar Kartu Riwayat (List Card)**:
  - Format teks: `[ID Anonim] | [Waktu/Tanggal] | Anemia: [Tingkat/No Anemia]`
  - Indikator Status Sinkronisasi:
    - 🟢 *Tersinkronisasi* (Awan hijau): Data sudah sukses diunggah.
    - 🟡 *Pending* (Awan kuning/oranye): Tersimpan di lokal, menunggu internet untuk auto-sync.
  - Tombol Aksi: Ikon "Mata" (Detail) dan ikon "Panah Kanan" untuk membuka detail skrining secara lengkap.

#### **Tab 3 (Center Button): Cek Mata (Flow Skrining Utama)**
*Tab ini berupa tombol menonjol di tengah bottom bar dengan ikon mata. Saat ditekan, masuk ke alur berikut:*
1. **Layar Kamera dengan Panduan (Camera Overlay)**:
   - Panduan kotak berbayang di area tengah untuk memposisikan mata (konjungtiva) siswi dengan pas.
   - Flash otomatis menyala saat tombol capture ditekan.
   - Verifikasi kualitas foto dilakukan setelah tombol capture ditekan (analisis pasca-pengambilan).
   - Jika kualitas buruk (blur atau kecerahan di bawah threshold): Memunculkan modal dialog "Foto Kurang Jelas/Gelap. Silakan foto ulang."
2. **Proses Klasifikasi Tahap 1 (Konjungtiva CNN)**:
   - Layar loading animasi menarik "Menganalisis Foto Konjungtiva..."
   - **Hasil Tahap 1 Negatif (No Anemia)**:
     - Langsung lompat ke **Layar Hasil Akhir** (Status: No Anemia, warna hijau, rekomendasi menjaga kesehatan).
   - **Hasil Tahap 1 Positif (Anemia)**:
     - Aplikasi menampilkan transisi halus menuju **Formulir 7 Data Klinis**.
3. **Formulir 7 Data Klinis (Hanya jika Tahap 1 Positif)**:
   - Tampilan single-page form (semua 7 pertanyaan ditampilkan dalam satu halaman scrollable) dengan pertanyaan non-medis yang mudah dipahami agar kader bisa mengisi dengan cepat:
     1. Apakah sering merasa 5L (Lesu, Letih, Lemah, Lelah, Lalai)? (Ya/Tidak)
     2. Apakah sering merasa pusing atau sakit kepala berputar? (Ya/Tidak)
     3. Apakah kelopak mata bawah bagian dalam terlihat sangat pucat? (Ya/Tidak)
     4. Apakah sering sulit konsentrasi saat belajar di kelas? (Ya/Tidak)
     5. Apakah sering merasa mengantuk di siang hari meskipun cukup tidur? (Ya/Tidak)
     6. Apakah kuku tangan terlihat pucat atau berbentuk sendok? (Ya/Tidak)
     7. Apakah sering mengalami sesak napas saat aktivitas ringan? (Ya/Tidak)
   - Tombol "Kirim & Analisis Tingkat Keparahan" di bagian bawah form.
4. **Proses Klasifikasi Tahap 2 (Severity Triage MLP)**:
   - Animasi loading "Menghitung tingkat keparahan anemia..."
5. **Layar Hasil & Rekomendasi**:
   - Status Klasifikasi Risiko dengan visualisasi warna kontras:
     - **Hijau**: No Anemia (Confidence Score: XX%)
     - **Kuning**: Anemia Ringan (Confidence Score: XX%)
     - **Oranye**: Anemia Sedang (Confidence Score: XX%)
     - **Merah**: Anemia Berat (Confidence Score: XX%)
   - **Rekomendasi Otomatis**: Langkah-langkah konkrit yang harus dilakukan (misal: konsumsi TTD untuk anemia ringan, rujukan ke faskes untuk anemia berat).
   - Tombol "Simpan Skrining".

#### **Tab 4: Prioritas (Triage Alert List)**
- Menampilkan daftar siswi dengan hasil screening **Anemia Berat** yang belum ditindaklanjuti secara medis.
- Fitur centang "Sudah dirujuk ke Puskesmas" untuk memperbarui status lokal.

#### **Tab 5: Profil & Sinkronisasi**
- Informasi Kader (Nama, Asal Sekolah).
- **Widget Sinkronisasi Data & Dokumentasi Lokal**:
  - Tombol manual "Sinkronkan Sekarang" (sebagai alternatif jika auto-sync WorkManager ditunda).
  - Statistik penyimpanan lokal: Jumlah foto tersimpan, kapasitas memori yang terpakai.
  - *Catatan Kebijakan*: Foto tidak dihapus secara otomatis setelah sinkronisasi agar Kader tetap memiliki dokumentasi lokal yang utuh.
- Pengaturan Aplikasi & Tombol Keluar (Logout).

---

### 2.3. Role: TBMs (Technical Blood Monitor)
TBMs bertanggung jawab memasukkan nilai Hb hasil uji laboratorium Quik-Check Hb sebagai *gold standard*.

#### **Tab 1: Beranda / Input Hb**
- **Kolom Pencarian ID Anonim**: Cari ID siswi (misal `AV-0010`).
- **Form Input Hb**:
  - Setelah ID dipilih, tampilkan info skrining awal (Tanggal & deteksi konjungtiva).
  - Field input nilai hemoglobin (Format angka, misal `11.5` g/dL).
  - Tombol "Simpan Uji Hb".
- *Data Hb ini otomatis terikat ke ID Anonim siswi tersebut di database lokal untuk kebutuhan pelabelan model di masa mendatang.*

#### **Tab 2: Riwayat Input Hb**
- Daftar ID anonim yang telah diinput nilai Hb-nya beserta status sinkronisasi.

#### **Tab 3: Profil**
- Profil akun TBM dan status sinkronisasi database offline ke server.

---

### 2.4. Role: Pihak Sekolah & Admin/Tim IT (Monitoring & Dashboard)
Admin dan Pihak Sekolah berfokus pada hasil agregat untuk tindakan intervensi sekolah.

#### **Tab 1: Dashboard Monitoring**
- **Ringkasan Statistik (KPI Cards)**:
  - Total siswi yang sudah diskrining.
  - Distribusi status: % No Anemia, % Ringan, % Sedang, % Berat.
- **Grafik Sebaran Risiko**: Chart lingkaran (Pie Chart) sebaran risiko anemia.
- **Grafik Tren Per Sesi**: Chart batang (Bar Chart) perbandingan data anemia antar sesi (Baseline vs Monitoring vs Evaluasi) untuk melihat apakah program intervensi berhasil menurunkan angka anemia.
- **Daftar Prioritas Utama**: Daftar siswi anemia berat teratas yang butuh penanganan segera.

#### **Tab 2: Riwayat Siswi (Longitudinal Track)**
- Pencarian ID Anonim.
- Ketika ID dipilih, tampilkan **Grafik Perkembangan Kondisi**:
  - Grafik garis (Line Chart) tren tingkat risiko atau kadar Hb dari waktu ke waktu berdasarkan sesi skrining.
  - Riwayat lengkap tes konjungtiva dan kuesioner klinis per sesi.

#### **Tab 3: Prioritas (Triage Notifikasi)**
- Daftar notifikasi real-time jika ada temuan kasus **Anemia Berat** di sekolah tersebut.
- Action: Tombol "Hubungi Puskesmas" atau "Kirim Rujukan".

#### **Tab 4 (Khusus Admin/Tim IT): Admin Panel**
- **Model Fine-Tuning**: Status akurasi model saat ini, jumlah data latih baru (pasangan foto + nilai Hb Quik-Check) yang siap dikirim untuk retraining.
- **Manajemen User**: Tambah/nonaktifkan akun Kader dan TBMs.

#### **Tab 5: Profil**
- Info akun sekolah/admin, pilihan sekolah yang dimonitor (jika admin multi-sekolah), dan tombol logout.

---

## 3. Aturan Desain Antarmuka (UI/UX) Frontend

Untuk memberikan kesan premium dan meyakinkan secara medis, desain frontend React Native harus mematuhi panduan visual berikut:

### 3.1. Palet Warna & Tema (Premium Medical Theme)
Aplikasi menggunakan **Dark Mode friendly** dengan pendekatan HSL tailored colors untuk tingkat keparahan:
- **Base Background**: White `#FFFFFF` / Soft Grey `#F8F9FA` (Light) & Sleek Slate `#121212` (Dark).
- **Primary Brand Color**: Deep Teal `#0D9488` atau Crimson Red `#DC2626` (sebagai aksen kepedulian anemia).
- **Severity Colors**:
  - 🟢 **No Anemia / Sehat**: Emerald Green (`HSL(142, 70%, 45%)`)
  - 🟡 **Anemia Ringan**: Amber Yellow (`HSL(45, 93%, 47%)`)
  - 🟠 **Anemia Sedang**: Dark Orange (`HSL(24, 94%, 50%)`)
  - 🔴 **Anemia Berat**: Crimson Red (`HSL(0, 84%, 60%)`)

### 3.2. Tipografi & Mikro-Animasi
- **Font**: Menggunakan Google Fonts **Outfit** atau **Inter** untuk tampilan modern dan tingkat keterbacaan yang tinggi di layar handphone kader.
- **Mikro-Animasi**:
  - Efek transisi antar step kuesioner klinis (slide in-out).
  - Efek loading berdenyut (pulse animation) saat AI memproses gambar konjungtiva.
  - Efek centang sukses ketika sinkronisasi selesai.

### 3.3. Offline State & Sinkronisasi UI
- **Banner Koneksi**: Banner tipis di atas layar "Mode Offline Aktif - Data Disimpan Aman di Perangkat" jika koneksi internet terputus.
- **Sync Badge**: Tampilan awan warna-warni pada setiap riwayat skrining (seperti referensi gambar) untuk meyakinkan pengguna bahwa data mereka tidak hilang dan siap dikirim ketika ada sinyal.

---

## 4. Rencana Validasi Frontend

1. **Uji Responsivitas Layar**: Memastikan tata letak tombol kamera dan form klinis pas di berbagai ukuran layar android kader (mulai dari HP entry-level layar kecil hingga tablet).
2. **Kamera Overlay & Capture Simulation**: Pengujian apakah overlay panduan mata tidak menghalangi preview kamera dan flash aktif saat pengambilan gambar.
3. **Simulasi Offline-First Storage**: Menjalankan skenario tanpa internet, melakukan skrining, memeriksa apakah riwayat tersimpan dengan status *Pending* (Awan Kuning), lalu menyalakan internet untuk melihat transisi otomatis ke *Tersinkronisasi* (Awan Hijau).
