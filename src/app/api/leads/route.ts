import { NextResponse } from 'next/server';
import { normalizePhoneNumber, calculateMiniTryoutDiagnostic, saveLead, getAllLeads } from '@/lib/leadStore';

export async function GET() {
  const leads = await getAllLeads();
  return NextResponse.json({ success: true, leads });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, whatsapp, whatsappNumber, email, answers = [], utmSource, utmCampaign } = body;

    const rawPhone = whatsappNumber || whatsapp;
    const normalizedPhone = normalizePhoneNumber(rawPhone);
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

    // Trigger WhatsApp Admin Notification
    console.log(`[WHATSAPP ADMIN NOTIFICATION] Prospek Baru Diterima: ${savedLead.name} (${savedLead.whatsapp_number}) | Skor: ${savedLead.score}/${savedLead.max_score} (${savedLead.is_passed ? 'LULUS' : 'BELUM LULUS'}) | Kelemahan: ${savedLead.weakest_section}`);

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
        ctaMessage: diagnostic.ctaMessage,
        adminNotificationSent: true
      }
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
