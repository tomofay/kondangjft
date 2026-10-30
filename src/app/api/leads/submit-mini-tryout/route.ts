import { NextResponse } from 'next/server';
import { normalizePhoneNumber, calculateMiniTryoutDiagnostic, saveLead } from '@/lib/leadStore';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, whatsappNumber, email, answers = [], utmSource, utmCampaign } = body;

    const normalizedPhone = normalizePhoneNumber(whatsappNumber);
    if (!normalizedPhone) {
      return NextResponse.json(
        { success: false, error: 'Nomor WhatsApp tidak valid. Masukkan minimal 9 digit nomor ponsel.' },
        { status: 400 }
      );
    }

    const diagnostic = calculateMiniTryoutDiagnostic(answers);

    const savedLead = await saveLead({
      name: name?.trim() || 'Calon Siswa',
      whatsapp_number: normalizedPhone,
      email: email?.trim() || undefined,
      score: diagnostic.score,
      max_score: diagnostic.maxScore,
      passing_grade: diagnostic.passingGrade,
      is_passed: diagnostic.isPassed,
      weakest_section: diagnostic.weakestSection,
      utm_source: utmSource || undefined,
      utm_campaign: utmCampaign || undefined
    });

    return NextResponse.json({
      success: true,
      data: {
        leadId: savedLead.id,
        score: diagnostic.score,
        maxScore: diagnostic.maxScore,
        passingGrade: diagnostic.passingGrade,
        isPassed: diagnostic.isPassed,
        weakestSection: diagnostic.weakestSection,
        normalizedPhone,
        ctaMessage: diagnostic.ctaMessage
      }
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
