'use client';

import React, { useState } from 'react';
import {
  Sparkles,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Volume2,
  ArrowRight,
  HelpCircle,
  Zap,
  Award
} from 'lucide-react';
import { RenshuQuestion } from '@/lib/renshuStore';

interface RenshuPracticeEngineProps {
  questions: RenshuQuestion[];
  chapterId?: number;
  classId?: string;
  onCompleted?: () => void;
}

export const RenshuPracticeEngine: React.FC<RenshuPracticeEngineProps> = ({
  questions,
  chapterId = 1,
  classId = 'cls_batch1_n5',
  onCompleted
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedTokens, setSelectedTokens] = useState<string[]>([]);
  const [availableTokens, setAvailableTokens] = useState<string[]>(() => {
    return questions[0]?.shuffled_tokens || questions[0]?.correct_tokens || [];
  });
  const [selectedParticle, setSelectedParticle] = useState<string | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [evaluationResult, setEvaluationResult] = useState<{
    isCorrect: boolean;
    explanation?: string;
    targetSentenceJp?: string;
    xpEarned?: number;
  } | null>(null);

  const currentQ = questions[currentIndex] || questions[0];

  const handleSelectToken = (token: string, tokenIndex: number) => {
    if (evaluationResult) return;
    setSelectedTokens((prev) => [...prev, token]);
    setAvailableTokens((prev) => prev.filter((_, idx) => idx !== tokenIndex));
  };

  const handleRemoveToken = (token: string, tokenIndex: number) => {
    if (evaluationResult) return;
    setSelectedTokens((prev) => prev.filter((_, idx) => idx !== tokenIndex));
    setAvailableTokens((prev) => [...prev, token]);
  };

  const handleResetTokens = () => {
    if (evaluationResult) return;
    setSelectedTokens([]);
    setAvailableTokens(currentQ.shuffled_tokens || currentQ.correct_tokens || []);
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;

    let submitted: string[] = [];
    if (currentQ.question_type === 'drag_drop') {
      if (selectedTokens.length === 0) return;
      submitted = selectedTokens;
    } else {
      if (!selectedParticle) return;
      submitted = [selectedParticle];
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/n5/renshu/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionId: currentQ.id,
          classId,
          submittedTokens: submitted
        })
      });
      const data = await res.json();
      setEvaluationResult(data);

      if (data.isCorrect && data.feedbackAudio) {
        try {
          const audio = new Audio(data.feedbackAudio);
          audio.play().catch(() => {});
        } catch {}
      }
    } catch (err) {
      console.warn('Renshu submission error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNextQuestion = () => {
    setEvaluationResult(null);
    setSelectedTokens([]);
    setSelectedParticle(null);

    if (currentIndex < questions.length - 1) {
      const nextIndex = currentIndex + 1;
      setCurrentIndex(nextIndex);
      const nextQ = questions[nextIndex];
      setAvailableTokens(nextQ.shuffled_tokens || nextQ.correct_tokens || []);
    } else {
      if (onCompleted) onCompleted();
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header Info */}
      <div className="flex items-center justify-between text-xs font-bold text-stone-500 border-b border-stone-200 pb-3">
        <span className="flex items-center gap-1.5 text-stone-800">
          <Sparkles className="w-4 h-4 text-amber-500" />
          <span>Latihan Dinamis Renshu: Bab {chapterId}</span>
        </span>
        <span className="font-mono bg-stone-100 px-2.5 py-1 rounded-full text-stone-600">
          Soal {currentIndex + 1} dari {questions.length}
        </span>
      </div>

      {/* Question Prompt Card */}
      <div className="bg-white rounded-3xl border-2 border-stone-200 p-6 sm:p-8 shadow-xs space-y-4 text-center">
        <span className="text-[11px] font-black uppercase tracking-wider px-3 py-1 rounded-full bg-rose-50 text-red-700 border border-rose-200">
          {currentQ.question_type === 'drag_drop'
            ? 'Susun Kalimat (Drag & Drop / Tap to Place)'
            : 'Pilihan Partikel Kalimat (Fill-in-the-Blank)'}
        </span>

        <h3 className="text-xl sm:text-2xl font-black text-stone-900 leading-snug">
          &ldquo;{currentQ.prompt_text}&rdquo;
        </h3>

        {/* DRAG & DROP SENTENCE BUILDER INTERACTION */}
        {currentQ.question_type === 'drag_drop' && (
          <div className="space-y-6 pt-2">
            {/* Target Slots Area */}
            <div className="min-h-16 p-4 rounded-2xl bg-stone-50 border-2 border-dashed border-stone-300 flex flex-wrap items-center justify-center gap-2">
              {selectedTokens.length === 0 ? (
                <span className="text-xs text-stone-400 font-medium italic">
                  Sentuh atau tarik kepingan kata di bawah ini untuk menyusun kalimat...
                </span>
              ) : (
                selectedTokens.map((tok, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleRemoveToken(tok, idx)}
                    className="px-3.5 py-2 bg-gradient-to-r from-red-600 to-rose-600 text-white font-bold text-sm rounded-xl shadow-xs hover:bg-red-700 transition transform hover:scale-95 cursor-pointer font-japanese"
                    title="Klik untuk menghapus kepingan"
                  >
                    {tok}
                  </button>
                ))
              )}
            </div>

            {/* Available Random Tokens */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-stone-500 px-1">
                <span>Pilihan Kepingan Kata (Acak):</span>
                {selectedTokens.length > 0 && !evaluationResult && (
                  <button
                    type="button"
                    onClick={handleResetTokens}
                    className="text-stone-400 hover:text-stone-700 flex items-center gap-1 cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reset</span>
                  </button>
                )}
              </div>

              <div className="flex flex-wrap items-center justify-center gap-2.5">
                {availableTokens.map((tok, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectToken(tok, idx)}
                    className="px-4 py-2.5 bg-white hover:bg-stone-100 text-stone-800 font-bold text-sm sm:text-base rounded-2xl border-2 border-stone-200 hover:border-red-400 transition shadow-2xs transform active:scale-95 cursor-pointer font-japanese"
                  >
                    {tok}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* FILL-IN-THE-BLANK INTERACTION */}
        {currentQ.question_type === 'fill_blank' && (
          <div className="space-y-6 pt-2">
            <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 text-base sm:text-lg font-bold font-japanese">
              {currentQ.target_sentence_jp.replace(
                currentQ.correct_particle || 'は',
                selectedParticle ? ` [ ${selectedParticle} ] ` : ' [ ? ] '
              )}
            </div>

            <div className="space-y-2">
              <span className="text-xs font-bold text-stone-500">
                Pilih partikel yang tepat:
              </span>
              <div className="flex items-center justify-center gap-3">
                {(currentQ.particle_options || ['は', 'に', 'で', 'を']).map((pt, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedParticle(pt)}
                    className={`w-14 h-14 rounded-2xl border-2 font-black text-xl transition flex items-center justify-center cursor-pointer font-japanese ${
                      selectedParticle === pt
                        ? 'border-red-600 bg-red-50 text-red-700 shadow-md scale-105'
                        : 'border-stone-200 bg-white text-stone-800 hover:bg-stone-50'
                    }`}
                  >
                    {pt}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Result & Feedback Box */}
      {evaluationResult && (
        <div
          className={`p-6 rounded-3xl border-2 space-y-3 animate-in zoom-in-95 duration-150 ${
            evaluationResult.isCorrect
              ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
              : 'bg-rose-50 border-rose-300 text-rose-950'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {evaluationResult.isCorrect ? (
              <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
            ) : (
              <XCircle className="w-6 h-6 text-rose-600 shrink-0" />
            )}
            <h4 className="text-base font-black">
              {evaluationResult.isCorrect ? 'Benar Sekali! (正解)' : 'Belum Tepat (不正解)'}
            </h4>
            {evaluationResult.xpEarned && evaluationResult.xpEarned > 0 && (
              <span className="ml-auto inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-200 text-emerald-900 font-black text-xs">
                <Zap className="w-3.5 h-3.5 fill-emerald-700" />
                <span>+{evaluationResult.xpEarned} XP</span>
              </span>
            )}
          </div>

          {!evaluationResult.isCorrect && evaluationResult.explanation && (
            <div className="space-y-1 text-xs sm:text-sm text-stone-700 leading-relaxed border-t border-rose-200/60 pt-2">
              <div className="font-bold text-stone-900">
                Kalimat yang Benar: {evaluationResult.targetSentenceJp}
              </div>
              <p>{evaluationResult.explanation}</p>
            </div>
          )}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex items-center justify-between gap-3">
        {!evaluationResult ? (
          <button
            type="button"
            disabled={
              isSubmitting ||
              (currentQ.question_type === 'drag_drop' && selectedTokens.length === 0) ||
              (currentQ.question_type === 'fill_blank' && !selectedParticle)
            }
            onClick={handleSubmit}
            className="w-full py-4 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 disabled:opacity-40 text-white font-black text-sm rounded-2xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>{isSubmitting ? 'Memeriksa Jawaban...' : 'Periksa Jawaban'}</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={handleNextQuestion}
            className="w-full py-4 bg-stone-900 hover:bg-black text-white font-black text-sm rounded-2xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>{currentIndex < questions.length - 1 ? 'Soal Berikutnya' : 'Selesai Latihan'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};
