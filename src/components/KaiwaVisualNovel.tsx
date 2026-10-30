'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Volume2,
  Mic,
  Square,
  Play,
  RotateCcw,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  Zap,
  FastForward,
  Send,
  AlertCircle
} from 'lucide-react';
import { KaiwaScene, KaiwaLine } from '@/lib/kaiwaStore';

interface KaiwaVisualNovelProps {
  scene: KaiwaScene;
  onSceneCompleted?: () => void;
}

export const KaiwaVisualNovel: React.FC<KaiwaVisualNovelProps> = ({
  scene,
  onSceneCompleted
}) => {
  const [currentLineIndex, setCurrentLineIndex] = useState(0);
  const [displayedText, setDisplayedText] = useState('');
  const [isTypewriterComplete, setIsTypewriterComplete] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<0.5 | 0.75 | 1.0>(1.0);

  // Audio Shadowing Player
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);
  const [isPlayingNativeAudio, setIsPlayingNativeAudio] = useState(false);

  // MediaRecorder Voice Recording States
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [recordedAudioBlob, setRecordedAudioBlob] = useState<Blob | null>(null);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(null);
  const [isPlayingRecorded, setIsPlayingRecorded] = useState(false);
  const [isSubmittingVoice, setIsSubmittingVoice] = useState(false);
  const [submissionSuccess, setSubmissionSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordTimerRef = useRef<NodeJS.Timeout | null>(null);
  const recordedAudioRef = useRef<HTMLAudioElement | null>(null);

  const currentLine: KaiwaLine = scene.lines[currentLineIndex] || scene.lines[0];

  // Typewriter streaming effect (30ms per character)
  useEffect(() => {
    setDisplayedText('');
    setIsTypewriterComplete(false);

    let charIndex = 0;
    const fullText = currentLine.japanese_text;

    const interval = setInterval(() => {
      if (charIndex < fullText.length) {
        setDisplayedText(fullText.slice(0, charIndex + 1));
        charIndex++;
      } else {
        setIsTypewriterComplete(true);
        clearInterval(interval);
      }
    }, 30);

    return () => clearInterval(interval);
  }, [currentLineIndex, currentLine.japanese_text]);

  const handleSkipTypewriter = () => {
    setDisplayedText(currentLine.japanese_text);
    setIsTypewriterComplete(true);
  };

  // Play Native Audio at chosen speed
  const playNativeAudio = () => {
    try {
      if (audioPlayerRef.current) {
        audioPlayerRef.current.pause();
      }

      const audio = new Audio(currentLine.audio_url);
      audioPlayerRef.current = audio;
      audio.playbackRate = playbackSpeed;
      setIsPlayingNativeAudio(true);

      audio.onended = () => setIsPlayingNativeAudio(false);
      audio.onerror = () => {
        // Fallback to Web Speech API
        if ('speechSynthesis' in window) {
          const u = new SpeechSynthesisUtterance(currentLine.japanese_text);
          u.lang = 'ja-JP';
          u.rate = playbackSpeed;
          u.onend = () => setIsPlayingNativeAudio(false);
          window.speechSynthesis.speak(u);
        } else {
          setIsPlayingNativeAudio(false);
        }
      };

      audio.play().catch(() => {
        if ('speechSynthesis' in window) {
          const u = new SpeechSynthesisUtterance(currentLine.japanese_text);
          u.lang = 'ja-JP';
          u.rate = playbackSpeed;
          u.onend = () => setIsPlayingNativeAudio(false);
          window.speechSynthesis.speak(u);
        } else {
          setIsPlayingNativeAudio(false);
        }
      });
    } catch {
      setIsPlayingNativeAudio(false);
    }
  };

  // Start MediaRecorder in browser
  const startRecording = async () => {
    setErrorMessage('');
    setSubmissionSuccess(false);
    setRecordedAudioBlob(null);
    setRecordedAudioUrl(null);
    audioChunksRef.current = [];

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : 'audio/webm';

      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: mimeType });
        setRecordedAudioBlob(blob);
        const url = URL.createObjectURL(blob);
        setRecordedAudioUrl(url);

        // Stop microphone tracks
        stream.getTracks().forEach((track) => track.stop());
      };

      recorder.start();
      setIsRecording(true);
      setRecordingSeconds(0);

      recordTimerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      setErrorMessage('Izin mikrofon diperlukan untuk merekam lafal Anda.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (recordTimerRef.current) clearInterval(recordTimerRef.current);
    }
  };

  const playRecordedPreview = () => {
    if (!recordedAudioUrl) return;
    if (recordedAudioRef.current) {
      recordedAudioRef.current.pause();
    }
    const audio = new Audio(recordedAudioUrl);
    recordedAudioRef.current = audio;
    setIsPlayingRecorded(true);
    audio.onended = () => setIsPlayingRecorded(false);
    audio.play().catch(() => setIsPlayingRecorded(false));
  };

  // Upload voice recording to backend
  const handleSubmitRecording = async () => {
    if (!recordedAudioBlob || isSubmittingVoice) return;

    setIsSubmittingVoice(true);
    setErrorMessage('');

    try {
      const formData = new FormData();
      formData.append('audioFile', recordedAudioBlob, 'kaiwa_recording.webm');
      formData.append('lineId', currentLine.id);
      formData.append('durationSeconds', String(recordingSeconds || 3.0));

      const res = await fetch('/api/n5/kaiwa/submit-voice', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();

      if (data.success) {
        setSubmissionSuccess(true);
      } else {
        setErrorMessage(data.error || 'Gagal mengunggah audio.');
      }
    } catch (err) {
      setErrorMessage('Koneksi terputus saat mengunggah suara.');
    } finally {
      setIsSubmittingVoice(false);
    }
  };

  const handleNextLine = () => {
    setRecordedAudioBlob(null);
    setRecordedAudioUrl(null);
    setSubmissionSuccess(false);
    setErrorMessage('');

    if (currentLineIndex < scene.lines.length - 1) {
      setCurrentLineIndex((prev) => prev + 1);
    } else {
      if (onSceneCompleted) onSceneCompleted();
    }
  };

  const handlePrevLine = () => {
    if (currentLineIndex > 0) {
      setCurrentLineIndex((prev) => prev - 1);
      setRecordedAudioBlob(null);
      setRecordedAudioUrl(null);
      setSubmissionSuccess(false);
      setErrorMessage('');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* 2D Visual Novel Stage Canvas */}
      <div className="relative w-full h-[400px] sm:h-[480px] rounded-3xl overflow-hidden shadow-2xl border-2 border-stone-200 bg-stone-900 select-none">
        {/* Background Scenery Image */}
        <div
          className="absolute inset-0 bg-cover bg-center transition-all duration-700 opacity-60"
          style={{
            backgroundImage: `url(${scene.setting_background_url})`,
            backgroundColor: '#1c1917'
          }}
        />

        {/* Scene Title Badge */}
        <div className="absolute top-4 left-4 z-10">
          <span className="px-3 py-1 rounded-full bg-stone-900/80 backdrop-blur-md text-white font-black text-xs border border-white/20 flex items-center gap-1.5 shadow-sm">
            <Sparkles className="w-3 h-3 text-amber-400" />
            <span>{scene.scene_title}</span>
          </span>
        </div>

        {/* 2D Character Sprite Avatars */}
        <div className="absolute inset-0 flex justify-between items-end px-6 sm:px-12 pointer-events-none pb-24 sm:pb-28">
          {/* Left Character */}
          <div
            className={`transition-all duration-500 transform ${
              currentLine.character_position === 'left'
                ? 'scale-105 opacity-100 translate-y-0 filter drop-shadow-[0_10px_20px_rgba(0,0,0,0.5)]'
                : 'scale-90 opacity-40 translate-y-4'
            }`}
          >
            <div className="w-28 sm:w-44 h-48 sm:h-72 rounded-2xl bg-gradient-to-t from-stone-900/40 to-transparent flex items-end justify-center">
              <img
                src={currentLine.character_avatar_url}
                alt={currentLine.speaker_name}
                className="w-full h-full object-contain"
                onError={(e) => {
                  // Fallback avatar
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            </div>
          </div>

          {/* Right Character */}
          <div
            className={`transition-all duration-500 transform ${
              currentLine.character_position === 'right'
                ? 'scale-105 opacity-100 translate-y-0 filter drop-shadow-[0_10px_20px_rgba(0,0,0,0.5)]'
                : 'scale-90 opacity-40 translate-y-4'
            }`}
          >
            <div className="w-28 sm:w-44 h-48 sm:h-72 rounded-2xl bg-gradient-to-t from-stone-900/40 to-transparent flex items-end justify-center">
              <img
                src={currentLine.character_avatar_url}
                alt={currentLine.speaker_name}
                className="w-full h-full object-contain"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            </div>
          </div>
        </div>

        {/* Visual Novel Dialogue Box */}
        <div className="absolute bottom-3 inset-x-3 sm:inset-x-6 z-20 bg-stone-950/90 backdrop-blur-md border border-white/20 rounded-2xl p-4 sm:p-5 shadow-2xl space-y-2">
          {/* Speaker Name Tag */}
          <div className="flex items-center justify-between">
            <span className="px-3 py-0.5 rounded-lg bg-red-600 text-white font-black text-xs tracking-wider uppercase">
              {currentLine.speaker_name}
            </span>

            {/* Typewriter Skip Button */}
            {!isTypewriterComplete && (
              <button
                type="button"
                onClick={handleSkipTypewriter}
                className="text-[11px] font-bold text-stone-400 hover:text-white flex items-center gap-1 transition cursor-pointer"
              >
                <span>Lewati</span>
                <FastForward className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Typewriter Japanese Dialogue */}
          <div className="text-base sm:text-xl font-bold text-white font-japanese min-h-12 leading-relaxed">
            {displayedText}
            {!isTypewriterComplete && <span className="animate-pulse">|</span>}
          </div>

          {/* Romaji & Indonesian Translation */}
          {isTypewriterComplete && (
            <div className="text-xs text-stone-400 space-y-0.5 border-t border-white/10 pt-2 animate-in fade-in duration-200">
              <div className="font-mono text-stone-300">{currentLine.romaji}</div>
              <div className="text-amber-200/90">&ldquo;{currentLine.indonesian_translation}&rdquo;</div>
            </div>
          )}
        </div>
      </div>

      {/* Shadowing Player & Audio Playback Speed Controls */}
      <div className="bg-white rounded-3xl border-2 border-stone-200 p-5 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            disabled={isPlayingNativeAudio}
            onClick={playNativeAudio}
            className={`p-3.5 rounded-2xl transition cursor-pointer flex items-center gap-2 ${
              isPlayingNativeAudio
                ? 'bg-red-600 text-white animate-pulse'
                : 'bg-red-50 hover:bg-red-100 text-red-700 border border-red-200'
            }`}
          >
            <Volume2 className="w-5 h-5" />
            <span className="text-xs font-black">
              {isPlayingNativeAudio ? 'Memutar Audio...' : 'Dengar Shadowing'}
            </span>
          </button>

          {/* Speed Selector Buttons */}
          <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-xl">
            {([0.5, 0.75, 1.0] as const).map((spd) => (
              <button
                key={spd}
                type="button"
                onClick={() => setPlaybackSpeed(spd)}
                className={`px-2.5 py-1 text-xs font-bold rounded-lg transition cursor-pointer ${
                  playbackSpeed === spd
                    ? 'bg-white text-stone-900 shadow-xs'
                    : 'text-stone-500 hover:text-stone-800'
                }`}
              >
                {spd}x
              </button>
            ))}
          </div>
        </div>

        {/* Scene Line Pager Buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={currentLineIndex === 0}
            onClick={handlePrevLine}
            className="p-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 disabled:opacity-40 transition cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-xs font-mono font-bold text-stone-500">
            {currentLineIndex + 1} / {scene.lines.length}
          </span>
          <button
            type="button"
            onClick={handleNextLine}
            className="p-2.5 rounded-xl bg-stone-900 hover:bg-black text-white transition cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* In-Browser MediaRecorder Audio Recording Studio */}
      <div className="bg-gradient-to-br from-stone-50 to-white rounded-3xl border-2 border-stone-200 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Mic className="w-4 h-4 text-red-600" />
            <h4 className="text-sm font-black text-stone-900">
              Latihan Pelafalan Mandiri (In-Browser Voice Recording)
            </h4>
          </div>
          {currentLine.is_student_role && (
            <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
              Giliran Siswa Bicara
            </span>
          )}
        </div>

        {errorMessage && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-800 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Recording Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <div className="flex items-center gap-3">
            {!isRecording ? (
              <button
                type="button"
                onClick={startRecording}
                className="py-2.5 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs flex items-center gap-2 shadow-xs transition cursor-pointer"
              >
                <Mic className="w-4 h-4" />
                <span>Mulai Rekam Suara</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={stopRecording}
                className="py-2.5 px-4 rounded-xl bg-stone-900 hover:bg-black text-white font-bold text-xs flex items-center gap-2 shadow-xs transition cursor-pointer animate-pulse"
              >
                <Square className="w-4 h-4 fill-white" />
                <span>Stop ({recordingSeconds}s)</span>
              </button>
            )}

            {/* Play Preview of Recorded Audio */}
            {recordedAudioUrl && !isRecording && (
              <button
                type="button"
                onClick={playRecordedPreview}
                className="py-2.5 px-4 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold text-xs flex items-center gap-2 transition cursor-pointer"
              >
                <Play className="w-4 h-4" />
                <span>{isPlayingRecorded ? 'Memutar...' : 'Dengar Rekaman'}</span>
              </button>
            )}
          </div>

          {/* Submit Voice Button */}
          {recordedAudioBlob && !isRecording && !submissionSuccess && (
            <button
              type="button"
              disabled={isSubmittingVoice}
              onClick={handleSubmitRecording}
              className="py-2.5 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs flex items-center gap-2 shadow-xs transition cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isSubmittingVoice ? 'Mengirim...' : 'Kirim ke Sensei'}</span>
            </button>
          )}

          {submissionSuccess && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Terkirim! Menunggu ulasan Sensei</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
