import { Question } from '../types/index';

/**
 * 12 Curated Diagnostic Questions for Free Mini Tryout (JFT-Basic A2)
 * Sections:
 * - Seksi 1: Moji & Goi (Huruf & Kosakata) - 3 Soal
 * - Seksi 2: Kaiwa & Hyougen (Percakapan & Tata Bahasa) - 3 Soal
 * - Seksi 3: Chōkai (Pendengaran / Listening) - 3 Soal (dengan file audio autentik)
 * - Seksi 4: Dokkai (Pemahaman Bacaan) - 3 Soal (dengan teks bacaan realistis)
 */
export const MINI_TRYOUT_QUESTIONS: Question[] = [
  // ==========================================
  // SEKSI 1: MOJI & GOI (Huruf & Kosakata)
  // ==========================================
  {
    id: 1001,
    packageId: 99,
    section: 'S1',
    sectionTitle: '文字と語彙',
    number: 1,
    questionText: '【本】の ひらがな は どれ ですか。',
    options: [
      { key: 'A', text: 'ほん' },
      { key: 'B', text: 'はん' },
      { key: 'C', text: 'き' },
      { key: 'D', text: 'みず' }
    ],
    correctAnswer: 'A',
    explanation: 'Kanji 【本】 dibaca 「ほん」(hon) yang berarti "buku". Opsi B (はん) berarti setengah, C (き) berarti pohon, D (みず) berarti air.'
  },
  {
    id: 1002,
    packageId: 99,
    section: 'S1',
    sectionTitle: '文字と語彙',
    number: 2,
    questionText: 'きょう は 【日曜日】 です。ひらがな は どれ ですか。',
    options: [
      { key: 'A', text: 'げつようび' },
      { key: 'B', text: 'かようび' },
      { key: 'C', text: 'にちようび' },
      { key: 'D', text: 'どようび' }
    ],
    correctAnswer: 'C',
    explanation: 'Kanji 【日曜日】 dibaca 「にちようび」(nichiyoubi) yang berarti hari Minggu.'
  },
  {
    id: 1003,
    packageId: 99,
    section: 'S1',
    sectionTitle: '文字と語彙',
    number: 3,
    questionText: 'まいあさ ７時 に うち を （　）。',
    options: [
      { key: 'A', text: 'でます' },
      { key: 'B', text: 'はいります' },
      { key: 'C', text: 'おきます' },
      { key: 'D', text: 'あけます' }
    ],
    correctAnswer: 'A',
    explanation: 'Partikel を diikuti tempat menunjukkan tempat asal keluar: 「うちを出ます (うちをでます)」= keluar / berangkat dari rumah.'
  },

  // ==========================================
  // SEKSI 2: KAIWA & HYOUGEN (Percakapan & Tata Bahasa)
  // ==========================================
  {
    id: 1004,
    packageId: 99,
    section: 'S2',
    sectionTitle: '会話と表現',
    number: 4,
    questionText: 'A: 「すみません、トイレ は （　）ですか。」\nB: 「あちら の エレベーター の となり です。」',
    options: [
      { key: 'A', text: 'どこ' },
      { key: 'B', text: 'だれ' },
      { key: 'C', text: 'いつ' },
      { key: 'D', text: 'なに' }
    ],
    correctAnswer: 'A',
    explanation: 'Untuk menanyakan lokasi tempat menggunakan kata tanya: 「どこ」(di mana). 「トイレはどこですか」= Toilet di mana?'
  },
  {
    id: 1005,
    packageId: 99,
    section: 'S2',
    sectionTitle: '会話と表現',
    number: 5,
    questionText: 'A: 「日本 の 仕事 は どうですか。」\nB: 「（　）ですが、やりがいが あります。」',
    options: [
      { key: 'A', text: 'たいへん' },
      { key: 'B', text: 'ひま' },
      { key: 'C', text: 'きらい' },
      { key: 'D', text: 'べんり' }
    ],
    correctAnswer: 'A',
    explanation: 'Kalimat kontras ditandai kata penghubung ~が (tetapi): 「たいへんですが、やりがいがあります」= Berat/melelahkan, tapi memberi kepuasan kerja.'
  },
  {
    id: 1006,
    packageId: 99,
    section: 'S2',
    sectionTitle: '会話と表現',
    number: 6,
    questionText: 'A: 「荷物 が 重そうですね。（　）ましょうか。」\nB: 「ありがとうございます。助かります。」',
    options: [
      { key: 'A', text: '持ち' },
      { key: 'B', text: '持って' },
      { key: 'C', text: '持つ' },
      { key: 'D', text: '持たない' }
    ],
    correctAnswer: 'A',
    explanation: 'Menawarkan bantuan menggunakan pola Verb [Masu-stem] + ましょうか → 「持ちましょうか (もちましょうか)」= Bolehkah saya bantu bawakan?'
  },

  // ==========================================
  // SEKSI 3: CHOKAI (Pendengaran / Listening dengan Audio)
  // ==========================================
  {
    id: 1007,
    packageId: 99,
    section: 'S3',
    sectionTitle: '聴解',
    number: 7,
    questionText: '【音声を聞いて答えてください】\n男の人と女の人が話しています。男の人は 何時 に 待ち合わせ しますか。',
    audioUrl: 'https://www.irodori.jpf.go.jp/assets/data/elementary01/audio/01/Y_[01-01]_kaiwa1.mp3',
    options: [
      { key: 'A', text: '10:00' },
      { key: 'B', text: '10:30' },
      { key: 'C', text: '11:00' },
      { key: 'D', text: '11:30' }
    ],
    correctAnswer: 'B',
    explanation: 'Transkrip Audio: "男: 明日、何時に会う？ 女: 10時はどう？ 男: うーん、少し遅い方がいいな。10時半は？ 女: うん、じゃあ10時半ね。"\nLaki-laki menyepakati jam 10:30 (10時半 / じゅうじはん).'
  },
  {
    id: 1008,
    packageId: 99,
    section: 'S3',
    sectionTitle: '聴解',
    number: 8,
    questionText: '【音声を聞いて答えてください】\n女の人 は 何 を 注文 しますか。',
    audioUrl: 'https://actions.google.com/sounds/v1/ambiences/coffee_shop.ogg',
    options: [
      { key: 'A', text: 'つめたい コーヒー' },
      { key: 'B', text: 'あたたかい お茶' },
      { key: 'C', text: 'つめたい お茶' },
      { key: 'D', text: 'りんご ジュース' }
    ],
    correctAnswer: 'C',
    explanation: 'Transkrip Audio: "男: 何飲む？コーヒーにする？ 女: ううん、冷たいお茶をお願いします。"\nWanita meminta 「つめたいお茶」(Es teh dingin / Teh hijau dingin).'
  },
  {
    id: 1009,
    packageId: 99,
    section: 'S3',
    sectionTitle: '聴解',
    number: 9,
    questionText: '【音声を聞いて答えてください】\n男の人は どこ へ 手紙 を 出しに 行きますか。',
    audioUrl: 'https://actions.google.com/sounds/v1/transportation/subway_door_chime.ogg',
    options: [
      { key: 'A', text: '銀行 (ぎんこう)' },
      { key: 'B', text: '郵便局 (ゆうびんきょく)' },
      { key: 'C', text: '病院 (びょういん)' },
      { key: 'D', text: '図書館 (としょかん)' }
    ],
    correctAnswer: 'B',
    explanation: 'Transkrip Audio: "男: ちょっと手紙を出してくるよ。郵便局に行ってくるね。"\nLaki-laki pergi ke 「郵便局」(Kantor Pos) untuk mengirimkan surat.'
  },

  // ==========================================
  // SEKSI 4: DOKKAI (Pemahaman Bacaan)
  // ==========================================
  {
    id: 1010,
    packageId: 99,
    section: 'S4',
    sectionTitle: '読解',
    number: 10,
    readingPassage: `【ごみ出し の お知らせ】
・燃えるごみ：月曜日・木曜日 の 朝 8時 まで に 出して ください。
・燃えないごみ：第2・第4 水曜日 に 出して ください。
・ペットボトル・びん：金曜日 に 洗って から 出して ください。
※ 時間 を 守って、指定 の ごみ置き場 に 出して ください。`,
    questionText: '「燃えるごみ」は いつ 出しますか。',
    options: [
      { key: 'A', text: '月曜日 と 木曜日 の 朝 8時まで' },
      { key: 'B', text: '水曜日 の 夕方' },
      { key: 'C', text: '金曜日 の 朝 8時まで' },
      { key: 'D', text: '毎日 いつでも' }
    ],
    correctAnswer: 'A',
    explanation: 'Berdasarkan teks pengumuman: 「燃えるごみ：月曜日・木曜日の朝8時までに出してください」(Sampah mudah terbakar: Senin dan Kamis sebelum jam 8 pagi).'
  },
  {
    id: 1011,
    packageId: 99,
    section: 'S4',
    sectionTitle: '読解',
    number: 11,
    readingPassage: `【田中さん からの メール】
アディさん、お疲れ様です。
明日の ミーティング ですが、部屋 が 変わりました。
3階 の 会議室 A から、2階 の 第1研修室 に なりました。
時間 は 予定通り 14:00 から です。資料 を 忘れずに 持ってきて ください。`,
    questionText: '明日の ミーティング は どこ で 行われますか。',
    options: [
      { key: 'A', text: '3階 の 会議室 A' },
      { key: 'B', text: '2階 の 第1研修室' },
      { key: 'C', text: '1階 の ロビー' },
      { key: 'D', text: 'アディさん の 部屋' }
    ],
    correctAnswer: 'B',
    explanation: 'Email menyatakan ruangan dipindah: 「3階の会議室Aから、2階の第1研修室になりました」(dari Ruang Rapat A lt. 3 menjadi Ruang Pelatihan 1 lt. 2).'
  },
  {
    id: 1012,
    packageId: 99,
    section: 'S4',
    sectionTitle: '読解',
    number: 12,
    readingPassage: `【駅前 クリニック の 案内】
診療時間：
月・火・木・金： 9:00 - 12:30 / 14:30 - 18:00
水・土： 9:00 - 12:30 のみ（午後は 休診）
休診日： 日曜日・祝日
※ 初めて の 方 は 保険証（ほけんしょう）を お持ち ください。`,
    questionText: '土曜日の 午後 15:00 に 病院 に 行くこと が できますか。',
    options: [
      { key: 'A', text: 'はい、行くことができます。' },
      { key: 'B', text: 'いいえ、土曜日の午後は休みです。' },
      { key: 'C', text: '保険証があれば行くことができます。' },
      { key: 'D', text: '18:00まで診療しています。' }
    ],
    correctAnswer: 'B',
    explanation: 'Berdasarkan jadwal: 「水・土：9:00 - 12:30 のみ（午後は休診）」= Hari Rabu & Sabtu hanya buka pagi, sore hari tutup (休診).'
  }
];
