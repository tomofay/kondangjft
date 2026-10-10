import { NextResponse } from 'next/server';
import { parsePdfTextToQuestions, getStore } from '../../../../lib/dataStore';

export async function POST(request: Request) {
  try {
    const { pdfText } = await request.json();
    if (!pdfText || typeof pdfText !== 'string') {
      return NextResponse.json({ success: false, message: 'Teks PDF tidak boleh kosong' }, { status: 400 });
    }

    const drafts = parsePdfTextToQuestions(pdfText);
    const store = getStore();
    store.pdfDrafts.push(...drafts);

    return NextResponse.json({
      success: true,
      draftsCount: drafts.length,
      drafts,
      message: `Berhasil mengekstrak ${drafts.length} draf soal dari teks PDF.`
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
