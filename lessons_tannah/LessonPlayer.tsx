import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Volume2, CheckCircle2, Mic, Square } from "lucide-react";
import lesson01 from "../lessons/lesson-01.json";
import { speak } from "../lib/tts";

type LangCode = "en" | "es" | "zh";

type ListenItem = {
  id: string;
  text: string;
  ttsText: string;
  ttsLang: string;
  pinyin?: string;
  concept?: string;
};

type LessonStep =
  | {
      id: string;
      type: "listen" | "vocab" | "pronounce";
      title: string;
      itemsByLanguage: Record<LangCode, ListenItem[]>;
    }
  | {
      id: string;
      type: "build";
      title: string;
      templateByLanguage: Record<LangCode, { template: string; ttsLang: string }>;
      names: string[];
    }
  | {
      id: string;
      type: "conversation";
      title: string;
      scriptByLanguage: Record<
        LangCode,
        {
          app1: string;
          learner1: string;
          app2: string;
          learner2: string;
          learner3?: string;
          app3?: string;
        }
      >;
    }
  | {
      id: string;
      type: "game";
      title: string;
      pairsByLanguage: Record<LangCode, { left: string; right: string }[]>;
    }
  | {
      id: string;
      type: "assessment";
      title: string;
      tasksByLanguage: Record<LangCode, string[]>;
    };

interface LessonPlayerProps {
  language: LangCode;
  onExit: () => void;
}

type SayStatus = "idle" | "listening" | "correct" | "wrong";

/* ---------------- helper functions ---------------- */

function languageToTTS(language: LangCode) {
  if (language === "en") return "en-US";
  if (language === "es") return "es-ES";
  return "zh-CN";
}

function stopSpeech() {
  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }
}

function shuffle<T>(arr: T[]) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function normalizeForCompare(s: string, lang: LangCode) {
  let out = (s ?? "")
    .toLowerCase()
    .replaceAll("’", "'")
    .replaceAll("…", "")
    .replaceAll("\u00A0", " ")
    .trim();

  out = out.replace(/[^a-z0-9\u4e00-\u9fff\s']/gi, "");
  out = out.replace(/\s+/g, " ").trim();
  return out;
}

function levenshtein(a: string, b: string) {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;

  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost);
    }
  }
  return dp[m][n];
}

function similarity(a: string, b: string) {
  const A = a.trim();
  const B = b.trim();
  const maxLen = Math.max(A.length, B.length);
  if (maxLen === 0) return 1;
  return 1 - levenshtein(A, B) / maxLen;
}

function isGoodMatch(transcriptRaw: string, expectedRaw: string, lang: LangCode) {
  const t = normalizeForCompare(transcriptRaw, lang);
  const e = normalizeForCompare(expectedRaw, lang);
  if (!t || !e) return false;
  if (t === e) return true;
  if (e.length >= 10 && t.includes(e)) return true;
  if (t.length >= 10 && e.includes(t)) return true;

  const score = similarity(t, e);
  return lang === "zh" ? score >= 0.6 : score >= 0.72;
}

function syllableHint(text: string) {
  const cleaned = (text ?? "").replaceAll("’", "'").replaceAll("…", "").trim();
  const words = cleaned.split(/\s+/).filter(Boolean);
  return words
    .map((w) => {
      const parts = w
        .toLowerCase()
        .replace(/[^a-z']/g, "")
        .match(/[bcdfghjklmnpqrstvwxyz]*[aeiouy]+(?:[^aeiouy]+)?/g);
      if (!parts || parts.length === 0) return w;
      return parts.join(" • ");
    })
    .join("   ");
}

function spacedCharacters(text: string) {
  return (text ?? "").trim().split("").join(" ");
}

function dedupe(arr: string[]) {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const x of arr) {
    const k = String(x);
    if (!seen.has(k)) {
      seen.add(k);
      out.push(k);
    }
  }
  return out;
}

function ensureAtLeast(base: string[], min: number, filler: string[]) {
  const out = [...base];
  let i = 0;
  while (out.length < min && i < filler.length) {
    const candidate = filler[i++];
    if (!out.includes(candidate)) out.push(candidate);
  }
  return out;
}

function languageFallbackDistractors(language: LangCode): string[] {
  if (language === "en")
    return ["Hello", "Hi", "name", "is", "My", "your", "What's", "Nice", "to", "meet", "you", "you.", "name?", "Hello!", "Hi!"];
  if (language === "es")
    return ["Hola", "¡Hola!", "Hi", "Me", "llamo", "¿Cómo", "te", "llamas?", "Mucho", "gusto."];
  return ["你", "我叫", "你好！", "嗨！", "叫什么", "名字？", "很高兴", "认识", "你。"];
}

/* ---------------- main ---------------- */

const LessonPlayer: React.FC<LessonPlayerProps> = ({ language, onExit }) => {
  const lesson = lesson01 as unknown as { id: string; title: string; steps: LessonStep[] };

  const [stepIndex, setStepIndex] = useState(0);
  const [name, setName] = useState("Alex");

  // Completion screen
  const [showComplete, setShowComplete] = useState(false);

  // Progress / gating state
  const [heardIds, setHeardIds] = useState<string[]>([]);
  const [matchedCountStep2, setMatchedCountStep2] = useState(0);
  const [sayItCorrectIds, setSayItCorrectIds] = useState<string[]>([]);
  const [buildDoneCount, setBuildDoneCount] = useState(0);
  const [buildTotalCount, setBuildTotalCount] = useState(5);
  const [convCorrectKeys, setConvCorrectKeys] = useState<string[]>([]);
  const [matchedCountStep6, setMatchedCountStep6] = useState(0);

  const step = lesson.steps[stepIndex];

  useEffect(() => {
    // reset per step / language
    setHeardIds([]);
    setMatchedCountStep2(0);
    setSayItCorrectIds([]);
    setBuildDoneCount(0);
    setBuildTotalCount(5);
    setConvCorrectKeys([]);
    setMatchedCountStep6(0);
    setShowComplete(false);
    stopSpeech();
  }, [stepIndex, language]);

  // Step 1 gating
  const isStep1Listen = stepIndex === 0 && step?.type === "listen";
  const step1Total = isStep1Listen ? (step as any).itemsByLanguage[language].length : 0;
  const step1AllHeard = !isStep1Listen ? true : heardIds.length >= step1Total;

  // Step 2 gating
  const isStep2Match = stepIndex === 1 && step?.type === "vocab";
  const step2Total = isStep2Match ? (step as any).itemsByLanguage[language].length : 0;
  const step2AllMatched = !isStep2Match ? true : matchedCountStep2 >= step2Total;

  // Step 3 gating
  const isStep3SayIt = stepIndex === 2 && step?.type === "pronounce";
  const step3Total = isStep3SayIt ? (step as any).itemsByLanguage[language].length : 0;
  const step3AllCorrect = !isStep3SayIt ? true : sayItCorrectIds.length >= step3Total;

  // Step 4 gating
  const isStep4Build = stepIndex === 3 && step?.type === "build";
  const step4AllCorrect = !isStep4Build ? true : buildDoneCount >= buildTotalCount;

  // Step 5 gating
  const isStep5Conversation = stepIndex === 4 && step?.type === "conversation";
  const step5RequiredLearnerLines = useMemo(() => {
    if (!isStep5Conversation) return 0;
    const s = (step as any).scriptByLanguage[language];
    let count = 0;
    if ((s.learner1 ?? "").trim()) count++;
    if ((s.learner2 ?? "").trim()) count++;
    if ((s.learner3 ?? "").trim()) count++;
    return count;
  }, [isStep5Conversation, step, language]);

  const step5AllCorrect = !isStep5Conversation ? true : convCorrectKeys.length >= step5RequiredLearnerLines;

  // Step 6 gating
  const isStep6FillBlank = stepIndex === 5 && step?.type === "game";
  const step6Total = isStep6FillBlank ? (step as any).pairsByLanguage[language].length : 0;
  const step6AllMatched = !isStep6FillBlank ? true : matchedCountStep6 >= step6Total;

  const canPrev = stepIndex > 0;
  const canNextBase = stepIndex < lesson.steps.length - 1;

  const canNext =
    canNextBase &&
    step1AllHeard &&
    step2AllMatched &&
    step3AllCorrect &&
    step4AllCorrect &&
    step5AllCorrect &&
    step6AllMatched;

  const isLastStep = stepIndex === lesson.steps.length - 1;

  const canComplete =
    isLastStep &&
    step1AllHeard &&
    step2AllMatched &&
    step3AllCorrect &&
    step4AllCorrect &&
    step5AllCorrect &&
    step6AllMatched;

  const next = () => {
    if (!canNext) return;
    stopSpeech();
    setStepIndex((i) => Math.min(i + 1, lesson.steps.length - 1));
    window.scrollTo(0, 0);
  };

  const prev = () => {
    stopSpeech();
    setStepIndex((i) => Math.max(i - 1, 0));
    window.scrollTo(0, 0);
  };

  const headerBadge = useMemo(() => {
    if (language === "en") return "English";
    if (language === "es") return "Spanish";
    return "Mandarin";
  }, [language]);

  const markHeard = (id: string) => setHeardIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
  const markSayItCorrect = (id: string) => setSayItCorrectIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
  const markConvCorrect = (key: string) => setConvCorrectKeys((prev) => (prev.includes(key) ? prev : [...prev, key]));

  if (!step) {
    return (
      <div className="min-h-screen pt-28 px-4 bg-[#F0F4F8]">
        <div className="max-w-4xl mx-auto bg-white rounded-3xl shadow-xl p-8">
          <div className="font-bold text-red-600">Error: step not found.</div>
        </div>
      </div>
    );
  }

  if (showComplete) {
    return (
      <div className="min-h-screen pt-28 pb-16 px-4 bg-[#FFE4EF]">
        <div className="max-w-4xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-3xl shadow-xl p-10 text-center">
            <div className="text-4xl font-heading font-black text-gray-800">Great job! 🎉</div>
            <div className="mt-2 text-gray-600 font-semibold">
              You completed Lesson 1 in {headerBadge}.
            </div>

            <div className="mt-8 flex items-center justify-center">
              <div className="w-20 h-20 rounded-3xl bg-[#F7FAFF] border border-blue-100 flex items-center justify-center text-4xl">
                🏆
              </div>
            </div>

            <div className="mt-8">
              <div className="text-sm font-extrabold text-gray-600 mb-2">Progress</div>
              <div className="h-4 w-full rounded-full bg-gray-100 overflow-hidden">
                <div className="h-full w-full bg-primary rounded-full" />
              </div>
              <div className="mt-2 text-xs font-bold text-gray-500">Lesson 1 Complete</div>
            </div>

            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button onClick={() => setShowComplete(false)} className="px-5 py-3 rounded-xl bg-gray-100 text-gray-800 font-bold hover:bg-gray-200">
                Review Lesson
              </button>

              <button
                onClick={() => {
                  stopSpeech();
                  onExit();
                }}
                className="px-5 py-3 rounded-xl bg-primary text-white font-bold hover:bg-primary/90"
              >
                Back to Map
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-28 pb-16 px-4 bg-[#F0F4F8]">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => {
              stopSpeech();
              onExit();
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white shadow-sm font-bold text-gray-700 hover:bg-gray-50"
          >
            <ArrowLeft size={18} />
            Back
          </button>

          <div className="px-4 py-2 rounded-full bg-white shadow-sm font-extrabold text-primary text-sm uppercase tracking-wide">
            {headerBadge} • Lesson 1
          </div>
        </div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-3xl shadow-xl p-8">
          <div className="flex items-start justify-between gap-4 mb-6">
            <div>
              <h1 className="font-heading font-black text-3xl text-gray-800">{lesson.title}</h1>
              <p className="text-gray-500 font-semibold mt-1">
                Step {stepIndex + 1} of {lesson.steps.length}: <span className="text-gray-700">{step.title}</span>
              </p>

              {isStep5Conversation ? (
                <div className="mt-3 text-sm font-bold text-gray-600">
                  Completed: <span className="text-gray-900">{convCorrectKeys.length}/{step5RequiredLearnerLines}</span>
                </div>
              ) : null}

              {isStep6FillBlank ? (
                <div className="mt-3 text-sm font-bold text-gray-600">
                  Matched: <span className="text-gray-900">{matchedCountStep6}/{step6Total}</span>
                </div>
              ) : null}
            </div>
          </div>

          {/* Step Body */}
          {step.type === "listen" && isStep1Listen ? (
            <StepListenCards step={step} language={language} heardIds={heardIds} onHeard={markHeard} />
          ) : step.type === "vocab" && isStep2Match ? (
            <Step2AudioMatch step={step} language={language} onProgress={setMatchedCountStep2} />
          ) : step.type === "pronounce" && isStep3SayIt ? (
            <Step3SayIt step={step} language={language} correctIds={sayItCorrectIds} onCorrect={markSayItCorrect} />
          ) : step.type === "build" && isStep4Build ? (
            <Step4BuildMulti
              step={step}
              language={language}
              name={name}
              setName={setName}
              onProgress={(done, total) => {
                setBuildDoneCount(done);
                setBuildTotalCount(total);
              }}
            />
          ) : step.type === "conversation" && isStep5Conversation ? (
            <Step5ConversationPronounce step={step} language={language} name={name} correctKeys={convCorrectKeys} onCorrect={markConvCorrect} />
          ) : step.type === "game" && isStep6FillBlank ? (
            <Step6FillBlank step={step} language={language} onProgress={setMatchedCountStep6} />
          ) : step.type === "assessment" ? (
            <StepAssessment step={step} language={language} name={name} />
          ) : (
            <div className="p-4 rounded-2xl bg-yellow-50 border border-yellow-200 text-yellow-900 font-bold">
              This step type/index isn’t wired in this file. (stepIndex={stepIndex}, type={step.type})
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between mt-10">
            <button
              onClick={prev}
              disabled={!canPrev}
              className={`px-5 py-3 rounded-xl font-bold flex items-center gap-2 ${
                canPrev ? "bg-gray-100 text-gray-800 hover:bg-gray-200" : "bg-gray-50 text-gray-300 cursor-not-allowed"
              }`}
            >
              <ArrowLeft size={18} />
              Prev
            </button>

            {isLastStep ? (
              <button
                onClick={() => {
                  if (!canComplete) return;
                  stopSpeech();
                  setShowComplete(true);
                  window.scrollTo(0, 0);
                }}
                disabled={!canComplete}
                className={`px-5 py-3 rounded-xl font-bold flex items-center gap-2 ${
                  canComplete
                    ? "bg-primary text-white hover:bg-primary/90 shadow-[0_4px_0_rgb(109,40,217)] active:shadow-none active:translate-y-1"
                    : "bg-gray-50 text-gray-300 cursor-not-allowed"
                }`}
              >
                Complete Lesson ✅
                <CheckCircle2 size={18} />
              </button>
            ) : (
              <button
                onClick={next}
                disabled={!canNext}
                className={`px-5 py-3 rounded-xl font-bold flex items-center gap-2 ${
                  canNext
                    ? "bg-primary text-white hover:bg-primary/90 shadow-[0_4px_0_rgb(109,40,217)] active:shadow-none active:translate-y-1"
                    : "bg-gray-50 text-gray-300 cursor-not-allowed"
                }`}
              >
                Next
                <ArrowRight size={18} />
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default LessonPlayer;

/* ---------------- Step 1: Listen ---------------- */

function StepListenCards({
  step,
  language,
  heardIds,
  onHeard
}: {
  step: Extract<LessonStep, { type: "listen" }>;
  language: LangCode;
  heardIds: string[];
  onHeard: (id: string) => void;
}) {
  const items = step.itemsByLanguage[language];
  const heardSet = useMemo(() => new Set(heardIds), [heardIds]);

  const handleClick = (item: ListenItem) => {
    speak((item.ttsText ?? item.text).trim(), (item.ttsLang ?? languageToTTS(language)).trim());
    onHeard(item.id);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
      {items.map((item) => {
        const isHeard = heardSet.has(item.id);
        return (
          <button
            key={item.id}
            onClick={() => handleClick(item)}
            className={[
              "text-left transition-colors rounded-2xl p-5 border shadow-sm",
              isHeard ? "bg-green-50 border-green-200 hover:bg-green-100" : "bg-[#F7FAFF] border-blue-100 hover:bg-[#EEF4FF]"
            ].join(" ")}
          >
            <div className="flex items-center justify-between">
              <div className="font-heading font-extrabold text-2xl text-gray-800">{item.text}</div>
              <div className={`p-2 rounded-xl bg-white border ${isHeard ? "border-green-100" : "border-gray-100"}`}>
                <Volume2 size={18} className="text-gray-700" />
              </div>
            </div>

            {item.pinyin ? <div className="mt-2 text-sm font-bold text-gray-600">Pinyin: {item.pinyin}</div> : null}

            <div className={`mt-3 text-xs font-extrabold uppercase tracking-wide ${isHeard ? "text-green-700" : "text-primary"}`}>
              {isHeard ? "Completed ✓" : "Tap to hear"}
            </div>
          </button>
        );
      })}
    </div>
  );
}

/* ---------------- Step 2: Audio Match ---------------- */

type Step2LeftCard = { id: string; correctRightId: string; ttsText: string; ttsLang: string };
type Step2RightCard = { id: string; text: string; ttsText: string; ttsLang: string; pinyin?: string };

function Step2AudioMatch({
  step,
  language,
  onProgress
}: {
  step: Extract<LessonStep, { type: "vocab" }>;
  language: LangCode;
  onProgress: (count: number) => void;
}) {
  const baseItems = step.itemsByLanguage[language];

  const leftCards: Step2LeftCard[] = useMemo(
    () =>
      baseItems.map((it) => ({
        id: `L-${it.id}`,
        correctRightId: it.id,
        ttsText: it.ttsText,
        ttsLang: it.ttsLang
      })),
    [baseItems]
  );

  const rightCards: Step2RightCard[] = useMemo(
    () =>
      baseItems.map((it) => ({
        id: it.id,
        text: it.text,
        ttsText: it.ttsText,
        ttsLang: it.ttsLang,
        pinyin: it.pinyin
      })),
    [baseItems]
  );

  const shuffledLeft = useMemo(() => shuffle(leftCards), [leftCards]);
  const shuffledRight = useMemo(() => shuffle(rightCards), [rightCards]);

  const [selectedLeftId, setSelectedLeftId] = useState<string | null>(null);
  const [matches, setMatches] = useState<Record<string, string>>({});
  const [wrongPair, setWrongPair] = useState<{ leftId: string; rightId: string } | null>(null);

  useEffect(() => {
    onProgress(Object.keys(matches).length);
  }, [matches, onProgress]);

  const isMatchedLeft = (leftId: string) => matches[leftId] != null;
  const isMatchedRight = (rightId: string) => Object.values(matches).includes(rightId);

  const clickLeft = (card: Step2LeftCard) => {
    if (isMatchedLeft(card.id)) return;
    setSelectedLeftId(card.id);
    speak(card.ttsText, card.ttsLang);
  };

  const clickRight = (card: Step2RightCard) => {
    speak(card.ttsText, card.ttsLang);
    if (!selectedLeftId) return;
    if (isMatchedRight(card.id)) return;

    const leftCard = leftCards.find((c) => c.id === selectedLeftId);
    if (!leftCard) return;

    if (leftCard.correctRightId === card.id) {
      setMatches((prev) => ({ ...prev, [selectedLeftId]: card.id }));
      setSelectedLeftId(null);
      setWrongPair(null);
      return;
    }

    const lp = { leftId: selectedLeftId, rightId: card.id };
    setWrongPair(lp);
    window.setTimeout(() => {
      setWrongPair((curr) => (curr && curr.leftId === lp.leftId && curr.rightId === lp.rightId ? null : curr));
    }, 900);
  };

  const leftStatusClass = (leftId: string) => {
    const matched = isMatchedLeft(leftId);
    const selected = selectedLeftId === leftId;
    const wrong = wrongPair?.leftId === leftId;
    if (matched) return "bg-green-50 border-green-200 hover:bg-green-100";
    if (wrong) return "bg-red-50 border-red-200";
    if (selected) return "bg-purple-50 border-purple-200";
    return "bg-[#F7FAFF] border-blue-100 hover:bg-[#EEF4FF]";
  };

  const rightStatusClass = (rightId: string) => {
    const matched = isMatchedRight(rightId);
    const wrong = wrongPair?.rightId === rightId;
    if (matched) return "bg-green-50 border-green-200 hover:bg-green-100";
    if (wrong) return "bg-red-50 border-red-200";
    return "bg-white border-gray-200 hover:bg-gray-50";
  };

  return (
    <div className="space-y-4">
      <div className="text-sm font-bold text-gray-600">1) Tap a left box to hear. 2) Match it to the word on the right.</div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="space-y-3">
          <div className="text-xs font-extrabold text-gray-500 uppercase tracking-wide">Tap to hear</div>
          {shuffledLeft.map((c) => (
            <button
              key={c.id}
              onClick={() => clickLeft(c)}
              disabled={isMatchedLeft(c.id)}
              className={["w-full text-left rounded-2xl p-5 border shadow-sm transition-colors", leftStatusClass(c.id)].join(" ")}
            >
              <div className="flex items-center justify-between">
                <div className="font-heading font-extrabold text-xl text-gray-800">Tap to hear</div>
                <div className="p-2 rounded-xl bg-white border border-gray-100">
                  <Volume2 size={18} className="text-gray-700" />
                </div>
              </div>
              <div className="mt-3 text-xs font-extrabold uppercase tracking-wide text-gray-500">
                {isMatchedLeft(c.id) ? "Matched ✓" : selectedLeftId === c.id ? "Now pick the match →" : " "}
              </div>
            </button>
          ))}
        </div>

        <div className="space-y-3">
          <div className="text-xs font-extrabold text-gray-500 uppercase tracking-wide">Match the word</div>
          {shuffledRight.map((c) => (
            <button
              key={c.id}
              onClick={() => clickRight(c)}
              disabled={isMatchedRight(c.id)}
              className={["w-full text-left rounded-2xl p-5 border shadow-sm transition-colors", rightStatusClass(c.id)].join(" ")}
            >
              <div className="flex items-center justify-between">
                <div className="font-heading font-extrabold text-xl text-gray-800">{c.text}</div>
                <div className="p-2 rounded-xl bg-white border border-gray-100">
                  <Volume2 size={18} className="text-gray-700" />
                </div>
              </div>
              {c.pinyin ? <div className="mt-2 text-sm font-bold text-gray-600">Pinyin: {c.pinyin}</div> : null}
              <div className="mt-3 text-xs font-extrabold uppercase tracking-wide text-gray-500">
                {isMatchedRight(c.id) ? "Matched ✓" : "Tap to hear"}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ---------------- Step 3: Say It ---------------- */

function Step3SayIt({
  step,
  language,
  correctIds,
  onCorrect
}: {
  step: Extract<LessonStep, { type: "pronounce" }>;
  language: LangCode;
  correctIds: string[];
  onCorrect: (id: string) => void;
}) {
  const items = step.itemsByLanguage[language];
  const correctSet = useMemo(() => new Set(correctIds), [correctIds]);

  const [statusById, setStatusById] = useState<Record<string, SayStatus>>({});
  const [heardTextById, setHeardTextById] = useState<Record<string, string>>({});
  const [activeId, setActiveId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);
  const isSupported =
    typeof window !== "undefined" && !!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);

  useEffect(() => {
    return () => {
      try {
        recognitionRef.current?.stop?.();
      } catch {}
    };
  }, []);

  const startListening = (item: ListenItem) => {
    setErrorMsg(null);
    if (!isSupported) {
      setErrorMsg("Speech recognition is not supported in this browser. Try Chrome on desktop.");
      return;
    }

    stopSpeech();
    try {
      recognitionRef.current?.stop?.();
    } catch {}

    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const rec = new SR();
    recognitionRef.current = rec;

    rec.lang = (item.ttsLang ?? languageToTTS(language)).trim();
    rec.continuous = false;
    rec.interimResults = false;
    rec.maxAlternatives = 3;

    setActiveId(item.id);
    setStatusById((p) => ({ ...p, [item.id]: "listening" }));

    rec.onresult = (event: any) => {
      const transcript = String(event.results?.[0]?.[0]?.transcript ?? "").trim();
      setHeardTextById((p) => ({ ...p, [item.id]: transcript }));

      const expected = (item.ttsText ?? item.text ?? "").trim();
      const ok = isGoodMatch(transcript, expected, language);

      if (ok) {
        setStatusById((p) => ({ ...p, [item.id]: "correct" }));
        onCorrect(item.id);
      } else {
        setStatusById((p) => ({ ...p, [item.id]: "wrong" }));
        window.setTimeout(() => {
          setStatusById((p) => (p[item.id] !== "wrong" ? p : { ...p, [item.id]: "idle" }));
        }, 1200);
      }

      setActiveId(null);
      try {
        rec.stop();
      } catch {}
    };

    rec.onerror = (e: any) => {
      setActiveId(null);
      setStatusById((p) => ({ ...p, [item.id]: "idle" }));

      const code = e?.error ? String(e.error) : "unknown";
      if (code === "not-allowed" || code === "service-not-allowed") {
        setErrorMsg("Microphone permission blocked. Allow mic access in your browser settings.");
      } else if (code === "no-speech") {
        setErrorMsg("I didn't hear anything. Try again and speak louder.");
      } else {
        setErrorMsg("Speech recognition error. Try again.");
      }

      try {
        rec.stop();
      } catch {}
    };

    rec.onend = () => {
      setStatusById((p) => (p[item.id] === "listening" ? { ...p, [item.id]: "idle" } : p));
      setActiveId(null);
    };

    try {
      rec.start();
    } catch {
      setErrorMsg("Could not start microphone. Try refreshing the page.");
      setStatusById((p) => ({ ...p, [item.id]: "idle" }));
      setActiveId(null);
    }
  };

  const stopListening = () => {
    try {
      recognitionRef.current?.stop?.();
    } catch {}
    setActiveId(null);
  };

  const playExample = (item: ListenItem) => {
    speak((item.ttsText ?? item.text).trim(), (item.ttsLang ?? languageToTTS(language)).trim());
  };

  const cardClass = (id: string) => {
    const st = statusById[id] ?? "idle";
    const isCorrect = correctSet.has(id) || st === "correct";
    if (isCorrect) return "bg-green-50 border-green-200 hover:bg-green-100";
    if (st === "wrong") return "bg-red-50 border-red-200";
    if (st === "listening") return "bg-purple-50 border-purple-200";
    return "bg-[#F7FAFF] border-blue-100 hover:bg-[#EEF4FF]";
  };

  return (
    <div className="space-y-4">
      {!isSupported ? (
        <div className="p-4 rounded-2xl bg-yellow-50 border border-yellow-200 text-yellow-900 font-bold">
          Speech recognition isn’t available in this browser. Try Chrome (desktop/laptop).
        </div>
      ) : null}

      {errorMsg ? <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 font-bold">{errorMsg}</div> : null}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {items.map((item) => {
          const st = statusById[item.id] ?? "idle";
          const isCorrect = correctSet.has(item.id) || st === "correct";
          const lastHeard = heardTextById[item.id];

          const hint =
            language === "zh"
              ? item.pinyin
                ? item.pinyin
                : spacedCharacters(item.text)
              : syllableHint(item.ttsText ?? item.text);

          return (
            <div key={item.id} className={["rounded-2xl p-5 border shadow-sm transition-colors", cardClass(item.id)].join(" ")}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-heading font-extrabold text-2xl text-gray-800">{item.text}</div>
                  {item.pinyin ? <div className="mt-1 text-sm font-bold text-gray-600">Pinyin: {item.pinyin}</div> : null}
                </div>

                <button onClick={() => playExample(item)} className="p-3 rounded-xl bg-white border border-gray-100 hover:bg-gray-50" title="Hear it">
                  <Volume2 size={18} className="text-gray-700" />
                </button>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-2">
                {!isCorrect ? (
                  <>
                    <button
                      onClick={() => startListening(item)}
                      disabled={activeId !== null && activeId !== item.id}
                      className={`px-4 py-2 rounded-xl font-extrabold flex items-center gap-2 ${
                        st === "listening" ? "bg-purple-600 text-white" : "bg-primary text-white hover:bg-primary/90"
                      }`}
                    >
                      <Mic size={16} />
                      {st === "listening" ? "Listening..." : "Start"}
                    </button>

                    <button
                      onClick={stopListening}
                      disabled={st !== "listening"}
                      className={`px-4 py-2 rounded-xl font-extrabold flex items-center gap-2 ${
                        st === "listening" ? "bg-gray-100 text-gray-800 hover:bg-gray-200" : "bg-gray-50 text-gray-300 cursor-not-allowed"
                      }`}
                    >
                      <Square size={16} />
                      Stop
                    </button>
                  </>
                ) : (
                  <div className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-white border border-green-100 text-green-700 font-extrabold">
                    <CheckCircle2 className="text-green-500" size={18} />
                    Correct
                  </div>
                )}
              </div>

              {lastHeard ? (
                <div className="mt-3 text-sm font-bold text-gray-700">
                  You said: <span className="text-gray-900">“{lastHeard}”</span>
                </div>
              ) : null}

              {st === "wrong" ? (
                <div className="mt-3 p-3 rounded-xl bg-white border border-red-100">
                  <div className="text-sm font-extrabold text-red-700">Try again 👇</div>
                  <div className="mt-1 text-sm font-bold text-gray-700">{hint}</div>
                </div>
              ) : null}

              <div className="mt-3 text-xs font-extrabold uppercase tracking-wide text-gray-500">{isCorrect ? "Completed ✓" : "Listen → then say it"}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ---------------- Step 4: Build (hear only) ---------------- */

type BuildSentence = {
  key: string;
  tts: string;
  ttsLang: string;
  tilesCorrect: string[];
  distractors?: string[];
};

function Step4BuildMulti({
  step,
  language,
  name,
  setName,
  onProgress
}: {
  step: Extract<LessonStep, { type: "build" }>;
  language: LangCode;
  name: string;
  setName: (v: string) => void;
  onProgress: (done: number, total: number) => void;
}) {
  const ttsLang = step.templateByLanguage[language].ttsLang;

  const zhPinyin: Record<string, string> = {
    "我叫": "Wǒ jiào",
    "你好！": "Nǐ hǎo!",
    "你好": "Nǐ hǎo",
    "嗨！": "Hāi!",
    "嗨": "Hāi",
    "你": "Nǐ",
    "叫什么": "jiào shénme",
    "名字？": "míngzì?",
    "名字": "míngzì",
    "很高兴": "Hěn gāoxìng",
    "认识": "rènshi",
    "你。": "nǐ."
  };

  const sentences: BuildSentence[] = useMemo(() => {
    if (language === "en") {
      return [
        { key: "en-1", tts: `My name is ${name}.`, ttsLang, tilesCorrect: ["My", "name", "is", `${name}.`], distractors: ["Hello!", "Hi!", "your", "What's", "meet", "you."] },
        { key: "en-2", tts: "Hello!", ttsLang, tilesCorrect: ["Hello!"], distractors: ["Hi!", "name", "is", "My", "your", "What's", "Hello", "you."] },
        { key: "en-3", tts: "Hi!", ttsLang, tilesCorrect: ["Hi!"], distractors: ["Hello!", "My", "name", "is", "your", "What's", "Hi", "meet"] },
        { key: "en-4", tts: "What's your name?", ttsLang, tilesCorrect: ["What's", "your", "name?"], distractors: ["My", "name", "is", "Hello!", "Hi!", "meet", "you."] },
        { key: "en-5", tts: "Nice to meet you.", ttsLang, tilesCorrect: ["Nice", "to", "meet", "you."], distractors: ["Hello!", "Hi!", "What's", "your", "name?", "My", "is"] }
      ];
    }

    if (language === "es") {
      return [
        { key: "es-1", tts: `Me llamo ${name}.`, ttsLang, tilesCorrect: ["Me", "llamo", `${name}.`], distractors: ["Hola", "Hi", "¿Cómo", "te", "llamas?", "gusto."] },
        { key: "es-2", tts: "¡Hola!", ttsLang, tilesCorrect: ["¡Hola!"], distractors: ["Hola", "Hi", "Me", "llamo", "¿Cómo", "te", "gusto", "llamas?"] },
        { key: "es-3", tts: "Hi", ttsLang, tilesCorrect: ["Hi"], distractors: ["¡Hola!", "Hola", "Me", "llamo", "¿Cómo", "te", "llamas?", "gusto."] },
        { key: "es-4", tts: "¿Cómo te llamas?", ttsLang, tilesCorrect: ["¿Cómo", "te", "llamas?"], distractors: ["Me", "llamo", "¡Hola!", "Hola", "gusto.", "Hi", `${name}.`] },
        { key: "es-5", tts: "Mucho gusto.", ttsLang, tilesCorrect: ["Mucho", "gusto."], distractors: ["Me", "llamo", "¡Hola!", "Hola", "¿Cómo", "te", "llamas?", "Hi"] }
      ];
    }

    return [
      { key: "zh-1", tts: `我叫 ${name}。`, ttsLang, tilesCorrect: ["我叫", `${name}。`], distractors: ["你好！", "嗨！", "你", "叫什么", "名字？", "很高兴", "认识"] },
      { key: "zh-2", tts: "你好！", ttsLang, tilesCorrect: ["你好！"], distractors: ["嗨！", "我叫", "你", "名字？", "叫什么", "很高兴", "认识", "你。"] },
      { key: "zh-3", tts: "嗨！", ttsLang, tilesCorrect: ["嗨！"], distractors: ["你好！", "我叫", "你", "叫什么", "名字？", "很高兴", "认识", "你。"] },
      { key: "zh-4", tts: "你叫什么名字？", ttsLang, tilesCorrect: ["你", "叫什么", "名字？"], distractors: ["你好！", "嗨！", "我叫", `${name}。`, "很高兴", "认识", "你。"] },
      { key: "zh-5", tts: "很高兴认识你。", ttsLang, tilesCorrect: ["很高兴", "认识", "你。"], distractors: ["你好！", "嗨！", "你", "叫什么", "名字？", "我叫", `${name}。`] }
    ];
  }, [language, name, ttsLang]);

  const [builtByKey, setBuiltByKey] = useState<Record<string, string[]>>({});
  const [doneKeys, setDoneKeys] = useState<string[]>([]);

  useEffect(() => {
    setBuiltByKey({});
    setDoneKeys([]);
  }, [language, name]);

  useEffect(() => {
    onProgress(doneKeys.length, sentences.length);
  }, [doneKeys, sentences.length, onProgress]);

  const doneSet = useMemo(() => new Set(doneKeys), [doneKeys]);

  const tileBankByKey = useMemo(() => {
    const map: Record<string, string[]> = {};
    for (const s of sentences) {
      const distractors = (s.distractors ?? []).filter(Boolean);
      const pool = dedupe([...s.tilesCorrect, ...distractors]);
      const minOptions = s.tilesCorrect.length === 1 ? 8 : 10;
      map[s.key] = shuffle(ensureAtLeast(pool, minOptions, languageFallbackDistractors(language)));
    }
    return map;
  }, [sentences, language]);

  const isComplete = (key: string, correctTiles: string[]) => {
    const built = builtByKey[key] ?? [];
    return built.join(" ") === correctTiles.join(" ");
  };

  const clickTile = (sentenceKey: string, tile: string) => {
    if (doneSet.has(sentenceKey)) return;

    setBuiltByKey((prev) => {
      const curr = prev[sentenceKey] ?? [];
      const bank = tileBankByKey[sentenceKey] ?? [];

      const countInCurr = curr.filter((x) => x === tile).length;
      const countInBank = bank.filter((x) => x === tile).length;
      if (countInCurr >= countInBank) return prev;

      return { ...prev, [sentenceKey]: [...curr, tile] };
    });
  };

  const resetOne = (sentenceKey: string) => {
    if (doneSet.has(sentenceKey)) return;
    setBuiltByKey((prev) => ({ ...prev, [sentenceKey]: [] }));
  };

  useEffect(() => {
    const newlyDone: string[] = [];
    for (const s of sentences) {
      if (doneSet.has(s.key)) continue;
      if (isComplete(s.key, s.tilesCorrect)) newlyDone.push(s.key);
    }
    if (newlyDone.length) setDoneKeys((prev) => [...prev, ...newlyDone]);
  }, [builtByKey]);

  return (
    <div className="space-y-6">
      <div className="bg-[#F7FAFF] border border-blue-100 rounded-2xl p-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="text-sm font-extrabold text-gray-500 uppercase tracking-wide">Choose a name</div>
            <div className="mt-2 flex flex-wrap gap-2">
              {step.names.map((n) => (
                <button
                  key={n}
                  onClick={() => setName(n)}
                  className={`px-4 py-2 rounded-xl font-bold ${
                    n === name ? "bg-primary text-white" : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          <div className="text-sm font-bold text-gray-600">
            Listen 🎧 then build all <span className="text-gray-900">5</span> to unlock Next ✅
          </div>
        </div>
      </div>

      <div className="space-y-5">
        {sentences.map((s, idx) => {
          const built = builtByKey[s.key] ?? [];
          const done = doneSet.has(s.key);
          const completeNow = done || built.join(" ") === s.tilesCorrect.join(" ");

          return (
            <div
              key={s.key}
              className={[
                "rounded-2xl p-5 border shadow-sm transition-colors",
                completeNow ? "bg-green-50 border-green-200 shadow-[0_0_0_3px_rgba(34,197,94,0.25)]" : "bg-white border-gray-100"
              ].join(" ")}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-xs font-extrabold text-gray-500 uppercase tracking-wide">Sentence {idx + 1}</div>
                  <div className="mt-1 text-sm font-bold text-gray-600">Tap “Hear it” and build what you hear.</div>
                </div>

                <button
                  onClick={() => speak(s.tts, s.ttsLang)}
                  className="px-4 py-3 rounded-xl bg-white border border-gray-200 font-extrabold flex items-center gap-2 hover:bg-gray-50"
                >
                  <Volume2 size={18} />
                  Hear it
                </button>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {(tileBankByKey[s.key] ?? []).map((t, i) => {
                  const py = language === "zh" ? zhPinyin[t] : undefined;
                  return (
                    <button
                      key={`${s.key}-${t}-${i}`}
                      onClick={() => clickTile(s.key, t)}
                      disabled={done}
                      className={`px-4 py-2 rounded-xl font-bold ${
                        done ? "bg-gray-50 text-gray-300 cursor-not-allowed" : "bg-gray-100 hover:bg-gray-200 text-gray-800"
                      }`}
                    >
                      <span>{t}</span>
                      {py ? <span className="ml-2 text-xs font-extrabold text-gray-500">({py})</span> : null}
                    </button>
                  );
                })}
              </div>

              <div
                className={[
                  "mt-5 p-4 rounded-xl border min-h-[56px] font-heading font-extrabold text-xl flex items-center justify-between",
                  completeNow ? "bg-green-50 border-green-200 text-green-800" : "bg-[#F7FAFF] border-blue-100 text-gray-800"
                ].join(" ")}
              >
                <span>{built.join(" ") || "Tap words above…"}</span>
                {completeNow ? <CheckCircle2 className="text-green-500" /> : null}
              </div>

              {language === "zh" ? (
                <div className="mt-2 text-xs font-bold text-gray-600">
                  (
                  {built
                    .map((tok) => zhPinyin[tok] ?? tok)
                    .join(" ")}
                  )
                </div>
              ) : null}

              <div className="mt-4 flex items-center gap-3">
                {!done ? (
                  <button onClick={() => resetOne(s.key)} className="px-4 py-2 rounded-xl bg-gray-100 font-bold text-gray-700 hover:bg-gray-200">
                    Reset
                  </button>
                ) : (
                  <div className="text-sm font-extrabold text-green-700">Completed ✓</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ---------------- Step 5: Conversation + Pronunciation ---------------- */

function Step5ConversationPronounce({
  step,
  language,
  name,
  correctKeys,
  onCorrect
}: {
  step: Extract<LessonStep, { type: "conversation" }>;
  language: LangCode;
  name: string;
  correctKeys: string[];
  onCorrect: (key: string) => void;
}) {
  const s = step.scriptByLanguage[language];

  const app1 = s.app1 ?? "";
  const learner1 = (s.learner1 ?? "").replace("{name}", name);
  const app2 = s.app2 ?? "";
  const learner2 = (s.learner2 ?? "").replace("{name}", name);

  const learner3 = (s.learner3 ?? "").replace("{name}", name);
  const app3 = (s.app3 ?? "").replace("{name}", name);

  const zhPinyinLine: Record<string, string> = {
    "你好！": "Nǐ hǎo!",
    "你好": "Nǐ hǎo",
    "嗨！": "Hāi!",
    "嗨": "Hāi",
    "你叫什么名字？": "Nǐ jiào shénme míngzì?",
    "你叫什么名字": "Nǐ jiào shénme míngzì?",
    "我叫 {name}，你呢？": "Wǒ jiào {name}, nǐ ne?",
    "我叫 {name}，你呢?": "Wǒ jiào {name}, nǐ ne?",
    "我叫 Luke。": "Wǒ jiào Luke.",
    "我叫 Luke": "Wǒ jiào Luke."
  };

  const pinyinForLine = (txt: string) => {
    if (language !== "zh") return "";
    const raw = (txt ?? "").trim();
    if (!raw) return "";
    const hit = zhPinyinLine[raw];
    if (!hit) return "";
    return hit.replace("{name}", name);
  };

  const correctSet = useMemo(() => new Set(correctKeys), [correctKeys]);

  const [statusByKey, setStatusByKey] = useState<Record<string, SayStatus>>({});
  const [heardByKey, setHeardByKey] = useState<Record<string, string>>({});
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);
  const isSupported =
    typeof window !== "undefined" && !!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);

  useEffect(() => {
    return () => {
      try {
        recognitionRef.current?.stop?.();
      } catch {}
    };
  }, []);

  const startListening = (key: string, expectedText: string) => {
    setErrorMsg(null);
    if (!isSupported) {
      setErrorMsg("Speech recognition is not supported in this browser. Try Chrome on desktop.");
      return;
    }

    stopSpeech();

    try {
      recognitionRef.current?.stop?.();
    } catch {}

    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const rec = new SR();
    recognitionRef.current = rec;

    rec.lang = languageToTTS(language);
    rec.continuous = false;
    rec.interimResults = false;
    rec.maxAlternatives = 3;

    setActiveKey(key);
    setStatusByKey((p) => ({ ...p, [key]: "listening" }));

    rec.onresult = (event: any) => {
      const transcript = String(event.results?.[0]?.[0]?.transcript ?? "").trim();
      setHeardByKey((p) => ({ ...p, [key]: transcript }));

      const ok = isGoodMatch(transcript, expectedText, language);

      if (ok) {
        setStatusByKey((p) => ({ ...p, [key]: "correct" }));
        onCorrect(key);
      } else {
        setStatusByKey((p) => ({ ...p, [key]: "wrong" }));
        window.setTimeout(() => {
          setStatusByKey((p) => (p[key] !== "wrong" ? p : { ...p, [key]: "idle" }));
        }, 1200);
      }

      setActiveKey(null);
      try {
        rec.stop();
      } catch {}
    };

    rec.onerror = (e: any) => {
      setActiveKey(null);
      setStatusByKey((p) => ({ ...p, [key]: "idle" }));

      const code = e?.error ? String(e.error) : "unknown";
      if (code === "not-allowed" || code === "service-not-allowed") {
        setErrorMsg("Microphone permission blocked. Allow mic access in your browser settings.");
      } else if (code === "no-speech") {
        setErrorMsg("I didn't hear anything. Try again and speak louder.");
      } else {
        setErrorMsg("Speech recognition error. Try again.");
      }

      try {
        rec.stop();
      } catch {}
    };

    rec.onend = () => {
      setStatusByKey((p) => (p[key] === "listening" ? { ...p, [key]: "idle" } : p));
      setActiveKey(null);
    };

    try {
      rec.start();
    } catch {
      setErrorMsg("Could not start microphone. Try refreshing.");
      setStatusByKey((p) => ({ ...p, [key]: "idle" }));
      setActiveKey(null);
    }
  };

  const stopListening = () => {
    try {
      recognitionRef.current?.stop?.();
    } catch {}
    setActiveKey(null);
  };

  const bubbleClass = (who: "app" | "learner", key?: string) => {
    if (who === "app") return "bg-white border border-gray-100";
    const st = key ? statusByKey[key] ?? "idle" : "idle";
    const done = key ? correctSet.has(key) || st === "correct" : false;
    if (done) return "bg-green-600 text-white";
    if (st === "wrong") return "bg-red-600 text-white";
    if (st === "listening") return "bg-purple-600 text-white";
    return "bg-primary text-white";
  };

  const lineHint = (txt: string) => (language === "zh" ? spacedCharacters(txt) : syllableHint(txt));

  return (
    <div className="space-y-4">
      {!isSupported ? (
        <div className="p-4 rounded-2xl bg-yellow-50 border border-yellow-200 text-yellow-900 font-bold">
          Speech recognition isn’t available in this browser. Try Chrome (desktop/laptop).
        </div>
      ) : null}

      {errorMsg ? <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 font-bold">{errorMsg}</div> : null}

      <div className="text-sm font-bold text-gray-600">
        White bubbles: tap 🔊 to hear. Blue bubbles: you must say it correctly ✅
      </div>

      <div className="space-y-3">
        <ChatBubble
          who="App"
          bgClass={bubbleClass("app")}
          text={app1}
          subtext={pinyinForLine(app1)}
          onSpeak={() => speak(app1, languageToTTS(language))}
        />

        <LearnerSpeakBubble
          bubbleClass={bubbleClass("learner", "learner1")}
          text={learner1}
          subtext={pinyinForLine(learner1)}
          status={statusByKey["learner1"] ?? "idle"}
          isDone={correctSet.has("learner1")}
          activeKey={activeKey}
          myKey="learner1"
          onHear={() => speak(learner1, languageToTTS(language))}
          onStart={() => startListening("learner1", learner1)}
          onStop={stopListening}
          heardText={heardByKey["learner1"]}
          hint={lineHint(learner1)}
        />

        <ChatBubble
          who="App"
          bgClass={bubbleClass("app")}
          text={app2}
          subtext={pinyinForLine(app2)}
          onSpeak={() => speak(app2, languageToTTS(language))}
        />

        <LearnerSpeakBubble
          bubbleClass={bubbleClass("learner", "learner2")}
          text={learner2}
          subtext={pinyinForLine(learner2)}
          status={statusByKey["learner2"] ?? "idle"}
          isDone={correctSet.has("learner2")}
          activeKey={activeKey}
          myKey="learner2"
          onHear={() => speak(learner2, languageToTTS(language))}
          onStart={() => startListening("learner2", learner2)}
          onStop={stopListening}
          heardText={heardByKey["learner2"]}
          hint={lineHint(learner2)}
        />

        {learner3 ? (
          <LearnerSpeakBubble
            bubbleClass={bubbleClass("learner", "learner3")}
            text={learner3}
            subtext={pinyinForLine(learner3)}
            status={statusByKey["learner3"] ?? "idle"}
            isDone={correctSet.has("learner3")}
            activeKey={activeKey}
            myKey="learner3"
            onHear={() => speak(learner3, languageToTTS(language))}
            onStart={() => startListening("learner3", learner3)}
            onStop={stopListening}
            heardText={heardByKey["learner3"]}
            hint={lineHint(learner3)}
          />
        ) : null}

        {app3 ? (
          <ChatBubble
            who="App"
            bgClass={bubbleClass("app")}
            text={app3}
            subtext={pinyinForLine(app3)}
            onSpeak={() => speak(app3, languageToTTS(language))}
          />
        ) : null}
      </div>
    </div>
  );
}

function ChatBubble({
  who,
  text,
  subtext,
  onSpeak,
  bgClass
}: {
  who: string;
  text: string;
  subtext?: string;
  onSpeak: () => void;
  bgClass: string;
}) {
  const isApp = who === "App";
  return (
    <div className={`flex ${isApp ? "justify-start" : "justify-end"}`}>
      <div className={`max-w-[85%] rounded-2xl px-4 py-3 ${bgClass}`}>
        <div className="flex items-center justify-between gap-3">
          <div className={`font-extrabold ${isApp ? "text-gray-800" : ""}`}>{text}</div>
          <button onClick={onSpeak} className={`p-2 rounded-xl ${isApp ? "bg-gray-100" : "bg-white/20"}`} title="Hear it">
            <Volume2 size={16} />
          </button>
        </div>

        {(subtext ?? "").trim() ? (
          <div className={`mt-1 text-xs font-bold ${isApp ? "text-gray-500" : "text-white/80"}`}>
            ({subtext})
          </div>
        ) : null}

        <div className="mt-2 text-xs font-extrabold uppercase tracking-wide text-gray-400">Tap to hear</div>
      </div>
    </div>
  );
}

function LearnerSpeakBubble({
  bubbleClass,
  text,
  subtext,
  status,
  isDone,
  activeKey,
  myKey,
  onHear,
  onStart,
  onStop,
  heardText,
  hint
}: {
  bubbleClass: string;
  text: string;
  subtext?: string;
  status: SayStatus;
  isDone: boolean;
  activeKey: string | null;
  myKey: string;
  onHear: () => void;
  onStart: () => void;
  onStop: () => void;
  heardText?: string;
  hint: string;
}) {
  const isListening = status === "listening";
  const isWrong = status === "wrong";
  const canStart = activeKey === null || activeKey === myKey;

  return (
    <div className="flex justify-end">
      <div className={`max-w-[85%] rounded-2xl px-4 py-3 ${bubbleClass}`}>
        <div className="flex items-center justify-between gap-3">
          <div className="font-extrabold">{text}</div>

          <div className="flex items-center gap-2">
            <button onClick={onHear} className="p-2 rounded-xl bg-white/20" title="Hear it">
              <Volume2 size={16} />
            </button>

            {!isDone ? (
              <>
                <button
                  onClick={onStart}
                  disabled={!canStart}
                  className={`px-3 py-2 rounded-xl font-extrabold flex items-center gap-2 ${
                    isListening ? "bg-white/20" : "bg-white/20"
                  } ${!canStart ? "opacity-60 cursor-not-allowed" : ""}`}
                  title="Start speaking"
                >
                  <Mic size={16} />
                  {isListening ? "Listening..." : "Say"}
                </button>

                <button
                  onClick={onStop}
                  disabled={!isListening}
                  className={`px-3 py-2 rounded-xl font-extrabold flex items-center gap-2 ${
                    isListening ? "bg-white/20" : "bg-white/10 opacity-60 cursor-not-allowed"
                  }`}
                  title="Stop"
                >
                  <Square size={16} />
                </button>
              </>
            ) : (
              <div className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-white/20 font-extrabold">
                <CheckCircle2 size={18} />
                Correct
              </div>
            )}
          </div>
        </div>

        {(subtext ?? "").trim() ? (
          <div className="mt-1 text-xs font-bold text-white/80">({subtext})</div>
        ) : null}

        {heardText ? <div className="mt-2 text-xs font-extrabold text-white/90">You said: “{heardText}”</div> : null}

        {isWrong ? (
          <div className="mt-2 p-2 rounded-xl bg-white/15">
            <div className="text-xs font-extrabold uppercase tracking-wide text-white/90">Try again</div>
            <div className="text-sm font-bold text-white">{hint}</div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

/* ---------------- Step 6: Fill Blank ---------------- */

function Step6FillBlank({
  step,
  language,
  onProgress
}: {
  step: Extract<LessonStep, { type: "game" }>;
  language: LangCode;
  onProgress: (count: number) => void;
}) {
  const pairs = step.pairsByLanguage[language] ?? [];

  type LeftCard = { id: string; word: string; correctRightId: string };
  type RightCard = { id: string; sentence: string; correctWord: string };

  const zhPinyinWord: Record<string, string> = {
    "你好": "Nǐ hǎo",
    "嗨": "Hāi",
    "我叫": "Wǒ jiào",
    "你": "Nǐ",
    "叫什么": "jiào shénme",
    "名字": "míngzì",
    "很高兴": "Hěn gāoxìng",
    "认识": "rènshi"
  };

  const pinyinForWord = (w: string) => {
    if (language !== "zh") return "";
    return zhPinyinWord[(w ?? "").trim()] ?? "";
  };

  const pinyinForSentence = (sentence: string) => {
    if (language !== "zh") return "";
    const raw = (sentence ?? "").trim();
    if (!raw) return "";

    const cleaned = raw.replace("____", "").replaceAll("！", "").replaceAll("。", "").replaceAll("？", "").trim();
    const parts = cleaned.split(/\s+/).filter(Boolean);

    const mapped = parts.map((tok) => zhPinyinWord[tok] ?? "");
    const joined = mapped.filter(Boolean).join(" ");
    return joined;
  };

  const leftCards: LeftCard[] = useMemo(
    () =>
      pairs.map((p, idx) => ({
        id: `L-${idx}`,
        word: p.left,
        correctRightId: `R-${idx}`
      })),
    [pairs]
  );

  const rightCards: RightCard[] = useMemo(
    () =>
      pairs.map((p, idx) => ({
        id: `R-${idx}`,
        sentence: p.right,
        correctWord: p.left
      })),
    [pairs]
  );

  const shuffledLeft = useMemo(() => shuffle(leftCards), [leftCards]);
  const shuffledRight = useMemo(() => shuffle(rightCards), [rightCards]);

  const [matches, setMatches] = useState<Record<string, string>>({});
  const [selectedLeftId, setSelectedLeftId] = useState<string | null>(null);
  const [wrongFlash, setWrongFlash] = useState<{ leftId: string; rightId: string } | null>(null);

  useEffect(() => {
    onProgress(Object.keys(matches).length);
  }, [matches, onProgress]);

  const isLeftMatched = (leftId: string) => matches[leftId] != null;
  const isRightMatched = (rightId: string) => Object.values(matches).includes(rightId);

  const leftById = useMemo(() => {
    const m = new Map<string, LeftCard>();
    leftCards.forEach((c) => m.set(c.id, c));
    return m;
  }, [leftCards]);

  const speakWord = (word: string) => speak(word, languageToTTS(language));

  const speakBlankSentence = (right: RightCard) => {
    const spoken = right.sentence.includes("____") ? right.sentence.replace("____", right.correctWord) : right.sentence;
    speak(spoken, languageToTTS(language));
  };

  const clickLeft = (left: LeftCard) => {
    if (isLeftMatched(left.id)) return;
    setSelectedLeftId(left.id);
  };

  const clickRight = (right: RightCard) => {
    if (!selectedLeftId) return;
    if (isRightMatched(right.id)) return;

    const left = leftById.get(selectedLeftId);
    if (!left) return;

    if (left.correctRightId === right.id) {
      setMatches((prev) => ({ ...prev, [left.id]: right.id }));
      setSelectedLeftId(null);
      setWrongFlash(null);
      return;
    }

    const flash = { leftId: left.id, rightId: right.id };
    setWrongFlash(flash);
    setSelectedLeftId(null);

    window.setTimeout(() => {
      setWrongFlash((curr) => (curr && curr.leftId === flash.leftId && curr.rightId === flash.rightId ? null : curr));
    }, 900);
  };

  const leftClass = (leftId: string) => {
    if (isLeftMatched(leftId)) return "bg-green-50 border-green-200";
    if (wrongFlash?.leftId === leftId) return "bg-red-50 border-red-200";
    if (selectedLeftId === leftId) return "bg-purple-50 border-purple-200";
    return "bg-white border-gray-200 hover:bg-gray-50";
  };

  const rightClass = (rightId: string) => {
    if (isRightMatched(rightId)) return "bg-green-50 border-green-200";
    if (wrongFlash?.rightId === rightId) return "bg-red-50 border-red-200";
    return "bg-[#F7FAFF] border-blue-100 hover:bg-[#EEF4FF]";
  };

  const renderBlank = (sentence: string) => sentence.replace("____", "_____");

  return (
    <div className="space-y-4">
      <div className="text-sm font-bold text-gray-600">
        Tap a <span className="text-gray-900">word</span> on the left, then tap the sentence on the right where it belongs.
        <br />✅ Green = correct, ❌ Red = try again. 🔊 optional.
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="space-y-3">
          <div className="text-xs font-extrabold text-gray-500 uppercase tracking-wide">Words</div>
          {shuffledLeft.map((c) => {
            const py = pinyinForWord(c.word);
            return (
              <div
                key={c.id}
                className={[
                  "w-full rounded-2xl p-4 border shadow-sm transition-colors flex items-center justify-between gap-3",
                  leftClass(c.id)
                ].join(" ")}
              >
                <button
                  onClick={() => clickLeft(c)}
                  disabled={isLeftMatched(c.id)}
                  className="flex-1 text-left"
                >
                  <div className="font-heading font-extrabold text-xl text-gray-800">{c.word}</div>
                  {py ? <div className="mt-1 text-xs font-bold text-gray-500">({py})</div> : null}
                </button>

                <button onClick={() => speakWord(c.word)} className="p-2 rounded-xl bg-white border border-gray-100 hover:bg-gray-50" title="Hear word">
                  <Volume2 size={18} className="text-gray-700" />
                </button>
              </div>
            );
          })}
        </div>

        <div className="space-y-3">
          <div className="text-xs font-extrabold text-gray-500 uppercase tracking-wide">Sentences</div>
          {shuffledRight.map((c) => {
            const py = pinyinForSentence(c.sentence);
            return (
              <div
                key={c.id}
                className={[
                  "w-full rounded-2xl p-4 border shadow-sm transition-colors flex items-center justify-between gap-3",
                  rightClass(c.id)
                ].join(" ")}
              >
                <button
                  onClick={() => clickRight(c)}
                  disabled={isRightMatched(c.id)}
                  className="flex-1 text-left"
                >
                  <div className="font-bold text-gray-800">{renderBlank(c.sentence)}</div>
                  {py ? <div className="mt-1 text-xs font-bold text-gray-500">({py})</div> : null}
                </button>

                <button onClick={() => speakBlankSentence(c)} className="p-2 rounded-xl bg-white border border-gray-100 hover:bg-gray-50" title="Hear sentence">
                  <Volume2 size={18} className="text-gray-700" />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      <div className="text-sm font-extrabold text-gray-700">
        Matched: {Object.keys(matches).length}/{pairs.length}
      </div>
    </div>
  );
}

/* ---------------- Step 7: Assessment ---------------- */

function StepAssessment({
  step,
  language,
  name
}: {
  step: Extract<LessonStep, { type: "assessment" }>;
  language: LangCode;
  name: string;
}) {
  const tasks = step.tasksByLanguage[language].map((t) => t.replace("{name}", name));
  return (
    <div className="space-y-5">
      <div className="bg-[#F7FAFF] border border-blue-100 rounded-2xl p-6">
        <div className="text-sm font-extrabold text-gray-500 uppercase tracking-wide">Tasks</div>
        <ul className="mt-4 space-y-3">
          {tasks.map((t, i) => (
            <li key={i} className="flex items-center justify-between gap-3 bg-white border border-gray-100 rounded-2xl px-4 py-3">
              <span className="font-bold text-gray-800">{t}</span>
              <button onClick={() => speak(t.replace("Say: ", ""), languageToTTS(language))} className="p-2 rounded-xl bg-gray-100" title="Hear it">
                <Volume2 size={16} />
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div className="text-center font-heading font-black text-2xl text-gray-800">Great job! 🎉</div>
    </div>
  );
}
