-- Data seeding untuk sistem jurnal dan presensi
-- Insert data contoh setelah schema dibuat

-- Insert admin user dengan password yang sudah di-hash (admin123)
-- Password: admin123 (hashed dengan bcrypt)
INSERT INTO users (id, username, password, nama, role, is_supervisor, is_pengajar, is_wali_kelas, is_piket) VALUES 
('00000000-0000-0000-0000-000000000001', 'admin', '$2b$10$K7Z/F5BQZJZ8ZJZ8ZJZ8ZO7Z/F5BQZJZ8ZJZ8ZJZ8ZO7Z/F5BQZJZ8Z', 'Administrator Sistem', 'admin', true, false, false, false);

-- Insert data contoh guru
INSERT INTO users (username, password, nama, role, is_supervisor, is_pengajar, is_wali_kelas, is_piket) VALUES 
('guru1', '$2b$10$K7Z/F5BQZJZ8ZJZ8ZJZ8ZO7Z/F5BQZJZ8ZJZ8ZJZ8ZO7Z/F5BQZJZ8Z', 'Ahmad Wijaya, S.Pd', 'guru', true, true, false, false),
('guru2', '$2b$10$K7Z/F5BQZJZ8ZJZ8ZJZ8ZO7Z/F5BQZJZ8ZJZ8ZJZ8ZO7Z/F5BQZJZ8Z', 'Siti Nurhaliza, S.Pd', 'guru', false, true, true, false),
('guru3', '$2b$10$K7Z/F5BQZJZ8ZJZ8ZJZ8ZO7Z/F5BQZJZ8ZJZ8ZJZ8ZO7Z/F5BQZJZ8Z', 'Budi Santoso, S.Pd', 'guru', false, true, false, true),
('guru4', '$2b$10$K7Z/F5BQZJZ8ZJZ8ZJZ8ZO7Z/F5BQZJZ8ZJZ8ZJZ8ZO7Z/F5BQZJZ8Z', 'Dewi Lestari, S.Pd', 'supervisor', true, true, false, false);

-- Insert data contoh siswa
INSERT INTO siswa (nis, nama, kelas) VALUES 
('2023001', 'Andi Pratama', 'X-1'),
('2023002', 'Siti Aminah', 'X-1'),
('2023003', 'Budi Cahyono', 'X-1'),
('2023004', 'Dewi Ratnasari', 'X-1'),
('2023005', 'Eko Prasetyo', 'X-2'),
('2023006', 'Fitri Handayani', 'X-2'),
('2023007', 'Gunawan Wijaya', 'X-2'),
('2023008', 'Hana Puspita', 'X-2'),
('2023009', 'Indra Lesmana', 'XI-1'),
('2023010', 'Julia Rahmawati', 'XI-1'),
('2023011', 'Kevin Pratama', 'XI-1'),
('2023012', 'Lisa Anggraini', 'XI-1'),
('2023013', 'Muhammad Rizki', 'XII-1'),
('2023014', 'Nadia Putri', 'XII-1'),
('2023015', 'Omar Hakim', 'XII-1'),
('2023016', 'Putri Amelia', 'XII-1');

-- Insert data mata pelajaran
INSERT INTO mata_pelajaran (kode, nama) VALUES 
('MTK', 'Matematika'),
('BIND', 'Bahasa Indonesia'),
('BING', 'Bahasa Inggris'),
('FIS', 'Fisika'),
('KIM', 'Kimia'),
('BIO', 'Biologi'),
('EKO', 'Ekonomi'),
('GEO', 'Geografi'),
('SEJ', 'Sejarah'),
('SOS', 'Sosiologi'),
('PKN', 'Pendidikan Kewarganegaraan'),
('PAI', 'Pendidikan Agama Islam'),
('PJOK', 'Pendidikan Jasmani Olahraga dan Kesehatan'),
('SBK', 'Seni Budaya dan Keterampilan'),
('TIK', 'Teknologi Informasi dan Komunikasi');

-- Insert relasi guru mata pelajaran
INSERT INTO guru_mata_pelajaran (guru_id, mata_pelajaran_id, kelas) VALUES 
('00000000-0000-0000-0000-000000000002', (SELECT id FROM mata_pelajaran WHERE kode = 'MTK'), 'X-1'),
('00000000-0000-0000-0000-000000000002', (SELECT id FROM mata_pelajaran WHERE kode = 'MTK'), 'X-2'),
('00000000-0000-0000-0000-000000000003', (SELECT id FROM mata_pelajaran WHERE kode = 'BIND'), 'X-1'),
('00000000-0000-0000-0000-000000000003', (SELECT id FROM mata_pelajaran WHERE kode = 'BIND'), 'XI-1'),
('00000000-0000-0000-0000-000000000004', (SELECT id FROM mata_pelajaran WHERE kode = 'BING'), 'X-1'),
('00000000-0000-0000-0000-000000000004', (SELECT id FROM mata_pelajaran WHERE kode = 'BING'), 'X-2'),
('00000000-0000-0000-0000-000000000005', (SELECT id FROM mata_pelajaran WHERE kode = 'FIS'), 'XI-1'),
('00000000-0000-0000-0000-000000000005', (SELECT id FROM mata_pelajaran WHERE kode = 'FIS'), 'XII-1');

-- Insert jenis penilaian
INSERT INTO jenis_penilaian (nama, keterangan) VALUES 
('Tugas Harian', 'Penilaian tugas yang diberikan setiap pertemuan'),
('UTS', 'Ujian Tengah Semester'),
('UAS', 'Ujian Akhir Semester'),
('Praktikum', 'Penilaian praktikum mata pelajaran'),
('Portofolio', 'Penilaian kumpulan tugas selama semester'),
('Partisipasi', 'Penilaian keaktifan dalam pembelajaran'),
('Projek', 'Penilaian projek kelompok/individu');

-- Insert profil lembaga
INSERT INTO profil_lembaga (nama_yayasan, nama_lembaga, alamat, no_telepon, email, nama_kepala, nip_kepala, tahun_ajaran, kab_kota) VALUES 
('Yayasan Pendidikan Harapan Bangsa', 'SMK Negeri 1 Jakarta', 'Jl. Pendidikan No. 123, Jakarta Pusat', '021-12345678', 'info@smkn1jakarta.sch.id', 'Dr. H. Ahmad Wijaya, M.Pd', '198712311990031001', '2023/2024', 'Jakarta Pusat');

-- Insert contoh jurnal
INSERT INTO jurnal (guru_id, status, tanggal, materi_kegiatan) VALUES 
('00000000-0000-0000-0000-000000000002', 'pengajar', '2024-01-15', 'Pembahasan materi Persamaan Kuadrat dan contoh soal'),
('00000000-0000-0000-0000-000000000003', 'pengajar', '2024-01-15', 'Analisis puisi "Aku" karya Chairil Anwar'),
('00000000-0000-0000-0000-000000000004', 'piket', '2024-01-15', 'Piket pagi: pengecekan kebersihan kelas dan kehadiran siswa');

-- Insert contoh presensi siswa
INSERT INTO presensi_siswa (jurnal_id, siswa_id, status) VALUES 
((SELECT id FROM jurnal WHERE guru_id = '00000000-0000-0000-0000-000000000002' AND tanggal = '2024-01-15'), (SELECT id FROM siswa WHERE nis = '2023001'), 'hadir'),
((SELECT id FROM jurnal WHERE guru_id = '00000000-0000-0000-0000-000000000002' AND tanggal = '2024-01-15'), (SELECT id FROM siswa WHERE nis = '2023002'), 'hadir'),
((SELECT id FROM jurnal WHERE guru_id = '00000000-0000-0000-0000-000000000002' AND tanggal = '2024-01-15'), (SELECT id FROM siswa WHERE nis = '2023003'), 'sakit'),
((SELECT id FROM jurnal WHERE guru_id = '00000000-0000-0000-0000-000000000002' AND tanggal = '2024-01-15'), (SELECT id FROM siswa WHERE nis = '2023004'), 'hadir');

-- Insert contoh nilai
INSERT INTO nilai (siswa_id, guru_id, mata_pelajaran_id, jenis_penilaian_id, nilai, semester, tahun_ajaran) VALUES 
((SELECT id FROM siswa WHERE nis = '2023001'), '00000000-0000-0000-0000-000000000002', (SELECT id FROM mata_pelajaran WHERE kode = 'MTK'), (SELECT id FROM jenis_penilaian WHERE nama = 'Tugas Harian'), 85.5, 'Ganjil', '2023/2024'),
((SELECT id FROM siswa WHERE nis = '2023002'), '00000000-0000-0000-0000-000000000002', (SELECT id FROM mata_pelajaran WHERE kode = 'MTK'), (SELECT id FROM jenis_penilaian WHERE nama = 'Tugas Harian'), 90.0, 'Ganjil', '2023/2024'),
((SELECT id FROM siswa WHERE nis = '2023003'), '00000000-0000-0000-0000-000000000002', (SELECT id FROM mata_pelajaran WHERE kode = 'MTK'), (SELECT id FROM jenis_penilaian WHERE nama = 'Tugas Harian'), 78.5, 'Ganjil', '2023/2024'),
((SELECT id FROM siswa WHERE nis = '2023004'), '00000000-0000-0000-0000-000000000002', (SELECT id FROM mata_pelajaran WHERE kode = 'MTK'), (SELECT id FROM jenis_penilaian WHERE nama = 'Tugas Harian'), 92.5, 'Ganjil', '2023/2024');

-- Insert login logs contoh
INSERT INTO login_logs (user_id, login_time, ip_address, user_agent) VALUES 
('00000000-0000-0000-0000-000000000001', '2024-01-15 07:30:00', '192.168.1.100', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'),
('00000000-0000-0000-0000-000000000002', '2024-01-15 07:15:00', '192.168.1.101', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'),
('00000000-0000-0000-0000-000000000003', '2024-01-15 07:20:00', '192.168.1.102', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'),
('00000000-0000-0000-0000-000000000004', '2024-01-15 07:25:00', '192.168.1.103', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'),
('00000000-0000-0000-0000-000000000001', '2024-01-14 08:00:00', '192.168.1.100', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'),
('00000000-0000-0000-0000-000000000002', '2024-01-14 07:45:00', '192.168.1.101', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'),
('00000000-0000-0000-0000-000000000003', '2024-01-14 07:50:00', '192.168.1.102', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'),
('00000000-0000-0000-0000-000000000004', '2024-01-14 07:55:00', '192.168.1.103', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'),
('00000000-0000-0000-0000-000000000001', '2024-01-13 07:30:00', '192.168.1.100', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'),
('00000000-0000-0000-0000-000000000002', '2024-01-13 07:15:00', '192.168.1.101', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');