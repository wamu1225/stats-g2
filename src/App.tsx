// stats-app/src/App.tsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import './App.css';
import { modules, chapterNames } from './data/modules';
import { comprehensiveQuizQuestions } from './data/comprehensiveQuiz';
import { glossary } from './data/glossary';
import { InteractiveGraph } from './components/InteractiveGraph';
import { MathDisplay } from './components/MathDisplay';
import { Quiz } from './components/Quiz';
import { TermText } from './components/TermGlossary';
import { DistributionSelector } from './components/DistributionSelector';
import { ExamGuide } from './components/ExamGuide';
import { buildUsecaseHtml } from './data/usecaseGuide';
import { ChevronLeft, Book, LayoutDashboard, ArrowRight, Search as SearchIcon, X, Lightbulb, Target, ArrowDown, Dumbbell, Trash2, FileText, Shuffle, CheckCircle2, XCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';


const PROGRESS_KEY = 'stats-g2-progress';
const COMPREHENSIVE_KEY = '__comprehensive__';

interface ProgressEntry { score: number; total: number; completedAt: string; }
type Progress = Record<string, ProgressEntry>;

function loadProgress(): Progress {
  try { return JSON.parse(localStorage.getItem(PROGRESS_KEY) || '{}'); } catch { return {}; }
}
function saveProgress(p: Progress) {
  localStorage.setItem(PROGRESS_KEY, JSON.stringify(p));
}

// Draw n random items from an array
function sampleN<T>(arr: T[], n: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, n);
}

type View = 'dashboard' | 'glossary' | 'cheatsheet' | 'randomquiz' | 'privacy' | 'about' | 'guide' | 'usecase';

function App() {
  const [activeModuleId, setActiveModuleId] = useState<string | null>(null);
  const [view, setView] = useState<View>('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [progress, setProgress] = useState<Progress>(loadProgress);

  // Random quiz state
  const [rqQuestions, setRqQuestions] = useState<{ q: typeof modules[0]['quiz'][0]; moduleTitle: string; moduleId: string }[]>([]);
  const [rqIdx, setRqIdx] = useState(0);
  const [rqSelected, setRqSelected] = useState<number | null>(null);
  const [rqIsCorrect, setRqIsCorrect] = useState<boolean | null>(null);
  const [rqResults, setRqResults] = useState<{ moduleId: string; moduleTitle: string; correct: boolean }[]>([]);
  const [rqDone, setRqDone] = useState(false);

  const startRandomQuiz = useCallback(() => {
    // Use the dedicated comprehensive quiz question bank (shuffled)
    const qs = [...comprehensiveQuizQuestions]
      .sort(() => Math.random() - 0.5)
      .map(({ moduleId, moduleTitle, ...q }) => ({ q, moduleTitle, moduleId }));
    setRqQuestions(qs);
    setRqIdx(0);
    setRqSelected(null);
    setRqIsCorrect(null);
    setRqResults([]);
    setRqDone(false);
    setView('randomquiz');
    window.scrollTo(0, 0);
  }, []);

  const rqHandleSelect = (idx: number) => {
    if (rqSelected !== null) return;
    setRqSelected(idx);
    const correct = idx === rqQuestions[rqIdx].q.correctAnswer;
    setRqIsCorrect(correct);
  };

  const rqNext = () => {
    const cur = rqQuestions[rqIdx];
    const correct = rqSelected === cur.q.correctAnswer;
    const newResults = [...rqResults, { moduleId: cur.moduleId, moduleTitle: cur.moduleTitle, correct }];
    if (rqIdx + 1 < rqQuestions.length) {
      setRqResults(newResults);
      setRqIdx(rqIdx + 1);
      setRqSelected(null);
      setRqIsCorrect(null);
      window.scrollTo(0, 0);
    } else {
      setRqResults(newResults);
      setRqDone(true);
      const entry: ProgressEntry = { score: newResults.filter(r => r.correct).length, total: newResults.length, completedAt: new Date().toLocaleDateString('ja-JP') };
      const next = { ...loadProgress(), [COMPREHENSIVE_KEY]: entry };
      saveProgress(next);
      setProgress(next);
      window.scrollTo(0, 0);
    }
  };

  const updateModuleId = useCallback((id: string | null) => {
    const basePath = window.location.pathname.startsWith('/stats-g2/') ? '/stats-g2' : '';
    const newPath = id ? `${basePath}/${id}/` : `${basePath}/`;
    window.history.pushState(null, '', newPath);
    
    if (!id) {
      setActiveModuleId(null);
      setView('dashboard');
    } else {
      setActiveModuleId(id);
      setView('dashboard');
    }
    setQuizCompleted(false);
    window.scrollTo(0, 0);
  }, []);

  const switchView = useCallback((newView: View) => {
    setActiveModuleId(null);
    setView(newView);
    const basePath = window.location.pathname.startsWith('/stats-g2/') ? '/stats-g2' : '';
    const newPath = newView === 'dashboard' ? `${basePath}/` : `${basePath}/${newView}/`;
    window.history.pushState(null, '', newPath);
    window.scrollTo(0, 0);
  }, []);

  const handleQuizComplete = useCallback((moduleId: string, score: number, total: number) => {
    setQuizCompleted(true);
    const entry: ProgressEntry = { score, total, completedAt: new Date().toLocaleDateString('ja-JP') };
    const next = { ...loadProgress(), [moduleId]: entry };
    saveProgress(next);
    setProgress(next);
  }, []);

  useEffect(() => {
    const handlePath = () => {
      const segments = window.location.pathname.split('/').filter(Boolean);
      const lastSegment = segments[segments.length - 1];
      
      const isCustomView = ['glossary', 'cheatsheet', 'privacy', 'about', 'guide', 'usecase'].includes(lastSegment || '');
      
      if (isCustomView) {
        setView(lastSegment as View);
        setActiveModuleId(null);
        if (lastSegment === 'privacy') document.title = 'プライバシーポリシー | 統計検定 2級 学習リファレンス';
        else if (lastSegment === 'about') document.title = 'サイトについて | 統計検定 2級 学習リファレンス';
        else if (lastSegment === 'guide') document.title = '試験ガイド | 統計検定 2級 学習リファレンス';
        else if (lastSegment === 'usecase') document.title = '検定・分布の使い分けガイド | 統計検定 2級 学習リファレンス';
      } else if (lastSegment && lastSegment !== 'stats-g2') {
        const found = modules.find(m => m.id === lastSegment);
        if (found) {
          setActiveModuleId(found.id);
          setView('dashboard');
          document.title = `${found.title} | 統計検定 2級`;
        } else {
          setActiveModuleId(null);
          setView('dashboard');
        }
      } else {
        setActiveModuleId(null);
        setView('dashboard');
        document.title = '統計検定 2級 学習リファレンス';
      }
    };
    handlePath();
    window.addEventListener('popstate', handlePath);
    return () => window.removeEventListener('popstate', handlePath);
  }, []);

  const parseInlineContent = useCallback((text: string): React.ReactNode => {
    function parseInline(t: string): React.ReactNode {
      const regex = /(\$\$[\s\S]*?\$\$|\$[\s\S]*?\$|\*\*[\s\S]*?\*\*|\[\[term:.*?\]\][\s\S]*?\[\[\/term\]\]|\[\[translate:.*?\]\][\s\S]*?\[\[\/translate\]\]|\[\[darts\]\]|\[\[practical:.*?\]\][\s\S]*?\[\[\/practical\]\]|\[\[conjugate\]\]|\[\[hierarchy\]\]|\[\[boxplot\]\]|\[\[lorenz\]\]|\[\[correlation\]\]|\[\[zscore\]\]|\[\[ppv\]\]|\[\[interactive:.*?\]\]|\[\[regularization-card\]\])/g;
      const parts = t.split(regex);
      return (
        <>
          {parts.map((part, i) => {
            if (!part) return null;
            const key = `inline-${i}`;
            if (part.startsWith('$$') && part.endsWith('$$')) return <MathDisplay key={key} formula={part.slice(2, -2)} block={true} />;
            if (part.startsWith('$') && part.endsWith('$')) return <MathDisplay key={key} formula={part.slice(1, -1)} />;
            if (part.startsWith('**') && part.endsWith('**')) return <strong key={key}>{parseInline(part.slice(2, -2))}</strong>;
            if (part.startsWith('[[term:')) {
              const idMatch = part.match(/\[\[term:(.*?)\]\]/);
              const contentMatch = part.match(/\]\]([\s\S]*?)\[\[\/term\]\]/);
              if (idMatch && contentMatch) return <TermText key={key} termId={idMatch[1]} onNavigate={updateModuleId} renderMath={parseInline}>{contentMatch[1]}</TermText>;
            }
            if (part.startsWith('[[translate:')) {
              const transMatch = part.match(/\[\[translate:(.*?)\]\]/);
              const contentMatch = part.match(/\]\]([\s\S]*?)\[\[\/translate\]\]/);
              if (transMatch && contentMatch) return <span key={key} className="formula-wrapper">{parseInline(contentMatch[1])}<span className="formula-translation">{transMatch[1]}</span></span>;
            }
            if (part === '[[darts]]') return (
              <div key={key} className="darts-container">
                <div className="dart-target"><Target size={32} color="#22c55e" className="target-svg" /><div className="dart-label">不偏性あり</div><div className="dart-desc">中心が真値を射抜いている</div></div>
                <div className="dart-target"><Target size={32} color="#3b82f6" className="target-svg" /><div className="dart-label">一致性あり</div><div className="dart-desc">n増で一点に集中する</div></div>
              </div>
            );
            if (part === '[[conjugate]]') return (
              <div key={key} className="conjugate-card">
                <div className="pair-row">
                  <div className="dist-box"><strong>二項分布</strong><br/><small>成功確率 p</small></div>
                  <div className="update-arrow"><ArrowRight size={16}/><span>共役</span></div>
                  <div className="dist-box"><strong>ベータ分布</strong><br/><small>形状 α, β</small></div>
                </div>
                <div className="update-arrow" style={{ margin: '8px 0' }}><ArrowDown size={16}/><span>更新</span></div>
                <div style={{ textAlign: 'center', fontSize: '0.85rem', color: 'var(--primary)', fontWeight: 800 }}>α' = α + 成功数 , β' = β + 失敗数</div>
              </div>
            );
            if (part === '[[hierarchy]]') return (
              <div key={key} className="matryoshka-container">
                <div className="shell shell-outer"><span className="shell-label">集団の差 (学校)</span>
                  <div className="shell shell-mid"><span className="shell-label">個人の差 (クラス)</span><div className="shell shell-inner">データ</div></div>
                </div>
              </div>
            );
            if (part === '[[boxplot]]') return (
              <figure key={key} className="g2-figure">
                <svg viewBox="0 0 360 112" role="img" aria-label="箱ひげ図：最小値・Q1・中央値・Q3・最大値と外れ値。箱の長さがIQR" className="g2-fig-svg">
                  <line x1={60} y1={60} x2={110} y2={60} stroke="#475569" strokeWidth={1.5} />
                  <line x1={200} y1={60} x2={250} y2={60} stroke="#475569" strokeWidth={1.5} />
                  <line x1={60} y1={47} x2={60} y2={73} stroke="#475569" strokeWidth={1.5} />
                  <line x1={250} y1={47} x2={250} y2={73} stroke="#475569" strokeWidth={1.5} />
                  <rect x={110} y={40} width={90} height={40} fill="#0f766e" fillOpacity={0.14} stroke="#0f766e" strokeWidth={1.6} />
                  <line x1={150} y1={40} x2={150} y2={80} stroke="#0b5a54" strokeWidth={2.6} />
                  <circle cx={300} cy={60} r={4} fill="none" stroke="#dc2626" strokeWidth={1.6} />
                  <line x1={110} y1={30} x2={200} y2={30} stroke="#94a3b8" strokeWidth={1} />
                  <line x1={110} y1={30} x2={110} y2={36} stroke="#94a3b8" strokeWidth={1} />
                  <line x1={200} y1={30} x2={200} y2={36} stroke="#94a3b8" strokeWidth={1} />
                  <text x={155} y={23} textAnchor="middle" fontSize={11} fontWeight={700} fill="#334155">IQR = Q₃ − Q₁</text>
                  <line x1={60} y1={75} x2={60} y2={90} stroke="#cbd5e1" strokeWidth={1} />
                  <line x1={110} y1={82} x2={110} y2={90} stroke="#cbd5e1" strokeWidth={1} />
                  <line x1={150} y1={82} x2={150} y2={90} stroke="#cbd5e1" strokeWidth={1} />
                  <line x1={200} y1={82} x2={200} y2={90} stroke="#cbd5e1" strokeWidth={1} />
                  <line x1={250} y1={75} x2={250} y2={90} stroke="#cbd5e1" strokeWidth={1} />
                  <line x1={300} y1={66} x2={300} y2={90} stroke="#cbd5e1" strokeWidth={1} />
                  <text x={60} y={101} textAnchor="middle" fontSize={10} fill="#64748b">最小値</text>
                  <text x={110} y={101} textAnchor="middle" fontSize={11} fontWeight={700} fill="#0b5a54">Q₁</text>
                  <text x={150} y={101} textAnchor="middle" fontSize={10} fontWeight={700} fill="#0b5a54">中央値</text>
                  <text x={200} y={101} textAnchor="middle" fontSize={11} fontWeight={700} fill="#0b5a54">Q₃</text>
                  <text x={250} y={101} textAnchor="middle" fontSize={10} fill="#64748b">最大値</text>
                  <text x={300} y={101} textAnchor="middle" fontSize={10} fill="#b91c1c">外れ値</text>
                </svg>
                <figcaption className="g2-fig-cap">
                  箱ひげ図の読み方。箱の左端が Q₁、右端が Q₃ で、箱の長さが四分位範囲 IQR ＝ Q₃−Q₁（中央50%の散らばり）。箱の中の線が中央値。ひげは Q₁−1.5×IQR ／ Q₃+1.5×IQR のフェンス内にある最小値・最大値まで伸び、その外側の点（赤）が外れ値候補として識別される。
                </figcaption>
              </figure>
            );
            if (part === '[[lorenz]]') {
              const x0 = 44, x1 = 272, yBot = 228, yTop = 22;
              const px = (p: number) => x0 + p * (x1 - x0);
              const py = (v: number) => yBot - v * (yBot - yTop);
              const L = (p: number) => Math.pow(p, 2.2);
              let area = `${px(0)},${py(0)} ${px(1)},${py(1)}`;
              for (let p = 1; p >= -0.0001; p -= 0.0625) { const q = Math.max(0, p); area += ` ${px(q).toFixed(1)},${py(L(q)).toFixed(1)}`; }
              let curve = '';
              for (let p = 0; p <= 1.0001; p += 0.0625) { const q = Math.min(1, p); curve += `${px(q).toFixed(1)},${py(L(q)).toFixed(1)} `; }
              return (
                <figure key={key} className="g2-figure">
                  <svg viewBox="0 0 300 262" role="img" aria-label="ローレンツ曲線とジニ係数：完全平等線と曲線の間の面積が格差" className="g2-fig-svg">
                    <text x={44} y={14} textAnchor="start" fontSize={10} fill="#615d59">所得（累積 %）</text>
                    <line x1={44} y1={22} x2={44} y2={228} stroke="#9ca3af" strokeWidth={1} />
                    <line x1={44} y1={228} x2={272} y2={228} stroke="#9ca3af" strokeWidth={1} />
                    <polygon points={area} fill="#0f766e" fillOpacity={0.14} />
                    <line x1={44} y1={228} x2={272} y2={22} stroke="#9ca3af" strokeWidth={1.2} strokeDasharray="4 3" />
                    <polyline points={curve.trim()} fill="none" stroke="#0f766e" strokeWidth={2.4} />
                    <text x={198} y={44} textAnchor="middle" fontSize={10} fill="#615d59">完全平等線</text>
                    <text x={152} y={164} textAnchor="middle" fontSize={13} fontWeight={700} fill="#0f766e">S</text>
                    <text x={210} y={190} textAnchor="middle" fontSize={10} fontWeight={700} fill="#0f766e">ローレンツ曲線</text>
                    <text x={158} y={252} textAnchor="middle" fontSize={10} fill="#615d59">人口（累積 %）</text>
                  </svg>
                  <figcaption className="g2-fig-cap">
                    ローレンツ曲線は「累積人口比率（横）」に対する「累積所得比率（縦）」を描く。全員が同じ所得なら対角線（完全平等線）と一致し、格差があるほど曲線は下へ垂れ下がる。ジニ係数はこのすき間の面積 S の2倍（G ＝ 2S）で、0 に近いほど平等・1 に近いほど不平等を表す。
                  </figcaption>
                </figure>
              );
            }
            if (part === '[[correlation]]') {
              const panels = [
                { cx: 30, cy: 30, label: '強い正の相関', r: 'r ≈ +0.9', kind: 'pos' as const },
                { cx: 198, cy: 30, label: '相関なし', r: 'r ≈ 0', kind: 'zero' as const },
                { cx: 30, cy: 132, label: '強い負の相関', r: 'r ≈ −0.9', kind: 'neg' as const },
                { cx: 198, cy: 132, label: '非線形（U字）', r: 'r ≈ 0', kind: 'nonlin' as const },
              ];
              const W = 116, H = 58;
              let seed = 7;
              const rnd = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
              const nodes: React.ReactNode[] = [];
              panels.forEach((p) => {
                nodes.push(
                  <text key={`${p.kind}-t`} x={p.cx + W / 2} y={p.cy - 8} textAnchor="middle" fontSize={11} fontWeight={700} fill="#33302c">{p.label}</text>,
                  <text key={`${p.kind}-r`} x={p.cx + W - 2} y={p.cy + 12} textAnchor="end" fontSize={10} fontWeight={700} fill="#0f766e">{p.r}</text>,
                  <line key={`${p.kind}-vy`} x1={p.cx} y1={p.cy} x2={p.cx} y2={p.cy + H} stroke="#c9c3ba" strokeWidth={1} />,
                  <line key={`${p.kind}-vx`} x1={p.cx} y1={p.cy + H} x2={p.cx + W} y2={p.cy + H} stroke="#c9c3ba" strokeWidth={1} />,
                );
                const n = 15;
                for (let i = 0; i < n; i++) {
                  const t = i / (n - 1);
                  let x = t, y = 0;
                  if (p.kind === 'pos') { y = t + (rnd() - 0.5) * 0.3; }
                  else if (p.kind === 'neg') { y = 1 - t + (rnd() - 0.5) * 0.3; }
                  else if (p.kind === 'zero') { x = rnd(); y = rnd(); }
                  else { y = 4 * (t - 0.5) * (t - 0.5) + (rnd() - 0.5) * 0.14; }
                  x = Math.max(0.02, Math.min(0.98, x));
                  y = Math.max(0.03, Math.min(0.97, y));
                  const px = p.cx + 8 + x * (W - 14);
                  const py = p.cy + 5 + (1 - y) * (H - 8);
                  nodes.push(<circle key={`${p.kind}-p${i}`} cx={px.toFixed(1)} cy={py.toFixed(1)} r={2.4} fill="#0f766e" fillOpacity={0.65} />);
                }
              });
              return (
                <figure key={key} className="g2-figure">
                  <svg viewBox="0 0 328 202" role="img" aria-label="相関係数の4パターン：強い正・相関なし・強い負・非線形（U字でr≈0）" className="g2-fig-svg">
                    {nodes}
                  </svg>
                  <figcaption className="g2-fig-cap">
                    散布図と相関係数 r の対応。点が右上がりに揃うほど r は +1 に、右下がりに揃うほど −1 に近づく。散らばって傾向がなければ r ≈ 0。ただし右下の U 字のように、はっきりした関係があっても r が測るのは<strong>線形</strong>の傾きだけなので r ≈ 0 になる。r=0 は「線形関係がない」であって「無関係」ではない。
                  </figcaption>
                </figure>
              );
            }
            if (part === '[[zscore]]') {
              // two normal curves with different mean/sd; same point maps to different z
              const gauss = (cx: number, hw: number, yb: number, ph: number) => {
                let pts = '';
                for (let t = -3; t <= 3.0001; t += 0.25) {
                  const x = cx + t * (hw / 3);
                  const y = yb - ph * Math.exp(-(t * t) / 2);
                  pts += `${x.toFixed(1)},${y.toFixed(1)} `;
                }
                return pts.trim();
              };
              const yb = 96, ph = 60, hw = 66;
              const mathCx = 96, engCx = 264;
              const markX = (cx: number, z: number) => cx + z * (hw / 3);
              return (
                <figure key={key} className="g2-figure">
                  <svg viewBox="0 0 360 232" role="img" aria-label="標準化：平均と散らばりの違う数学と英語の得点を、共通のz尺度に載せて比較する" className="g2-fig-svg">
                    {/* two distributions */}
                    <line x1={22} y1={yb} x2={170} y2={yb} stroke="#c9c3ba" strokeWidth={1} />
                    <line x1={190} y1={yb} x2={338} y2={yb} stroke="#c9c3ba" strokeWidth={1} />
                    <polyline points={gauss(mathCx, hw, yb, ph)} fill="#0f766e" fillOpacity={0.08} stroke="#0f766e" strokeWidth={1.8} />
                    <polyline points={gauss(engCx, hw, yb, ph)} fill="#dd5b2a" fillOpacity={0.08} stroke="#dd5b2a" strokeWidth={1.8} />
                    <text x={mathCx} y={20} textAnchor="middle" fontSize={10.5} fontWeight={700} fill="#0b5a54">数学</text>
                    <text x={mathCx} y={33} textAnchor="middle" fontSize={9} fill="#615d59">平均60・SD10</text>
                    <text x={engCx} y={20} textAnchor="middle" fontSize={10.5} fontWeight={700} fill="#b8461c">英語</text>
                    <text x={engCx} y={33} textAnchor="middle" fontSize={9} fill="#615d59">平均70・SD5</text>
                    {/* mean ticks */}
                    <text x={mathCx} y={yb + 12} textAnchor="middle" fontSize={8.5} fill="#8a857e">60</text>
                    <text x={engCx} y={yb + 12} textAnchor="middle" fontSize={8.5} fill="#8a857e">70</text>
                    {/* marked scores: math 80 -> z=2, eng 75 -> z=1 */}
                    <line x1={markX(mathCx, 2)} y1={yb} x2={markX(mathCx, 2)} y2={yb - ph * Math.exp(-2)} stroke="#0b5a54" strokeWidth={1.4} strokeDasharray="3 2" />
                    <circle cx={markX(mathCx, 2)} cy={yb} r={3.2} fill="#0f766e" />
                    <text x={markX(mathCx, 2) + 2} y={yb - 6} textAnchor="start" fontSize={9.5} fontWeight={700} fill="#0b5a54">80点</text>
                    <line x1={markX(engCx, 1)} y1={yb} x2={markX(engCx, 1)} y2={yb - ph * Math.exp(-0.5)} stroke="#b8461c" strokeWidth={1.4} strokeDasharray="3 2" />
                    <circle cx={markX(engCx, 1)} cy={yb} r={3.2} fill="#dd5b2a" />
                    <text x={markX(engCx, 1) + 2} y={yb - 6} textAnchor="start" fontSize={9.5} fontWeight={700} fill="#b8461c">75点</text>
                    {/* arrows down to shared z-axis */}
                    <text x={180} y={132} textAnchor="middle" fontSize={10} fill="#615d59">↓ z ＝ (得点 − 平均) ÷ SD で同じ物差しに ↓</text>
                    {/* shared z axis */}
                    <line x1={40} y1={170} x2={320} y2={170} stroke="#8a857e" strokeWidth={1.4} />
                    {[-2, -1, 0, 1, 2].map((z) => {
                      const x = 180 + z * 56;
                      return (
                        <g key={`zt${z}`}>
                          <line x1={x} y1={166} x2={x} y2={174} stroke="#8a857e" strokeWidth={1} />
                          <text x={x} y={186} textAnchor="middle" fontSize={9} fill="#8a857e">{z > 0 ? `+${z}` : z}</text>
                        </g>
                      );
                    })}
                    <text x={324} y={173} textAnchor="start" fontSize={9} fill="#8a857e">z</text>
                    <circle cx={180 + 2 * 56} cy={170} r={4} fill="#0f766e" />
                    <text x={180 + 2 * 56} y={158} textAnchor="middle" fontSize={9.5} fontWeight={700} fill="#0b5a54">数学 z=2</text>
                    <circle cx={180 + 1 * 56} cy={170} r={4} fill="#dd5b2a" />
                    <text x={180 + 1 * 56} y={158} textAnchor="middle" fontSize={9.5} fontWeight={700} fill="#b8461c">英語 z=1</text>
                    <text x={180} y={210} textAnchor="middle" fontSize={10.5} fontWeight={700} fill="#33302c">同じ土俵なら 数学80(z=2) の方が相対的に上</text>
                  </svg>
                  <figcaption className="g2-fig-cap">
                    平均も散らばりも違う数学（平均60・SD10）と英語（平均70・SD5）は、素点のままでは比べられない。各得点を z ＝ (得点 − 平均) ÷ SD に変換すると、どちらも「平均0・SD1」の共通の物差しに載る。数学80点は平均から2SD上（z=2）、英語75点は1SD上（z=1）なので、相対的には数学の方が上だとわかる。
                  </figcaption>
                </figure>
              );
            }
            if (part === '[[ppv]]') {
              // natural-frequency tree: 1000 people, prevalence 1%, sens 90%, spec 95%
              const barX = 40, barW = 280, barY = 208, barH = 22;
              const tp = 9, fp = 50, total = tp + fp; // 59 positives
              const tpW = (tp / total) * barW;
              return (
                <figure key={key} className="g2-figure">
                  <svg viewBox="0 0 360 276" role="img" aria-label="1000人の自然頻度で見る陽性適中率：陽性59人のうち本当に病気は9人でPPV約15%" className="g2-fig-svg">
                    <text x={180} y={13} textAnchor="middle" fontSize={11} fontWeight={700} fill="#33302c">有病率1%・感度90%・特異度95% を1000人で考える</text>
                    {/* root */}
                    <rect x={150} y={22} width={60} height={22} rx={4} fill="#0f766e" fillOpacity={0.1} stroke="#0f766e" strokeWidth={1.2} />
                    <text x={180} y={37} textAnchor="middle" fontSize={11} fontWeight={700} fill="#0b5a54">1000人</text>
                    {/* branches to disease/healthy */}
                    <line x1={180} y1={44} x2={96} y2={66} stroke="#c9c3ba" strokeWidth={1.2} />
                    <line x1={180} y1={44} x2={264} y2={66} stroke="#c9c3ba" strokeWidth={1.2} />
                    <rect x={54} y={66} width={84} height={22} rx={4} fill="#0f766e" fillOpacity={0.1} stroke="#0f766e" strokeWidth={1.2} />
                    <text x={96} y={81} textAnchor="middle" fontSize={10.5} fontWeight={700} fill="#0b5a54">病気 10人</text>
                    <rect x={222} y={66} width={84} height={22} rx={4} fill="#efe9e1" stroke="#c9c3ba" strokeWidth={1.2} />
                    <text x={264} y={81} textAnchor="middle" fontSize={10.5} fontWeight={700} fill="#615d59">健康 990人</text>
                    {/* leaves */}
                    <line x1={96} y1={88} x2={70} y2={110} stroke="#c9c3ba" strokeWidth={1} />
                    <line x1={96} y1={88} x2={122} y2={110} stroke="#c9c3ba" strokeWidth={1} />
                    <line x1={264} y1={88} x2={238} y2={110} stroke="#c9c3ba" strokeWidth={1} />
                    <line x1={264} y1={88} x2={290} y2={110} stroke="#c9c3ba" strokeWidth={1} />
                    <rect x={44} y={110} width={52} height={20} rx={3} fill="#0f766e" stroke="#0b5a54" strokeWidth={1} />
                    <text x={70} y={124} textAnchor="middle" fontSize={10} fontWeight={700} fill="#ffffff">陽性 9</text>
                    <text x={122} y={124} textAnchor="middle" fontSize={10} fill="#615d59">陰性 1</text>
                    <rect x={212} y={110} width={52} height={20} rx={3} fill="#dd5b2a" stroke="#b8461c" strokeWidth={1} />
                    <text x={238} y={124} textAnchor="middle" fontSize={10} fontWeight={700} fill="#ffffff">陽性 50</text>
                    <text x={294} y={124} textAnchor="middle" fontSize={10} fill="#615d59">陰性 940</text>
                    {/* true vs false positive labels */}
                    <text x={70} y={144} textAnchor="middle" fontSize={9} fill="#0b5a54">真陽性</text>
                    <text x={238} y={144} textAnchor="middle" fontSize={9} fill="#b8461c">偽陽性</text>
                    {/* punchline bar */}
                    <text x={180} y={172} textAnchor="middle" fontSize={11} fontWeight={700} fill="#33302c">陽性は合計 59人。その内訳は？</text>
                    <rect x={barX} y={barY} width={tpW} height={barH} fill="#0f766e" />
                    <rect x={barX + tpW} y={barY} width={barW - tpW} height={barH} fill="#dd5b2a" />
                    <rect x={barX} y={barY} width={barW} height={barH} fill="none" stroke="#8a857e" strokeWidth={1} />
                    <text x={barX + tpW / 2} y={barY + 15} textAnchor="middle" fontSize={10} fontWeight={700} fill="#ffffff">9</text>
                    <text x={barX + tpW + (barW - tpW) / 2} y={barY + 15} textAnchor="middle" fontSize={10} fontWeight={700} fill="#ffffff">偽陽性 50</text>
                    <text x={180} y={252} textAnchor="middle" fontSize={11.5} fontWeight={700} fill="#0b5a54">PPV ＝ 9 / 59 ≈ 15%</text>
                    <text x={180} y={268} textAnchor="middle" fontSize={9.5} fill="#615d59">陽性でも 85% は病気ではない</text>
                  </svg>
                  <figcaption className="g2-fig-cap">
                    感度・特異度が高くても、有病率が低いと陽性の大半が偽陽性になる（基本率の誤謬）。1000人のうち病気は10人で、その9割＝9人が陽性（真陽性）。一方で健康な990人の5%＝約50人も陽性になる（偽陽性）。陽性は合わせて59人だが、本当に病気なのは9人だけ。だから陽性適中率 PPV は 9/59 ≈ 15% にとどまる。確率でなく「実際の人数」で数えると直感がつかみやすい。
                  </figcaption>
                </figure>
              );
            }
            if (part.startsWith('[[interactive:')) {
              const typeMatch = part.match(/\[\[interactive:(.*?)\]\]/);
              if (typeMatch) {
                const type = typeMatch[1] as 'normal' | 't' | 'chi2' | 'f' | 'pca' | 'regression' | 'logistic' | 'mcmc' | 'gibbs' | 'update' | 'overfit' | 'outlier' | 'multico';
                return <InteractiveGraph key={key} type={type} renderContent={parseInline} />;
              }
            }
            if (part === '[[regularization-card]]') return (
              <div key={key} className="reg-card-container">
                <div className="reg-side lasso">
                  <div className="reg-header"><Trash2 size={20}/> <strong>Lasso (L1)</strong></div>
                  <div className="reg-metaphor">「断捨離」</div>
                  <ul className="reg-list">
                    <li>不要な係数を **完全に 0** にする</li>
                    <li>**変数選択** の機能がある</li>
                    <li>スパースな解を得やすい</li>
                  </ul>
                </div>
                <div className="reg-side ridge">
                  <div className="reg-header"><Dumbbell size={20}/> <strong>Ridge (L2)</strong></div>
                  <div className="reg-metaphor">「シェイプアップ」</div>
                  <ul className="reg-list">
                    <li>係数を **全体的に縮小** する</li>
                    <li>完全に 0 にはならない</li>
                    <li>マルチコに強く安定する</li>
                  </ul>
                </div>
              </div>
            );
            if (part.startsWith('[[practical:')) {
              const titleMatch = part.match(/\[\[practical:(.*?)\]\]/);
              const contentMatch = part.match(/\]\]([\s\S]*?)\[\[\/practical\]\]/);
              if (titleMatch && contentMatch) return <div key={key} className="column-practical"><div className="column-title"><Lightbulb size={16} /> 実務Tips: {titleMatch[1]}</div><div style={{ fontSize: '0.85rem' }}>{parseInline(contentMatch[1])}</div></div>;
            }
            return <span key={key} style={{ whiteSpace: 'pre-wrap' }}>{part}</span>;
          })}
        </>
      );
    }
    return parseInline(text);
  }, [updateModuleId]);

  const parseContent = useCallback((text: string): React.ReactNode => {
    if (!text) return null;
    const lines = text.split('\n');
    const result: React.ReactNode[] = [];
    let currentList: React.ReactNode[] = [];
    const flushList = (key: string) => {
      if (currentList.length > 0) {
        result.push(<ul key={`list-${key}`}>{currentList}</ul>);
        currentList = [];
      }
    };
    lines.forEach((line, lineIdx) => {
      const trimmedLine = line.trim();
      const key = `line-${lineIdx}`;
      if (trimmedLine.startsWith('#### ')) { flushList(key); result.push(<h4 key={key} className="content-h4">{parseInlineContent(trimmedLine.slice(5))}</h4>); return; }
      if (trimmedLine.startsWith('### ')) { flushList(key); result.push(<h3 key={key} className="content-h3">{parseInlineContent(trimmedLine.slice(4))}</h3>); return; }
      if (trimmedLine.startsWith('## ')) { flushList(key); result.push(<h2 key={key} className="content-h2">{parseInlineContent(trimmedLine.slice(3))}</h2>); return; }
      if (trimmedLine.startsWith('---')) { flushList(key); result.push(<hr key={key} className="content-hr" />); return; }
      if (trimmedLine.startsWith('- ')) { currentList.push(<li key={`li-${lineIdx}`}>{parseInlineContent(trimmedLine.slice(2))}</li>); return; }
      if (trimmedLine === '') { flushList(key); return; }
      flushList(key);
      result.push(<p key={key} className="content-p">{parseInlineContent(line)}</p>);
    });
    flushList('final');
    return <>{result}</>;
  }, [parseInlineContent]);

  const filteredModules = useMemo(() => {
    if (!searchQuery) return modules;
    const q = searchQuery.toLowerCase();
    return modules.filter(m =>
      m.title.toLowerCase().includes(q) ||
      m.content.toLowerCase().includes(q) ||
      m.description.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  const activeModule = useMemo(() => modules.find(m => m.id === activeModuleId), [activeModuleId]);
  const nextModule = useMemo(() => {
    if (!activeModuleId) return null;
    const idx = modules.findIndex(m => m.id === activeModuleId);
    return idx >= 0 && idx < modules.length - 1 ? modules[idx + 1] : null;
  }, [activeModuleId]);
  const findModulesByTerm = useCallback((termId: string) => modules.filter(m => m.content.includes(`[[term:${termId}]]`)), []);

  const completedCount = modules.filter(m => progress[m.id]).length;
  const totalModules = modules.length;

  return (
    <div className="container" style={{ maxWidth: activeModuleId ? '800px' : view === 'glossary' ? '1000px' : '800px' }}>
      <header className="header">
        <h1 className="title" onClick={() => updateModuleId(null)} style={{ cursor: 'pointer' }}>統計検定 2級</h1>
        <p className="subtitle">学習リファレンス</p>
        {!activeModuleId && view === 'dashboard' && (
          <>
            <p className="hero-lead">図解と逆引き診断で、2級の全範囲をやさしく攻略。</p>
            <div className="hero-chips">
              <span className="hero-chip">6章 19分野</span>
              <span className="hero-chip">図解つき</span>
              <span className="hero-chip">逆引き診断</span>
              <span className="hero-chip">全範囲クイズ</span>
            </div>
          </>
        )}
      </header>

      {!activeModuleId && (
        <nav style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem', flexWrap: 'wrap' }}>
          <button onClick={() => switchView('dashboard')} className={`nav-tab ${view === 'dashboard' ? 'active' : ''}`}>
            <LayoutDashboard size={18} /> ロードマップ
            {completedCount > 0 && <span className="nav-progress-badge">{completedCount}/{totalModules}</span>}
          </button>
          <button onClick={() => switchView('glossary')} className={`nav-tab ${view === 'glossary' ? 'active' : ''}`}>
            <Book size={18} /> 用語集
          </button>
          <button onClick={() => switchView('cheatsheet')} className={`nav-tab ${view === 'cheatsheet' ? 'active' : ''}`}>
            <FileText size={18} /> 公式集
          </button>
          <button onClick={startRandomQuiz} className={`nav-tab ${view === 'randomquiz' ? 'active' : ''}`}>
            <Shuffle size={18} /> 全範囲クイズ
          </button>
          <button onClick={() => switchView('guide')} className={`nav-tab ${view === 'guide' ? 'active' : ''}`}>
            <Target size={18} /> 試験ガイド
          </button>
          <button onClick={() => switchView('usecase')} className={`nav-tab ${view === 'usecase' ? 'active' : ''}`}>
            <Lightbulb size={18} /> 使い分けガイド
          </button>
        </nav>
      )}

      <main>
        <AnimatePresence mode="wait">
          {activeModuleId ? (
            <motion.div key={activeModuleId} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}>
              <button className="btn-back" onClick={() => updateModuleId(null)}><ChevronLeft size={18} /> 一覧に戻る</button>
              <div className="card">
                <span className="badge-chapter">Chapter {activeModule?.chapter}</span>
                <h2 style={{ marginTop: '0.5rem' }}>{parseContent(activeModule?.title || '')}</h2>
                <div className="content-body">{activeModule && parseContent(activeModule.content)}</div>
              </div>
              <div style={{ marginTop: '2rem' }}>
                <Quiz
                  key={activeModuleId}
                  questions={activeModule?.quiz || []}
                  onComplete={(score, total) => handleQuizComplete(activeModuleId, score, total)}
                  renderContent={parseContent}
                />
              </div>
              {quizCompleted && (
                <div style={{ marginTop: '1rem' }}>
                  {activeModuleId && progress[activeModuleId] && (
                    <div className="score-banner">
                      {progress[activeModuleId].score} / {progress[activeModuleId].total} 問正解
                      {progress[activeModuleId].score === progress[activeModuleId].total && ' 🎉 パーフェクト！'}
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: '1rem', marginTop: '0.75rem', flexWrap: 'wrap' }}>
                    <button className="btn" onClick={() => updateModuleId(null)} style={{ flex: 1, background: '#f1f5f9', color: 'var(--text)', border: '1px solid #e2e8f0' }}>
                      <ChevronLeft size={16} /> 一覧に戻る
                    </button>
                    {nextModule && (
                      <button className="btn" onClick={() => updateModuleId(nextModule.id)} style={{ flex: 2 }}>
                        次のモジュールへ：{nextModule.title} <ArrowRight size={16} />
                      </button>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          ) : view === 'randomquiz' ? (
            <motion.div key="rq" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              <button className="btn-back" onClick={() => switchView('dashboard')}><ChevronLeft size={18} /> 一覧に戻る</button>
              {rqDone ? (
                /* Results screen */
                <div>
                  <div className="card" style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '2.5rem', fontWeight: 900, color: 'var(--primary)' }}>
                      {rqResults.filter(r => r.correct).length} <span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>/ {rqResults.length} 問正解</span>
                    </div>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>全範囲クイズ完了</p>
                  </div>
                  {/* Breakdown by module */}
                  {(() => {
                    const byModule: Record<string, { title: string; correct: number; total: number }> = {};
                    rqResults.forEach(r => {
                      if (!byModule[r.moduleId]) byModule[r.moduleId] = { title: r.moduleTitle, correct: 0, total: 0 };
                      byModule[r.moduleId].total++;
                      if (r.correct) byModule[r.moduleId].correct++;
                    });
                    const weak = Object.entries(byModule).filter(([, v]) => v.correct < v.total);
                    return (
                      <div className="card">
                        <h3 style={{ margin: '0 0 1rem', fontSize: '1rem' }}>モジュール別結果</h3>
                        {Object.entries(byModule).map(([id, v]) => (
                          <div key={id} className="rq-result-row">
                            <span className={`rq-result-dot ${v.correct === v.total ? 'ok' : 'ng'}`} />
                            <span style={{ flex: 1, fontSize: '0.85rem' }}>{v.title}</span>
                            <span style={{ fontSize: '0.8rem', color: v.correct === v.total ? '#16a34a' : '#dc2626', fontWeight: 700 }}>{v.correct}/{v.total}</span>
                          </div>
                        ))}
                        {weak.length > 0 && (
                          <div style={{ marginTop: '1.25rem' }}>
                            <p style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', margin: '0 0 0.5rem' }}>復習が必要なモジュール：</p>
                            <div className="links-row">
                              {weak.map(([id, v]) => (
                                <button key={id} className="btn-link" onClick={() => updateModuleId(id)}>
                                  {v.title} <ArrowRight size={12} />
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                  <button className="btn" onClick={startRandomQuiz} style={{ marginTop: '0.5rem' }}>
                    <Shuffle size={16} /> もう一度
                  </button>
                </div>
              ) : rqQuestions.length > 0 ? (
                /* Quiz screen */
                <div className="card" style={{ border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <div>
                      <h3 style={{ margin: 0, fontSize: '1.1rem' }}>全範囲クイズ</h3>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>{rqQuestions[rqIdx].moduleTitle}</span>
                    </div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {rqIdx + 1} / {rqQuestions.length}
                    </span>
                  </div>
                  <div style={{ marginBottom: '1.25rem', fontSize: '1rem', fontWeight: 600, lineHeight: 1.6 }}>
                    {parseContent(rqQuestions[rqIdx].q.question)}
                  </div>
                  <div className="quiz-options">
                    {rqQuestions[rqIdx].q.options.map((opt, i) => (
                      <button
                        key={`rq-${rqIdx}-${i}`}
                        className="btn"
                        style={{
                          background: rqSelected === i ? (i === rqQuestions[rqIdx].q.correctAnswer ? '#22c55e' : '#ef4444') : '#ffffff',
                          color: rqSelected === i ? 'white' : 'var(--text)',
                          justifyContent: 'space-between',
                          border: rqSelected === i ? 'none' : '1px solid #e2e8f0',
                          textAlign: 'left',
                          padding: '0.75rem 1rem',
                          boxShadow: 'none',
                          fontWeight: 500,
                          fontSize: '0.9rem',
                        }}
                        onClick={() => rqHandleSelect(i)}
                      >
                        <div style={{ flex: 1 }}>{parseContent(opt)}</div>
                        {rqSelected === i && (i === rqQuestions[rqIdx].q.correctAnswer ? <CheckCircle2 size={18} /> : <XCircle size={18} />)}
                      </button>
                    ))}
                  </div>
                  <AnimatePresence>
                    {rqSelected !== null && (
                      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                        style={{ marginTop: '1.5rem', padding: '1rem', background: '#f8fafc', borderRadius: '0.5rem', border: '1px solid #e2e8f0' }}>
                        <p style={{ margin: 0, fontSize: '0.85rem', lineHeight: 1.6 }}>
                          <strong style={{ color: rqIsCorrect ? '#22c55e' : '#ef4444' }}>{rqIsCorrect ? '正解！' : '不正解...'}</strong><br />
                          {parseContent(rqQuestions[rqIdx].q.explanation)}
                        </p>
                        <button className="btn" style={{ marginTop: '1rem', width: 'auto', padding: '0.5rem 1rem' }} onClick={rqNext}>
                          {rqIdx + 1 < rqQuestions.length ? '次の問題へ' : '結果を見る'} <ArrowRight size={16} />
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : null}
            </motion.div>
          ) : view === 'cheatsheet' ? (
            <motion.div key="cs" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              <div style={{ marginBottom: '1.5rem' }}>
                <h2 style={{ margin: '0 0 0.25rem', fontSize: '1.25rem', fontWeight: 800 }}>公式集</h2>
                <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>試験直前の確認用。各モジュールの重要公式をまとめました。</p>
              </div>
              {[1, 2, 3].map(ch => (
                <div key={ch}>
                  <div className="chapter-header">
                    <span className="badge-chapter" style={{ fontSize: '0.7rem' }}>Chapter {ch}</span>
                    <h3 className="content-h3" style={{ margin: '0.25rem 0 0' }}>{chapterNames[ch]}</h3>
                  </div>
                  {modules.filter(m => m.chapter === ch && m.keyFormulas && m.keyFormulas.length > 0).map(m => (
                    <div key={m.id} className="card cs-module-card" onClick={() => updateModuleId(m.id)} style={{ cursor: 'pointer' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                        <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800 }}>{m.title}</h4>
                        {progress[m.id] && (
                          <span className="progress-badge-small">
                            {progress[m.id].score}/{progress[m.id].total}点
                          </span>
                        )}
                      </div>
                      <div className="cs-formulas">
                        {m.keyFormulas!.map((kf, i) => (
                          <div key={i} className="cs-formula-row">
                            <span className="cs-label">{kf.label}</span>
                            <div className="cs-formula"><MathDisplay formula={kf.formula} /></div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </motion.div>
          ) : view === 'dashboard' ? (
            <motion.div key="dash" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              <DistributionSelector onSelect={updateModuleId} />
              <div className="search-container">
                <div className="search-input-wrapper">
                  <SearchIcon size={18} className="search-icon" />
                  <input type="text" placeholder="トピックを検索..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="search-input" />
                  {searchQuery && <button onClick={() => setSearchQuery('')} className="search-clear"><X size={16} /></button>}
                </div>
              </div>
              <div className="roadmap-grid">
                {filteredModules.reduce<React.ReactNode[]>((acc, m, idx) => {
                  const prev = filteredModules[idx - 1];
                  if (!prev || prev.chapter !== m.chapter) {
                    acc.push(
                      <div key={`ch-${m.chapter}`} className="chapter-header">
                        <span className="badge-chapter" style={{ fontSize: '0.7rem' }}>Chapter {m.chapter}</span>
                        <h3 className="content-h3" style={{ margin: '0.25rem 0 0' }}>{chapterNames[m.chapter]}</h3>
                      </div>
                    );
                  }
                  const p = progress[m.id];
                  acc.push(
                    <div key={m.id} className="card-module" onClick={() => updateModuleId(m.id)}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span className="badge-chapter">Chapter {m.chapter}</span>
                        {p && (
                          <span className={`progress-badge ${p.score === p.total ? 'perfect' : ''}`}>
                            {p.score === p.total ? '✓ ' : ''}{p.score}/{p.total}点
                          </span>
                        )}
                      </div>
                      <h4>{parseContent(m.title)}</h4>
                      <div className="module-desc">{parseContent(m.description)}</div>
                    </div>
                  );
                  return acc;
                }, [])}
                {!searchQuery && (
                  <>
                    <div className="chapter-header">
                      <span className="badge-chapter" style={{ fontSize: '0.7rem' }}>全範囲</span>
                      <h3 className="content-h3" style={{ margin: '0.25rem 0 0' }}>まとめ</h3>
                    </div>
                    <div className="card-module" style={{ cursor: 'pointer' }} onClick={startRandomQuiz}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span className="badge-chapter" style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}><Shuffle size={12} /> 全範囲</span>
                        {progress[COMPREHENSIVE_KEY] && (
                          <span className={`progress-badge ${progress[COMPREHENSIVE_KEY].score === progress[COMPREHENSIVE_KEY].total ? 'perfect' : ''}`}>
                            {progress[COMPREHENSIVE_KEY].score === progress[COMPREHENSIVE_KEY].total ? '✓ ' : ''}{progress[COMPREHENSIVE_KEY].score}/{progress[COMPREHENSIVE_KEY].total}点
                          </span>
                        )}
                      </div>
                      <h4>全範囲クイズ</h4>
                      <div className="module-desc">全モジュールからランダム出題</div>
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          ) : view === 'about' ? (
            <motion.div key="about" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              <div className="privacy-page">
                <h2>サイトについて</h2>

                <section>
                  <h3>このサイトについて</h3>
                  <p>「統計検定 2級 学習リファレンス」は、統計検定2級の合格を目指す方のために作られた、個人運営の学習支援サイトです。</p>
                  <p>数学的な素養が中学〜高校レベルの方でも理解できるよう、概念の直感的な説明・インタラクティブなグラフ・確認クイズを提供しています。</p>
                  <p className="privacy-disclaimer">⚠️ 本サイトは、統計質保証推進協会および日本統計学会の公式サイトではありません。試験の最新情報・申込方法・合否については、必ず公式サイトをご確認ください。</p>
                </section>

                <section>
                  <h3>コンテンツ構成</h3>
                  <ul>
                    <li><strong>学習モジュール（全10章）</strong>：確率分布・推定・検定・多変量解析・ベイズ統計・時系列分析など</li>
                    <li><strong>用語集</strong>：2級頻出用語の解説</li>
                    <li><strong>公式集</strong>：重要公式の一覧（印刷対応）</li>
                    <li><strong>全範囲クイズ</strong>：全モジュールからランダム出題</li>
                  </ul>
                </section>

                <section>
                  <h3>編集・制作方針</h3>
                  <p>本サイトのコンテンツは、統計検定の公式の出題範囲（試験要項）や、一般に流通している統計学の教科書・専門書を参照しつつ、運営者が内容を一から再構成し、初学者がつまずきやすい点を補う形で独自に解説しています。他サイトの文章をそのまま転載することはありません。</p>
                  <p>図解・確認クイズは、すべて本サイト向けに独自に制作したものです。内容の誤りや古くなった情報に気づいた場合は、お問い合わせを受けて随時見直し・修正します。</p>
                </section>

                <section>
                  <h3>運営者について</h3>
                  <p>本サイトは、統計学の学習を個人的に進める中で、同じように学んでいる方の助けになればと思い作成・公開しています。</p>
                  <p>お問い合わせは<a href="https://forms.gle/ccMv7oKwz6ysDHBe6" target="_blank" rel="noopener noreferrer">こちらのGoogleフォーム</a>からお願いします。</p>
                </section>

                <section>
                  <h3>免責事項</h3>
                  <p>本サイトの解説・問題・公式は学習目的で作成されており、内容の正確性・完全性を保証するものではありません。本サイトの情報を利用したことによるいかなる損害についても、運営者は責任を負いかねます。また、本サイトは統計検定への合格を保証するものではありません。</p>
                </section>
              </div>
            </motion.div>
          ) : view === 'guide' ? (
            <motion.div key="guide" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              <ExamGuide />
            </motion.div>
          ) : view === 'usecase' ? (
            <motion.div key="usecase" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              <div dangerouslySetInnerHTML={{ __html: buildUsecaseHtml(window.location.pathname.startsWith('/stats-g2/') ? '/stats-g2' : '') }} />
            </motion.div>
          ) : view === 'privacy' ? (
            <motion.div key="privacy" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              <div className="privacy-page">
                <h2>プライバシーポリシー</h2>
                <p className="privacy-updated">最終更新：2025年4月</p>

                <section>
                  <h3>1. サイトについて</h3>
                  <p>本サイト「統計検定 2級 学習リファレンス」は、統計検定2級の学習を支援することを目的とした個人運営のサイトです。</p>
                  <p className="privacy-disclaimer">⚠️ 本サイトは、統計質保証推進協会および日本統計学会の公式サイトではありません。試験の出題範囲・申込方法・合否については、必ず公式サイトをご確認ください。本サイトのコンテンツは学習目的で作成されたものであり、内容の正確性・完全性を保証するものではありません。</p>
                </section>

                <section>
                  <h3>2. Google Analytics の利用について</h3>
                  <p>本サイトでは、アクセス状況を把握するために <strong>Google Analytics</strong>（Google LLC 提供）を使用しています。</p>
                  <p><strong>送信される情報の例：</strong>閲覧したページのURL・滞在時間・使用デバイス・おおまかな地域情報（IPアドレスから推定）など。これらの情報はCookieを通じてGoogleのサーバーに送信されます。個人を特定する情報は収集しません。</p>
                  <p><strong>利用目的：</strong>コンテンツ改善のためのアクセス分析</p>
                  <p><strong>オプトアウト：</strong><a href="https://tools.google.com/dlpage/gaoptout" target="_blank" rel="noopener noreferrer">Google アナリティクス オプトアウト アドオン</a>をインストールすることで、データ送信を無効にできます。</p>
                  <p>Googleのプライバシーポリシーは<a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">こちら</a>をご参照ください。</p>
                </section>

                <section>
                  <h3>3. Google AdSense の利用について</h3>
                  <p>本サイトでは、広告配信のために <strong>Google AdSense</strong>（Google LLC 提供）を使用しています。</p>
                  <p><strong>送信される情報の例：</strong>閲覧履歴・Cookieに保存された識別情報など。これらは広告のパーソナライズ（行動ターゲティング）に使用されます。</p>
                  <p><strong>利用目的：</strong>サイト運営費用の確保</p>
                  <p><strong>オプトアウト：</strong><a href="https://www.google.com/settings/ads" target="_blank" rel="noopener noreferrer">広告設定ページ</a>でパーソナライズ広告を無効にできます。また、<a href="https://www.aboutads.info/choices/" target="_blank" rel="noopener noreferrer">Digital Advertising Alliance</a> のオプトアウトツールもご利用いただけます。</p>
                </section>

                <section>
                  <h3>4. Cookieについて</h3>
                  <p>本サイトでは、Google Analytics および Google AdSense の機能提供のためにCookieを使用しています。ブラウザの設定からCookieを無効にすることができますが、一部機能が正常に動作しない場合があります。</p>
                </section>

                <section>
                  <h3>5. 学習進捗データについて</h3>
                  <p>クイズの得点・完了状況は、お使いのブラウザの <strong>ローカルストレージ</strong> にのみ保存されます。このデータは外部サーバーへ送信されることはなく、運営者も閲覧できません。ブラウザのデータ削除により消去されます。</p>
                </section>

                <section>
                  <h3>6. コンテンツの免責事項</h3>
                  <p>本サイトの解説・問題・公式は学習目的で作成されており、内容の正確性を保証するものではありません。本サイトの情報を利用したことによるいかなる損害についても、運営者は責任を負いかねます。また、本サイトは統計検定への合格を保証するものではありません。</p>
                </section>

                <section>
                  <h3>7. 本ポリシーの変更</h3>
                  <p>本ポリシーは予告なく変更される場合があります。変更後のポリシーはこのページへの掲載をもって効力を生じます。</p>
                </section>
              </div>
            </motion.div>
          ) : (
            /* Glossary view */
            <motion.div key="glos" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              <div className="search-container" style={{ marginBottom: '2rem' }}>
                <div className="search-input-wrapper">
                  <SearchIcon size={18} className="search-icon" />
                  <input type="text" placeholder="用語を検索..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="search-input" />
                  {searchQuery && <button onClick={() => setSearchQuery('')} className="search-clear"><X size={16} /></button>}
                </div>
              </div>
              <div className="glossary-grid">
                {Object.values(glossary)
                  .filter(term => !searchQuery || term.term.toLowerCase().includes(searchQuery.toLowerCase()) || term.explanation.toLowerCase().includes(searchQuery.toLowerCase()))
                  .map(term => {
                    const relatedModules = findModulesByTerm(term.id);
                    return (
                      <div key={term.id} id={`glossary-${term.id}`} className="card-glossary">
                        <div className="glossary-header">
                          <h4>{parseContent(term.term)}</h4>
                          <span className={`badge-level ${{ '基礎': 'basic', '中級': 'intermediate', '上級': 'advanced' }[term.level] ?? 'basic'}`}>{term.level}</span>
                        </div>
                        <div className="glossary-explanation">{parseContent(term.explanation)}</div>
                        {term.formula && (
                          <div className="glossary-formula">
                            <MathDisplay formula={term.formula} />
                          </div>
                        )}
                        {term.relatedTerms && term.relatedTerms.length > 0 && (
                          <div className="related-links">
                            <p className="label-related">関連用語：</p>
                            <div className="links-row">
                              {term.relatedTerms.map(rtId => glossary[rtId] && (
                                <button key={rtId} className="btn-link" onClick={() => {
                                  const el = document.getElementById(`glossary-${rtId}`);
                                  el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                }}>
                                  {glossary[rtId].term} <ArrowRight size={12} />
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                        {relatedModules.length > 0 && (
                          <div className="related-links">
                            <p className="label-related">解説ページ：</p>
                            <div className="links-row">
                              {relatedModules.map(m => (
                                <button key={m.id} className="btn-link" onClick={() => updateModuleId(m.id)}>
                                  {parseContent(m.title)} <ArrowRight size={12} />
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <footer className="site-footer">
        <p className="footer-disclaimer">
          本サイトは個人による学習支援サイトであり、統計質保証推進協会および日本統計学会の公式サイトではありません。掲載内容は個人の見解に基づくものであり、公式の情報を保証するものではありません。
        </p>
        <div className="footer-links">
          <button className="footer-link" onClick={() => switchView('about')}>サイトについて</button>
          <button className="footer-link" onClick={() => switchView('privacy')}>プライバシーポリシー</button>
          <a className="footer-link" href="https://forms.gle/ccMv7oKwz6ysDHBe6" target="_blank" rel="noopener noreferrer">お問い合わせ</a>
        </div>
        <p className="footer-copy">© {new Date().getFullYear()} 統計検定 2級 学習リファレンス</p>
      </footer>
    </div>
  );
}

export default App;
