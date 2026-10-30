export interface FormulaBlock {
  type: 'topic' | 'particle' | 'predicate';
  text: string;
  subtext?: string;
}

export interface ExampleSentence {
  japanese: string;
  romaji: string;
  indonesian: string;
  audio_url: string;
  furigana?: Array<{ kanji: string; kana: string; type: string }>;
}

export interface BunpouPattern {
  id?: string;
  chapter_id: number;
  pattern_code: string;
  title: string;
  meaning: string;
  formula_blocks: FormulaBlock[];
  key_points: string[];
  example_sentences: ExampleSentence[];
  nuance_accordion: {
    title: string;
    content: string;
  };
}

export const INITIAL_BUNPOU_DATA: Record<number, BunpouPattern[]> = {
  1: [
    {
      chapter_id: 1,
      pattern_code: 'N5-B01-01',
      title: '~ は ~ です (~ wa ~ desu)',
      meaning: 'A adalah B (Menyatakan identitas/keterangan subjek)',
      formula_blocks: [
        { type: 'topic', text: 'KB 1 (Orang)', subtext: 'Subjek / Topik' },
        { type: 'particle', text: 'は (wa)', subtext: 'Partikel Penanda Topik' },
        { type: 'predicate', text: 'KB 2 (Profesi/Kewarganegaraan) です', subtext: 'Predikat Kalimat' }
      ],
      key_points: [
        "Partikel は ditulis dengan huruf Hiragana 'HA' tetapi dilafalkan 'WA'.",
        "Kata です (desu) berfungsi sebagai penutup kalimat sopan dan menyatakan penegasan positif saat ini."
      ],
      example_sentences: [
        {
          japanese: 'わたし は 学生 です。',
          romaji: 'Watashi wa gakusei desu.',
          indonesian: 'Saya adalah seorang pelajar.',
          audio_url: 'https://assets.kondangsensei.my.id/audio/bunpou/n5_01_01.mp3',
          furigana: [
            { kanji: 'わたし', kana: 'わたし', type: 'topic' },
            { kanji: 'は', kana: 'は (wa)', type: 'particle' },
            { kanji: '学生', kana: 'がくせい', type: 'predicate' },
            { kanji: 'です', kana: 'です', type: 'predicate' }
          ]
        },
        {
          japanese: '田中さん は 先生 です。',
          romaji: 'Tanaka-san wa sensei desu.',
          indonesian: 'Tuan Tanaka adalah seorang guru.',
          audio_url: 'https://assets.kondangsensei.my.id/audio/bunpou/n5_01_02.mp3',
          furigana: [
            { kanji: '田中さん', kana: 'たなかさん', type: 'topic' },
            { kanji: 'は', kana: 'は (wa)', type: 'particle' },
            { kanji: '先生', kana: 'せんせい', type: 'predicate' },
            { kanji: 'です', kana: 'です', type: 'predicate' }
          ]
        }
      ],
      nuance_accordion: {
        title: 'Perbedaan Sopan (です) vs Kasual (だ)',
        content: "Bentuk 'desu' digunakan dalam situasi formal, kantor, dan berbicara dengan orang baru. Bentuk 'da' adalah ragam akrab (casual) yang hanya digunakan dengan teman sebaya atau keluarga."
      }
    },
    {
      chapter_id: 1,
      pattern_code: 'N5-B01-02',
      title: '~ は ~ じゃありません (~ wa ~ ja arimasen)',
      meaning: 'A bukan B (Kalimat negatif formal)',
      formula_blocks: [
        { type: 'topic', text: 'KB 1', subtext: 'Topik Kalimat' },
        { type: 'particle', text: 'は (wa)', subtext: 'Partikel Penanda Topik' },
        { type: 'predicate', text: 'KB 2 じゃありません / ではありません', subtext: 'Bentuk Negatif Sopan' }
      ],
      key_points: [
        "'じゃありません' (ja arimasen) lebih umum digunakan dalam percakapan lisan sopan.",
        "'ではありません' (dewa arimasen) lebih formal dan sering digunakan dalam pidato atau tulisan resmi."
      ],
      example_sentences: [
        {
          japanese: 'サントスさん は 学生 じゃありません。',
          romaji: 'Santos-san wa gakusei ja arimasen.',
          indonesian: 'Tuan Santos bukan seorang pelajar.',
          audio_url: 'https://assets.kondangsensei.my.id/audio/bunpou/n5_01_03.mp3'
        }
      ],
      nuance_accordion: {
        title: 'Catatan Kesalahan Umum (Peringatan Partikel)',
        content: "Jangan menambahkan 'desu' setelah 'ja arimasen'. Ucapkan 'Gakusei ja arimasen', BUKAN 'Gakusei ja arimasen desu'."
      }
    }
  ],
  5: [
    {
      chapter_id: 5,
      pattern_code: 'N5-B05-01',
      title: '~ へ 行きます / 来ます / 帰ります (~ e ikimasu / kimasu / kaerimasu)',
      meaning: 'Pergi / Datang / Pulang ke tempat tertentu',
      formula_blocks: [
        { type: 'topic', text: 'Tempat (KB Tempat)', subtext: 'Tujuan Arah' },
        { type: 'particle', text: 'へ (e)', subtext: 'Partikel Penanda Arah' },
        { type: 'predicate', text: '行きます / 来ます / 帰ります', subtext: 'Kata Kerja Perpindahan' }
      ],
      key_points: [
        "Partikel へ ditulis dengan Hiragana 'HE' tetapi dilafalkan 'E'.",
        "Menunjukkan arah pergerakan menuju tempat tujuan."
      ],
      example_sentences: [
        {
          japanese: '京都 へ 行きます。',
          romaji: 'Kyouto e ikimasu.',
          indonesian: 'Saya pergi ke Kyoto.',
          audio_url: 'https://assets.kondangsensei.my.id/audio/bunpou/n5_05_01.mp3'
        }
      ],
      nuance_accordion: {
        title: 'Perbedaan Partikel へ (e) vs に (ni)',
        content: "Partikel へ (e) lebih menekankan pada arah pergerakan perjalanan, sedangkan に (ni) menekankan pada titik akhir tujuan yang dicapai."
      }
    }
  ]
};

// Registered chapters
export const REGISTERED_CHAPTERS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25];

export function getBunpouByChapter(chapterId: number): BunpouPattern[] | null {
  if (!REGISTERED_CHAPTERS.includes(chapterId)) {
    return null;
  }
  return INITIAL_BUNPOU_DATA[chapterId] || [
    {
      chapter_id: chapterId,
      pattern_code: `N5-B${chapterId < 10 ? '0' + chapterId : chapterId}-01`,
      title: `Pola Tata Bahasa Bab ${chapterId}`,
      meaning: `Materi pokok tata bahasa pembelajaran Bab ${chapterId}`,
      formula_blocks: [
        { type: 'topic', text: `Topik Bab ${chapterId}` },
        { type: 'particle', text: 'は (wa)' },
        { type: 'predicate', text: `Predikat Bab ${chapterId}` }
      ],
      key_points: [`Pahami perubahan bentuk kata pada Bab ${chapterId}`],
      example_sentences: [
        {
          japanese: `これは 第${chapterId}課 の 例文 です。`,
          romaji: `Kore wa dai ${chapterId} ka no reibun desu.`,
          indonesian: `Ini adalah contoh kalimat untuk Bab ${chapterId}.`,
          audio_url: `https://assets.kondangsensei.my.id/audio/bunpou/n5_${chapterId}_01.mp3`
        }
      ],
      nuance_accordion: {
        title: `Nuansa dan Konteks Penggunaan Bab ${chapterId}`,
        content: `Gunakan pola kalimat Bab ${chapterId} sesuai konteks situasi formal maupun kasual.`
      }
    }
  ];
}

export function saveBunpouPattern(pattern: BunpouPattern) {
  if (!INITIAL_BUNPOU_DATA[pattern.chapter_id]) {
    INITIAL_BUNPOU_DATA[pattern.chapter_id] = [];
  }
  INITIAL_BUNPOU_DATA[pattern.chapter_id].push(pattern);
  return pattern;
}
