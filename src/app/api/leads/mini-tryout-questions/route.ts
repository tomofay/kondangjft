import { NextResponse } from 'next/server';
import { MINI_TRYOUT_QUESTIONS } from '@/lib/miniTryoutQuestions';

export async function GET() {
  // Strip out correct answers and explanations before sending to public client
  const safeQuestions = MINI_TRYOUT_QUESTIONS.map((q, index) => ({
    id: `mini_q_${index + 1}`,
    numericId: q.id,
    number: index + 1,
    section: q.section,
    sectionTitle: q.sectionTitle,
    questionText: q.questionText,
    readingPassage: q.readingPassage || null,
    imageUrl: q.imageUrl || null,
    audioUrl: q.audioUrl || null,
    options: q.options.map((opt) => ({
      key: opt.key,
      text: opt.text,
      imageUrl: opt.imageUrl || null
    }))
  }));

  return NextResponse.json({
    success: true,
    questions: safeQuestions
  });
}
