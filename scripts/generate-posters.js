const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const OUTPUT_DIR = path.join(__dirname, '..', 'public', 'poster');

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

const posters = [
  {
    id: '01-senin-moji-goi',
    day: 'SENIN',
    category: 'MOJI & GOI • KANJI & KOSAKATA',
    categoryJp: '文字・語彙',
    headline: 'Soal Kanji JFT A2 yang Paling Sering Bikin Terkecoh!',
    subhead: 'Bentuk kanji di bawah ini mirip banget. Hati-hati jangan sampai salah pilih!',
    tag: 'JEBAKAN VISUAL KANJI',
    themeColor: '#dc2626',
    themeBg: 'linear-gradient(135deg, #fff5f5 0%, #ffffff 50%, #fef2f2 100%)',
    badgeBg: '#fee2e2',
    badgeText: '#991b1b',
    questionBox: `
      <div style="font-size: 20px; font-weight: 700; color: #78716c; margin-bottom: 12px; text-transform: uppercase; letter-spacing: 1px;">
        Pilih kanji yang tepat untuk melengkapi kalimat:
      </div>
      <div style="font-size: 52px; font-weight: 900; color: #1c1917; font-family: 'Noto Sans JP', 'Hiragino Sans', sans-serif; line-height: 1.3;">
        毎朝、<span style="display: inline-block; min-width: 140px; padding: 2px 20px; background: #fee2e2; border: 3px dashed #dc2626; border-radius: 16px; color: #dc2626; text-align: center;">（　）</span>を 飲みます。
      </div>
      <div style="margin-top: 14px; font-size: 20px; color: #78716c; font-style: italic;">
        Arti: "Setiap pagi, minum [ ... ]."
      </div>
    `,
    options: [
      { key: 'A', text: '水', furigana: 'みず', meaning: 'Air (Mizu)', isHighlight: true },
      { key: 'B', text: '氷', furigana: 'こおり', meaning: 'Es (Koori)' },
      { key: 'C', text: '永', furigana: 'ながい', meaning: 'Abadi (Nagai)' },
      { key: 'D', text: '木', furigana: 'き', meaning: 'Pohon (Ki)' }
    ],
    hint: '🔍 Perhatikan posisi dan keberadaan titik pada kanji!',
    cta: 'Tulis huruf pilihanmu (A / B / C / D) di komentar!',
    caption: `Soal Kanji & Kosakata JFT A2 yang sering bikin orang terkecoh!

Hati-hati, huruf kanji di bawah ini bentuknya mirip banget. Jangan sampai salah pilih ya mina-san!

毎朝、（ ）を 飲みます。

A. 水 (みず)
B. 氷 (こおり)
C. 永 (ながい)
D. 木 (き)

Manakah kanji yang tepat untuk melengkapi kalimat di atas? Tulis huruf A, B, C, atau D di kolom komentar ya!

(Kunci jawaban & link tes CBT gratis ada di komentar paling atas)`,
    comment: `Jawaban yang benar: A. 水 (みず - Mizu = Air)

Penjelasan: Opsi B (氷 - Es) punya titik tambahan di kiri atas, sedangkan C (永) punya titik di atas, dan D (木 - Pohon) tidak ada titik sama sekali. Soal CBT asli sering memunculkan kanji visual mirip seperti ini!

Biar makin terbiasa membedakan kanji dan kosakata cepat dalam sistem CBT Prometric, coba tes kemampuan kamu gratis di sini:
https://kondangsensei.my.id`
  },
  {
    id: '02-selasa-bunpou',
    day: 'SELASA',
    category: 'BUNPOU • TATA BAHASA & EKSPRESI',
    categoryJp: '文法・会話表現',
    headline: 'Paling Sering Bikin Peserta Salah: Menolak Ajakan Halus!',
    subhead: 'Bahasa Jepang kerja mengutamakan kesopanan. Mana jawaban yang paling alami?',
    tag: 'POLA KALIMAT KERJA JEPANG',
    themeColor: '#ea580c',
    themeBg: 'linear-gradient(135deg, #fff7ed 0%, #ffffff 50%, #fff1f2 100%)',
    badgeBg: '#ffedd5',
    badgeText: '#9a3412',
    questionBox: `
      <div style="font-size: 20px; font-weight: 700; color: #78716c; margin-bottom: 12px; text-transform: uppercase; letter-spacing: 1px;">
        Lengkapi percakapan penolakan halus:
      </div>
      <div style="background: #fafaf9; border: 2px solid #e7e5e4; border-radius: 20px; padding: 24px; font-family: 'Noto Sans JP', sans-serif; font-size: 32px; font-weight: 800; color: #1c1917; line-height: 1.6;">
        <div style="display: flex; gap: 16px; align-items: baseline;">
          <span style="color: #dc2626; font-weight: 900;">A:</span>
          <span>「今晩、一緒に ごはんを 食べませんか。」</span>
        </div>
        <div style="display: flex; gap: 16px; align-items: baseline; margin-top: 14px;">
          <span style="color: #ea580c; font-weight: 900;">B:</span>
          <span>「すみません。今晩は ちょっと…<span style="padding: 2px 14px; background: #ffedd5; border: 3px dashed #ea580c; border-radius: 12px; color: #ea580c;">（　）</span>。」</span>
        </div>
      </div>
    `,
    options: [
      { key: 'A', text: '食べません', furigana: 'tabemasen', meaning: 'Terlalu kasar' },
      { key: 'B', text: '忙しいです', furigana: 'isogashii desu', meaning: 'Kurang sopan' },
      { key: 'C', text: '都合が 悪いです', furigana: 'tsugou ga warui', meaning: 'Penolakan halus resmi', isHighlight: true },
      { key: 'D', text: '食べたいです', furigana: 'tabetai desu', meaning: 'Bertolak belakang' }
    ],
    hint: '💡 Ungkapan 『都合が悪い』 adalah standar penolakan sopan di dunia kerja Jepang!',
    cta: 'Jawaban mana yang benar? Tulis di komentar ya!',
    caption: `Soal Tata Bahasa JFT-Basic A2 yang paling sering bikin peserta LULUS PALSUS!

Perhatikan penggunaan pola kalimat saat menolak ajakan secara halus:

A: 「今晩、一緒に ごはんを 食べませんか。」
B: 「すみません。今晩は ちょっと…（ ）。」

A. 食べません
B. 忙しいです
C. 都合が 悪いです
D. 食べたいです

Jawaban mana yang paling alami sesuai kultur budaya kerja Jepang? Jawab di komentar!

(Kunci jawaban ada di kolom komentar)`,
    comment: `Jawaban yang benar: C. 都合が 悪いです (Tsugou ga warui desu)

Penjelasan: Dalam JFT A2, penolakan halus menggunakan pola 『都合が悪い』 atau cukup berhenti di kata 『ちょっと…』. Mengucapkan Tabemasen (Opsi A) terlalu kasar dan tidak alami dalam bahasa Jepang sehari-hari.

Mau tahu seberapa siap kamu menghadapi pola tata bahasa JFT A2 lainnya? Coba Mini Tryout gratis ber-timer di:
https://kondangsensei.my.id`
  },
  {
    id: '03-rabu-choukai',
    day: 'RABU',
    category: 'CHOUKAI • LISTENING & AUDIO CBT',
    categoryJp: '聴解テスト',
    headline: 'Kenapa Banyak Peserta GAGAL di Sesi Choukai JFT A2?',
    subhead: 'Audio ujian resmi cuma diputar 2x dan ada jebakan urutan kata waktu!',
    tag: 'JEBAKAN WAKTU PROMETRIC',
    themeColor: '#0284c7',
    themeBg: 'linear-gradient(135deg, #f0f9ff 0%, #ffffff 50%, #fff1f2 100%)',
    badgeBg: '#e0f2fe',
    badgeText: '#0369a1',
    questionBox: `
      <div style="display: flex; align-items: center; justify-content: space-between; background: #0f172a; color: white; border-radius: 18px; padding: 16px 24px; margin-bottom: 20px;">
        <div style="display: flex; align-items: center; gap: 14px;">
          <div style="width: 44px; height: 44px; border-radius: 50%; background: #dc2626; display: flex; align-items: center; justify-content: center; font-size: 20px;">🔊</div>
          <div>
            <div style="font-size: 14px; color: #94a3b8; font-weight: 700; text-transform: uppercase;">Audio CBT Simulasi Prometric</div>
            <div style="font-size: 20px; font-weight: 900; color: #38bdf8;">Track #3 • Putaran Ke-1 dari 2</div>
          </div>
        </div>
        <div style="background: #dc2626; color: white; padding: 6px 14px; border-radius: 10px; font-size: 14px; font-weight: 900; letter-spacing: 1px;">
          ⏱ 60 MENIT CBT
        </div>
      </div>
      <div style="background: #f8fafc; border: 2px solid #cbd5e1; border-radius: 18px; padding: 22px; font-size: 22px; line-height: 1.5; color: #1e293b;">
        <div style="color: #64748b; font-size: 16px; font-weight: 800; text-transform: uppercase; margin-bottom: 8px;">Transkrip Audio Pembicara:</div>
        <div style="font-style: italic; color: #0f172a; font-weight: 700;">
          "Hari ini hujan, jadi rapat yang tadinya jam 2 diundur jadi besok jam 10 di lantai 2."
        </div>
        <div style="margin-top: 14px; padding-top: 12px; border-top: 1px dashed #cbd5e1; font-weight: 900; color: #dc2626; font-size: 24px;">
          Pertanyaan: Rapat dilaksanakan kapan dan jam berapa?
        </div>
      </div>
    `,
    options: [
      { key: 'A', text: 'Hari ini jam 14:00', furigana: 'Jebakan kata pertama', meaning: 'Salah' },
      { key: 'B', text: 'Besok jam 10:00', furigana: 'Jadwal revisi terbaru', meaning: 'Benar', isHighlight: true },
      { key: 'C', text: 'Besok jam 14:00', furigana: 'Kombinasi salah', meaning: 'Salah' },
      { key: 'D', text: 'Hari ini jam 10:00', furigana: 'Kombinasi salah', meaning: 'Salah' }
    ],
    hint: '🎯 Trik: Fokus pada kata kunci waktu terbaru (besok / diundur / jadi)!',
    cta: 'Awas terkecoh! Tulis jawabanmu di komentar!',
    caption: `Kenapa banyak peserta JFT A2 GAGAL di sesi Choukai (Listening)?

Karena audio di ujian Prometric cuma diputar 2 kali dan opsi jawabannya sering pakai kata jebakan waktu!

Contoh Soal Jebakan Choukai:
Dalam percakapan, si pembicara bilang: "Hari ini hujan, jadi rapat yang tadinya jam 2 diundur jadi besok jam 10 di lantai 2."

Lalu pertanyaannya: "Rapat dilaksanakan kapan dan jam berapa?"

Banyak yang terkecoh memilih "Hari ini jam 2" karena kata itu diucapkan paling awal dalam audio!

Trik Lolos Choukai:
1. Fokus pada kata kunci waktu terbaru (besok/diundur/jadi).
2. Latihan mendengar audio sambil melihat pengukur waktu (timer) berjalan.`,
    comment: `Rasakan sensasi ujian Choukai asli dengan pemutar audio otomatis dan timer 15 menit di KondangSensei secara gratis:
https://kondangsensei.my.id`
  },
  {
    id: '04-kamis-dokkai',
    day: 'KAMIS',
    category: 'DOKKAI • MEMBACA TEKS & PENGUMUMAN',
    categoryJp: '読解テスト',
    headline: 'Soal Dokkai JFT A2: Teliti Detail Syarat & Pengecualian!',
    subhead: 'Baca pengumuman perpustakaan ini dalam waktu 30 detik. Jangan sampai terjebak!',
    tag: 'MEMBACA PENGUMUMAN CBT',
    themeColor: '#059669',
    themeBg: 'linear-gradient(135deg, #f0fdf4 0%, #ffffff 50%, #fff1f2 100%)',
    badgeBg: '#dcfce7',
    badgeText: '#166534',
    questionBox: `
      <div style="background: #ffffff; border: 3px solid #10b981; border-radius: 20px; padding: 22px; font-family: 'Noto Sans JP', sans-serif; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.1);">
        <div style="background: #10b981; color: white; display: inline-block; padding: 4px 16px; border-radius: 8px; font-size: 16px; font-weight: 900; margin-bottom: 12px;">
          【図書館（としょかん）からのお知らせ】
        </div>
        <div style="font-size: 26px; font-weight: 800; color: #1f2937; line-height: 1.6;">
          休館日（きゅうかんび）：毎週月曜日<br/>
          <span style="font-size: 22px; color: #dc2626; font-weight: 900;">
            ※ただし、月曜日が 祝日（しゅくじつ）の 場合は 開いています。翌日の 火曜日が 休みに なります。
          </span>
        </div>
      </div>
      <div style="margin-top: 16px; font-size: 24px; font-weight: 900; color: #111827;">
        Pertanyaan: Jika hari Senin adalah hari libur nasional (祝日), apakah perpustakaan buka?
      </div>
    `,
    options: [
      { key: 'A', text: 'Buka (開いています)', furigana: 'Akete imasu', meaning: 'Pengecualian libur', isHighlight: true },
      { key: 'B', text: 'Tutup (休みになります)', furigana: 'Yasumi ni narimasu', meaning: 'Salah' },
      { key: 'C', text: 'Buka setengah hari', furigana: 'Han-nichi', meaning: 'Tidak disebut' },
      { key: 'D', text: 'Tidak dijelaskan', furigana: 'Wakaranai', meaning: 'Salah' }
    ],
    hint: '📌 Perhatikan kata kunci 『ただし』 (namun/kecuali) dan 『翌日の火曜日』!',
    cta: 'Jawabanmu A, B, C, atau D? Tulis di bawah ya!',
    caption: `Soal Dokkai (Membaca Teks) JFT A2: Jangan Sampai Terjebak Detail Kecil!

Coba baca pengumuman di bawah ini dalam waktu 30 detik:

【図書館（としょかん）からのお知らせ】
休館日（きゅうかんび）：毎週月曜日
※ただし、月曜日が 祝日（しゅくじつ）の 場合は 開いています。翌日の 火曜日が 休みに なります。

Pertanyaan: Jika hari Senin adalah hari libur nasional (祝日), apakah perpustakaan buka?

A. Buka
B. Tutup
C. Buka setengah hari
D. Tidak dijelaskan

Tulis jawaban kamu di bawah!
(Kunci jawaban ada di kolom komentar)`,
    comment: `Jawaban yang benar: A. Buka (開いています - Akete imasu)

Penjelasan: Pengumuman menyebutkan perpustakaan tutup setiap Senin, KECUALI jika Senin itu hari libur nasional (祝日), maka tetap buka dan liburnya diganti ke hari Selasa (翌日の火曜日). Soal Dokkai JFT A2 penuh dengan syarat/pengecualian seperti ini!

Latihan baca teks Dokkai berdurasi waktu penuh di simulasi CBT KondangSensei:
https://kondangsensei.my.id`
  },
  {
    id: '05-jumat-aisatsu',
    day: 'JUMAT',
    category: 'AISATSU & KEIGO • ETIKA BUDAYA JEPANG',
    categoryJp: 'マナー・挨拶表現',
    headline: 'Etika Bertamu di Jepang yang Sering Bikin Salah Ucap!',
    subhead: 'Soal JFT A2 menguji situasi nyata dalam kehidupan sehari-hari di Jepang.',
    tag: 'ETIKA BERTAMU JEPANG',
    themeColor: '#7c3aed',
    themeBg: 'linear-gradient(135deg, #faf5ff 0%, #ffffff 50%, #fff1f2 100%)',
    badgeBg: '#f3e8ff',
    badgeText: '#6b21a8',
    questionBox: `
      <div style="font-size: 20px; font-weight: 700; color: #78716c; margin-bottom: 12px; text-transform: uppercase; letter-spacing: 1px;">
        Situasi Nyata Kehidupan di Jepang:
      </div>
      <div style="background: #faf5ff; border: 2px solid #d8b4fe; border-radius: 20px; padding: 24px; font-size: 26px; font-weight: 800; color: #3b0764; line-height: 1.5;">
        Saat kamu bertamu ke rumah teman / atasan di Jepang dan disajikan minuman / teh, ungkapan apa yang paling tepat diucapkan tepat sebelum minum?
      </div>
    `,
    options: [
      { key: 'A', text: 'いただきます', furigana: 'Itadakimasu', meaning: 'Makan / Minum disajikan orang', isHighlight: true },
      { key: 'B', text: 'ごちそうさまでした', furigana: 'Gochisousama deshita', meaning: 'Setelah selesai minum' },
      { key: 'C', text: '邪魔します', furigana: 'Jama shimasu', meaning: 'Saat melangkah masuk rumah' },
      { key: 'D', text: '失礼します', furigana: 'Shitsurei shimasu', meaning: 'Saat masuk / permisi' }
    ],
    hint: '🍵 Itadakimasu digunakan saat hendak makan MAUPUN minum hidangan!',
    cta: 'Ayo jawab! Jangan sampai salah sebut saat bertamu!',
    caption: `Soal Etika & Ungkapan Bahasa Jepang (JFT-Basic A2) yang sering bikin bingung!

Saat kamu bertamu ke rumah teman/atasan di Jepang dan disajikan minuman, ungkapan apa yang paling tepat diucapkan sebelum minum?

A. いただきます
B. ごちそうさまでした
C. 邪魔します (じゃまします)
D. 失礼します (しつれいします)

Ayo jawab, jangan sampai tertukar antara ungkapan makan dan bertamu!
(Kunci jawaban ada di komentar)`,
    comment: `Jawaban yang benar: A. いただきます (Itadakimasu)

Penjelasan: Itadakimasu digunakan sebelum makan ATAU minum disajikan oleh orang lain. Jama shimasu/Shitsurei shimasu diucapkan saat melangkah masuk ke dalam rumah.

JFT A2 menguji pemahaman situasi kehidupan nyata di Jepang. Uji pemahaman materi JFT A2 kamu secara menyeluruh lewat Mini Tryout Gratis:
https://kondangsensei.my.id`
  },
  {
    id: '06-sabtu-grafik',
    day: 'SABTU',
    category: 'KAITSU / GRAFIK • JADWAL & PENGUMUMAN CBT',
    categoryJp: '情報検索・図表問題',
    headline: 'Soal Model Jadwal Bus CBT JFT-Basic A2!',
    subhead: 'Di ujian CBT resmi, kamu harus cepat memindai tabel rute dalam durasi waktu ketat.',
    tag: 'SIMULASI TABEL & JADWAL BUS',
    themeColor: '#d97706',
    themeBg: 'linear-gradient(135deg, #fffbeb 0%, #ffffff 50%, #fff1f2 100%)',
    badgeBg: '#fef3c7',
    badgeText: '#92400e',
    questionBox: `
      <div style="background: #ffffff; border: 2px solid #e5e7eb; border-radius: 18px; padding: 18px; font-size: 19px; color: #1f2937;">
        <div style="display: flex; gap: 12px; margin-bottom: 12px; font-weight: 800; color: #dc2626;">
          <span>📍 Kondisi: Hari ini hari <strong style="text-decoration: underline;">RABU</strong>, pukul 09:50.</span>
          <span>🎯 Tujuan: Stasiun ➔ Rumah Sakit</span>
        </div>
        <table style="width: 100%; border-collapse: collapse; font-size: 17px; text-align: left;">
          <thead>
            <tr style="background: #f3f4f6; color: #374151;">
              <th style="padding: 10px; border: 1px solid #d1d5db;">Jalur Bus</th>
              <th style="padding: 10px; border: 1px solid #d1d5db;">Waktu Berangkat</th>
              <th style="padding: 10px; border: 1px solid #d1d5db;">Keterangan Rute</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style="padding: 8px 10px; border: 1px solid #d1d5db; font-weight: bold;">Jalur A</td>
              <td style="padding: 8px 10px; border: 1px solid #d1d5db;">10:00</td>
              <td style="padding: 8px 10px; border: 1px solid #d1d5db; color: #dc2626;">Tidak berhenti di Rumah Sakit</td>
            </tr>
            <tr style="background: #fef2f2; font-weight: bold;">
              <td style="padding: 8px 10px; border: 1px solid #d1d5db; color: #dc2626;">Jalur B</td>
              <td style="padding: 8px 10px; border: 1px solid #d1d5db; color: #dc2626;">10:15</td>
              <td style="padding: 8px 10px; border: 1px solid #d1d5db; color: #16a34a;">Langsung menuju Rumah Sakit</td>
            </tr>
            <tr>
              <td style="padding: 8px 10px; border: 1px solid #d1d5db; font-weight: bold;">Jalur C</td>
              <td style="padding: 8px 10px; border: 1px solid #d1d5db;">10:05</td>
              <td style="padding: 8px 10px; border: 1px solid #d1d5db; color: #6b7280;">Lewat RS (Khusus Hari Minggu)</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div style="margin-top: 14px; font-size: 23px; font-weight: 900; color: #111827;">
        Pertanyaan: Bus mana yang WAJIB kamu naiki?
      </div>
    `,
    options: [
      { key: 'A', text: 'Jalur A', furigana: 'Jam 10:00', meaning: 'Tidak lewat RS' },
      { key: 'B', text: 'Jalur B', furigana: 'Jam 10:15', meaning: 'Tepat & Langsung', isHighlight: true },
      { key: 'C', text: 'Jalur C', furigana: 'Jam 10:05', meaning: 'Hanya Minggu' },
      { key: 'D', text: 'Semua jalur bisa', furigana: 'Bebas', meaning: 'Salah' }
    ],
    hint: '⏱️ Butuh ketelitian membaca syarat hari & tujuan dalam 30 detik!',
    cta: 'Jalur mana yang kamu pilih? Tulis di komentar!',
    caption: `Soal Menjebak Model Grafik/Tabel JFT A2!

Di ujian CBT asli, kamu bakal nemuin soal model papan petunjuk jalan, menu makanan, atau jadwal bus.

Skenario Soal:
Kamu mau naik bus dari Stasiun ke Rumah Sakit.
- Bus Jalur A: Berangkat jam 10:00, tidak berhenti di Rumah Sakit.
- Bus Jalur B: Berangkat jam 10:15, langsung menuju Rumah Sakit.
- Bus Jalur C: Berangkat jam 10:05, lewat Rumah Sakit tapi khusus hari Minggu.

Jika hari ini hari Rabu jam 09:50, bus mana yang wajib kamu naiki?

A. Jalur A
B. Jalur B
C. Jalur C
D. Semua jalur bisa

Kelihatannya sepele tapi butuh ketelitian tinggi! Tulis jawabanmu di bawah.`,
    comment: `Jawaban yang benar: B. Bus Jalur B

Penjelasan: Jalur A tidak berhenti di RS, sedangkan Jalur C hanya beroperasi hari Minggu (hari ini Rabu). Maka pilihan paling tepat adalah Bus Jalur B jam 10:15.

Terbiasa membaca grafik dan tabel dalam durasi waktu ketat adalah kunci lulus JFT A2. Latihan gratis sekarang di:
https://kondangsensei.my.id`
  },
  {
    id: '07-minggu-mini-tryout',
    day: 'MINGGU',
    category: 'CHALLENGE MINGGUAN • SIMULASI CBT RESMI',
    categoryJp: '実力診断テスト',
    headline: 'Seberapa Siap Kamu LULUS Ujian JFT-Basic A2 Sekali Tes?',
    subhead: 'Biaya tes resmi Rp550.000! Jangan sampai uang & waktu terbuang hanya karena panik di depan layar CBT.',
    tag: 'MINI TRYOUT CBT 100% GRATIS',
    themeColor: '#dc2626',
    themeBg: 'linear-gradient(135deg, #1c1917 0%, #0c0a09 100%)',
    isDark: true,
    badgeBg: '#dc2626',
    badgeText: '#ffffff',
    questionBox: `
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 20px;">
        <div style="background: rgba(255,255,255,0.07); border: 1px solid rgba(255,255,255,0.15); border-radius: 18px; padding: 20px;">
          <div style="font-size: 36px; margin-bottom: 6px;">📝</div>
          <div style="font-size: 22px; font-weight: 900; color: white;">12 Soal Pilihan</div>
          <div style="font-size: 15px; color: #a8a29e; margin-top: 4px;">4 Seksi Lengkap: Moji-Goi, Kaiwa, Choukai, Dokkai</div>
        </div>
        <div style="background: rgba(255,255,255,0.07); border: 1px solid rgba(255,255,255,0.15); border-radius: 18px; padding: 20px;">
          <div style="font-size: 36px; margin-bottom: 6px;">🎧</div>
          <div style="font-size: 22px; font-weight: 900; color: #38bdf8;">Audio Chōkai Asli</div>
          <div style="font-size: 15px; color: #a8a29e; margin-top: 4px;">Standar CBT Prometric (Maks 2x putar otomatis)</div>
        </div>
        <div style="background: rgba(255,255,255,0.07); border: 1px solid rgba(255,255,255,0.15); border-radius: 18px; padding: 20px;">
          <div style="font-size: 36px; margin-bottom: 6px;">⏱️</div>
          <div style="font-size: 22px; font-weight: 900; color: #fbbf24;">Timer 15 Menit</div>
          <div style="font-size: 15px; color: #a8a29e; margin-top: 4px;">Simulasi tekanan waktu nyata persis ruang ujian</div>
        </div>
        <div style="background: rgba(255,255,255,0.07); border: 1px solid rgba(255,255,255,0.15); border-radius: 18px; padding: 20px;">
          <div style="font-size: 36px; margin-bottom: 6px;">🏆</div>
          <div style="font-size: 22px; font-weight: 900; color: #4ade80;">Skor Real-Time</div>
          <div style="font-size: 15px; color: #a8a29e; margin-top: 4px;">Skala 10 - 250 poin + Analisis kelemahan per seksi</div>
        </div>
      </div>
      <div style="background: linear-gradient(90deg, rgba(220,38,38,0.2) 0%, rgba(245,158,11,0.2) 100%); border: 2px solid #dc2626; border-radius: 18px; padding: 18px 24px; text-align: center; color: white;">
        <span style="font-size: 22px; font-weight: 900; color: #fca5a5;">🔥 TANTANGAN MINGGUAN:</span>
        <span style="font-size: 20px; font-weight: 700; margin-left: 8px;">Uji kesiapanmu hari ini sebelum daftar ujian resmi!</span>
      </div>
    `,
    options: null,
    hint: '✨ 100% Gratis • Tanpa Perlu Kartu Kredit • Cukup Buka dari HP / Laptop',
    cta: 'Klik Link di Komentar Paling Atas untuk Mulai Tes Gratis!',
    caption: `[CHALLENGE MINGGUAN] Seberapa Siap Kamu Menghadapi Ujian JFT-Basic A2 Resmi?

Mengeluarkan biaya ujian resmi Rp550.000 itu tidak sedikit. Jangan sampai modal uang dan waktu belajar kamu terbuang hanya karena panik melihat layar monitor komputer saat ujian!

Coba evaluasi kemampuan kamu akhir pekan ini lewat Mini Tryout CBT Gratis:
- 12 Soal Pilihan (Moji, Goi, Bunpou, Choukai, Dokkai)
- Fitur Audio Listening Autentik
- Countdown Timer 15 Menit
- Skor Otomatis (Skala 0 - 250) + Rekomendasi Kelulusan

Berani terima tantangannya? Buktikan skor kamu hari ini!`,
    comment: `Klik tautan di bawah ini untuk memulai simulasi CBT tanpa dipungut biaya:
https://kondangsensei.my.id`
  }
];

function generateHtml(p) {
  const isDark = p.isDark || false;
  const textColor = isDark ? '#ffffff' : '#1c1917';
  const subtextColor = isDark ? '#a8a29e' : '#57534e';
  const cardBg = isDark ? 'rgba(255, 255, 255, 0.05)' : '#ffffff';
  const cardBorder = isDark ? 'rgba(255, 255, 255, 0.12)' : '#e7e5e4';

  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>${p.day} - ${p.category}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800;900&family=Noto+Sans+JP:wght@500;700;900&display=swap');
    
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      width: 1080px;
      height: 1080px;
      background: ${p.themeBg};
      font-family: 'Plus Jakarta Sans', sans-serif;
      color: ${textColor};
      padding: 56px 64px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      overflow: hidden;
      position: relative;
    }

    /* Ambient background glow */
    .glow-1 {
      position: absolute;
      top: -80px;
      right: -80px;
      width: 450px;
      height: 450px;
      border-radius: 50%;
      background: radial-gradient(circle, rgba(220, 38, 38, ${isDark ? '0.25' : '0.12'}) 0%, transparent 70%);
      pointer-events: none;
    }

    .glow-2 {
      position: absolute;
      bottom: -60px;
      left: -60px;
      width: 400px;
      height: 400px;
      border-radius: 50%;
      background: radial-gradient(circle, rgba(245, 158, 11, ${isDark ? '0.18' : '0.08'}) 0%, transparent 70%);
      pointer-events: none;
    }

    /* Header */
    .header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      position: relative;
      z-index: 10;
    }

    .brand {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .logo-badge {
      width: 68px;
      height: 68px;
      border-radius: 20px;
      background: white;
      border: 2px solid #e7e5e4;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 12px rgba(0,0,0,0.06);
      overflow: hidden;
      padding: 6px;
    }

    .brand-title {
      font-size: 28px;
      font-weight: 900;
      letter-spacing: -0.5px;
      color: ${textColor};
      line-height: 1;
    }

    .brand-title span {
      color: #dc2626;
    }

    .brand-subtitle {
      font-size: 13px;
      font-weight: 800;
      color: ${subtextColor};
      letter-spacing: 1.5px;
      text-transform: uppercase;
      margin-top: 5px;
    }

    .day-pill {
      display: flex;
      align-items: center;
      gap: 12px;
      background: ${p.badgeBg};
      color: ${p.badgeText};
      padding: 10px 22px;
      border-radius: 9999px;
      border: 2px solid ${isDark ? 'transparent' : '#fecaca'};
      box-shadow: 0 2px 8px rgba(0,0,0,0.04);
    }

    .day-pill .dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background: #dc2626;
    }

    .day-pill .text {
      font-size: 15px;
      font-weight: 900;
      letter-spacing: 1px;
      text-transform: uppercase;
    }

    /* Main Content */
    .content {
      position: relative;
      z-index: 10;
      margin: 12px 0;
    }

    .headline-wrap {
      margin-bottom: 24px;
    }

    .tag-badge {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: #dc2626;
      color: white;
      padding: 6px 16px;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 900;
      letter-spacing: 1px;
      text-transform: uppercase;
      margin-bottom: 12px;
    }

    .main-headline {
      font-size: 38px;
      font-weight: 900;
      line-height: 1.25;
      letter-spacing: -0.8px;
      color: ${textColor};
      margin-bottom: 8px;
    }

    .main-subhead {
      font-size: 18px;
      font-weight: 600;
      color: ${subtextColor};
    }

    /* Question Container Card */
    .question-card {
      background: ${cardBg};
      border: 2px solid ${cardBorder};
      border-radius: 28px;
      padding: 30px;
      box-shadow: 0 12px 32px rgba(0,0,0,0.06);
      backdrop-filter: blur(8px);
    }

    /* Options Grid (If applicable) */
    .options-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      margin-top: 24px;
    }

    .option-btn {
      display: flex;
      align-items: center;
      gap: 16px;
      background: ${isDark ? 'rgba(255,255,255,0.08)' : '#ffffff'};
      border: 3px solid ${isDark ? 'rgba(255,255,255,0.18)' : '#e7e5e4'};
      border-radius: 20px;
      padding: 14px 18px;
      transition: all 0.2s ease;
      box-shadow: 0 2px 6px rgba(0,0,0,0.03);
    }

    .option-letter {
      width: 44px;
      height: 44px;
      border-radius: 12px;
      background: #f5f5f4;
      color: #1c1917;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 20px;
      font-weight: 900;
      border: 2px solid #d6d3d1;
      shrink-0: 0;
    }

    .option-text-wrap {
      flex: 1;
      min-width: 0;
    }

    .option-kanji {
      font-family: 'Noto Sans JP', sans-serif;
      font-weight: 900;
      color: ${textColor};
      line-height: 1.15;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .option-furigana {
      font-size: 13px;
      color: ${subtextColor};
      font-weight: 700;
      margin-top: 2px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    /* Interactive CTA Banner */
    .interaction-bar {
      margin-top: 20px;
      background: ${isDark ? 'rgba(255,255,255,0.08)' : '#fef2f2'};
      border: 2px solid ${isDark ? 'rgba(255,255,255,0.15)' : '#fecaca'};
      border-radius: 18px;
      padding: 14px 22px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .interaction-left {
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 17px;
      font-weight: 800;
      color: ${isDark ? '#fca5a5' : '#b91c1c'};
    }

    .interaction-badge {
      background: #dc2626;
      color: white;
      font-weight: 900;
      font-size: 14px;
      padding: 6px 16px;
      border-radius: 10px;
      letter-spacing: 0.5px;
    }

    /* Footer */
    .footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      position: relative;
      z-index: 10;
      padding-top: 18px;
      border-top: 2px solid ${isDark ? 'rgba(255,255,255,0.12)' : '#e7e5e4'};
    }

    .footer-left {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .footer-url {
      font-size: 18px;
      font-weight: 900;
      color: #dc2626;
      letter-spacing: 0.5px;
    }

    .footer-desc {
      font-size: 14px;
      font-weight: 700;
      color: ${subtextColor};
    }

    .footer-right {
      display: flex;
      align-items: center;
      gap: 10px;
      background: ${isDark ? 'rgba(255,255,255,0.1)' : '#f5f5f4'};
      padding: 8px 18px;
      border-radius: 12px;
      font-size: 14px;
      font-weight: 800;
      color: ${textColor};
    }
  </style>
</head>
<body>
  <div class="glow-1"></div>
  <div class="glow-2"></div>

  <!-- Header -->
  <div class="header">
    <div class="brand">
      <div class="logo-badge">
        <img src="file:///C:/Users/PC-SIJA/Desktop/KondangJFT/public/logo-icon.png" style="width: 100%; height: 100%; object-fit: contain;" />
      </div>
      <div>
        <div class="brand-title">Kondang<span>Sensei</span></div>
        <div class="brand-subtitle">CBT 日本語能力判定テスト • JFT-Basic A2</div>
      </div>
    </div>

    <div class="day-pill">
      <div class="dot"></div>
      <div class="text">${p.day} • ${p.categoryJp}</div>
    </div>
  </div>

  <!-- Content -->
  <div class="content">
    <div class="headline-wrap">
      <div class="tag-badge">⚡ ${p.tag}</div>
      <h1 class="main-headline">${p.headline}</h1>
      <p class="main-subhead">${p.subhead}</p>
    </div>

    <!-- Question Box -->
    <div class="question-card">
      ${p.questionBox}

      ${p.options ? `
      <div class="options-grid">
        ${p.options.map(opt => {
          const fontSize = opt.text.length > 14 ? '23px' : opt.text.length > 8 ? '28px' : '34px';
          return `
          <div class="option-btn">
            <div class="option-letter">${opt.key}</div>
            <div class="option-text-wrap">
              <div class="option-kanji" style="font-size: ${fontSize};">${opt.text}</div>
              <div class="option-furigana">${opt.furigana} • ${opt.meaning}</div>
            </div>
          </div>
        `}).join('')}
      </div>
      ` : ''}

      <div class="interaction-bar">
        <div class="interaction-left">
          <span>💬</span>
          <span>${p.cta}</span>
        </div>
        <div class="interaction-badge">
          KUNCI JAWABAN DI KOMENTAR ↓
        </div>
      </div>
    </div>
  </div>

  <!-- Footer -->
  <div class="footer">
    <div class="footer-left">
      <div class="footer-url">kondangsensei.my.id</div>
      <div style="color: ${subtextColor};">•</div>
      <div class="footer-desc">Simulasi CBT JFT-Basic A2 99% Mirip Ujian Asli Prometric</div>
    </div>
    <div class="footer-right">
      <span>Coba Mini Tryout 100% Gratis</span>
      <span>→</span>
    </div>
  </div>
</body>
</html>`;
}

// 1. Generate HTML templates
const htmlDir = path.join(OUTPUT_DIR, 'html');
if (!fs.existsSync(htmlDir)) {
  fs.mkdirSync(htmlDir, { recursive: true });
}

console.log('Generating poster HTMLs...');
for (const p of posters) {
  const htmlContent = generateHtml(p);
  const htmlPath = path.join(htmlDir, `${p.id}.html`);
  fs.writeFileSync(htmlPath, htmlContent, 'utf8');
}

// 2. Render each HTML to 1080x1080 PNG using Chrome headless
console.log('Rendering 1080x1080 PNGs via Headless Chrome...');
for (const p of posters) {
  const htmlPath = path.join(htmlDir, `${p.id}.html`);
  const pngPath = path.join(OUTPUT_DIR, `${p.id}.png`);
  const fileUrl = `file:///${htmlPath.replace(/\\/g, '/')}`;

  const cmd = `"${CHROME_PATH}" --headless --disable-gpu --force-device-scale-factor=1 --window-size=1080,1080 --screenshot="${pngPath}" "${fileUrl}"`;
  console.log(`Rendering ${p.id}...`);
  try {
    execSync(cmd, { stdio: 'inherit' });
  } catch (err) {
    console.error(`Error rendering ${p.id}:`, err.message);
  }
}

// 3. Create interactive showcase gallery index.html in public/poster/
const galleryHtml = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Koleksi Poster Konten JFT-Basic A2 (Senin - Minggu) • KondangSensei</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800;900&display=swap');
    * { box-sizing: border-box; }
    body {
      font-family: 'Plus Jakarta Sans', sans-serif;
      background: #090d16;
      color: #f8fafc;
      padding: 40px 20px 80px;
      margin: 0;
    }
    .container {
      max-width: 1280px;
      margin: 0 auto;
    }
    .header {
      text-align: center;
      margin-bottom: 48px;
    }
    .badge {
      display: inline-block;
      background: #fee2e2;
      color: #991b1b;
      font-size: 13px;
      font-weight: 900;
      padding: 6px 18px;
      border-radius: 9999px;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 12px;
    }
    .header h1 {
      font-size: 36px;
      font-weight: 900;
      color: white;
      margin: 0 0 10px;
      letter-spacing: -0.5px;
    }
    .header p {
      color: #94a3b8;
      font-size: 16px;
      max-width: 650px;
      margin: 0 auto;
      line-height: 1.5;
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
      gap: 32px;
    }
    .card {
      background: #131c2e;
      border: 1px solid #1e293b;
      border-radius: 24px;
      overflow: hidden;
      box-shadow: 0 12px 30px rgba(0,0,0,0.4);
      display: flex;
      flex-direction: column;
      transition: transform 0.2s, border-color 0.2s;
    }
    .card:hover {
      transform: translateY(-4px);
      border-color: #dc2626;
    }
    .card-img-wrap {
      position: relative;
      background: #0b1120;
    }
    .card img {
      width: 100%;
      aspect-ratio: 1/1;
      object-fit: cover;
      display: block;
    }
    .card-body {
      padding: 24px;
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      gap: 18px;
    }
    .card-day {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      font-size: 12px;
      font-weight: 900;
      color: #f87171;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 6px;
    }
    .card-title {
      font-size: 19px;
      font-weight: 800;
      color: white;
      line-height: 1.35;
      margin-bottom: 6px;
    }
    .copy-box {
      background: #0b1120;
      border: 1px solid #1e293b;
      border-radius: 14px;
      padding: 14px;
      font-size: 12px;
      color: #94a3b8;
      max-height: 140px;
      overflow-y: auto;
      white-space: pre-line;
      line-height: 1.5;
    }
    .actions {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
    }
    .btn {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      padding: 12px 14px;
      border-radius: 12px;
      font-weight: 800;
      font-size: 13px;
      cursor: pointer;
      text-decoration: none;
      border: none;
      transition: all 0.2s;
    }
    .btn-download {
      background: #dc2626;
      color: white;
    }
    .btn-download:hover {
      background: #b91c1c;
    }
    .btn-copy {
      background: #1e293b;
      color: #f8fafc;
      border: 1px solid #334155;
    }
    .btn-copy:hover {
      background: #334155;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <span class="badge">7 Hari Konten Siap Posting</span>
      <h1>Koleksi Poster Konten JFT-Basic A2 (Senin - Minggu)</h1>
      <p>Format 1080x1080 px kualitas HD siap unggah ke Facebook & Instagram Feed, lengkap dengan caption & komentar kunci jawaban.</p>
    </div>

    <div class="grid">
      ${posters.map(p => `
        <div class="card">
          <div class="card-img-wrap">
            <a href="${p.id}.png" target="_blank">
              <img src="${p.id}.png" alt="${p.day} - ${p.category}" />
            </a>
          </div>
          <div class="card-body">
            <div>
              <div class="card-day">● ${p.day} • ${p.category}</div>
              <div class="card-title">${p.headline}</div>
              <div style="font-size: 11px; font-weight: 700; color: #64748b; margin-bottom: 6px; text-transform: uppercase;">Preview Caption FB:</div>
              <div class="copy-box">${p.caption}</div>
            </div>
            <div class="actions">
              <a href="${p.id}.png" download="${p.id}.png" class="btn btn-download">
                📥 Download PNG
              </a>
              <button onclick="copyCaption('${p.id}')" class="btn btn-copy" id="btn-copy-${p.id}">
                📋 Salin Caption
              </button>
            </div>
          </div>
        </div>
      `).join('')}
    </div>
  </div>

  <script>
    const captionsData = ${JSON.stringify(posters.reduce((acc, p) => {
      acc[p.id] = { caption: p.caption, comment: p.comment };
      return acc;
    }, {}))};

    function copyCaption(id) {
      const data = captionsData[id];
      const textToCopy = data.caption + '\\n\\n--- ISI KOMENTAR PERTAMA (KUNCI & CTA) ---\\n' + data.comment;
      navigator.clipboard.writeText(textToCopy).then(() => {
        const btn = document.getElementById('btn-copy-' + id);
        const orig = btn.innerHTML;
        btn.innerHTML = '✅ Tersalin!';
        setTimeout(() => { btn.innerHTML = orig; }, 2000);
      });
    }
  </script>
</body>
</html>`;

fs.writeFileSync(path.join(OUTPUT_DIR, 'index.html'), galleryHtml, 'utf8');
console.log('All posters re-rendered successfully with perfected layouts!');
