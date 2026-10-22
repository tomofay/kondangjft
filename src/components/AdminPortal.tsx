'use client';

import React, { useState, useEffect, useRef } from 'react';
import { User, Question, Transaction, PDFQuestionDraft, SectionType, ExamResult } from '../types';
import { Users, FileText, Lock, Upload, Layers, DollarSign, BookOpen, X, ChevronLeft, ChevronRight, RefreshCw, Trash2, Shield, Image as ImageIcon, Link as LinkIcon, UploadCloud, Check, Volume2, Headphones, Sparkles, Eye, ZoomIn, AlertCircle, FileUp, FolderUp, Folder, FolderPlus, ArrowLeft, Edit3, Plus, Award, CheckCircle2, XCircle, Calendar, Clock, TrendingUp, BarChart3, Activity } from 'lucide-react';
import { isSubscriptionActive, getRemainingDays, getRemainingSubscriptionText, DEFAULT_ANONYMOUS_PHOTO } from '../lib/dataStore';
import { renderFormattedQuestion } from '../lib/formatQuestion';
import { JftResultReport } from './JftResultReport';

interface AdminPortalProps {
  users: User[];
  questions: Question[];
  transactions: Transaction[];
  pdfDrafts: PDFQuestionDraft[];
  examSets?: import('../types').ExamSet[];
  examResults?: ExamResult[];
  onKickSession: (userId: string) => Promise<void> | void;
  onAddCredit: (userId: string, count: number) => Promise<void> | void;
  onChangeRole?: (userId: string, newRole: 'user' | 'admin') => Promise<void> | void;
  onDeleteUser?: (userId: string) => Promise<void> | void;
  onRefreshData?: () => Promise<void> | void;
  onImportPdfText: (pdfText: string) => Promise<void>;
  onImportPdfFile?: (file: File) => Promise<{ success: boolean; draftsCount: number; imagesExtractedCount?: number; message: string }>;
  onSaveBatchQuestions?: (questions: Question[]) => Promise<void>;
  onSaveQuestion?: (question: Question) => void;
  onDeleteQuestion?: (questionId: number) => void;
}

export const AdminPortal: React.FC<AdminPortalProps> = ({
  users,
  questions,
  transactions,
  pdfDrafts,
  examSets = [],
  examResults = [],
  onKickSession,
  onAddCredit,
  onChangeRole,
  onDeleteUser,
  onRefreshData,
  onImportPdfText,
  onImportPdfFile,
  onSaveBatchQuestions,
  onSaveQuestion,
  onDeleteQuestion
}) => {
  const [activeTab, setActiveTab] = useState<'USERS' | 'QUESTIONS' | 'PDF_PARSER' | 'TRANSACTIONS'>('USERS');
  const [pdfInputText, setPdfInputText] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [parseMessage, setParseMessage] = useState('');
  const [actionLoadingUserId, setActionLoadingUserId] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // PDF Parsing & Batch Import States (Cara 2 Otomatisasi dengan Gambar)
  const [localDrafts, setLocalDrafts] = useState<PDFQuestionDraft[]>(pdfDrafts || []);
  const [selectedPdfFile, setSelectedPdfFile] = useState<File | null>(null);
  const [isUploadingPdf, setIsUploadingPdf] = useState(false);
  const [targetPackageId, setTargetPackageId] = useState<number>(1);
  const [isSavingBatch, setIsSavingBatch] = useState(false);
  const [batchSaveSuccess, setBatchSaveSuccess] = useState('');
  const [zoomPreviewImage, setZoomPreviewImage] = useState<string | null>(null);
  const [isManualTextOpen, setIsManualTextOpen] = useState(false);
  const pdfFileInputRef = useRef<HTMLInputElement | null>(null);
  const draftSpecificImageInputRef = useRef<HTMLInputElement | null>(null);
  const [activeDraftIdForImage, setActiveDraftIdForImage] = useState<string | null>(null);

  const allExamSets = examSets && examSets.length > 0 ? examSets : [
    { id: 1, name: 'Paket Ujian #1 (Simulasi Utama)', code: 'JFT-SET-A', description: '50 Soal standar asli JFT-Basic.', totalQuestions: 50 },
    { id: 2, name: 'Paket Ujian #2 (Intensif Kosakata & Tata Bahasa)', code: 'JFT-SET-B', description: '50 Soal variasi tata bahasa A2.', totalQuestions: 50 },
    { id: 3, name: 'Paket Ujian #3 (Master Chōkai Pendengaran)', code: 'JFT-SET-C', description: '50 Soal simulasi audio.', totalQuestions: 50 },
    { id: 4, name: 'Paket Ujian #4 (Tryout Spesial Final Test)', code: 'JFT-SET-D', description: '50 Soal komprehensif.', totalQuestions: 50 }
  ];

  const activePackageIds = React.useMemo(() => new Set(allExamSets.map((s) => s.id)), [allExamSets]);
  const activeQuestions = React.useMemo(() => {
    return questions.filter((q) => activePackageIds.has(q.packageId || 1));
  }, [questions, activePackageIds]);

  const nextPackageId = Math.max(...allExamSets.map((s) => s.id), 4) + 1;
  const nextLetter = String.fromCharCode(64 + Math.min(nextPackageId, 26));

  const [publishMode, setPublishMode] = useState<'new_package' | 'existing_package'>('new_package');
  const [newPackageName, setNewPackageName] = useState(`Paket Ujian #${nextPackageId} (Simulasi JFT-Basic Baru)`);
  const [newPackageCode, setNewPackageCode] = useState(`JFT-SET-${nextLetter}`);
  const [newPackageDescription, setNewPackageDescription] = useState('Paket simulasi hasil impor dokumen PDF lengkap dengan gambar & pembahasan.');

  useEffect(() => {
    setNewPackageName(`Paket Ujian #${nextPackageId} (Simulasi JFT-Basic Baru)`);
    setNewPackageCode(`JFT-SET-${nextLetter}`);
  }, [nextPackageId, nextLetter]);

  // Sync local drafts when pdfDrafts prop updates
  useEffect(() => {
    if (pdfDrafts && pdfDrafts.length > 0) {
      setLocalDrafts(pdfDrafts);
    }
  }, [pdfDrafts]);

  // Question Bank Editor Filters, Paging & Modal State
  const [selectedPkgFilter, setSelectedPkgFilter] = useState<number>(0); // 0 = Semua Paket
  const [selectedSecFilter, setSelectedSecFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [pageSize, setPageSize] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Bank Soal: Tampilan Per Paket (null = Daftar Paket, number = Detail Soal Paket)
  const [openedPackageId, setOpenedPackageId] = useState<number | null>(null);

  // Package CRUD Modal State
  const [isPackageModalOpen, setIsPackageModalOpen] = useState(false);
  const [packageModalMode, setPackageModalMode] = useState<'create' | 'edit'>('create');
  const [editingPackage, setEditingPackage] = useState<import('../types').ExamSet | null>(null);
  const [isSavingPackage, setIsSavingPackage] = useState(false);

  // Student Exam History & Progress Modal State
  const [selectedUserForHistory, setSelectedUserForHistory] = useState<User | null>(null);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [previewingExamResult, setPreviewingExamResult] = useState<ExamResult | null>(null);

  // Helper to determine package name & code for any exam result
  const getPackageInfoForResult = (result: ExamResult) => {
    let pkgId = result.packageId;
    if (!pkgId && result.answers && result.answers.length > 0) {
      const q = questions.find((item) => item.id === result.answers[0]?.questionId);
      if (q?.packageId) {
        pkgId = q.packageId;
      }
    }
    const set = allExamSets.find((s) => s.id === (pkgId || 1));
    return {
      id: pkgId || 1,
      name: set?.name || `Paket Ujian #${pkgId || 1}`,
      code: set?.code || `JFT-SET-${pkgId || 1}`
    };
  };

  // Question Image Upload State
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [uploadImageError, setUploadImageError] = useState('');

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editingQuestion) return;

    setIsUploadingImage(true);
    setUploadImageError('');

    try {
      const formData = new FormData();
      formData.append('image', file);

      const res = await fetch('/api/admin/upload-image', {
        method: 'POST',
        body: formData
      });

      const data = await res.json();
      if (data.success && data.url) {
        setEditingQuestion((prev) => prev ? { ...prev, imageUrl: data.url } : null);
      } else {
        setUploadImageError(data.message || 'Gagal mengunggah gambar.');
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setUploadImageError('Gagal menghubungi server: ' + msg);
    } finally {
      setIsUploadingImage(false);
      if (e.target) e.target.value = '';
    }
  };

  // Question Audio Upload State
  const audioFileInputRef = React.useRef<HTMLInputElement | null>(null);
  const [isUploadingAudio, setIsUploadingAudio] = useState(false);
  const [uploadAudioError, setUploadAudioError] = useState('');

  const handleAudioUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editingQuestion) return;

    setIsUploadingAudio(true);
    setUploadAudioError('');

    try {
      const formData = new FormData();
      formData.append('audio', file);

      const res = await fetch('/api/admin/upload-audio', {
        method: 'POST',
        body: formData
      });

      const data = await res.json();
      if (data.success && data.url) {
        setEditingQuestion((prev) => prev ? { ...prev, audioUrl: data.url } : null);
      } else {
        setUploadAudioError(data.message || 'Gagal mengunggah file audio.');
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setUploadAudioError('Gagal menghubungi server: ' + msg);
    } finally {
      setIsUploadingAudio(false);
      if (e.target) e.target.value = '';
    }
  };

  // Sample PDF demo text generator (Contoh format autentik JFT-Basic 37 Soal)
  const fillSamplePdfText = () => {
    setPdfInputText(`お名前：＿＿＿＿＿＿＿＿ ＿＿＿年＿＿＿月＿＿＿日
もじ・ごい
１． １．さむい
２．じめじめする
３．あたたかい
２． １．暑いのが好き
２．暑いのが苦手
３．暑いのがまぶしい
３． １．きれいな公園
２．町がにぎやか
３．みどりが多い
４． １．ちこくした
２．ねてしまった
３．ねぼうした
５．この島は、大きい森があります。
１．とり ２．しま ３．うま
６．ここは、有名な観光地で、日本からのお客さんが多いです。
１．かんこうち ２．けんこうち ３．かんこうじ
７．日本で、好きな歌手がいますか。
１．かしゅう ２．うたて ３．かしゅ
８．まごが可愛いですが、よくなきます。
１．泣きます ２．歩きます ３．空きます
９．レストランをよやくしました。
１．約束 ２．予約 ３．予定
１０．ぎゅうにゅうと生の魚が苦手です。
１．牛肉 ２．牛入 ３．牛乳
１１．魚をやきます。
１．焼き ２．向き ３．巻き
１２．りょかんに泊まってみたいです。
１．旅館 ２．料館 ３．族館
１３． A：京都に美術館は＿＿＿＿＿ありますか。
B：３つあります。
１．いくら ２．いくつ ３．なんだい
１４． A：このトマト、何もかけないで、＿＿＿＿食べて。
B：はい。…あ、甘くておいしい！
１．それから ２．そのまま ３．これで
１５．ナインさんは＿＿＿＿をかぶっている人です。
１．ぼうし ２．めがね ３．くつ
かいわ・ひょうげん
１６．その魚は＿＿＿＿＿＿＿かもしれませんよ。ちょっと悪くなっているようですから。
１．たべてもいい
２．食べなければならない
３．食べないほうがいい
１７. いろいろ＿＿＿＿＿＿＿＿＿＿、ありがとうございました。
１．おしえて ２．おしえたのは ３．おしえてくれて
１８． 母：このマンガ、もうすてるよ。
子：ああ、＿＿＿＿＿＿。ぼく、まだ読むから。
１．すてる ２．すてないと ３．すてないで
１９．Ａ：＿＿＿＿＿＿＿＿な赤ちゃんですね。
Ｂ：ええ、とてもかわいいです。
１．げんきそう ２．げんきそうに ３．げんきだ
２０．安室奈美恵はかっこいい＿＿＿、歌もダンスも上手だ＿＿＿。テレビを見て、好きになりました。
１．くて、し ２．し、し ３．し、が
２１．パーティーのために料理を作っ＿＿＿飲み物を買っ＿＿＿した。
１．て、て ２．し、し ３．たり、たり
２２．A：あした、朝６時にここに＿＿＿＿＿＿＿＿か。
B：はい、だいじょうぶです。
１．来る ２．来ない ３．来られます
２３．A：すみません。ちょっと使い方を＿＿＿＿＿＿＿か。
B：お引き出しですか。
A：そうです。
B：じゃ、まずここをおしてください。
１．おしえてもいいです ２．おしえてくださいません
３．おしえます
２４．A：どうぞお上がりください。
B：＿＿＿＿＿＿＿＿＿。
１．いらっしゃい ２．おかえりなさい ３．しつれいします
２５. さっき、空港に＿＿＿＿ばかりです。
１．ついた ２．つかない ３．ついて
２６． A：お茶をどうぞ。
B：＿＿＿＿＿＿＿＿。
１．いただきます ２．どういたしまして ３．ごちそうさまでした
２７． A：このカレー、ピーナッツが＿＿＿＿＿＿＿＿？
B：いえ、だいじょうぶですよ。
１．空いていますか ２．どうしますか ３．入っていますか
２８． A：＿＿＿＿＿＿、みかん、1 つどうですか。
B：ありがとうございます。
１．たしかに ２．よかったら ３．なんとか
２９． A：明日の会議、プロジェクターは使いますか。
B：はい、でも、準備は高橋さんに頼んだから、＿＿＿＿＿＿。
１．もういっぱいです
２．いいです
３．とくにないです
３０． A：昨日は休んで、＿＿＿＿＿＿＿＿。
B：いえ、だいじょうぶですよ。
１．ありがとうございました ２．お疲れさまでした
３．すみませんでした
どっかい
ゆうこさんが リンさんに メモを書きました。
リンさん、おかえりなさい。
れいぞうこに ケーキがありますから 食べてください。
ぜんぶ食べないでくださいね。わたしも食べますから。
ゆうこ
３１．ケーキをぜんぶ食べてもいいですか。
１．はい、ひとりでぜんぶ食べてください。
２．いいえ、ゆうこさんに少しあげてください。
３．いいえ、れいぞうこのケーキは食べないでください。
３２．王さんはあした、何をしますか。
１．山本さんにタコ焼きの作り方を教える
２．山登りのガイドブックを借りる
３．上野公園で桜を見る
３３．アンナさんは、中村さんに会ったとき何をしますか。
１．メールを送って、ノートを貸してもらいます。
２．ノートを借りて、レポートの説明を聞きます。
３．ノートを貸して、レポートの説明をします。
３４．このお知らせから、公園についてわかることはなんですか。
１． 午後１０時に公園に入ってもいいです。
２． 入口にオートバイをとめてはいけません。
３． サッカーの練習をしてはいけません。
３５．この「おねがい」から、わかることは何ですか。
１．自転車は白い線の中に、ならべてはいけません。
２．木曜日の午後１０時に、もえるゴミを出してもいいです。
３．水曜日の午後８時に、もえないゴミを出してはいけません。
３６．水曜日に６０分のコースを選んだあと、もう２０分乾燥したい人は、全部でいくら払いますか。
１．５００円 ２．６００円 ３．７００円
３７．このコインランドリーで、できないことはどれですか。
１．洗濯だけを１時間する
２．カーペットを洗う
３．コース１を２回する`);
  };

  const handleRunPdfParse = async () => {
    if (!pdfInputText.trim()) return;
    setIsParsing(true);
    setParseMessage('');
    try {
      await onImportPdfText(pdfInputText);
      setParseMessage('Berhasil mengimpor draf soal dari teks PDF!');
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setParseMessage('Gagal mengurai PDF: ' + msg);
    } finally {
      setIsParsing(false);
    }
  };

  // Handler Upload Berkas PDF (Cara 2 Otomatisasi dengan Ekstraksi Gambar)
  const handleUploadPdfFile = async () => {
    if (!selectedPdfFile) return;
    setIsUploadingPdf(true);
    setParseMessage('');
    setBatchSaveSuccess('');

    try {
      if (onImportPdfFile) {
        const res = await onImportPdfFile(selectedPdfFile);
        setParseMessage(res.message || `Berhasil mengekstrak ${res.draftsCount} draf soal beserta gambar otomatis!`);
      } else {
        const formData = new FormData();
        formData.append('file', selectedPdfFile);
        const res = await fetch('/api/admin/parse-pdf', {
          method: 'POST',
          body: formData
        });
        const data = await res.json();
        if (data.success && Array.isArray(data.drafts)) {
          setLocalDrafts(data.drafts);
          setParseMessage(data.message || `Berhasil mengekstrak ${data.drafts.length} draf soal!`);
        } else {
          setParseMessage(data.message || 'Gagal mengekstrak berkas PDF.');
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setParseMessage('Gagal mengurai berkas PDF: ' + msg);
    } finally {
      setIsUploadingPdf(false);
    }
  };

  // Simpan Seluruh Draf Soal ke Paket Ujian Baru / Yang Ada (MySQL & Halaman Depan)
  const handleSaveAllDraftsToPackage = async () => {
    if (localDrafts.length === 0) return;
    setIsSavingBatch(true);
    setBatchSaveSuccess('');

    try {
      let finalPkgId = targetPackageId;
      let finalPkgName = `Paket #${targetPackageId}`;

      if (publishMode === 'new_package') {
        finalPkgId = nextPackageId;
        finalPkgName = newPackageName.trim() || `Paket Ujian #${nextPackageId}`;
        const finalCode = newPackageCode.trim() || `JFT-SET-${nextLetter}`;
        const finalDesc = newPackageDescription.trim() || `Simulasi ${localDrafts.length} soal JFT-Basic hasil impor dokumen PDF.`;

        // 1. Buat paket ujian baru via API
        const setRes = await fetch('/api/exam-sets', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: finalPkgId,
            name: finalPkgName,
            code: finalCode,
            description: finalDesc,
            totalQuestions: localDrafts.length
          })
        });
        const setData = await setRes.json();
        if (!setData.success) {
          throw new Error(setData.message || 'Gagal membuat paket ujian baru');
        }
      }

      const maxId = questions.length > 0 ? Math.max(...questions.map((q) => q.id)) : 0;
      const secTitles: Record<SectionType, string> = {
        S1: 'Seksi 1 - 文字と語彙 (Huruf & Kosakata)',
        S2: 'Seksi 2 - 会話表現 (Percakapan & Ekspresi)',
        S3: 'Seksi 3 - 聴解 (Pendengaran)',
        S4: 'Seksi 4 - 読解 (Pemahaman Bacaan)'
      };

      const newQuestions: Question[] = localDrafts.map((d, idx) => ({
        id: maxId + idx + 1,
        packageId: finalPkgId,
        section: d.section,
        sectionTitle: d.sectionTitle || secTitles[d.section] || d.section,
        number: d.number || idx + 1,
        questionText: d.questionText,
        readingPassage: d.passageText || undefined,
        imageUrl: d.imageUrl || undefined,
        audioUrl: d.audioUrl || undefined,
        options: d.options,
        correctAnswer: d.correctAnswer,
        explanation: d.explanation
      }));

      if (onSaveBatchQuestions) {
        await onSaveBatchQuestions(newQuestions);
      } else {
        const res = await fetch('/api/questions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ questions: newQuestions })
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.message || 'Gagal menyimpan batch soal');
      }

      if (onRefreshData) await onRefreshData();

      setBatchSaveSuccess(`🎉 Alhamdulillah! Berhasil menerbitkan ${newQuestions.length} soal lengkap ke '${finalPkgName}'! Paket ujian ini langsung aktif dan dapat dikerjakan siswa di Halaman Depan.`);
      setLocalDrafts([]);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      alert('Gagal menerbitkan paket soal: ' + msg);
    } finally {
      setIsSavingBatch(false);
    }
  };

  const handleUploadDraftSpecificImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeDraftIdForImage) return;

    try {
      const formData = new FormData();
      formData.append('image', file);
      const res = await fetch('/api/admin/upload-image', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (data.success && data.url) {
        setLocalDrafts((prev) =>
          prev.map((d) => (d.id === activeDraftIdForImage ? { ...d, imageUrl: data.url } : d))
        );
      } else {
        alert(data.message || 'Gagal mengunggah gambar');
      }
    } catch (err) {
      alert('Gagal mengunggah: ' + err);
    } finally {
      setActiveDraftIdForImage(null);
      if (e.target) e.target.value = '';
    }
  };

  const handleRemoveDraftImage = (draftId: string) => {
    setLocalDrafts((prev) => prev.map((d) => (d.id === draftId ? { ...d, imageUrl: undefined } : d)));
  };

  const handleUpdateDraftAnswer = (draftId: string, ans: 'A' | 'B' | 'C' | 'D') => {
    setLocalDrafts((prev) => prev.map((d) => (d.id === draftId ? { ...d, correctAnswer: ans } : d)));
  };

  const handleDeleteSingleDraft = (draftId: string) => {
    setLocalDrafts((prev) => prev.filter((d) => d.id !== draftId));
  };

  // Paket Ujian CRUD Handlers
  const handleOpenCreatePackage = () => {
    setPackageModalMode('create');
    setEditingPackage({
      id: nextPackageId,
      name: `Paket Ujian #${nextPackageId} (Simulasi JFT-Basic Baru)`,
      code: `JFT-SET-${nextLetter}`,
      description: `Paket simulasi latihan soal JFT-Basic lengkap.`,
      totalQuestions: 50
    });
    setIsPackageModalOpen(true);
  };

  const handleOpenEditPackage = (pkg: import('../types').ExamSet, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setPackageModalMode('edit');
    setEditingPackage({ ...pkg });
    setIsPackageModalOpen(true);
  };

  const handleSavePackage = async () => {
    if (!editingPackage) return;
    if (!editingPackage.name.trim()) {
      alert('Nama paket ujian tidak boleh kosong!');
      return;
    }
    setIsSavingPackage(true);
    try {
      const res = await fetch('/api/exam-sets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingPackage)
      });
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.message || 'Gagal menyimpan paket ujian');
      }
      if (onRefreshData) await onRefreshData();
      setIsPackageModalOpen(false);
      setEditingPackage(null);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      alert('Gagal menyimpan paket ujian: ' + msg);
    } finally {
      setIsSavingPackage(false);
    }
  };

  const handleDeletePackage = async (pkg: import('../types').ExamSet, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const pkgQuestions = questions.filter((q) => (q.packageId || 1) === pkg.id);
    const confirmText = `Apakah Anda yakin ingin menghapus '${pkg.name}' (${pkg.code})?\n\nPerhatian: ${pkgQuestions.length} soal di dalam paket ini akan ikut dihapus secara permanen dari database!`;
    if (!window.confirm(confirmText)) return;

    try {
      const res = await fetch(`/api/exam-sets?id=${pkg.id}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.message || 'Gagal menghapus paket ujian');
      }
      if (openedPackageId === pkg.id) {
        setOpenedPackageId(null);
      }
      if (onRefreshData) await onRefreshData();
      alert(`Paket '${pkg.name}' berhasil dihapus.`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      alert('Gagal menghapus paket: ' + msg);
    }
  };

  const handleOpenEdit = (q: Question) => {
    setEditingQuestion({ ...q, options: q.options.map(o => ({ ...o })) });
    setIsEditModalOpen(true);
  };

  const handleOpenAdd = () => {
    const nextId = questions.length > 0 ? Math.max(...questions.map((q) => q.id)) + 1 : 1;
    const targetPkg = openedPackageId !== null ? openedPackageId : (selectedPkgFilter > 0 ? selectedPkgFilter : 1);
    const pkgQuestions = questions.filter((q) => (q.packageId || 1) === targetPkg);
    const nextNumber = pkgQuestions.length > 0 ? Math.max(...pkgQuestions.map((q) => q.number)) + 1 : 1;

    setEditingQuestion({
      id: nextId,
      packageId: targetPkg,
      section: 'S1',
      sectionTitle: 'Seksi 1 - 文字と語彙 (Huruf & Kosakata)',
      number: nextNumber,
      questionText: '',
      options: [
        { key: 'A', text: '' },
        { key: 'B', text: '' },
        { key: 'C', text: '' },
        { key: 'D', text: '' }
      ],
      correctAnswer: 'A',
      explanation: ''
    });
    setIsEditModalOpen(true);
  };

  const handleSaveEditModal = () => {
    if (!editingQuestion || !onSaveQuestion) return;
    if (!editingQuestion.questionText.trim()) {
      alert('Teks pertanyaan tidak boleh kosong!');
      return;
    }
    onSaveQuestion(editingQuestion);
    setIsEditModalOpen(false);
    setEditingQuestion(null);
  };

  // Filter questions list (jika membuka paket tertentu, filter khusus paket tersebut)
  const filteredQuestions = questions.filter((q) => {
    const pkg = q.packageId || 1;
    if (openedPackageId !== null) {
      if (pkg !== openedPackageId) return false;
    } else if (selectedPkgFilter > 0 && pkg !== selectedPkgFilter) {
      return false;
    }
    if (selectedSecFilter !== 'ALL' && q.section !== selectedSecFilter) return false;
    if (searchQuery.trim()) {
      const qText = (q.questionText + ' ' + q.explanation).toLowerCase();
      if (!qText.includes(searchQuery.toLowerCase())) return false;
    }
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      {/* Admin Header */}
      <div className="bg-white text-stone-900 p-6 rounded-3xl shadow-sm border border-stone-200/90 flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="px-3 py-1 rounded-full bg-gradient-to-r from-rose-50 via-amber-50 to-sky-50 border border-stone-200 text-stone-800 text-xs font-bold uppercase tracking-wider inline-flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-pulse" />
            Superadmin Control Panel
          </span>
          <h1 className="text-2xl font-black tracking-tight mt-1.5 text-stone-900">Portal Administrator KondangSensei</h1>
          <p className="text-xs text-stone-500">Kelola Bank Soal 50 Soal, Sesi Single Lock, Transaksi & Parser PDF</p>
        </div>

        {/* Tab Buttons with Distinct KondangSensei Color Identity */}
        <div className="flex flex-wrap gap-1.5 bg-stone-100 p-1.5 rounded-2xl border border-stone-200 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('USERS')}
            className={`px-4 py-2 rounded-xl transition flex items-center gap-1.5 ${
              activeTab === 'USERS' ? 'bg-sky-600 text-white shadow font-bold' : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/60'
            }`}
          >
            <Users className="w-4 h-4" />
            Peserta & Sesi ({users.length})
          </button>

          <button
            onClick={() => setActiveTab('QUESTIONS')}
            className={`px-4 py-2 rounded-xl transition flex items-center gap-1.5 ${
              activeTab === 'QUESTIONS' ? 'bg-emerald-600 text-white shadow font-bold' : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/60'
            }`}
          >
            <Layers className="w-4 h-4" />
            Bank Soal ({activeQuestions.length})
          </button>

          <button
            onClick={() => setActiveTab('PDF_PARSER')}
            className={`px-4 py-2 rounded-xl transition flex items-center gap-1.5 ${
              activeTab === 'PDF_PARSER' ? 'bg-violet-600 text-white shadow font-bold' : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/60'
            }`}
          >
            <FileText className="w-4 h-4 text-amber-300" />
            Parser PDF Importer
          </button>

          <button
            onClick={() => setActiveTab('TRANSACTIONS')}
            className={`px-4 py-2 rounded-xl transition flex items-center gap-1.5 ${
              activeTab === 'TRANSACTIONS' ? 'bg-amber-600 text-white shadow font-bold' : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/60'
            }`}
          >
            <DollarSign className="w-4 h-4" />
            Transaksi ({transactions.length})
          </button>
        </div>
      </div>

      {/* Tab 1: Users & Single Session Lock Manager */}
      {activeTab === 'USERS' && (
        <div className="bg-white rounded-3xl p-6 shadow-xl border border-stone-200 space-y-6">
          <div className="flex flex-wrap items-center justify-between border-b pb-4 border-stone-200 gap-4">
            <div>
              <h2 className="text-lg font-bold text-stone-900 flex items-center gap-2">
                <Lock className="w-5 h-5 text-red-600" />
                Manajemen Pengguna & Sesi Tunggal ({users.length} Akun Terdaftar)
              </h2>
              <p className="text-xs text-stone-500">
                Data terhubung langsung ke Database MySQL. Setiap akun memiliki proteksi 1 sesi aktif (Single Device Lock).
              </p>
            </div>

            {onRefreshData && (
              <button
                type="button"
                onClick={async () => {
                  setIsRefreshing(true);
                  try {
                    await onRefreshData();
                  } finally {
                    setIsRefreshing(false);
                  }
                }}
                disabled={isRefreshing}
                className="px-3.5 py-2 rounded-xl bg-stone-100 hover:bg-stone-100:bg-stone-200 text-stone-700 text-xs font-bold transition flex items-center gap-1.5 border border-stone-200 shadow-sm"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-red-600' : ''}`} />
                {isRefreshing ? 'Memuat Ulang...' : 'Sinkronkan Data'}
              </button>
            )}
          </div>

          {/* Realtime Live Monitoring Banner */}
          {(() => {
            const now = Date.now();
            const onlineCount = users.filter((u) => Boolean(u.activeSessionId && u.lastActiveAt && (now - Number(u.lastActiveAt) < 15000))).length;
            const examCount = users.filter((u) => {
              const isOnline = Boolean(u.activeSessionId && u.lastActiveAt && (now - Number(u.lastActiveAt) < 15000));
              return isOnline && u.currentActivity?.view === 'exam';
            }).length;

            return (
              <div className="p-4 rounded-2xl bg-emerald-50/80 border border-emerald-200 text-emerald-900 flex flex-wrap items-center justify-between gap-3 shadow-sm">
                <div className="flex items-center gap-2.5">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                  </span>
                  <div>
                    <div className="text-xs font-black text-emerald-800 flex items-center gap-1.5">
                      <span>Live Realtime Monitor Aktif</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-mono">Sync 2s</span>
                    </div>
                    <div className="text-[11px] text-emerald-700/80">
                      Data aktivitas siswa diperbarui otomatis secara langsung tanpa perlu memuat ulang halaman.
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap text-xs">
                  <div className="px-3 py-1.5 rounded-xl bg-white border border-emerald-300 text-emerald-800 shadow-xs font-bold flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                    <span>{onlineCount} Siswa Online</span>
                  </div>
                  {examCount > 0 && (
                    <div className="px-3 py-1.5 rounded-xl bg-rose-50 border border-rose-300 text-red-800 shadow-xs font-bold flex items-center gap-1.5 animate-pulse">
                      <Activity className="w-3.5 h-3.5 text-red-600" />
                      <span>{examCount} Sedang Mengerjakan CBT</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })()}

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-stone-200 bg-stone-50 text-stone-500 uppercase tracking-wider font-bold">
                  <th className="p-3">Nama & No. Reg</th>
                  <th className="p-3">Email Akun</th>
                  <th className="p-3">Role</th>
                  <th className="p-3 min-w-[220px]">Status & Aktivitas Realtime</th>
                  <th className="p-3">Masa Aktif Akses</th>
                  <th className="p-3">Progres & Riwayat Tes</th>
                  <th className="p-3 text-right">Kelola Akun</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-stone-400">
                      Belum ada data pengguna terdaftar di database.
                    </td>
                  </tr>
                ) : (
                  users.map((u) => {
                    const hasActiveSession = !!u.activeSessionId;
                    const isBusy = actionLoadingUserId === u.id;

                    return (
                      <tr key={u.id} className="hover:bg-stone-50:bg-stone-100 transition">
                        <td className="p-3 font-semibold text-stone-900">
                          <div className="flex items-center gap-2">
                            <img
                              src={
                                u.facePhotoUrl && !u.facePhotoUrl.includes('unsplash.com')
                                  ? u.facePhotoUrl
                                  : DEFAULT_ANONYMOUS_PHOTO
                              }
                              alt={u.name}
                              className="w-7 h-7 rounded-full object-cover border border-stone-200"
                            />
                            <div>
                              <div>{u.name}</div>
                              <div className="text-[10px] text-stone-400 font-mono">{u.registrationNumber || u.id}</div>
                            </div>
                          </div>
                        </td>

                        <td className="p-3 text-stone-600 font-mono text-[11px]">
                          {u.email}
                        </td>

                        <td className="p-3">
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] uppercase ${
                                u.role === 'admin'
                                  ? 'bg-rose-100 text-red-600 border border-rose-200'
                                  : 'bg-stone-100 text-stone-600'
                              }`}
                            >
                              {u.role}
                            </span>
                            {onChangeRole && (
                              <button
                                type="button"
                                title={`Ganti role menjadi ${u.role === 'admin' ? 'user' : 'admin'}`}
                                onClick={async () => {
                                  if (confirm(`Ubah role ${u.name} menjadi ${u.role === 'admin' ? 'user biasa' : 'superadmin'}?`)) {
                                    setActionLoadingUserId(u.id);
                                    try {
                                      await onChangeRole(u.id, u.role === 'admin' ? 'user' : 'admin');
                                    } finally {
                                      setActionLoadingUserId(null);
                                    }
                                  }
                                }}
                                disabled={isBusy}
                                className="text-stone-400 hover:text-red-600 p-0.5 transition"
                              >
                                <Shield className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>

                        <td className="p-3">
                          {(() => {
                            const isOnline = Boolean(u.activeSessionId && u.lastActiveAt && (Date.now() - Number(u.lastActiveAt) < 15000));
                            const act = u.currentActivity;

                            if (isOnline) {
                              return (
                                <div className="space-y-1.5 py-1">
                                  <div className="flex items-center gap-1.5">
                                    <span className="relative flex h-2.5 w-2.5">
                                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                                    </span>
                                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-mono text-[10px] font-black border border-emerald-300">
                                      Online • Sesi Aktif
                                    </span>
                                  </div>

                                  {/* Live What They Are Doing */}
                                  {act?.view === 'exam' ? (
                                    <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-xs space-y-1 shadow-xs">
                                      <div className="flex items-center gap-1.5 font-black text-red-700 text-[11px]">
                                        <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse"></span>
                                        <span>Mengerjakan: {act.packageName || 'Paket Ujian'}</span>
                                      </div>
                                      <div className="font-extrabold text-stone-800 text-[11px] flex items-center gap-1">
                                        <span>Soal No. {act.currentNumber || 1}</span>
                                        <span className="text-[10px] text-red-600 font-mono">({act.currentSection || 'S1'})</span>
                                      </div>
                                      <div className="flex items-center gap-2 text-[10px] text-stone-500 flex-wrap">
                                        <span className="font-semibold text-stone-700">
                                          ✓ {act.answeredCount || 0}/{act.totalQuestions || 50} Soal
                                        </span>
                                        <span>•</span>
                                        <span className="text-amber-600 font-bold font-mono">
                                          ⏱ Sisa {Math.floor((act.timeLeftSeconds || 0) / 60)}m {(act.timeLeftSeconds || 0) % 60}s
                                        </span>
                                      </div>
                                    </div>
                                  ) : act?.view === 'dashboard' ? (
                                    <div className="px-2.5 py-1 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 text-[11px] font-semibold flex items-center gap-1.5 w-max">
                                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                                      Di Dashboard Utama
                                    </div>
                                  ) : act?.view === 'report' ? (
                                    <div className="px-2.5 py-1 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-semibold flex items-center gap-1.5 w-max">
                                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                      Melihat Rapor Hasil Ujian
                                    </div>
                                  ) : act?.view === 'review' ? (
                                    <div className="px-2.5 py-1 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 text-[11px] font-semibold flex items-center gap-1.5 w-max">
                                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                                      Melihat Pembahasan Soal
                                    </div>
                                  ) : act?.view === 'admin' ? (
                                    <div className="px-2.5 py-1 rounded-xl bg-stone-100 text-stone-600 text-[11px] font-semibold flex items-center gap-1.5 w-max">
                                      <span className="w-1.5 h-1.5 rounded-full bg-stone-400"></span>
                                      Di Portal Admin
                                    </div>
                                  ) : (
                                    <span className="text-[11px] text-stone-500">
                                      Aktif di Aplikasi
                                    </span>
                                  )}
                                </div>
                              );
                            }

                            if (u.activeSessionId) {
                              return (
                                <div className="space-y-1">
                                  <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 text-[10px] font-semibold border border-amber-200 flex items-center gap-1 w-max">
                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                                    Sesi Terkunci (Tab Ditutup / Idle)
                                  </span>
                                  {act?.packageName && (
                                    <div className="text-[10px] text-stone-400 truncate max-w-[170px]" title={act.packageName}>
                                      Terakhir: {act.packageName}
                                    </div>
                                  )}
                                </div>
                              );
                            }

                            return (
                              <span className="text-stone-400 text-[11px] flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-stone-200"></span>
                                Offline
                              </span>
                            );
                          })()}
                        </td>

                        <td className="p-3 font-bold text-stone-800">
                          {isSubscriptionActive(u) ? (
                            <span className="text-emerald-600">
                              {getRemainingSubscriptionText(u)}
                            </span>
                          ) : (
                            <span className="text-red-500 font-semibold text-[11px]">Kedaluwarsa</span>
                          )}
                        </td>

                        {/* Progres & Riwayat Tes */}
                        <td className="p-3">
                          {(() => {
                            const userAttempts = (examResults || []).filter((r) => r.userId === u.id);
                            if (userAttempts.length === 0) {
                              return (
                                <span className="px-2.5 py-1 rounded-lg bg-stone-100 text-stone-400 text-[11px] font-medium flex items-center gap-1 w-max">
                                  Belum ada tes
                                </span>
                              );
                            }

                            const highestScore = Math.max(...userAttempts.map((r) => r.totalScore));
                            const passedCount = userAttempts.filter((r) => r.isPassed).length;
                            const latestAttempt = userAttempts[0];
                            const latestPkg = getPackageInfoForResult(latestAttempt);

                            return (
                              <div className="space-y-1">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="px-2 py-0.5 rounded-md bg-rose-50 text-red-700 font-bold text-[10px] border border-rose-200">
                                    {userAttempts.length}x Tes
                                  </span>
                                  <span className="text-[11px] font-extrabold text-stone-900">
                                    Max: <span className="text-red-600">{highestScore}</span><span className="text-[10px] text-stone-400 font-normal">/250</span>
                                  </span>
                                  {passedCount > 0 && (
                                    <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-emerald-100 text-emerald-700">
                                      {passedCount} Lulus
                                    </span>
                                  )}
                                </div>
                                <div className="text-[10px] text-stone-500 truncate max-w-[170px]" title={latestPkg.name}>
                                  Terakhir: {latestPkg.name}
                                </div>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedUserForHistory(u);
                                    setIsHistoryModalOpen(true);
                                  }}
                                  className="px-2.5 py-1 rounded-lg bg-red-50 hover:bg-red-600 text-red-600 hover:text-stone-900 text-[11px] font-bold transition flex items-center gap-1.5 border border-rose-200 shadow-xs"
                                >
                                  <Award className="w-3.5 h-3.5" />
                                  Lihat Progres & Rapor ({userAttempts.length})
                                </button>
                              </div>
                            );
                          })()}
                        </td>

                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {hasActiveSession && (
                              <button
                                type="button"
                                disabled={isBusy}
                                onClick={async () => {
                                  setActionLoadingUserId(u.id);
                                  try {
                                    await onKickSession(u.id);
                                  } finally {
                                    setActionLoadingUserId(null);
                                  }
                                }}
                                className="py-1 px-2.5 bg-red-100 hover:bg-red-200:bg-red-900 text-red-700 rounded-lg font-semibold text-[11px] transition disabled:opacity-50"
                              >
                                {isBusy ? '...' : 'Kick Sesi'}
                              </button>
                            )}
                            <button
                              type="button"
                              disabled={isBusy}
                              onClick={async () => {
                                setActionLoadingUserId(u.id);
                                try {
                                  await onAddCredit(u.id, 7);
                                } finally {
                                  setActionLoadingUserId(null);
                                }
                              }}
                              className="py-1 px-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold text-[11px] transition shadow disabled:opacity-50"
                            >
                              +7 Hari
                            </button>
                            <button
                              type="button"
                              disabled={isBusy}
                              onClick={async () => {
                                setActionLoadingUserId(u.id);
                                try {
                                  await onAddCredit(u.id, 30);
                                } finally {
                                  setActionLoadingUserId(null);
                                }
                              }}
                              className="py-1 px-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg font-semibold text-[11px] transition border border-stone-200 disabled:opacity-50"
                            >
                              +30 Hari
                            </button>
                            {onDeleteUser && (
                              <button
                                type="button"
                                title="Hapus pengguna ini dari database"
                                disabled={isBusy}
                                onClick={async () => {
                                  if (confirm(`Yakin ingin menghapus peserta ${u.name} (${u.email}) secara permanen dari database?`)) {
                                    setActionLoadingUserId(u.id);
                                    try {
                                      await onDeleteUser(u.id);
                                    } finally {
                                      setActionLoadingUserId(null);
                                    }
                                  }
                                }}
                                className="p-1.5 text-stone-400 hover:text-red-600:text-red-400 transition rounded-lg hover:bg-red-50:bg-red-950/50 disabled:opacity-50"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Questions Bank & Package Management */}
      {activeTab === 'QUESTIONS' && (
        <div className="bg-white rounded-3xl p-6 shadow-xl border border-stone-200 space-y-6">
          {openedPackageId === null ? (
            /* ======================================================== */
            /* LEVEL 1: OVERVIEW DAFTAR PAKET SOAL (MANAJEMEN PAKET)   */
            /* ======================================================== */
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b pb-4 border-stone-200">
                <div>
                  <h2 className="text-lg font-bold text-stone-900 flex items-center gap-2">
                    <Folder className="w-5 h-5 text-red-600" />
                    Bank Soal & Manajemen Paket Ujian JFT-Basic ({allExamSets.length} Paket Tersedia)
                  </h2>
                  <p className="text-xs text-stone-500">
                    Klik salah satu kartu paket di bawah untuk melihat & mengelola soal di dalamnya, atau buat paket baru.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleOpenCreatePackage}
                  className="px-4 py-2.5 bg-gradient-to-r from-red-600 via-rose-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-bold text-xs rounded-xl shadow-lg shadow-red-500/20 transition flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Tambah Paket Soal Baru
                </button>
              </div>

              {/* Stat Summary */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200">
                  <div className="text-stone-500 font-semibold">Total Paket Ujian</div>
                  <div className="text-2xl font-black text-stone-900 mt-1">
                    {allExamSets.length} <span className="text-xs font-normal text-stone-400">Paket Aktif</span>
                  </div>
                </div>
                <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200">
                  <div className="text-stone-500 font-semibold">Total Seluruh Soal</div>
                  <div className="text-2xl font-black text-red-600 mt-1">
                    {activeQuestions.length} <span className="text-xs font-normal text-stone-400">Soal Terdaftar</span>
                  </div>
                </div>
                <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200">
                  <div className="text-stone-500 font-semibold">Rata-rata per Paket</div>
                  <div className="text-2xl font-black text-emerald-600 mt-1">
                    ~{allExamSets.length > 0 ? Math.round(activeQuestions.length / allExamSets.length) : 0}{' '}
                    <span className="text-xs font-normal text-stone-400">Soal/Paket</span>
                  </div>
                </div>
              </div>

              {/* Grid of Package Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {allExamSets.map((pkg) => {
                  const pkgQuestions = questions.filter((q) => (q.packageId || 1) === pkg.id);
                  const s1Count = pkgQuestions.filter((q) => q.section === 'S1').length;
                  const s2Count = pkgQuestions.filter((q) => q.section === 'S2').length;
                  const s3Count = pkgQuestions.filter((q) => q.section === 'S3').length;
                  const s4Count = pkgQuestions.filter((q) => q.section === 'S4').length;

                  return (
                    <div
                      key={pkg.id}
                      onClick={() => {
                        setOpenedPackageId(pkg.id);
                        setSelectedSecFilter('ALL');
                        setSearchQuery('');
                        setCurrentPage(1);
                      }}
                      className="p-5 rounded-2xl bg-stone-50 border border-stone-200 hover:border-red-400:border-red-400 hover:shadow-xl hover:shadow-indigo-500/5 transition cursor-pointer flex flex-col justify-between gap-4 group"
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="px-2.5 py-1 rounded-lg bg-rose-100 border border-rose-200 text-red-700 font-mono text-[11px] font-bold">
                            {pkg.code}
                          </span>
                          <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-100 text-emerald-700 border border-emerald-300">
                            {pkgQuestions.length > 0 ? `${pkgQuestions.length} Soal Aktif` : `${pkg.totalQuestions} Target Soal`}
                          </span>
                        </div>

                        <div>
                          <h3 className="text-base font-bold text-stone-900 group-hover:text-red-600:text-red-600 transition flex items-center gap-1.5">
                            <Folder className="w-4 h-4 text-red-600 shrink-0" />
                            {pkg.name}
                          </h3>
                          <p className="text-xs text-stone-500 mt-1 line-clamp-2 leading-relaxed">
                            {pkg.description || 'Tidak ada deskripsi paket.'}
                          </p>
                        </div>

                        {/* Section Pills */}
                        <div className="grid grid-cols-4 gap-1 text-[10px] text-center pt-1 font-semibold">
                          <div className="bg-amber-100 text-amber-800 p-1.5 rounded-lg border border-amber-200">
                            S1: {s1Count}
                          </div>
                          <div className="bg-blue-100 text-blue-800 p-1.5 rounded-lg border border-blue-200">
                            S2: {s2Count}
                          </div>
                          <div className="bg-purple-100 text-purple-800 p-1.5 rounded-lg border border-purple-200">
                            S3: {s3Count}
                          </div>
                          <div className="bg-emerald-100 text-emerald-800 p-1.5 rounded-lg border border-emerald-200">
                            S4: {s4Count}
                          </div>
                        </div>
                      </div>

                      {/* Card Footer Actions */}
                      <div className="pt-3 flex items-center justify-between border-t border-stone-200 gap-2">
                        <span className="text-xs font-bold text-red-600 flex items-center gap-1 group-hover:underline">
                          Buka Soal ({pkgQuestions.length}) →
                        </span>

                        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={(e) => handleOpenEditPackage(pkg, e)}
                            className="p-1.5 rounded-lg text-stone-400 hover:text-red-600:text-red-600 hover:bg-stone-100:bg-stone-100 transition"
                            title="Edit Info Paket"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => handleDeletePackage(pkg, e)}
                            className="p-1.5 rounded-lg text-stone-400 hover:text-red-600:text-red-400 hover:bg-red-50:bg-red-950/40 transition"
                            title="Hapus Paket Ini"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            /* ======================================================== */
            /* LEVEL 2: DETAIL & SOAL KHUSUS PAKET TERPILIH             */
            /* ======================================================== */
            (() => {
              const currentPackage =
                allExamSets.find((s) => s.id === openedPackageId) || {
                  id: openedPackageId,
                  name: `Paket #${openedPackageId}`,
                  code: `JFT-SET-${openedPackageId}`,
                  description: '',
                  totalQuestions: 50
                };
              const currentPackageQuestions = questions.filter((q) => (q.packageId || 1) === openedPackageId);

              return (
                <div className="space-y-6">
                  {/* Top Bar with Back Button & Package Header */}
                  <div className="flex flex-wrap items-center justify-between gap-4 border-b pb-4 border-stone-200">
                    <div className="flex items-start gap-3">
                      <button
                        type="button"
                        onClick={() => setOpenedPackageId(null)}
                        className="p-2 rounded-xl bg-stone-100 hover:bg-stone-100:bg-stone-200 text-stone-700 transition shrink-0"
                        title="Kembali ke Daftar Semua Paket"
                      >
                        <ArrowLeft className="w-5 h-5" />
                      </button>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="px-2.5 py-0.5 rounded-lg bg-rose-100 text-red-700 font-mono text-xs font-bold border border-rose-200">
                            {currentPackage.code}
                          </span>
                          <h2 className="text-lg font-bold text-stone-900">
                            {currentPackage.name}
                          </h2>
                          <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-100 text-emerald-700 border border-emerald-300">
                            {currentPackageQuestions.length} Soal Terdaftar
                          </span>
                        </div>
                        <p className="text-xs text-stone-500 mt-1">
                          {currentPackage.description || 'Kelola dan modifikasi soal-soal khusus untuk paket simulasi ini.'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        type="button"
                        onClick={() => handleOpenEditPackage(currentPackage)}
                        className="px-3.5 py-2 bg-stone-100 hover:bg-stone-100:bg-stone-200 text-stone-700 font-bold text-xs rounded-xl transition flex items-center gap-1.5"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        Edit Info Paket
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeletePackage(currentPackage)}
                        className="px-3.5 py-2 bg-red-100 hover:bg-red-200:bg-red-900/60 text-red-700 font-bold text-xs rounded-xl transition flex items-center gap-1.5 border border-red-200"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Hapus Paket
                      </button>

                      <button
                        type="button"
                        onClick={handleOpenAdd}
                        className="px-4 py-2 bg-gradient-to-r from-red-600 via-rose-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-bold text-xs rounded-xl shadow transition flex items-center gap-1.5"
                      >
                        <Plus className="w-4 h-4" />
                        Tambah Soal ke Paket Ini
                      </button>
                    </div>
                  </div>

                  {/* Filters: Seksi, Tampilkan, dan Cari */}
                  <div className="flex flex-wrap items-center justify-between gap-3 bg-stone-50 p-4 rounded-2xl border border-stone-200 text-xs">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-stone-700">Filter Seksi:</span>
                      {['ALL', 'S1', 'S2', 'S3', 'S4'].map((sec) => (
                        <button
                          key={sec}
                          type="button"
                          onClick={() => {
                            setSelectedSecFilter(sec);
                            setCurrentPage(1);
                          }}
                          className={`px-3 py-1.5 rounded-xl font-bold transition ${
                            selectedSecFilter === sec
                              ? 'bg-red-600 text-white shadow'
                              : 'bg-white text-stone-600 border border-stone-200'
                          }`}
                        >
                          {sec === 'ALL' ? 'Semua Seksi' : sec}
                        </button>
                      ))}
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1.5">
                        <span className="text-stone-500 font-semibold">Tampilkan:</span>
                        <select
                          value={pageSize}
                          onChange={(e) => {
                            setPageSize(Number(e.target.value));
                            setCurrentPage(1);
                          }}
                          className="px-2.5 py-1.5 bg-white border border-stone-200 rounded-xl text-xs text-stone-800 font-bold focus:outline-none focus:ring-2 focus:ring-red-500"
                        >
                          <option value={5}>5 Soal</option>
                          <option value={10}>10 Soal</option>
                          <option value={20}>20 Soal</option>
                          <option value={50}>50 Soal</option>
                          <option value={100}>100 Soal</option>
                        </select>
                      </div>

                      <div className="w-full sm:w-64">
                        <input
                          type="text"
                          value={searchQuery}
                          onChange={(e) => {
                            setSearchQuery(e.target.value);
                            setCurrentPage(1);
                          }}
                          placeholder="Cari kata kunci soal..."
                          className="w-full px-3 py-1.5 bg-white border border-stone-200 rounded-xl text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-red-500"
                        />
                      </div>
                    </div>
                  </div>

          {/* Question List */}
          <div className="grid grid-cols-1 gap-4">
            {filteredQuestions.length === 0 ? (
              <div className="p-8 text-center text-xs text-stone-400 bg-stone-50 rounded-2xl border border-dashed border-stone-300">
                Tidak ada soal yang cocok dengan filter.
              </div>
            ) : (
              (() => {
                const totalPages = Math.ceil(filteredQuestions.length / pageSize) || 1;
                const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);
                const startIndex = (safeCurrentPage - 1) * pageSize;
                const pageQuestions = filteredQuestions.slice(startIndex, startIndex + pageSize);

                return (
                  <>
                    {pageQuestions.map((q) => (
                      <div
                        key={q.id}
                        className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-3 text-xs"
                      >
                        <div className="flex items-center justify-between font-bold text-stone-900 flex-wrap gap-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="px-2.5 py-1 rounded-lg bg-rose-100 text-red-700 border border-rose-200">
                              Paket #{q.packageId || 1} • Soal #{q.number} ({q.section})
                            </span>
                            <span className="text-stone-500 text-[11px] font-normal">{q.sectionTitle}</span>
                            {q.imageUrl && (
                              <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 border border-blue-200 text-[10px] font-bold flex items-center gap-1">
                                <ImageIcon className="w-3 h-3" /> Ada Foto
                              </span>
                            )}
                            {q.audioUrl && (
                              <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-200 text-[10px] font-bold">
                                🎵 Audio
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-700 font-bold">
                              Kunci: {q.correctAnswer}
                            </span>
                            <button
                              onClick={() => handleOpenEdit(q)}
                              className="px-3 py-1 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-lg transition"
                            >
                              Edit Soal
                            </button>
                            {onDeleteQuestion && (
                              <button
                                onClick={() => {
                                  if (confirm(`Hapus soal #${q.number} dari Paket #${q.packageId || 1}?`)) {
                                    onDeleteQuestion(q.id);
                                  }
                                }}
                                className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition"
                              >
                                Hapus
                              </button>
                            )}
                          </div>
                        </div>

                        <div className="font-semibold text-stone-900 font-japanese text-sm bg-white p-3 rounded-xl border border-stone-200 leading-relaxed">
                          {renderFormattedQuestion(q.questionText)}
                        </div>

                        {q.imageUrl && (
                          <div className="p-2 bg-white rounded-xl border border-stone-200 flex items-center gap-3">
                            <img
                              src={q.imageUrl}
                              alt="Foto Soal"
                              className="h-16 w-24 object-contain rounded bg-stone-50 p-1 border border-stone-200 shrink-0"
                            />
                            <span className="text-[11px] text-stone-500 font-mono truncate">{q.imageUrl}</span>
                          </div>
                        )}

                        <div className="grid grid-cols-2 gap-2 text-[11px] font-mono text-stone-700">
                          {q.options.map((opt) => (
                            <div
                              key={opt.key}
                              className={`p-2 rounded-lg border ${
                                opt.key === q.correctAnswer
                                  ? 'bg-emerald-50 border-emerald-300 font-bold text-emerald-800'
                                  : 'bg-white border-stone-200'
                              }`}
                            >
                              {opt.key}) {opt.text}
                            </div>
                          ))}
                        </div>

                        <p className="text-[11px] text-stone-500 italic bg-stone-100 p-2.5 rounded-lg flex items-center gap-1.5">
                          <BookOpen className="w-3.5 h-3.5 shrink-0 text-red-600" />
                          <span>Pembahasan: {q.explanation}</span>
                        </p>
                      </div>
                    ))}

                    {/* Pagination Bar */}
                    <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200 flex flex-wrap items-center justify-between gap-3 text-xs">
                      <div className="text-stone-500">
                        Menampilkan <span className="font-bold text-stone-900">{startIndex + 1}</span> -{' '}
                        <span className="font-bold text-stone-900">
                          {Math.min(startIndex + pageSize, filteredQuestions.length)}
                        </span>{' '}
                        dari <span className="font-bold text-red-600">{filteredQuestions.length}</span> soal
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                          disabled={safeCurrentPage <= 1}
                          className="p-2 bg-white border border-stone-200 rounded-xl text-stone-700 disabled:opacity-40 hover:bg-stone-100:bg-stone-200 transition"
                          title="Halaman Sebelumnya"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>

                        <div className="flex items-center gap-1">
                          {Array.from({ length: totalPages }, (_, i) => i + 1)
                            .filter(
                              (p) =>
                                p === 1 ||
                                p === totalPages ||
                                Math.abs(p - safeCurrentPage) <= 1
                            )
                            .map((p, idx, arr) => {
                              const prevPage = arr[idx - 1];
                              const showEllipsis = prevPage && p - prevPage > 1;

                              return (
                                <React.Fragment key={p}>
                                  {showEllipsis && (
                                    <span className="px-2 text-stone-400">...</span>
                                  )}
                                  <button
                                    onClick={() => setCurrentPage(p)}
                                    className={`w-8 h-8 rounded-xl font-bold transition text-xs ${
                                      safeCurrentPage === p
                                        ? 'bg-red-600 text-white shadow'
                                        : 'bg-white border border-stone-200 text-stone-700 hover:bg-stone-100:bg-stone-200'
                                    }`}
                                  >
                                    {p}
                                  </button>
                                </React.Fragment>
                              );
                            })}
                        </div>

                        <button
                          onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                          disabled={safeCurrentPage >= totalPages}
                          className="p-2 bg-white border border-stone-200 rounded-xl text-stone-700 disabled:opacity-40 hover:bg-stone-100:bg-stone-200 transition"
                          title="Halaman Selanjutnya"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </>
                );
              })()
            )}
          </div>
        </div>
      );
    })()
  )}
</div>
)}

      {/* Tab 3: PDF Question Parser (Cara 2: Unggah PDF Berkas & Otomatisasi Gambar Soal) */}
      {activeTab === 'PDF_PARSER' && (
        <div className="bg-white rounded-3xl p-6 shadow-xl border border-stone-200 space-y-6">
          {/* Header Tab */}
          <div className="border-b pb-4 border-stone-200 flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-amber-100 border border-amber-300 text-amber-700 text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-500" /> Cara 2: Ekstraksi Otomatis
                </span>
                <h2 className="text-lg font-bold text-stone-900 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-red-600" />
                  Sistem Impor & Parser PDF Cerdas
                </h2>
              </div>
              <p className="text-xs text-stone-500 mt-1">
                Unggah langsung berkas PDF soal JFT. Sistem otomatis mengekstrak seluruh nomor soal, seksi S1-S4, opsi jawaban, serta <strong>memotong & memasang gambar soal secara otomatis</strong> ke setiap nomor soal yang sesuai!
              </p>
            </div>

            {localDrafts.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  if (confirm('Yakin ingin membersihkan semua draf soal hasil ekstraksi PDF?')) {
                    setLocalDrafts([]);
                    setParseMessage('');
                    setBatchSaveSuccess('');
                  }
                }}
                className="px-3 py-1.5 rounded-xl text-xs font-bold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100:bg-red-900/50 border border-red-200 transition flex items-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Hapus Semua Draf ({localDrafts.length})
              </button>
            )}
          </div>

          {/* Alert Messages */}
          {parseMessage && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-2xl text-xs font-semibold flex items-center justify-between gap-3 shadow-sm animate-in fade-in">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{parseMessage}</span>
              </div>
              <button onClick={() => setParseMessage('')} className="text-stone-400 hover:text-stone-600">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {batchSaveSuccess && (
            <div className="p-4 bg-rose-50 border border-rose-200 text-red-900 rounded-2xl text-xs font-bold flex items-center justify-between gap-3 shadow-sm animate-in fade-in">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-red-600 shrink-0" />
                <span>{batchSaveSuccess}</span>
              </div>
              <button onClick={() => setBatchSaveSuccess('')} className="text-stone-400 hover:text-stone-600">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* CARA 2: Upload File PDF Ujian Box */}
          <div className="p-6 rounded-3xl bg-gradient-to-br from-indigo-50/50 via-white to-slate-50 border-2 border-dashed border-rose-200 shadow-inner flex flex-col items-center justify-center text-center space-y-4">
            <input
              type="file"
              ref={pdfFileInputRef}
              accept=".pdf"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  setSelectedPdfFile(file);
                  setParseMessage('');
                }
              }}
            />

            <div className="w-14 h-14 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center shadow-sm">
              <FileUp className="w-7 h-7" />
            </div>

            <div className="space-y-1 max-w-lg">
              <h3 className="text-base font-black text-stone-900">
                Unggah Berkas PDF Soal JFT (Cara 2 Otomatis)
              </h3>
              <p className="text-xs text-stone-500">
                Pilih berkas PDF soal ujian Anda. Teks, nomor soal, opsi, dan potongan gambar soal akan langsung diekstrak dan dipasangkan otomatis.
              </p>
            </div>

            {selectedPdfFile ? (
              <div className="flex flex-wrap items-center justify-center gap-3 bg-white px-4 py-2.5 rounded-2xl border border-rose-200 shadow-sm text-xs">
                <FileText className="w-4 h-4 text-red-600" />
                <span className="font-bold text-stone-800">{selectedPdfFile.name}</span>
                <span className="text-[11px] text-emerald-700/80">({(selectedPdfFile.size / (1024 * 1024)).toFixed(2)} MB)</span>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedPdfFile(null);
                    if (pdfFileInputRef.current) pdfFileInputRef.current.value = '';
                  }}
                  className="text-stone-400 hover:text-red-500 transition ml-1"
                  title="Batalkan pilihan"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : null}

            <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
              <button
                type="button"
                onClick={() => pdfFileInputRef.current?.click()}
                disabled={isUploadingPdf}
                className="px-5 py-2.5 rounded-xl bg-white hover:bg-stone-100:bg-stone-200 text-stone-800 text-xs font-bold border border-stone-300 transition flex items-center gap-2 shadow-sm disabled:opacity-50"
              >
                <FolderUp className="w-4 h-4 text-red-600" />
                {selectedPdfFile ? 'Ganti File PDF...' : 'Pilih File PDF (.pdf)'}
              </button>

              <button
                type="button"
                onClick={handleUploadPdfFile}
                disabled={isUploadingPdf || !selectedPdfFile}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-red-600 via-rose-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white text-xs font-black transition flex items-center gap-2 shadow-lg shadow-red-500/20 disabled:opacity-50"
              >
                {isUploadingPdf ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-white" />
                    <span>Mengekstrak Teks & Gambar PDF...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-amber-300" />
                    <span>Mulai Ekstraksi Berkas PDF & Potong Gambar Otomatis</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* DRAFT QUESTIONS LIST & BATCH SAVE CONTROL */}
          {localDrafts.length > 0 && (
            <div className="space-y-4 pt-2">
              {/* Batch Action Bar */}
              <div className="bg-white text-stone-900 p-4 sm:p-5 rounded-2xl shadow-xl border border-stone-200 flex flex-wrap items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-black">
                      {localDrafts.length} Soal Berhasil Diekstrak
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full bg-rose-50 border border-rose-200 text-red-600 text-xs font-black flex items-center gap-1">
                      <ImageIcon className="w-3 h-3" />
                      {localDrafts.filter((d) => d.imageUrl).length} Gambar Soal Otomatis Terhubung
                    </span>
                  </div>
                  <p className="text-xs text-stone-400">
                    Periksa pratinjau draf soal di bawah. Setelah sesuai, pilih target paket dan klik tombol simpan di sebelah kanan.
                  </p>
                </div>

                {/* Panel Tujuan Penerbitan Paket Ujian (Baru vs Ada) */}
                <div className="w-full p-4 rounded-2xl bg-rose-50 border border-rose-300/70 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h4 className="text-xs font-black text-stone-900 flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-amber-400" />
                        Tujuan Penerbitan Soal Ujian
                      </h4>
                      <p className="text-[11px] text-stone-600">
                        Pilih untuk membuat paket soal baru agar langsung muncul di Halaman Depan atau simpan ke paket lama
                      </p>
                    </div>

                    {/* Mode Toggle Buttons */}
                    <div className="flex p-1 bg-stone-50 rounded-xl border border-stone-200 text-xs">
                      <button
                        type="button"
                        onClick={() => setPublishMode('new_package')}
                        className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
                          publishMode === 'new_package'
                            ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white shadow'
                            : 'text-stone-600 hover:text-stone-900'
                        }`}
                      >
                        <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                        Buat Paket Ujian Baru (Halaman Depan)
                      </button>
                      <button
                        type="button"
                        onClick={() => setPublishMode('existing_package')}
                        className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
                          publishMode === 'existing_package'
                            ? 'bg-red-600 text-white shadow'
                            : 'text-stone-600 hover:text-stone-900'
                        }`}
                      >
                        <Layers className="w-3.5 h-3.5 text-red-600" />
                        Simpan ke Paket yang Ada
                      </button>
                    </div>
                  </div>

                  {publishMode === 'new_package' ? (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 text-xs">
                      <div className="space-y-1">
                        <label className="font-bold text-stone-700 flex items-center gap-1">
                          Nama Paket Ujian Baru:
                        </label>
                        <input
                          type="text"
                          value={newPackageName}
                          onChange={(e) => setNewPackageName(e.target.value)}
                          placeholder={`Paket Ujian #${nextPackageId} (Simulasi Baru)`}
                          className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 font-bold text-xs focus:ring-2 focus:ring-red-500 focus:outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="font-bold text-stone-700 flex items-center gap-1">
                          Kode Paket:
                        </label>
                        <input
                          type="text"
                          value={newPackageCode}
                          onChange={(e) => setNewPackageCode(e.target.value)}
                          placeholder={`JFT-SET-${nextLetter}`}
                          className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 font-mono font-bold text-xs focus:ring-2 focus:ring-red-500 focus:outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="font-bold text-stone-700 flex items-center gap-1">
                          Deskripsi Paket:
                        </label>
                        <input
                          type="text"
                          value={newPackageDescription}
                          onChange={(e) => setNewPackageDescription(e.target.value)}
                          placeholder={`Simulasi ${localDrafts.length} soal JFT-Basic hasil impor PDF.`}
                          className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl text-stone-600 text-xs focus:ring-2 focus:ring-red-500 focus:outline-none"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 bg-stone-50 p-2.5 rounded-xl border border-stone-200 text-xs max-w-sm">
                      <span className="font-bold text-stone-600">Pilih Paket:</span>
                      <select
                        value={targetPackageId}
                        onChange={(e) => setTargetPackageId(Number(e.target.value))}
                        className="bg-transparent text-stone-900 font-bold focus:outline-none cursor-pointer flex-1"
                      >
                        {allExamSets.map((s) => (
                          <option key={s.id} value={s.id} className="bg-white text-stone-900">
                            Paket #{s.id} - {s.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div className="pt-2 flex flex-wrap items-center justify-between border-t border-rose-200 gap-3">
                    <div className="text-[11px] text-stone-600">
                      Total Draf: <strong className="text-stone-900 font-mono">{localDrafts.length} soal</strong> • Gambar terpasang: <strong className="text-emerald-700 font-mono">{localDrafts.filter((d) => d.imageUrl).length} gambar</strong>
                    </div>

                    <button
                      type="button"
                      onClick={handleSaveAllDraftsToPackage}
                      disabled={isSavingBatch}
                      className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 hover:from-red-700 hover:to-amber-700 text-white font-black text-xs transition flex items-center gap-2 shadow-xl shadow-red-600/30 disabled:opacity-50"
                    >
                      {isSavingBatch ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin text-white" />
                          <span>Menerbitkan Paket Baru...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4 text-amber-300" />
                          <span>
                            {publishMode === 'new_package'
                              ? `Terbitkan Paket Ujian Baru (#${nextPackageId}) Langsung ke Halaman Depan`
                              : `Simpan Semua ${localDrafts.length} Soal ke Paket #${targetPackageId}`}
                          </span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Draft Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {localDrafts.map((draft, idx) => (
                  <div
                    key={draft.id}
                    className="p-4 rounded-2xl bg-white border border-stone-200 shadow-sm space-y-3 flex flex-col justify-between"
                  >
                    <div className="space-y-2.5">
                      {/* Card Header: Number & Section */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-7 h-7 rounded-lg bg-rose-100 text-red-700 font-black text-xs flex items-center justify-center">
                            #{draft.number || idx + 1}
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            draft.section === 'S1'
                              ? 'bg-blue-100 text-blue-700'
                              : draft.section === 'S2'
                              ? 'bg-purple-100 text-purple-700'
                              : draft.section === 'S3'
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-emerald-100 text-emerald-700'
                          }`}>
                            {draft.sectionTitle || draft.section}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleDeleteSingleDraft(draft.id)}
                          className="p-1 text-stone-400 hover:text-red-500 rounded-lg hover:bg-stone-100:bg-stone-100 transition"
                          title="Hapus draf soal ini"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Question Text */}
                      <div className="text-xs font-semibold text-stone-900 font-japanese leading-relaxed whitespace-pre-line">
                        {renderFormattedQuestion(draft.questionText)}
                      </div>

                      {/* Image Preview & Controls (Auto-extracted from PDF) */}
                      {draft.imageUrl ? (
                        <div className="space-y-1.5 p-2 rounded-xl bg-stone-50 border border-stone-200">
                          <div className="relative group overflow-hidden rounded-lg bg-white flex items-center justify-center p-2 border border-stone-200">
                            <img
                              src={draft.imageUrl}
                              alt={`Soal #${draft.number}`}
                              className="max-h-36 object-contain rounded cursor-pointer transition hover:scale-105"
                              onClick={() => setZoomPreviewImage(draft.imageUrl || null)}
                            />
                            <button
                              type="button"
                              onClick={() => setZoomPreviewImage(draft.imageUrl || null)}
                              className="absolute inset-0 bg-stone-900/40 backdrop-blur-xs text-white opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-1.5 text-xs font-bold"
                            >
                              <ZoomIn className="w-4 h-4" /> Perbesar Gambar
                            </button>
                          </div>
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-emerald-600 font-bold flex items-center gap-1">
                              <Check className="w-3 h-3" /> Gambar Otomatis Terhubung
                            </span>
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => {
                                  setActiveDraftIdForImage(draft.id);
                                  draftSpecificImageInputRef.current?.click();
                                }}
                                className="text-red-600 hover:underline font-semibold"
                              >
                                Ganti
                              </button>
                              <span className="text-stone-600">•</span>
                              <button
                                type="button"
                                onClick={() => handleRemoveDraftImage(draft.id)}
                                className="text-red-500 hover:underline font-semibold"
                              >
                                Hapus
                              </button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="pt-1">
                          <button
                            type="button"
                            onClick={() => {
                              setActiveDraftIdForImage(draft.id);
                              draftSpecificImageInputRef.current?.click();
                            }}
                            className="text-[11px] font-bold text-stone-500 hover:text-red-600:text-red-600 flex items-center gap-1 border border-dashed border-stone-200 px-2.5 py-1.5 rounded-xl hover:border-indigo-400 transition"
                          >
                            <ImageIcon className="w-3 h-3" /> + Tambah Gambar untuk Soal Ini
                          </button>
                        </div>
                      )}

                      {/* Options List */}
                      <div className="space-y-1 pt-1 text-xs font-japanese">
                        {draft.options.map((opt) => (
                          <div
                            key={opt.key}
                            className={`p-1.5 rounded-lg border flex items-center gap-2 text-xs transition ${
                              draft.correctAnswer === opt.key
                                ? 'bg-emerald-50 border-emerald-300 font-bold text-emerald-900'
                                : 'bg-stone-50/60 border-stone-100 text-stone-700'
                            }`}
                          >
                            <span className="font-bold font-mono text-[11px] w-4">{opt.key})</span>
                            <span className="flex-1">{opt.text}</span>
                            {draft.correctAnswer === opt.key && (
                              <span className="text-[10px] uppercase tracking-wider font-extrabold text-emerald-600">
                                Kunci
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Card Footer: Correct Answer Selector */}
                    <div className="pt-3 border-t border-stone-100 flex items-center justify-between text-xs">
                      <span className="text-stone-500 text-[11px] font-semibold">Kunci Jawaban:</span>
                      <select
                        value={draft.correctAnswer}
                        onChange={(e) =>
                          handleUpdateDraftAnswer(draft.id, e.target.value as 'A' | 'B' | 'C' | 'D')
                        }
                        className="p-1 px-2.5 rounded-lg bg-emerald-50 border border-emerald-300 font-bold text-emerald-900 text-xs focus:outline-none"
                      >
                        {draft.options.map((opt) => (
                          <option key={opt.key} value={opt.key}>
                            Opsi {opt.key}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* CARA 1: Fallback Tempel Teks Manual (Collapsible) */}
          <div className="border border-stone-200 rounded-2xl overflow-hidden">
            <button
              type="button"
              onClick={() => setIsManualTextOpen((prev) => !prev)}
              className="w-full p-4 bg-stone-50 hover:bg-stone-100:bg-white flex items-center justify-between text-left text-xs font-bold text-stone-700 transition"
            >
              <span className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-stone-400" />
                Cara 1: Tempel Teks PDF Manual (Alternatif / Cadangan)
              </span>
              <span className="text-[11px] text-emerald-700/80 font-normal">
                {isManualTextOpen ? 'Sembunyikan' : 'Tampilkan Form Teks'}
              </span>
            </button>

            {isManualTextOpen && (
              <div className="p-4 bg-white space-y-3 border-t border-stone-200">
                <div className="flex justify-between items-center text-xs">
                  <label className="font-bold text-stone-700">
                    Tempel Teks Soal:
                  </label>
                  <button
                    onClick={fillSamplePdfText}
                    className="text-red-600 hover:underline text-xs font-semibold"
                  >
                    + Isi Contoh Teks Demo
                  </button>
                </div>

                <textarea
                  rows={6}
                  value={pdfInputText}
                  onChange={(e) => setPdfInputText(e.target.value)}
                  placeholder="Tempel teks PDF soal di sini (misal: [S1] Soal 1... A) ほん B) はん... Kunci: A...)"
                  className="w-full p-3 bg-stone-50 rounded-xl border border-stone-200 text-xs font-mono text-stone-900 focus:outline-none focus:ring-2 focus:ring-red-500"
                ></textarea>

                <button
                  type="button"
                  onClick={handleRunPdfParse}
                  disabled={isParsing || !pdfInputText.trim()}
                  className="py-2.5 px-5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow transition flex items-center gap-2 disabled:opacity-50"
                >
                  <Upload className="w-3.5 h-3.5" />
                  {isParsing ? 'Mengurai Teks PDF...' : 'Ekstrak Draf dari Teks Manual'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Hidden file input for uploading specific draft image */}
      <input
        type="file"
        ref={draftSpecificImageInputRef}
        accept="image/*"
        className="hidden"
        onChange={handleUploadDraftSpecificImage}
      />

      {/* CLICK-TO-ZOOM LIGHTBOX MODAL FOR DRAFT IMAGES */}
      {zoomPreviewImage && (
        <div
          onClick={() => setZoomPreviewImage(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/40 backdrop-blur-xs backdrop-blur-md p-4 animate-in fade-in cursor-zoom-out"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-4xl max-h-[90vh] bg-white rounded-3xl p-4 border border-stone-200 shadow-2xl overflow-hidden flex flex-col items-center cursor-default"
          >
            <button
              onClick={() => setZoomPreviewImage(null)}
              className="absolute top-4 right-4 p-2 rounded-full bg-stone-100 text-stone-600 hover:text-stone-900 hover:bg-stone-200 z-10 transition shadow-lg"
              title="Tutup Pratinjau (ESC)"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="text-xs text-stone-400 font-bold mb-2 flex items-center gap-1.5">
              <Eye className="w-4 h-4 text-red-600" />
              Pratinjau Resolusi Penuh Gambar Soal JFT
            </div>
            <img
              src={zoomPreviewImage}
              alt="Pratinjau Gambar Soal"
              className="max-w-full max-h-[80vh] object-contain rounded-2xl shadow-md border border-stone-200 bg-white p-2"
            />
          </div>
        </div>
      )}

      {/* Tab 4: Transactions */}
      {activeTab === 'TRANSACTIONS' && (
        <div className="bg-white rounded-3xl p-6 shadow-xl border border-stone-200 space-y-6">
          <div className="flex flex-wrap items-center justify-between border-b pb-4 border-stone-200 gap-4">
            <div>
              <h2 className="text-lg font-bold text-stone-900">
                Riwayat Pembayaran & Transaksi Paket ({transactions.length} Total Transaksi)
              </h2>
              <p className="text-xs text-stone-500">
                Data transaksi pembayaran real-time dari database MySQL & DOKU Payment Gateway
              </p>
            </div>

            {onRefreshData && (
              <button
                type="button"
                onClick={async () => {
                  setIsRefreshing(true);
                  try {
                    await onRefreshData();
                  } finally {
                    setIsRefreshing(false);
                  }
                }}
                disabled={isRefreshing}
                className="px-3.5 py-2 rounded-xl bg-stone-100 hover:bg-stone-100:bg-stone-200 text-stone-700 text-xs font-bold transition flex items-center gap-1.5 border border-stone-200 shadow-sm"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-red-600' : ''}`} />
                {isRefreshing ? 'Memuat Ulang...' : 'Sinkronkan Transaksi'}
              </button>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-stone-200 bg-stone-50 text-stone-500 font-bold uppercase tracking-wider">
                  <th className="p-3">ID Transaksi</th>
                  <th className="p-3">Waktu</th>
                  <th className="p-3">Peserta</th>
                  <th className="p-3">Paket</th>
                  <th className="p-3">Nominal</th>
                  <th className="p-3">Metode Bayar</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {transactions.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-stone-400">
                      Belum ada transaksi di database.
                    </td>
                  </tr>
                ) : (
                  transactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-stone-50:bg-stone-100 transition">
                      <td className="p-3 font-mono text-[11px] text-stone-500">{tx.id}</td>
                      <td className="p-3 text-[11px] text-emerald-700/80">
                        {tx.createdAt ? new Date(tx.createdAt).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-'}
                      </td>
                      <td className="p-3 font-semibold text-stone-900">{tx.userName}</td>
                      <td className="p-3 text-stone-700">{tx.packageName}</td>
                      <td className="p-3 font-bold text-red-600">
                        Rp {tx.amount.toLocaleString('id-ID')}
                      </td>
                      <td className="p-3 text-stone-500">{tx.paymentMethod}</td>
                      <td className="p-3">
                        <span className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                          tx.status === 'PAID'
                            ? 'bg-emerald-100 text-emerald-700'
                            : tx.status === 'PENDING'
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-red-100 text-red-700'
                        }`}>
                          {tx.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* QUESTION EDIT MODAL OVERLAY */}
      {isEditModalOpen && editingQuestion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/40 backdrop-blur-xs backdrop-blur-md p-4 overflow-y-auto">
          <div className="bg-white max-w-2xl w-full rounded-3xl p-6 shadow-2xl border border-stone-200 space-y-4 my-8">
            <div className="flex items-center justify-between border-b pb-3 border-stone-200">
              <h3 className="text-base font-bold text-stone-900">
                Editor Soal JFT (ID #{editingQuestion.id})
              </h3>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="p-1 text-stone-400 hover:text-stone-600:text-stone-700 rounded-lg hover:bg-stone-100:bg-stone-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <label className="font-bold text-stone-700 block mb-1">Pilih Paket:</label>
                <select
                  value={editingQuestion.packageId || 1}
                  onChange={(e) =>
                    setEditingQuestion({ ...editingQuestion, packageId: Number(e.target.value) })
                  }
                  className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 font-bold"
                >
                  {allExamSets.map((s) => (
                    <option key={s.id} value={s.id}>
                      Paket #{s.id} - {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-stone-700 block mb-1">Seksi Ujian:</label>
                <select
                  value={editingQuestion.section}
                  onChange={(e) => {
                    const sec = e.target.value as SectionType;
                    const secTitles: Record<SectionType, string> = {
                      S1: 'Seksi 1 - 文字と語彙 (Huruf & Kosakata)',
                      S2: 'Seksi 2 - 会話表現 (Percakapan & Ekspresi)',
                      S3: 'Seksi 3 - 聴解 (Pendengaran)',
                      S4: 'Seksi 4 - 読解 (Pemahaman Bacaan)'
                    };
                    setEditingQuestion({
                      ...editingQuestion,
                      section: sec,
                      sectionTitle: secTitles[sec] || sec
                    });
                  }}
                  className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 font-bold"
                >
                  <option value="S1">S1 (Moji Goi)</option>
                  <option value="S2">S2 (Kaiwa)</option>
                  <option value="S3">S3 (Chokai)</option>
                  <option value="S4">S4 (Dokkai)</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-stone-700 block mb-1">Nomor Soal:</label>
                <input
                  type="number"
                  value={editingQuestion.number}
                  onChange={(e) => setEditingQuestion({ ...editingQuestion, number: Number(e.target.value) })}
                  className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 font-bold"
                />
              </div>

              <div>
                <label className="font-bold text-stone-700 block mb-1">Kunci Jawaban Benar:</label>
                <select
                  value={editingQuestion.correctAnswer}
                  onChange={(e) => setEditingQuestion({ ...editingQuestion, correctAnswer: e.target.value as 'A' | 'B' | 'C' | 'D' })}
                  className="w-full p-2.5 bg-emerald-50 border border-emerald-300 rounded-xl text-emerald-900 font-bold"
                >
                  <option value="A">Opsi A</option>
                  <option value="B">Opsi B</option>
                  <option value="C">Opsi C</option>
                  <option value="D">Opsi D</option>
                </select>
              </div>
            </div>

            <div className="text-xs space-y-1">
              <label className="font-bold text-stone-700">Teks Pertanyaan:</label>
              <textarea
                rows={3}
                value={editingQuestion.questionText}
                onChange={(e) => setEditingQuestion({ ...editingQuestion, questionText: e.target.value })}
                className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 font-japanese text-xs"
              ></textarea>
            </div>

            {/* Options A-D */}
            <div className="space-y-2 text-xs">
              <label className="font-bold text-stone-700">Opsi Jawaban A, B, C, D:</label>
              <div className="grid grid-cols-2 gap-2">
                {editingQuestion.options.map((opt, idx) => (
                  <div key={opt.key} className="flex items-center gap-2">
                    <span className="font-bold text-red-600 w-4">{opt.key})</span>
                    <input
                      type="text"
                      value={opt.text}
                      onChange={(e) => {
                        const newOpts = [...editingQuestion.options];
                        newOpts[idx].text = e.target.value;
                        setEditingQuestion({ ...editingQuestion, options: newOpts });
                      }}
                      className="w-full p-2 bg-stone-50 border border-stone-200 rounded-lg text-stone-900 text-xs"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Audio Soal Chokai (Upload & Link URL) */}
            <div className="p-3.5 bg-stone-50 rounded-2xl border border-stone-200 space-y-2.5 text-xs">
              <div className="flex items-center justify-between">
                <label className="font-bold text-stone-800 flex items-center gap-1.5">
                  <Headphones className="w-4 h-4 text-amber-500" />
                  Audio Soal Chōkai (S3 - Opsional):
                </label>
                {editingQuestion.audioUrl && (
                  <button
                    type="button"
                    onClick={() => setEditingQuestion({ ...editingQuestion, audioUrl: '' })}
                    className="text-[11px] font-bold text-rose-500 hover:text-rose-400 flex items-center gap-1 transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Hapus Audio
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Upload File Audio */}
                <div className="space-y-1">
                  <span className="text-[11px] text-stone-500 font-semibold block">
                    1. Upload File Audio (MP3, WAV, OGG, M4A):
                  </span>
                  <input
                    type="file"
                    ref={audioFileInputRef}
                    accept="audio/*"
                    onChange={handleAudioUpload}
                    className="hidden"
                  />
                  <button
                    type="button"
                    disabled={isUploadingAudio}
                    onClick={() => audioFileInputRef.current?.click()}
                    className="w-full py-2.5 px-3 bg-amber-50 hover:bg-amber-100:bg-amber-900/60 text-amber-700 border border-amber-200 rounded-xl font-bold flex items-center justify-center gap-2 transition disabled:opacity-50"
                  >
                    <UploadCloud className="w-4 h-4" />
                    <span>{isUploadingAudio ? 'Mengunggah Audio...' : 'Pilih File Audio & Upload'}</span>
                  </button>
                </div>

                {/* Input Link URL Audio */}
                <div className="space-y-1">
                  <span className="text-[11px] text-stone-500 font-semibold block">
                    2. Atau Tempel / Ketik Link URL Audio:
                  </span>
                  <div className="relative">
                    <input
                      type="text"
                      value={editingQuestion.audioUrl || ''}
                      onChange={(e) => setEditingQuestion({ ...editingQuestion, audioUrl: e.target.value })}
                      placeholder="https://... atau /uploads/audio/..."
                      className="w-full p-2.5 pr-8 bg-white border border-stone-200 rounded-xl text-stone-900 text-xs"
                    />
                    <LinkIcon className="w-3.5 h-3.5 text-stone-400 absolute right-2.5 top-3" />
                  </div>
                </div>
              </div>

              {uploadAudioError && (
                <div className="text-[11px] text-rose-500 font-semibold">
                  ⚠️ {uploadAudioError}
                </div>
              )}

              {/* Live Audio Player Preview */}
              {editingQuestion.audioUrl && (
                <div className="mt-2 p-2.5 bg-white rounded-xl border border-stone-200 space-y-1.5">
                  <div className="text-[10px] text-stone-400 font-semibold flex items-center gap-1">
                    <Volume2 className="w-3.5 h-3.5 text-amber-500" /> Pemutar Audio Aktif:
                  </div>
                  <audio
                    key={editingQuestion.audioUrl}
                    controls
                    className="w-full h-8"
                    src={editingQuestion.audioUrl}
                  >
                    <source
                      src={editingQuestion.audioUrl}
                      type={editingQuestion.audioUrl.endsWith('.ogg') ? 'audio/ogg' : 'audio/mpeg'}
                    />
                  </audio>
                  <div className="text-[10px] text-stone-400 font-mono truncate">
                    {editingQuestion.audioUrl}
                  </div>
                </div>
              )}
            </div>

            {/* Foto / Gambar Soal (Upload & Link URL) */}
            <div className="p-3.5 bg-stone-50 rounded-2xl border border-stone-200 space-y-2.5 text-xs">
              <div className="flex items-center justify-between">
                <label className="font-bold text-stone-800 flex items-center gap-1.5">
                  <ImageIcon className="w-4 h-4 text-red-600" />
                  Foto / Gambar Soal (Opsional):
                </label>
                {editingQuestion.imageUrl && (
                  <button
                    type="button"
                    onClick={() => setEditingQuestion({ ...editingQuestion, imageUrl: '' })}
                    className="text-[11px] font-bold text-rose-500 hover:text-rose-400 flex items-center gap-1 transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Hapus Foto
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Upload File */}
                <div className="space-y-1">
                  <span className="text-[11px] text-stone-500 font-semibold block">
                    1. Upload File Gambar (JPG, PNG, WebP):
                  </span>
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  <button
                    type="button"
                    disabled={isUploadingImage}
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full py-2.5 px-3 bg-rose-50 hover:bg-rose-100:bg-rose-100/60 text-red-700 border border-rose-200 rounded-xl font-bold flex items-center justify-center gap-2 transition disabled:opacity-50"
                  >
                    <UploadCloud className="w-4 h-4" />
                    <span>{isUploadingImage ? 'Mengunggah Foto...' : 'Pilih File & Upload'}</span>
                  </button>
                </div>

                {/* Input Link URL */}
                <div className="space-y-1">
                  <span className="text-[11px] text-stone-500 font-semibold block">
                    2. Atau Masukkan Link / URL Gambar:
                  </span>
                  <div className="relative">
                    <input
                      type="text"
                      value={editingQuestion.imageUrl || ''}
                      onChange={(e) => setEditingQuestion({ ...editingQuestion, imageUrl: e.target.value })}
                      placeholder="https://... atau /uploads/questions/..."
                      className="w-full p-2.5 pr-8 bg-white border border-stone-200 rounded-xl text-stone-900 text-xs"
                    />
                    <LinkIcon className="w-3.5 h-3.5 text-stone-400 absolute right-2.5 top-3" />
                  </div>
                </div>
              </div>

              {uploadImageError && (
                <div className="text-[11px] text-rose-500 font-semibold">
                  ⚠️ {uploadImageError}
                </div>
              )}

              {/* Live Preview */}
              {editingQuestion.imageUrl && (
                <div className="mt-2 p-2.5 bg-white rounded-xl border border-stone-200 text-center">
                  <div className="text-[10px] text-stone-400 font-semibold mb-1 flex items-center justify-center gap-1">
                    <Check className="w-3 h-3 text-emerald-500" /> Preview Gambar Soal Aktif:
                  </div>
                  <img
                    src={editingQuestion.imageUrl}
                    alt="Preview Soal"
                    className="max-h-48 max-w-full rounded-lg mx-auto object-contain border border-stone-200 shadow-sm"
                  />
                  <div className="text-[10px] text-stone-400 font-mono mt-1 truncate">
                    {editingQuestion.imageUrl}
                  </div>
                </div>
              )}
            </div>

            {/* Dokkai Reading Passage (Optional) */}
            {editingQuestion.section === 'S4' && (
              <div className="text-xs space-y-1">
                <label className="font-bold text-stone-700">Teks Bacaan (Dokkai S4 - Opsional):</label>
                <textarea
                  rows={4}
                  value={editingQuestion.readingPassage || ''}
                  onChange={(e) => setEditingQuestion({ ...editingQuestion, readingPassage: e.target.value })}
                  placeholder="Masukkan teks artikel / wacana bacaan jika soal ini memiliki bacaan panjang..."
                  className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 font-japanese text-xs"
                ></textarea>
              </div>
            )}

            <div className="text-xs space-y-1">
              <label className="font-bold text-stone-700">Penjelasan & Pembahasan (Insight):</label>
              <textarea
                rows={2}
                value={editingQuestion.explanation}
                onChange={(e) => setEditingQuestion({ ...editingQuestion, explanation: e.target.value })}
                className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 text-xs"
              ></textarea>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold rounded-xl text-xs transition"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSaveEditModal}
                className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs transition shadow-lg"
              >
                Simpan Perubahan Soal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal CRUD Paket Ujian */}
      {isPackageModalOpen && editingPackage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/40 backdrop-blur-xs backdrop-blur-md p-4 overflow-y-auto">
          <div className="bg-white max-w-lg w-full rounded-3xl p-6 shadow-2xl border border-stone-200 space-y-5 my-8">
            <div className="flex items-center justify-between border-b pb-3 border-stone-200">
              <h3 className="text-base font-bold text-stone-900 flex items-center gap-2">
                <Folder className="w-5 h-5 text-red-600" />
                {packageModalMode === 'create' ? 'Tambah Paket Ujian Baru' : `Edit Info Paket #${editingPackage.id}`}
              </h3>
              <button
                type="button"
                onClick={() => setIsPackageModalOpen(false)}
                className="p-1 text-stone-400 hover:text-stone-600:text-stone-700 rounded-lg hover:bg-stone-100:bg-stone-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-stone-700">
                  Nama Paket Ujian:
                </label>
                <input
                  type="text"
                  required
                  value={editingPackage.name}
                  onChange={(e) => setEditingPackage({ ...editingPackage, name: e.target.value })}
                  placeholder="Contoh: Paket Ujian #5 (Simulasi Mandiri)"
                  className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 font-bold focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-stone-700">
                    Kode Paket:
                  </label>
                  <input
                    type="text"
                    required
                    value={editingPackage.code}
                    onChange={(e) => setEditingPackage({ ...editingPackage, code: e.target.value.toUpperCase() })}
                    placeholder="Contoh: JFT-SET-E"
                    className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl text-amber-600 font-mono font-bold focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-stone-700">
                    Target Total Soal:
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={editingPackage.totalQuestions || 50}
                    onChange={(e) => setEditingPackage({ ...editingPackage, totalQuestions: Number(e.target.value) || 50 })}
                    placeholder="50"
                    className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 font-bold focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-stone-700">
                  Deskripsi Paket:
                </label>
                <textarea
                  rows={3}
                  value={editingPackage.description}
                  onChange={(e) => setEditingPackage({ ...editingPackage, description: e.target.value })}
                  placeholder="Keterangan materi soal, fokus bahasan, atau tipe simulasi..."
                  className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 text-xs focus:outline-none focus:ring-2 focus:ring-red-500"
                ></textarea>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2 border-t border-stone-200">
              <button
                type="button"
                onClick={() => setIsPackageModalOpen(false)}
                className="px-4 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold rounded-xl text-xs transition"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isSavingPackage}
                onClick={handleSavePackage}
                className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs transition shadow-lg shadow-red-500/20 flex items-center gap-2 disabled:opacity-50"
              >
                {isSavingPackage ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-white" />
                    <span>Menyimpan...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>{packageModalMode === 'create' ? 'Buat Paket Sekarang' : 'Simpan Perubahan Paket'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: RIWAYAT & PROGRES UJIAN PESERTA */}
      {isHistoryModalOpen && selectedUserForHistory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-xs backdrop-blur-md animate-in fade-in">
          <div className="bg-white border border-stone-200 rounded-3xl max-w-4xl w-full max-h-[90vh] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95">
            {/* Modal Header */}
            <div className="p-6 border-b border-stone-200 bg-stone-50 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <img
                  src={
                    selectedUserForHistory.facePhotoUrl && !selectedUserForHistory.facePhotoUrl.includes('unsplash.com')
                      ? selectedUserForHistory.facePhotoUrl
                      : DEFAULT_ANONYMOUS_PHOTO
                  }
                  alt={selectedUserForHistory.name}
                  className="w-12 h-12 rounded-2xl object-cover border-2 border-stone-300 shadow-sm"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-black text-stone-900">
                      {selectedUserForHistory.name}
                    </h2>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-rose-100 text-red-700 border border-rose-200">
                      {selectedUserForHistory.role}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-stone-500 mt-0.5 font-mono">
                    <span>{selectedUserForHistory.registrationNumber || selectedUserForHistory.id}</span>
                    <span>•</span>
                    <span>{selectedUserForHistory.email}</span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setIsHistoryModalOpen(false);
                  setSelectedUserForHistory(null);
                }}
                className="w-9 h-9 rounded-2xl bg-stone-100 text-stone-500 hover:text-stone-900 flex items-center justify-center transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6">
              {(() => {
                const userAttempts = (examResults || []).filter(
                  (r) => r.userId === selectedUserForHistory.id
                );
                const highestScore = userAttempts.length > 0 ? Math.max(...userAttempts.map((r) => r.totalScore)) : 0;
                const avgScore =
                  userAttempts.length > 0
                    ? Math.round(userAttempts.reduce((acc, r) => acc + r.totalScore, 0) / userAttempts.length)
                    : 0;
                const passedAttempts = userAttempts.filter((r) => r.isPassed).length;

                return (
                  <>
                    {/* Summary KPI Cards */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200">
                        <div className="flex items-center gap-2 text-stone-500 text-xs font-semibold">
                          <BookOpen className="w-4 h-4 text-red-600" />
                          <span>Total Dikerjakan</span>
                        </div>
                        <div className="text-2xl font-black text-stone-900 mt-1">
                          {userAttempts.length} <span className="text-xs font-normal text-stone-400">Kali</span>
                        </div>
                      </div>

                      <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200">
                        <div className="flex items-center gap-2 text-stone-500 text-xs font-semibold">
                          <TrendingUp className="w-4 h-4 text-emerald-500" />
                          <span>Skor Tertinggi</span>
                        </div>
                        <div className="text-2xl font-black text-emerald-600 mt-1">
                          {highestScore} <span className="text-xs font-normal text-stone-400">/ 250</span>
                        </div>
                      </div>

                      <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200">
                        <div className="flex items-center gap-2 text-stone-500 text-xs font-semibold">
                          <BarChart3 className="w-4 h-4 text-amber-500" />
                          <span>Rata-rata Skor</span>
                        </div>
                        <div className="text-2xl font-black text-amber-600 mt-1">
                          {avgScore} <span className="text-xs font-normal text-stone-400">/ 250</span>
                        </div>
                      </div>

                      <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200">
                        <div className="flex items-center gap-2 text-stone-500 text-xs font-semibold">
                          <CheckCircle2 className="w-4 h-4 text-red-600" />
                          <span>Kelulusan</span>
                        </div>
                        <div className="text-2xl font-black text-red-600 mt-1">
                          {passedAttempts} <span className="text-xs font-normal text-stone-400">/ {userAttempts.length}</span>
                        </div>
                      </div>
                    </div>

                    {/* Riwayat Tes List */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-black text-stone-900 flex items-center gap-2">
                          <Clock className="w-4 h-4 text-red-600" />
                          Daftar Riwayat Tes Paket & Nilai Lengkap
                        </h3>
                        <span className="text-xs text-stone-400 font-semibold">
                          {userAttempts.length} Catatan Riwayat
                        </span>
                      </div>

                      {userAttempts.length === 0 ? (
                        <div className="p-8 text-center bg-stone-50 rounded-2xl border border-dashed border-stone-200 space-y-2">
                          <div className="w-12 h-12 mx-auto rounded-full bg-stone-100 flex items-center justify-center text-stone-400">
                            <BookOpen className="w-6 h-6" />
                          </div>
                          <p className="text-sm font-bold text-stone-700">
                            Peserta belum pernah mengerjakan ujian
                          </p>
                          <p className="text-xs text-stone-500 max-w-sm mx-auto">
                            Hasil simulasi CBT dan lembar sertifikat akan otomatis terekam dan muncul di sini saat peserta menyelesaikan paket ujian.
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {userAttempts.map((attempt, index) => {
                            const pkgInfo = getPackageInfoForResult(attempt);
                            const spentMin = Math.floor((attempt.totalTimeSpentSeconds || 0) / 60);
                            const spentSec = (attempt.totalTimeSpentSeconds || 0) % 60;

                            return (
                              <div
                                key={attempt.id || index}
                                className="p-4 rounded-2xl bg-white border border-stone-200 hover:border-red-300:border-rose-200 transition shadow-sm space-y-3"
                              >
                                <div className="flex flex-wrap items-start justify-between gap-3">
                                  <div className="space-y-1">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span className="px-2.5 py-1 rounded-xl text-xs font-black bg-rose-50 text-red-600 border border-rose-200">
                                        {pkgInfo.code}
                                      </span>
                                      <h4 className="text-sm font-black text-stone-900">
                                        {pkgInfo.name}
                                      </h4>
                                    </div>
                                    <div className="flex items-center gap-3 text-xs text-stone-400">
                                      <span className="flex items-center gap-1">
                                        <Calendar className="w-3.5 h-3.5" />
                                        {attempt.testDate}
                                      </span>
                                      <span>•</span>
                                      <span className="flex items-center gap-1">
                                        <Clock className="w-3.5 h-3.5" />
                                        {spentMin}m {spentSec}s
                                      </span>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-3">
                                    <div className="text-right">
                                      <div className="text-xl font-black text-stone-900">
                                        {attempt.totalScore}
                                        <span className="text-xs font-normal text-stone-400"> / 250</span>
                                      </div>
                                      <div>
                                        {attempt.isPassed ? (
                                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-black bg-emerald-100 text-emerald-700 border border-emerald-300">
                                            <CheckCircle2 className="w-3 h-3" />
                                            Lulus ({attempt.assessmentResult})
                                          </span>
                                        ) : (
                                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-black bg-red-100 text-red-700 border border-red-300">
                                            <XCircle className="w-3 h-3" />
                                            {attempt.assessmentResult || 'Tidak Lulus'}
                                          </span>
                                        )}
                                      </div>
                                    </div>

                                    <button
                                      type="button"
                                      onClick={() => setPreviewingExamResult(attempt)}
                                      className="px-3.5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition shadow-sm flex items-center gap-1.5"
                                    >
                                      <Eye className="w-4 h-4" />
                                      <span>Lihat Rapor Hasil Evaluasi</span>
                                    </button>
                                  </div>
                                </div>

                                {/* Section Breakdown Grid */}
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-stone-100 text-xs">
                                  <div className="p-2 rounded-xl bg-stone-50">
                                    <div className="text-[10px] text-stone-400 font-semibold truncate">
                                      Seksi 1 (Huruf & Kosakata)
                                    </div>
                                    <div className="font-bold text-stone-800 mt-0.5">
                                      {attempt.sectionScores?.S1?.score || 0} / {attempt.sectionScores?.S1?.maxScore || 12}
                                      <span className="text-[10px] text-stone-400 font-normal ml-1">
                                        ({attempt.sectionScores?.S1?.percentage || 0}%)
                                      </span>
                                    </div>
                                  </div>

                                  <div className="p-2 rounded-xl bg-stone-50">
                                    <div className="text-[10px] text-stone-400 font-semibold truncate">
                                      Seksi 2 (Percakapan & Ekspresi)
                                    </div>
                                    <div className="font-bold text-stone-800 mt-0.5">
                                      {attempt.sectionScores?.S2?.score || 0} / {attempt.sectionScores?.S2?.maxScore || 12}
                                      <span className="text-[10px] text-stone-400 font-normal ml-1">
                                        ({attempt.sectionScores?.S2?.percentage || 0}%)
                                      </span>
                                    </div>
                                  </div>

                                  <div className="p-2 rounded-xl bg-stone-50">
                                    <div className="text-[10px] text-stone-400 font-semibold truncate">
                                      Seksi 3 (Pendengaran / Chōkai)
                                    </div>
                                    <div className="font-bold text-stone-800 mt-0.5">
                                      {attempt.sectionScores?.S3?.score || 0} / {attempt.sectionScores?.S3?.maxScore || 13}
                                      <span className="text-[10px] text-stone-400 font-normal ml-1">
                                        ({attempt.sectionScores?.S3?.percentage || 0}%)
                                      </span>
                                    </div>
                                  </div>

                                  <div className="p-2 rounded-xl bg-stone-50">
                                    <div className="text-[10px] text-stone-400 font-semibold truncate">
                                      Seksi 4 (Bacaan / Dokkai)
                                    </div>
                                    <div className="font-bold text-stone-800 mt-0.5">
                                      {attempt.sectionScores?.S4?.score || 0} / {attempt.sectionScores?.S4?.maxScore || 13}
                                      <span className="text-[10px] text-stone-400 font-normal ml-1">
                                        ({attempt.sectionScores?.S4?.percentage || 0}%)
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </>
                );
              })()}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-stone-200 bg-stone-50 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  setIsHistoryModalOpen(false);
                  setSelectedUserForHistory(null);
                }}
                className="px-5 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold rounded-xl text-xs transition"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: PRATINJAU RAPOR RESMI JFT */}
      {previewingExamResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-xs backdrop-blur-md animate-in fade-in overflow-y-auto">
          <div className="bg-white border border-stone-200 rounded-3xl max-w-5xl w-full max-h-[92vh] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 my-auto">
            {/* Header */}
            <div className="p-4 sm:p-5 border-b border-stone-200 bg-white text-stone-900 flex items-center justify-between gap-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-red-600/30 text-red-600 flex items-center justify-center">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-black">
                    Lembar Hasil Evaluasi Simulasi KondangSensei — {previewingExamResult.userName}
                  </h3>
                  <p className="text-xs text-stone-400">
                    {getPackageInfoForResult(previewingExamResult).name} • Tanggal: {previewingExamResult.testDate}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setPreviewingExamResult(null)}
                className="w-8 h-8 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-600 hover:text-stone-900 flex items-center justify-center transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Certificate Body */}
            <div className="p-4 sm:p-6 overflow-y-auto bg-stone-100">
              <JftResultReport
                result={previewingExamResult}
                currentUser={users.find((u) => u.id === previewingExamResult.userId) || null}
                onOpenReview={() => {}}
                onRetake={() => {}}
              />
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-stone-200 bg-white flex justify-end">
              <button
                type="button"
                onClick={() => setPreviewingExamResult(null)}
                className="px-5 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold rounded-xl text-xs transition"
              >
                Kembali ke Riwayat Peserta
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
