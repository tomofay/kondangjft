'use client';

import React, { useState, useEffect } from 'react';

export type JftSection = 's1_moji_goi' | 's2_kaiwa' | 's3_chokai' | 's4_dokkai';

export interface ExamQuestion {
  questionNumber: number;
  section: JftSection;
  questionText: string;
  audioUrl?: string;
  options: { key: string; text: string }[];
  correctOptionIndex: number;
  explanation: string;
}

interface CbtJftExamEngineProps {
  packageId?: string;
  candidateName?: string;
  registrationNumber?: string;
  onFinish?: (result: any) => void;
}

export function CbtJftExamEngine({
  packageId = 'jft_pack_1',
  candidateName = 'Siti Rahma',
  registrationNumber = 'JFT-2026-88912',
  onFinish
}: CbtJftExamEngineProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<number, number>>({});
  const [flaggedQuestions, setFlaggedQuestions] = useState<Record<number, boolean>>({});
  const [timeLeftSeconds, setTimeLeftSeconds] = useState(60 * 60); // 60 minutes
  const [audioPlays, setAudioPlays] = useState<Record<number, number>>({});
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [examResult, setExamResult] = useState<any | null>(null);

  // Generate standard 50 questions
  const [questions] = useState<ExamQuestion[]>(() => {
    const list: ExamQuestion[] = [];
    for (let i = 1; i <= 12; i++) {
      list.push({
        questionNumber: i,
        section: 's1_moji_goi',
        questionText: `【文字・語彙 第${i}問】下線の ことば は どう 書きますか。`,
        options: [
          { key: 'A', text: 'ほんとう' },
          { key: 'B', text: 'べんとう' },
          { key: 'C', text: 'しょくどう' },
          { key: 'D', text: 'かいしゃ' }
        ],
        correctOptionIndex: 0,
        explanation: 'Jawaban A adalah bacaan huruf kanji yang benar.'
      });
    }
    for (let i = 13; i <= 24; i++) {
      list.push({
        questionNumber: i,
        section: 's2_kaiwa',
        questionText: `【会話・表現 第${i - 12}問】場面に 適した 表現を えらびなさい。`,
        options: [
          { key: 'A', text: 'かしこまりました' },
          { key: 'B', text: 'どういたしまして' },
          { key: 'C', text: 'おねがいします' },
          { key: 'D', text: 'ごめんなさい' }
        ],
        correctOptionIndex: 0,
        explanation: 'Jawaban A adalah ekspresi sopan standar dalam situasi kerja.'
      });
    }
    for (let i = 25; i <= 37; i++) {
      list.push({
        questionNumber: i,
        section: 's3_chokai',
        questionText: `【聴解 第${i - 24}問】音声を聞いて、質問に答えてください。話の内容と合っているものはどれですか。`,
        audioUrl: `/audio/jft/chokai_q${i}.mp3`,
        options: [
          { key: 'A', text: '明日の朝 9時に 会議室へ 行きます' },
          { key: 'B', text: '午後 2時に 荷物を 送ります' },
          { key: 'C', text: '駅の改札口で 待ち合わせします' },
          { key: 'D', text: '工場で 作業着に 着替えます' }
        ],
        correctOptionIndex: 0,
        explanation: 'Jawaban A sesuai dengan percakapan audio yang diperdengarkan.'
      });
    }
    for (let i = 38; i <= 50; i++) {
      list.push({
        questionNumber: i,
        section: 's4_dokkai',
        questionText: `【読解 第${i - 37}問】お知らせの 文を 読んで、質問に 答えてください。`,
        options: [
          { key: 'A', text: '毎週水曜日の午前中は休館です' },
          { key: 'B', text: '事前に予約が必要です' },
          { key: 'C', text: '利用料金は無料です' },
          { key: 'D', text: '身分証明書を持参してください' }
        ],
        correctOptionIndex: 0,
        explanation: 'Jawaban A sesuai dengan poin yang tertulis pada teks pengumuman.'
      });
    }
    return list;
  });

  const currentQuestion = questions[currentQuestionIndex];
  const isChokai = currentQuestion.section === 's3_chokai';
  const playsCount = audioPlays[currentQuestion.questionNumber] || 0;
  const playsRemaining = Math.max(0, 2 - playsCount);

  // Timer Countdown
  useEffect(() => {
    if (examResult) return;
    const timer = setInterval(() => {
      setTimeLeftSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmitExam();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [examResult]);

  const handleSelectOption = (index: number) => {
    setUserAnswers((prev) => ({
      ...prev,
      [currentQuestion.questionNumber]: index
    }));
  };

  const handleToggleFlag = () => {
    setFlaggedQuestions((prev) => ({
      ...prev,
      [currentQuestion.questionNumber]: !prev[currentQuestion.questionNumber]
    }));
  };

  const handlePlayAudio = () => {
    if (playsRemaining <= 0 || isPlayingAudio) return;

    setIsPlayingAudio(true);
    setAudioPlays((prev) => ({
      ...prev,
      [currentQuestion.questionNumber]: playsCount + 1
    }));

    setTimeout(() => {
      setIsPlayingAudio(false);
    }, 3500);
  };

  const handleSubmitExam = () => {
    setIsSubmitting(true);
    let s1 = 0, s2 = 0, s3 = 0, s4 = 0;

    questions.forEach((q) => {
      const isCorrect = userAnswers[q.questionNumber] === q.correctOptionIndex;
      if (isCorrect) {
        if (q.section === 's1_moji_goi') s1 += 5;
        else if (q.section === 's2_kaiwa') s2 += 5;
        else if (q.section === 's3_chokai') s3 += 5;
        else if (q.section === 's4_dokkai') s4 += 5;
      }
    });

    const total = s1 + s2 + s3 + s4;
    const resultData = {
      totalScore: total,
      maxScore: 250,
      isPassed: total >= 200,
      sectionScores: {
        s1_moji_goi: s1,
        s2_kaiwa: s2,
        s3_chokai: s3,
        s4_dokkai: s4
      }
    };

    setTimeout(() => {
      setExamResult(resultData);
      setIsSubmitting(false);
      onFinish?.(resultData);
    }, 600);
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        background: '#0f172a',
        color: '#f8fafc',
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
        userSelect: 'none'
      }}
    >
      {/* Prometric Top Exam Bar */}
      <div
        style={{
          background: '#1e293b',
          borderBottom: '2px solid #3b82f6',
          padding: '12px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div
            style={{
              background: '#2563eb',
              color: '#ffffff',
              padding: '4px 10px',
              borderRadius: '6px',
              fontWeight: '800',
              fontSize: '12px',
              letterSpacing: '0.05em'
            }}
          >
            PROMETRIC CBT
          </div>
          <div>
            <div style={{ fontWeight: '700', fontSize: '15px' }}>
              JFT-Basic A2 Official Simulation Test
            </div>
            <div style={{ fontSize: '12px', color: '#94a3b8' }}>
              Candidate: <span style={{ color: '#e2e8f0', fontWeight: '600' }}>{candidateName}</span> ({registrationNumber})
            </div>
          </div>
        </div>

        {/* Timer */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: timeLeftSeconds < 300 ? '#7f1d1d' : '#0f172a',
              border: `1px solid ${timeLeftSeconds < 300 ? '#ef4444' : '#334155'}`,
              borderRadius: '8px',
              padding: '6px 16px'
            }}
          >
            <span style={{ fontSize: '16px' }}>⏱️</span>
            <div>
              <div style={{ fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase' }}>Waktu Tersisa</div>
              <div style={{ fontSize: '18px', fontWeight: '800', fontFamily: 'monospace', color: timeLeftSeconds < 300 ? '#fca5a5' : '#38bdf8' }}>
                {formatTime(timeLeftSeconds)}
              </div>
            </div>
          </div>

          <button
            onClick={handleSubmitExam}
            disabled={isSubmitting}
            style={{
              background: '#dc2626',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              padding: '10px 18px',
              fontWeight: '700',
              fontSize: '13px',
              cursor: 'pointer'
            }}
          >
            Selesai & Kumpulkan
          </button>
        </div>
      </div>

      {/* Sections Tab Bar */}
      <div
        style={{
          background: '#1e293b',
          borderBottom: '1px solid #334155',
          display: 'flex',
          padding: '0 24px',
          gap: '8px'
        }}
      >
        {[
          { key: 's1_moji_goi', label: '1. 文字と語彙 (Moji & Goi)', count: '12 Soal' },
          { key: 's2_kaiwa', label: '2. 会話と表現 (Kaiwa)', count: '12 Soal' },
          { key: 's3_chokai', label: '3. 聴解 (Chōkai Audio)', count: '13 Soal (Maks 2x Putar)' },
          { key: 's4_dokkai', label: '4. 読解 (Dokkai Reading)', count: '13 Soal' }
        ].map((tab) => {
          const isActive = currentQuestion.section === tab.key;
          return (
            <div
              key={tab.key}
              style={{
                padding: '12px 16px',
                borderBottom: isActive ? '3px solid #38bdf8' : '3px solid transparent',
                color: isActive ? '#38bdf8' : '#94a3b8',
                fontWeight: isActive ? '700' : '500',
                fontSize: '13px',
                cursor: isChokai ? 'not-allowed' : 'pointer'
              }}
            >
              {tab.label} <span style={{ fontSize: '11px', opacity: 0.7 }}>({tab.count})</span>
            </div>
          );
        })}
      </div>

      {/* Main Workspace */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Left: Question Content */}
        <div style={{ flex: 1, padding: '32px 48px', overflowY: 'auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div style={{ fontSize: '18px', fontWeight: '800', color: '#38bdf8' }}>
              Soal Nomor {currentQuestion.questionNumber} / 50
            </div>
            <button
              onClick={handleToggleFlag}
              style={{
                background: flaggedQuestions[currentQuestion.questionNumber] ? '#f59e0b' : '#334155',
                color: '#ffffff',
                border: 'none',
                borderRadius: '6px',
                padding: '6px 14px',
                fontSize: '12px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              🚩 {flaggedQuestions[currentQuestion.questionNumber] ? 'Ditandai Ragu-ragu' : 'Tandai Ragu-ragu'}
            </button>
          </div>

          {/* Chōkai Audio Controller Box */}
          {isChokai && (
            <div
              style={{
                background: '#1e293b',
                border: '1px solid #3b82f6',
                borderRadius: '12px',
                padding: '20px',
                marginBottom: '28px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
            >
              <div>
                <div style={{ fontWeight: '700', fontSize: '15px', color: '#f8fafc', marginBottom: '4px' }}>
                  🎧 Rekaman Audio Percakapan (Chōkai)
                </div>
                <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                  Aturan Prometric: Audio hanya dapat diputar maksimal 2 kali. Scrubber bar dinonaktifkan.
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div
                  style={{
                    background: '#0f172a',
                    padding: '6px 12px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    color: playsRemaining === 0 ? '#ef4444' : '#10b981',
                    fontWeight: '700'
                  }}
                >
                  {playsRemaining > 0 ? `Sisa Putar: ${playsRemaining}x` : 'Batas Habis (2/2)'}
                </div>

                <button
                  onClick={handlePlayAudio}
                  disabled={playsRemaining <= 0 || isPlayingAudio}
                  style={{
                    background: playsRemaining <= 0 ? '#475569' : isPlayingAudio ? '#f59e0b' : '#2563eb',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '10px 20px',
                    fontSize: '13px',
                    fontWeight: '700',
                    cursor: playsRemaining <= 0 ? 'not-allowed' : 'pointer'
                  }}
                >
                  {isPlayingAudio ? '🔊 Memutar Audio...' : '▶ Putar Audio'}
                </button>
              </div>
            </div>
          )}

          {/* Question Text */}
          <div
            style={{
              fontSize: '18px',
              fontWeight: '500',
              lineHeight: '1.6',
              marginBottom: '32px',
              background: '#1e293b',
              padding: '24px',
              borderRadius: '12px',
              border: '1px solid #334155'
            }}
          >
            {currentQuestion.questionText}
          </div>

          {/* Options List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {currentQuestion.options.map((opt, idx) => {
              const isSelected = userAnswers[currentQuestion.questionNumber] === idx;
              return (
                <div
                  key={opt.key}
                  onClick={() => handleSelectOption(idx)}
                  style={{
                    background: isSelected ? '#1e3a8a' : '#1e293b',
                    border: `2px solid ${isSelected ? '#38bdf8' : '#334155'}`,
                    borderRadius: '10px',
                    padding: '16px 20px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      background: isSelected ? '#38bdf8' : '#334155',
                      color: isSelected ? '#0f172a' : '#f8fafc',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: '800',
                      fontSize: '14px'
                    }}
                  >
                    {opt.key}
                  </div>
                  <div style={{ fontSize: '16px', color: '#f8fafc' }}>{opt.text}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Question Navigation Matrix */}
        <div
          style={{
            width: '320px',
            background: '#1e293b',
            borderLeft: '1px solid #334155',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          <div style={{ fontWeight: '700', fontSize: '14px', marginBottom: '16px', color: '#94a3b8' }}>
            PETA NAVIGASI SOAL
          </div>

          {isChokai && (
            <div
              style={{
                background: '#78350f',
                color: '#fef3c7',
                padding: '8px 12px',
                borderRadius: '6px',
                fontSize: '11px',
                marginBottom: '16px'
              }}
            >
              🔒 Mode Terkunci Chōkai: Navigasi linier maju saja aktif.
            </div>
          )}

          <div
            style={{
              flex: 1,
              display: 'grid',
              gridTemplateColumns: 'repeat(5, 1fr)',
              gap: '8px',
              overflowY: 'auto',
              alignContent: 'start'
            }}
          >
            {questions.map((q, idx) => {
              const isAnswered = userAnswers[q.questionNumber] !== undefined;
              const isCurrent = idx === currentQuestionIndex;
              const isFlagged = flaggedQuestions[q.questionNumber];

              return (
                <button
                  key={q.questionNumber}
                  disabled={isChokai}
                  onClick={() => setCurrentQuestionIndex(idx)}
                  style={{
                    height: '36px',
                    borderRadius: '6px',
                    border: isCurrent ? '2px solid #38bdf8' : '1px solid #475569',
                    background: isFlagged
                      ? '#d97706'
                      : isAnswered
                      ? '#059669'
                      : isCurrent
                      ? '#1e40af'
                      : '#334155',
                    color: '#ffffff',
                    fontWeight: '700',
                    fontSize: '12px',
                    cursor: isChokai ? 'not-allowed' : 'pointer'
                  }}
                >
                  {q.questionNumber}
                </button>
              );
            })}
          </div>

          {/* Navigation Controls */}
          <div style={{ display: 'flex', gap: '8px', marginTop: '20px' }}>
            <button
              disabled={isChokai || currentQuestionIndex === 0}
              onClick={() => setCurrentQuestionIndex((prev) => Math.max(0, prev - 1))}
              style={{
                flex: 1,
                background: isChokai || currentQuestionIndex === 0 ? '#334155' : '#475569',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                padding: '12px',
                fontSize: '13px',
                fontWeight: '700',
                cursor: isChokai || currentQuestionIndex === 0 ? 'not-allowed' : 'pointer'
              }}
            >
              ◀ Sebelumnya
            </button>

            <button
              disabled={currentQuestionIndex === questions.length - 1}
              onClick={() => setCurrentQuestionIndex((prev) => Math.min(questions.length - 1, prev + 1))}
              style={{
                flex: 1,
                background: '#2563eb',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                padding: '12px',
                fontSize: '13px',
                fontWeight: '700',
                cursor: 'pointer'
              }}
            >
              Berikutnya ▶
            </button>
          </div>
        </div>
      </div>

      {/* Result Diagnostic Modal */}
      {examResult && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.85)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000
          }}
        >
          <div
            style={{
              background: '#1e293b',
              border: `2px solid ${examResult.isPassed ? '#10b981' : '#ef4444'}`,
              borderRadius: '16px',
              padding: '36px',
              width: '540px',
              textAlign: 'center',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
            }}
          >
            <div style={{ fontSize: '48px', marginBottom: '8px' }}>
              {examResult.isPassed ? '🎉' : '📚'}
            </div>
            <div style={{ fontSize: '24px', fontWeight: '800', color: examResult.isPassed ? '#34d399' : '#f87171' }}>
              {examResult.isPassed ? 'LULUS (合格 - PASSED)' : 'BELUM LULUS (FAILED)'}
            </div>
            <div style={{ fontSize: '13px', color: '#94a3b8', marginTop: '4px' }}>
              Standar Kelulusan JFT-Basic A2: Minimal 200 dari 250 Poin
            </div>

            <div
              style={{
                margin: '24px 0',
                background: '#0f172a',
                padding: '20px',
                borderRadius: '12px',
                border: '1px solid #334155'
              }}
            >
              <div style={{ fontSize: '12px', color: '#94a3b8', textTransform: 'uppercase' }}>Total Skor Akhir</div>
              <div style={{ fontSize: '42px', fontWeight: '900', color: '#38bdf8' }}>
                {examResult.totalScore} <span style={{ fontSize: '18px', color: '#64748b' }}>/ 250</span>
              </div>
            </div>

            {/* Section Scores Breakdown */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', textAlign: 'left', marginBottom: '24px' }}>
              <div style={{ background: '#0f172a', padding: '12px', borderRadius: '8px', border: '1px solid #334155' }}>
                <div style={{ fontSize: '11px', color: '#94a3b8' }}>文字・語彙 (Moji & Goi)</div>
                <div style={{ fontSize: '16px', fontWeight: '800', color: '#38bdf8' }}>{examResult.sectionScores.s1_moji_goi} / 60</div>
              </div>
              <div style={{ background: '#0f172a', padding: '12px', borderRadius: '8px', border: '1px solid #334155' }}>
                <div style={{ fontSize: '11px', color: '#94a3b8' }}>会話・表現 (Kaiwa)</div>
                <div style={{ fontSize: '16px', fontWeight: '800', color: '#38bdf8' }}>{examResult.sectionScores.s2_kaiwa} / 60</div>
              </div>
              <div style={{ background: '#0f172a', padding: '12px', borderRadius: '8px', border: '1px solid #334155' }}>
                <div style={{ fontSize: '11px', color: '#94a3b8' }}>聴解 (Chōkai Audio)</div>
                <div style={{ fontSize: '16px', fontWeight: '800', color: '#38bdf8' }}>{examResult.sectionScores.s3_chokai} / 65</div>
              </div>
              <div style={{ background: '#0f172a', padding: '12px', borderRadius: '8px', border: '1px solid #334155' }}>
                <div style={{ fontSize: '11px', color: '#94a3b8' }}>読解 (Dokkai Reading)</div>
                <div style={{ fontSize: '16px', fontWeight: '800', color: '#38bdf8' }}>{examResult.sectionScores.s4_dokkai} / 65</div>
              </div>
            </div>

            <button
              onClick={() => setExamResult(null)}
              style={{
                background: '#2563eb',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                padding: '12px 28px',
                fontWeight: '700',
                fontSize: '14px',
                cursor: 'pointer'
              }}
            >
              Lihat Pembahasan Lengkap
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
export default CbtJftExamEngine;
