import * as fs from 'fs';
import * as path from 'path';
import sharp from 'sharp';
import katex from 'katex';
import { modules, chapterNames } from '../src/data/modules';
import { glossary } from '../src/data/glossary';
import { buildUsecaseHtml } from '../src/data/usecaseGuide';

const DIST_DIR = path.resolve(process.cwd(), 'dist');
const INDEX_HTML_PATH = path.join(DIST_DIR, 'index.html');
const BASE_URL = 'https://study-apps.com/stats-g2';

// KaTeXでサーバーサイド描画（2026-08-04・O-2-6再監査：本サイトだけ$...$を削除する旧実装が残っていた）。
// stats-pre1/stats-g3と同じオプション・クラス名を使い、ハイドレーション後との見た目の一致を狙う。
function renderMath(formula: string, block: boolean): string {
  try {
    const html = katex.renderToString(formula, { displayMode: block, throwOnError: false, output: 'html' });
    return block ? `<div class="math-block-container" style="margin:1rem 0"><div class="katex-display">${html}</div></div>` : `<span class="katex-inline">${html}</span>`;
  } catch {
    return formula;
  }
}

// クイズ問題文/選択肢内の$...$を実描画（2026-08-04・O-2-6再監査：クイズ抜粋だけ数式が未対応だった）。
function renderInlineMath(text: string): string {
  const tokens = text.split(/(\$\$[\s\S]+?\$\$|\$[^$\n]+\$)/g);
  return tokens
    .map((t) => {
      if (t.startsWith('$$') && t.endsWith('$$') && t.length >= 4) return renderMath(t.slice(2, -2), true);
      if (t.startsWith('$') && t.endsWith('$') && t.length >= 2) return renderMath(t.slice(1, -1), false);
      return t;
    })
    .join('');
}

// App.tsx内のJSX図（[[key]]でReact専用に描画されるSVG）を静的HTMLでも表示する（2026-07-30・O-2-6続報）。
// 固定座標・固定数式（seeded PRNGを含め props/state非依存）のもののみ複製。
// [[interactive:TYPE]]（真の動的スライダー）は対象外のまま（下のFIGURESに無いキーは従来どおり除去）。
function mulberryRnd(seed: number) {
  let s = seed;
  return () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
}
function boxplotSvg(): string {
  return `<svg viewBox="0 0 360 112" role="img" aria-label="箱ひげ図：最小値・Q1・中央値・Q3・最大値と外れ値。箱の長さがIQR" class="g2-fig-svg">
    <line x1="60" y1="60" x2="110" y2="60" stroke="#475569" stroke-width="1.5" /><line x1="200" y1="60" x2="250" y2="60" stroke="#475569" stroke-width="1.5" />
    <line x1="60" y1="47" x2="60" y2="73" stroke="#475569" stroke-width="1.5" /><line x1="250" y1="47" x2="250" y2="73" stroke="#475569" stroke-width="1.5" />
    <rect x="110" y="40" width="90" height="40" fill="#0f766e" fill-opacity="0.14" stroke="#0f766e" stroke-width="1.6" />
    <line x1="150" y1="40" x2="150" y2="80" stroke="#0b5a54" stroke-width="2.6" />
    <circle cx="300" cy="60" r="4" fill="none" stroke="#dc2626" stroke-width="1.6" />
    <line x1="110" y1="30" x2="200" y2="30" stroke="#94a3b8" stroke-width="1" /><line x1="110" y1="30" x2="110" y2="36" stroke="#94a3b8" stroke-width="1" /><line x1="200" y1="30" x2="200" y2="36" stroke="#94a3b8" stroke-width="1" />
    <text x="155" y="23" text-anchor="middle" font-size="11" font-weight="700" fill="#334155">IQR = Q₃ − Q₁</text>
    <line x1="60" y1="75" x2="60" y2="90" stroke="#cbd5e1" stroke-width="1" /><line x1="110" y1="82" x2="110" y2="90" stroke="#cbd5e1" stroke-width="1" /><line x1="150" y1="82" x2="150" y2="90" stroke="#cbd5e1" stroke-width="1" /><line x1="200" y1="82" x2="200" y2="90" stroke="#cbd5e1" stroke-width="1" /><line x1="250" y1="75" x2="250" y2="90" stroke="#cbd5e1" stroke-width="1" /><line x1="300" y1="66" x2="300" y2="90" stroke="#cbd5e1" stroke-width="1" />
    <text x="60" y="101" text-anchor="middle" font-size="10" fill="#64748b">最小値</text><text x="110" y="101" text-anchor="middle" font-size="11" font-weight="700" fill="#0b5a54">Q₁</text><text x="150" y="101" text-anchor="middle" font-size="10" font-weight="700" fill="#0b5a54">中央値</text><text x="200" y="101" text-anchor="middle" font-size="11" font-weight="700" fill="#0b5a54">Q₃</text><text x="250" y="101" text-anchor="middle" font-size="10" fill="#64748b">最大値</text><text x="300" y="101" text-anchor="middle" font-size="10" fill="#b91c1c">外れ値</text>
  </svg>`;
}
// App.tsxの[[skewshape]]と同一の計算（2026-08-04・実欠落を読み取り調査で発見し新設）。
// 正/負の歪度で最頻値・中央値・平均の並び順が逆転することを2パネルで見せる。
function skewshapeSvg(): string {
  const tmax = 7, LAMBDA = 1.3;
  const shape = (t: number) => (t <= 0 ? 0 : t * t * Math.exp(-LAMBDA * t));
  const tMode = 2 / LAMBDA; // t^2 e^{-λt} の極大点は解析的に 2/λ
  // 積分は精度優先で細かく（NINT）、描画点は軽量優先で粗く（NDRAW）と分離。
  const NINT = 200, dtInt = tmax / NINT;
  let area = 0, weighted = 0;
  const cumAt: number[] = [];
  let cum = 0;
  for (let i = 0; i <= NINT; i++) {
    const t = i * dtInt;
    const f = shape(t);
    area += f * dtInt;
    weighted += t * f * dtInt;
    cum += f * dtInt;
    cumAt.push(cum);
  }
  const tMean = weighted / area;
  let tMedian = tmax;
  for (let i = 0; i <= NINT; i++) {
    if (cumAt[i] >= area / 2) { tMedian = i * dtInt; break; }
  }
  const fmax = shape(tMode);
  const NDRAW = 28, dt = tmax / NDRAW;
  const pw = 148, ph = 78, baseY = 118, topPad = 14;
  const panel = (mirror: boolean, originX: number) => {
    const px = (t: number) => originX + (mirror ? (tmax - t) / tmax : t / tmax) * pw;
    const py = (f: number) => baseY - (f / fmax) * ph;
    let curve = '';
    for (let i = 0; i <= NDRAW; i++) { const t = i * dt; curve += `${px(t).toFixed(1)},${py(shape(t)).toFixed(1)} `; }
    const area2 = `${px(0).toFixed(1)},${baseY} ` + curve + `${px(tmax).toFixed(1)},${baseY}`;
    const marks = [
      { t: tMode, label: '最頻値', color: '#0f766e', dy: 0 },
      { t: tMedian, label: '中央値', color: '#334155', dy: 12 },
      { t: tMean, label: '平均', color: '#b91c1c', dy: 24 },
    ];
    let out = `<polygon points="${area2}" fill="#0f766e" fill-opacity="0.12" /><polyline points="${curve.trim()}" fill="none" stroke="#0f766e" stroke-width="2.2" /><line x1="${originX}" y1="${baseY}" x2="${originX + pw}" y2="${baseY}" stroke="#94a3b8" stroke-width="1" />`;
    marks.forEach((m) => {
      const topY = py(shape(m.t)) < baseY - 4 ? py(shape(m.t)) : baseY - 4;
      out += `<line x1="${px(m.t).toFixed(1)}" y1="${topY.toFixed(1)}" x2="${px(m.t).toFixed(1)}" y2="${baseY}" stroke="${m.color}" stroke-width="1.4" stroke-dasharray="3 2" /><text x="${px(m.t).toFixed(1)}" y="${baseY + 14 + m.dy}" text-anchor="middle" font-size="9.5" font-weight="700" fill="${m.color}">${m.label}</text>`;
    });
    return out;
  };
  return `<svg viewBox="0 0 360 168" role="img" aria-label="正の歪度と負の歪度：最頻値・中央値・平均の並び順が逆転する" class="g2-fig-svg">
    ${panel(false, 8)}
    <text x="82" y="${topPad}" text-anchor="middle" font-size="11" font-weight="700" fill="#334155">正の歪度（右に裾）</text>
    ${panel(true, 204)}
    <text x="278" y="${topPad}" text-anchor="middle" font-size="11" font-weight="700" fill="#334155">負の歪度（左に裾）</text>
  </svg>`;
}
function lorenzSvg(): string {
  const x0 = 44, x1 = 272, yBot = 228, yTop = 22;
  const px = (p: number) => x0 + p * (x1 - x0);
  const py = (v: number) => yBot - v * (yBot - yTop);
  const L = (p: number) => Math.pow(p, 2.2);
  let area = `${px(0)},${py(0)} ${px(1)},${py(1)}`;
  for (let p = 1; p >= -0.0001; p -= 0.0625) { const q = Math.max(0, p); area += ` ${px(q).toFixed(1)},${py(L(q)).toFixed(1)}`; }
  let curve = '';
  for (let p = 0; p <= 1.0001; p += 0.0625) { const q = Math.min(1, p); curve += `${px(q).toFixed(1)},${py(L(q)).toFixed(1)} `; }
  return `<svg viewBox="0 0 300 262" role="img" aria-label="ローレンツ曲線とジニ係数：完全平等線と曲線の間の面積が格差" class="g2-fig-svg">
    <text x="44" y="14" text-anchor="start" font-size="10" fill="#615d59">所得（累積 %）</text>
    <line x1="44" y1="22" x2="44" y2="228" stroke="#9ca3af" stroke-width="1" /><line x1="44" y1="228" x2="272" y2="228" stroke="#9ca3af" stroke-width="1" />
    <polygon points="${area}" fill="#0f766e" fill-opacity="0.14" />
    <line x1="44" y1="228" x2="272" y2="22" stroke="#9ca3af" stroke-width="1.2" stroke-dasharray="4 3" />
    <polyline points="${curve.trim()}" fill="none" stroke="#0f766e" stroke-width="2.4" />
    <text x="198" y="44" text-anchor="middle" font-size="10" fill="#615d59">完全平等線</text><text x="152" y="164" text-anchor="middle" font-size="13" font-weight="700" fill="#0f766e">S</text><text x="210" y="190" text-anchor="middle" font-size="10" font-weight="700" fill="#0f766e">ローレンツ曲線</text><text x="158" y="252" text-anchor="middle" font-size="10" fill="#615d59">人口（累積 %）</text>
  </svg>`;
}
function correlationSvg(): string {
  const panels = [
    { cx: 30, cy: 30, label: '強い正の相関', r: 'r ≈ +0.9', kind: 'pos' as const },
    { cx: 198, cy: 30, label: '相関なし', r: 'r ≈ 0', kind: 'zero' as const },
    { cx: 30, cy: 132, label: '強い負の相関', r: 'r ≈ −0.9', kind: 'neg' as const },
    { cx: 198, cy: 132, label: '非線形（U字）', r: 'r ≈ 0', kind: 'nonlin' as const },
  ];
  const W = 116, H = 58;
  const rnd = mulberryRnd(7);
  let out = '';
  panels.forEach((p) => {
    out += `<text x="${p.cx + W / 2}" y="${p.cy - 8}" text-anchor="middle" font-size="11" font-weight="700" fill="#33302c">${p.label}</text>`;
    out += `<text x="${p.cx + W - 2}" y="${p.cy + 12}" text-anchor="end" font-size="10" font-weight="700" fill="#0f766e">${p.r}</text>`;
    out += `<line x1="${p.cx}" y1="${p.cy}" x2="${p.cx}" y2="${p.cy + H}" stroke="#c9c3ba" stroke-width="1" />`;
    out += `<line x1="${p.cx}" y1="${p.cy + H}" x2="${p.cx + W}" y2="${p.cy + H}" stroke="#c9c3ba" stroke-width="1" />`;
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
      out += `<circle cx="${px.toFixed(1)}" cy="${py.toFixed(1)}" r="2.4" fill="#0f766e" fill-opacity="0.65" />`;
    }
  });
  return `<svg viewBox="0 0 328 202" role="img" aria-label="相関係数の4パターン：強い正・相関なし・強い負・非線形（U字でr≈0）" class="g2-fig-svg">${out}</svg>`;
}
function vartransformSvg(): string {
  const yb = 120;
  const gauss = (cx: number, hw: number, ph: number) => { let p = ''; for (let t = -3; t <= 3.001; t += 0.2) { const x = cx + t * (hw / 3); const y = yb - ph * Math.exp(-(t * t) / 2); p += `${x.toFixed(1)},${y.toFixed(1)} `; } return p.trim(); };
  return `<svg viewBox="0 0 336 184" role="img" aria-label="分散の変換：定数の加算は分散を変えず、係数倍は分散をa2乗倍にする" class="g2-fig-svg">
    <text x="84" y="14" text-anchor="middle" font-size="10.5" font-weight="700" fill="#33302c">＋b（平行移動）</text>
    <line x1="12" y1="${yb}" x2="156" y2="${yb}" stroke="#c9c3ba" stroke-width="1" />
    <polyline points="${gauss(58, 30, 66)}" fill="#0f766e" fill-opacity="0.12" stroke="#0f766e" stroke-width="2" />
    <polyline points="${gauss(112, 30, 66)}" fill="#dd5b2a" fill-opacity="0.1" stroke="#dd5b2a" stroke-width="2" stroke-dasharray="4 3" />
    <line x1="58" y1="40" x2="112" y2="40" stroke="#8a857e" stroke-width="1" />
    <text x="85" y="35" text-anchor="middle" font-size="9" fill="#615d59">＋b →</text>
    <text x="84" y="${yb + 16}" text-anchor="middle" font-size="9.5" font-weight="700" fill="#0b5a54">分散は変わらない</text>
    <text x="84" y="${yb + 29}" text-anchor="middle" font-size="8.5" fill="#615d59">同じ幅のまま位置だけ動く</text>
    <line x1="168" y1="20" x2="168" y2="${yb + 30}" stroke="#e8e7e5" stroke-width="1" />
    <text x="252" y="14" text-anchor="middle" font-size="10.5" font-weight="700" fill="#33302c">×a（a倍・例 a=2）</text>
    <line x1="182" y1="${yb}" x2="326" y2="${yb}" stroke="#c9c3ba" stroke-width="1" />
    <polyline points="${gauss(252, 18, 70)}" fill="#0f766e" fill-opacity="0.14" stroke="#0f766e" stroke-width="2" />
    <polyline points="${gauss(252, 40, 35)}" fill="#dd5b2a" fill-opacity="0.1" stroke="#dd5b2a" stroke-width="2" />
    <text x="252" y="${yb + 16}" text-anchor="middle" font-size="9.5" font-weight="700" fill="#b8461c">分散は a²＝4倍</text>
    <text x="252" y="${yb + 29}" text-anchor="middle" font-size="8.5" fill="#615d59">幅が a 倍に広がる（低く平たく）</text>
  </svg>`;
}
function twosampleSvg(): string {
  const yb = 118, ph = 74, hw = 66, aCx = 108, bCx = 208;
  const gauss = (cx: number) => { let p = ''; for (let t = -3; t <= 3.001; t += 0.25) { const x = cx + t * (hw / 3); const y = yb - ph * Math.exp(-(t * t) / 2); p += `${x.toFixed(1)},${y.toFixed(1)} `; } return p.trim(); };
  return `<svg viewBox="0 0 328 172" role="img" aria-label="2標本の平均の差：A群とB群の分布が重なる中で平均差が偶然より大きいかを検定する" class="g2-fig-svg">
    <line x1="20" y1="${yb}" x2="308" y2="${yb}" stroke="#c9c3ba" stroke-width="1" />
    <polyline points="${gauss(aCx)}" fill="#0f766e" fill-opacity="0.12" stroke="#0f766e" stroke-width="2" />
    <polyline points="${gauss(bCx)}" fill="#dd5b2a" fill-opacity="0.12" stroke="#dd5b2a" stroke-width="2" />
    <line x1="${aCx}" y1="${yb}" x2="${aCx}" y2="${yb - ph}" stroke="#0b5a54" stroke-width="1.4" stroke-dasharray="3 2" />
    <line x1="${bCx}" y1="${yb}" x2="${bCx}" y2="${yb - ph}" stroke="#b8461c" stroke-width="1.4" stroke-dasharray="3 2" />
    <text x="${aCx}" y="28" text-anchor="middle" font-size="11" font-weight="700" fill="#0b5a54">A群</text>
    <text x="${bCx}" y="28" text-anchor="middle" font-size="11" font-weight="700" fill="#b8461c">B群</text>
    <text x="${aCx}" y="${yb + 13}" text-anchor="middle" font-size="9.5" fill="#0b5a54">x̄_A</text>
    <text x="${bCx}" y="${yb + 13}" text-anchor="middle" font-size="9.5" fill="#b8461c">x̄_B</text>
    <line x1="${aCx}" y1="${yb + 24}" x2="${bCx}" y2="${yb + 24}" stroke="#33302c" stroke-width="1" />
    <line x1="${aCx}" y1="${yb + 20}" x2="${aCx}" y2="${yb + 28}" stroke="#33302c" stroke-width="1" />
    <line x1="${bCx}" y1="${yb + 20}" x2="${bCx}" y2="${yb + 28}" stroke="#33302c" stroke-width="1" />
    <text x="${(aCx + bCx) / 2}" y="${yb + 38}" text-anchor="middle" font-size="9.5" font-weight="700" fill="#33302c">平均の差 x̄_B − x̄_A</text>
  </svg>`;
}
function samplingSvg(): string {
  const panels = [{ title: '単純無作為', cx: 8 }, { title: '層化', cx: 116 }, { title: 'クラスター', cx: 224 }];
  const pw = 96, py = 24, ph = 96;
  const rnd = mulberryRnd(3);
  let out = '';
  panels.forEach((p) => {
    out += `<text x="${p.cx + pw / 2}" y="16" text-anchor="middle" font-size="10.5" font-weight="700" fill="#33302c">${p.title}</text>`;
    out += `<rect x="${p.cx}" y="${py}" width="${pw}" height="${ph}" rx="6" fill="none" stroke="#c9c3ba" stroke-width="1" />`;
    if (p.title === '層化') { for (let b = 0; b < 3; b++) out += `<rect x="${p.cx}" y="${py + b * (ph / 3)}" width="${pw}" height="${ph / 3}" fill="${b % 2 ? '#0f766e' : '#dd5b2a'}" fill-opacity="0.06" />`; }
    if (p.title === 'クラスター') {
      for (let c = 0; c < 4; c++) { const gx = p.cx + 6 + (c % 2) * (pw / 2 - 2); const gy = py + 8 + Math.floor(c / 2) * (ph / 2 - 4); if (c === 1 || c === 2) out += `<rect x="${gx - 3}" y="${gy - 3}" width="40" height="38" rx="4" fill="#0f766e" fill-opacity="0.14" stroke="#0f766e" stroke-width="1.2" />`; }
    }
    for (let i = 0; i < 28; i++) {
      const dx = p.cx + 8 + rnd() * (pw - 16);
      const dy = py + 8 + rnd() * (ph - 16);
      let picked = false;
      if (p.title === '単純無作為') picked = rnd() < 0.28;
      else if (p.title === '層化') picked = rnd() < 0.28;
      else picked = (dx > p.cx + 6 && dx < p.cx + 6 + 40 && dy > py + 8 && dy < py + 8 + 38) || (dx > p.cx + pw / 2 + 2 && dy > py + ph / 2 - 1);
      out += `<circle cx="${dx.toFixed(1)}" cy="${dy.toFixed(1)}" r="2.4" fill="${picked ? '#0f766e' : '#c9c3ba'}" />`;
    }
  });
  return `<svg viewBox="0 0 328 138" role="img" aria-label="標本抽出法：単純無作為・層化・クラスターの違い" class="g2-fig-svg">${out}<text x="164" y="132" text-anchor="middle" font-size="9" fill="#615d59">濃い点＝標本に選ばれた個体</text></svg>`;
}
function timeseriesSvgG2(): string {
  const N = 24, x0 = 30, y0 = 16, plotW = 288, plotH = 116;
  const rnd = mulberryRnd(7);
  const raw: number[] = [];
  for (let t = 0; t < N; t++) raw.push(1 + 0.05 * t + 0.6 * Math.sin((2 * Math.PI * t) / 12) + (rnd() - 0.5) * 0.7);
  const half = 2;
  const ma = raw.map((_, t) => { let s = 0, c = 0; for (let j = -half; j <= half; j++) { if (t + j >= 0 && t + j < N) { s += raw[t + j]; c++; } } return s / c; });
  const all = raw.concat(ma), mn = Math.min(...all), mx = Math.max(...all);
  const sx = (t: number) => x0 + (t / (N - 1)) * plotW;
  const sy = (v: number) => y0 + plotH - ((v - mn) / (mx - mn)) * plotH;
  const rawPoly = raw.map((v, t) => `${sx(t).toFixed(1)},${sy(v).toFixed(1)}`).join(' ');
  const maPoly = ma.map((v, t) => `${sx(t).toFixed(1)},${sy(v).toFixed(1)}`).join(' ');
  const dots = raw.map((v, t) => `<circle cx="${sx(t)}" cy="${sy(v)}" r="1.7" fill="#8a857e" />`).join('');
  return `<svg viewBox="0 0 328 182" role="img" aria-label="時系列：ぎざぎざの生データと、なめらかな移動平均のトレンド線" class="g2-fig-svg">
    <line x1="${x0}" y1="${y0 + plotH}" x2="${x0 + plotW}" y2="${y0 + plotH}" stroke="#c9c3ba" stroke-width="1" />
    <polyline points="${rawPoly}" fill="none" stroke="#b7b1a8" stroke-width="1.3" />${dots}
    <polyline points="${maPoly}" fill="none" stroke="#0f766e" stroke-width="2.8" />
    <line x1="${x0}" y1="${y0 + plotH + 16}" x2="${x0 + 18}" y2="${y0 + plotH + 16}" stroke="#b7b1a8" stroke-width="1.3" />
    <text x="${x0 + 22}" y="${y0 + plotH + 19}" font-size="9.5" fill="#615d59">生データ（ノイズ）</text>
    <line x1="${x0 + 150}" y1="${y0 + plotH + 16}" x2="${x0 + 168}" y2="${y0 + plotH + 16}" stroke="#0f766e" stroke-width="2.8" />
    <text x="${x0 + 172}" y="${y0 + plotH + 19}" font-size="9.5" fill="#0b5a54">移動平均＝トレンド</text>
  </svg>`;
}
function scaleladderSvg(): string {
  const steps = [
    { name: '名義尺度', ex: '血液型・都道府県', op: '分類できる' },
    { name: '順序尺度', ex: '満足度・順位', op: '＋ 大小がわかる' },
    { name: '間隔尺度', ex: '摂氏温度・西暦', op: '＋ 差を計算できる' },
    { name: '比例尺度', ex: '身長・体重', op: '＋ 比を計算できる' },
  ];
  const sw = 78, gap = 4, baseY = 176, unit = 34, x0 = 6;
  let out = '';
  steps.forEach((s, i) => {
    const h = unit * (i + 1), x = x0 + i * (sw + gap), y = baseY - h, op = 0.35 + i * 0.2;
    out += `<g><rect x="${x}" y="${y}" width="${sw}" height="${h}" rx="5" fill="#0f766e" fill-opacity="${op}" stroke="#0f766e" stroke-width="1.3" />
      <text x="${x + sw / 2}" y="${y + 16}" text-anchor="middle" font-size="11" font-weight="800" fill="${i >= 2 ? '#ffffff' : '#0b5a54'}">${s.name}</text>
      <text x="${x + sw / 2}" y="${y + 30}" text-anchor="middle" font-size="8" fill="${i >= 2 ? '#e6f5f2' : '#615d59'}">${s.ex}</text>
      <text x="${x + sw / 2}" y="${baseY + 13}" text-anchor="middle" font-size="8.5" font-weight="600" fill="#0b5a54">${s.op}</text></g>`;
  });
  return `<svg viewBox="0 0 336 196" role="img" aria-label="尺度の4水準の階段：名義＜順序＜間隔＜比例、上位ほど使える操作が増える" class="g2-fig-svg">${out}<line x1="${x0}" y1="${baseY}" x2="${x0 + 4 * (sw + gap)}" y2="${baseY}" stroke="#c9c3ba" stroke-width="1" /></svg>`;
}
function binomialSvg(): string {
  const nB = 10, pB = 0.3;
  const logFact = (m: number) => { let v = 0; for (let i = 2; i <= m; i++) v += Math.log(i); return v; };
  const pmf = (k: number) => Math.exp(logFact(nB) - logFact(k) - logFact(nB - k) + k * Math.log(pB) + (nB - k) * Math.log(1 - pB));
  const bars = Array.from({ length: nB + 1 }, (_, k) => ({ k, p: pmf(k) }));
  const maxP = Math.max(...bars.map(b => b.p));
  const x0 = 34, y0 = 12, plotW = 276, plotH = 118, bw = plotW / (nB + 1), mean = nB * pB;
  const rects = bars.map(b => {
    const h = (b.p / maxP) * plotH, bx = x0 + b.k * bw + bw * 0.16, near = Math.abs(b.k - mean) <= 0.5;
    return `<g><rect x="${bx}" y="${y0 + 8 + (plotH - h)}" width="${bw * 0.68}" height="${h}" rx="2" fill="#0f766e" fill-opacity="${near ? 0.95 : 0.4}" /><text x="${bx + bw * 0.34}" y="${y0 + 8 + plotH + 12}" text-anchor="middle" font-size="9" fill="#615d59">${b.k}</text></g>`;
  }).join('');
  return `<svg viewBox="0 0 324 176" role="img" aria-label="二項分布 B(10,0.3) の確率分布：k=3付近が最も高い棒グラフ" class="g2-fig-svg">
    <text x="162" y="10" text-anchor="middle" font-size="11" font-weight="700" fill="#33302c">二項分布 B(n=10, p=0.3)：成功回数 k の確率</text>${rects}
    <line x1="${x0}" y1="${y0 + 8 + plotH}" x2="${x0 + plotW}" y2="${y0 + 8 + plotH}" stroke="#c9c3ba" stroke-width="1" />
    <text x="162" y="168" text-anchor="middle" font-size="9.5" fill="#615d59">成功回数 k（平均 np ＝ 3 が最も出やすい）</text>
  </svg>`;
}
function zscoreSvg(): string {
  const gauss = (cx: number, hw: number, yb: number, ph: number) => { let pts = ''; for (let t = -3; t <= 3.0001; t += 0.25) { const x = cx + t * (hw / 3); const y = yb - ph * Math.exp(-(t * t) / 2); pts += `${x.toFixed(1)},${y.toFixed(1)} `; } return pts.trim(); };
  const yb = 96, ph = 60, hw = 66, mathCx = 96, engCx = 264;
  const markX = (cx: number, z: number) => cx + z * (hw / 3);
  const zticks = [-2, -1, 0, 1, 2].map((z) => { const x = 180 + z * 56; return `<line x1="${x}" y1="166" x2="${x}" y2="174" stroke="#8a857e" stroke-width="1" /><text x="${x}" y="186" text-anchor="middle" font-size="9" fill="#8a857e">${z > 0 ? `+${z}` : z}</text>`; }).join('');
  return `<svg viewBox="0 0 360 232" role="img" aria-label="標準化：平均と散らばりの違う数学と英語の得点を、共通のz尺度に載せて比較する" class="g2-fig-svg">
    <line x1="22" y1="${yb}" x2="170" y2="${yb}" stroke="#c9c3ba" stroke-width="1" /><line x1="190" y1="${yb}" x2="338" y2="${yb}" stroke="#c9c3ba" stroke-width="1" />
    <polyline points="${gauss(mathCx, hw, yb, ph)}" fill="#0f766e" fill-opacity="0.08" stroke="#0f766e" stroke-width="1.8" />
    <polyline points="${gauss(engCx, hw, yb, ph)}" fill="#dd5b2a" fill-opacity="0.08" stroke="#dd5b2a" stroke-width="1.8" />
    <text x="${mathCx}" y="20" text-anchor="middle" font-size="10.5" font-weight="700" fill="#0b5a54">数学</text><text x="${mathCx}" y="33" text-anchor="middle" font-size="9" fill="#615d59">平均60・SD10</text>
    <text x="${engCx}" y="20" text-anchor="middle" font-size="10.5" font-weight="700" fill="#b8461c">英語</text><text x="${engCx}" y="33" text-anchor="middle" font-size="9" fill="#615d59">平均70・SD5</text>
    <text x="${mathCx}" y="${yb + 12}" text-anchor="middle" font-size="8.5" fill="#8a857e">60</text><text x="${engCx}" y="${yb + 12}" text-anchor="middle" font-size="8.5" fill="#8a857e">70</text>
    <line x1="${markX(mathCx, 2)}" y1="${yb}" x2="${markX(mathCx, 2)}" y2="${yb - ph * Math.exp(-2)}" stroke="#0b5a54" stroke-width="1.4" stroke-dasharray="3 2" />
    <circle cx="${markX(mathCx, 2)}" cy="${yb}" r="3.2" fill="#0f766e" /><text x="${markX(mathCx, 2) + 2}" y="${yb - 6}" text-anchor="start" font-size="9.5" font-weight="700" fill="#0b5a54">80点</text>
    <line x1="${markX(engCx, 1)}" y1="${yb}" x2="${markX(engCx, 1)}" y2="${yb - ph * Math.exp(-0.5)}" stroke="#b8461c" stroke-width="1.4" stroke-dasharray="3 2" />
    <circle cx="${markX(engCx, 1)}" cy="${yb}" r="3.2" fill="#dd5b2a" /><text x="${markX(engCx, 1) + 2}" y="${yb - 6}" text-anchor="start" font-size="9.5" font-weight="700" fill="#b8461c">75点</text>
    <text x="180" y="132" text-anchor="middle" font-size="10" fill="#615d59">↓ z ＝ (得点 − 平均) ÷ SD で同じ物差しに ↓</text>
    <line x1="40" y1="170" x2="320" y2="170" stroke="#8a857e" stroke-width="1.4" />${zticks}
    <text x="324" y="173" text-anchor="start" font-size="9" fill="#8a857e">z</text>
    <circle cx="${180 + 2 * 56}" cy="170" r="4" fill="#0f766e" /><text x="${180 + 2 * 56}" y="158" text-anchor="middle" font-size="9.5" font-weight="700" fill="#0b5a54">数学 z=2</text>
    <circle cx="${180 + 1 * 56}" cy="170" r="4" fill="#dd5b2a" /><text x="${180 + 1 * 56}" y="158" text-anchor="middle" font-size="9.5" font-weight="700" fill="#b8461c">英語 z=1</text>
    <text x="180" y="210" text-anchor="middle" font-size="10.5" font-weight="700" fill="#33302c">同じ土俵なら 数学80(z=2) の方が相対的に上</text>
  </svg>`;
}
function ppvSvgG2(): string {
  const barX = 40, barW = 280, barY = 208, barH = 22, tp = 9, fp = 50, total = tp + fp;
  const tpW = (tp / total) * barW;
  return `<svg viewBox="0 0 360 276" role="img" aria-label="1000人の自然頻度で見る陽性適中率：陽性59人のうち本当に病気は9人でPPV約15%" class="g2-fig-svg">
    <text x="180" y="13" text-anchor="middle" font-size="11" font-weight="700" fill="#33302c">有病率1%・感度90%・特異度95% を1000人で考える</text>
    <rect x="150" y="22" width="60" height="22" rx="4" fill="#0f766e" fill-opacity="0.1" stroke="#0f766e" stroke-width="1.2" /><text x="180" y="37" text-anchor="middle" font-size="11" font-weight="700" fill="#0b5a54">1000人</text>
    <line x1="180" y1="44" x2="96" y2="66" stroke="#c9c3ba" stroke-width="1.2" /><line x1="180" y1="44" x2="264" y2="66" stroke="#c9c3ba" stroke-width="1.2" />
    <rect x="54" y="66" width="84" height="22" rx="4" fill="#0f766e" fill-opacity="0.1" stroke="#0f766e" stroke-width="1.2" /><text x="96" y="81" text-anchor="middle" font-size="10.5" font-weight="700" fill="#0b5a54">病気 10人</text>
    <rect x="222" y="66" width="84" height="22" rx="4" fill="#efe9e1" stroke="#c9c3ba" stroke-width="1.2" /><text x="264" y="81" text-anchor="middle" font-size="10.5" font-weight="700" fill="#615d59">健康 990人</text>
    <line x1="96" y1="88" x2="70" y2="110" stroke="#c9c3ba" stroke-width="1" /><line x1="96" y1="88" x2="122" y2="110" stroke="#c9c3ba" stroke-width="1" /><line x1="264" y1="88" x2="238" y2="110" stroke="#c9c3ba" stroke-width="1" /><line x1="264" y1="88" x2="290" y2="110" stroke="#c9c3ba" stroke-width="1" />
    <rect x="44" y="110" width="52" height="20" rx="3" fill="#0f766e" stroke="#0b5a54" stroke-width="1" /><text x="70" y="124" text-anchor="middle" font-size="10" font-weight="700" fill="#ffffff">陽性 9</text><text x="122" y="124" text-anchor="middle" font-size="10" fill="#615d59">陰性 1</text>
    <rect x="212" y="110" width="52" height="20" rx="3" fill="#dd5b2a" stroke="#b8461c" stroke-width="1" /><text x="238" y="124" text-anchor="middle" font-size="10" font-weight="700" fill="#ffffff">陽性 50</text><text x="294" y="124" text-anchor="middle" font-size="10" fill="#615d59">陰性 940</text>
    <text x="70" y="144" text-anchor="middle" font-size="9" fill="#0b5a54">真陽性</text><text x="238" y="144" text-anchor="middle" font-size="9" fill="#b8461c">偽陽性</text>
    <text x="180" y="172" text-anchor="middle" font-size="11" font-weight="700" fill="#33302c">陽性は合計 59人。その内訳は？</text>
    <rect x="${barX}" y="${barY}" width="${tpW}" height="${barH}" fill="#0f766e" /><rect x="${barX + tpW}" y="${barY}" width="${barW - tpW}" height="${barH}" fill="#dd5b2a" /><rect x="${barX}" y="${barY}" width="${barW}" height="${barH}" fill="none" stroke="#8a857e" stroke-width="1" />
    <text x="${barX + tpW / 2}" y="${barY + 15}" text-anchor="middle" font-size="10" font-weight="700" fill="#ffffff">9</text><text x="${barX + tpW + (barW - tpW) / 2}" y="${barY + 15}" text-anchor="middle" font-size="10" font-weight="700" fill="#ffffff">偽陽性 50</text>
    <text x="180" y="252" text-anchor="middle" font-size="11.5" font-weight="700" fill="#0b5a54">PPV ＝ 9 / 59 ≈ 15%</text><text x="180" y="268" text-anchor="middle" font-size="9.5" fill="#615d59">陽性でも 85% は病気ではない</text>
  </svg>`;
}

const FIGURES: Record<string, string> = {
  'boxplot': `<figure class="g2-figure">${boxplotSvg()}<figcaption class="g2-fig-cap">箱ひげ図の読み方。箱の左端が Q₁、右端が Q₃ で、箱の長さが四分位範囲 IQR ＝ Q₃−Q₁（中央50%の散らばり）。箱の中の線が中央値。ひげは Q₁−1.5×IQR ／ Q₃+1.5×IQR のフェンス内にある最小値・最大値まで伸び、その外側の点（赤）が外れ値候補として識別される。</figcaption></figure>`,
  'skewshape': `<figure class="g2-figure">${skewshapeSvg()}<figcaption class="g2-fig-cap">正の歪度（右に長い裾）では、裾に引っ張られる平均が最も右へ動き、最頻値＜中央値＜平均の順に並ぶ。負の歪度ではこの並びが左右反転し、平均＜中央値＜最頻値になる。「歪度の符号＝平均が引っ張られる方向」と覚えると迷わない。</figcaption></figure>`,
  'lorenz': `<figure class="g2-figure">${lorenzSvg()}<figcaption class="g2-fig-cap">ローレンツ曲線は「累積人口比率（横）」に対する「累積所得比率（縦）」を描く。全員が同じ所得なら対角線（完全平等線）と一致し、格差があるほど曲線は下へ垂れ下がる。ジニ係数はこのすき間の面積 S の2倍（G ＝ 2S）で、0 に近いほど平等・1 に近いほど不平等を表す。</figcaption></figure>`,
  'correlation': `<figure class="g2-figure">${correlationSvg()}<figcaption class="g2-fig-cap">散布図と相関係数 r の対応。点が右上がりに揃うほど r は +1 に、右下がりに揃うほど −1 に近づく。散らばって傾向がなければ r ≈ 0。ただし右下の U 字のように、はっきりした関係があっても r が測るのは<strong>線形</strong>の傾きだけなので r ≈ 0 になる。r=0 は「線形関係がない」であって「無関係」ではない。</figcaption></figure>`,
  'vartransform': `<figure class="g2-figure">${vartransformSvg()}<figcaption class="g2-fig-cap">定数を足す（＋b）と分布は<strong>位置だけ</strong>動き、散らばり＝分散は変わらない（全員同じだけずらしても相対的な広がりは同じ）。一方 a 倍すると幅が a 倍に広がり、面積は一定なので低く平たくなる。散らばりは a 倍でも、<strong>分散は a² 倍</strong>（例：2倍で4倍）。だから V[aX+b] ＝ a²V[X]。</figcaption></figure>`,
  'twosample': `<figure class="g2-figure">${twosampleSvg()}<figcaption class="g2-fig-cap">2群のデータは分布が重なっているため、平均の差 x̄_B − x̄_A が見かけ上あっても「たまたま」かもしれない。2標本の検定は、この差が<strong>標本のばらつき（標準誤差）から予想される揺らぎより大きいか</strong>を調べ、母平均に本当に差があるか（μ_A ≠ μ_B）を判断する。重なりが大きく差が小さいほど、有意と言いにくくなる。</figcaption></figure>`,
  'sampling': `<figure class="g2-figure">${samplingSvg()}<figcaption class="g2-fig-cap"><strong>単純無作為抽出</strong>は母集団全体から等確率でばらばらに選ぶ。<strong>層化抽出</strong>は母集団を似た者どうしの層（例：年代）に分け、各層から選ぶことで偏りを抑える。<strong>クラスター抽出</strong>は母集団を集団（例：学校・地区）に分け、選ばれた集団を丸ごと調べる（コストは低いが精度は下がりやすい）。</figcaption></figure>`,
  'timeseries': `<figure class="g2-figure">${timeseriesSvgG2()}<figcaption class="g2-fig-cap">生データ（灰）は短期のノイズで上下にぎざぎざ揺れて、長期の傾向が見えにくい。各点を「前後数点の平均」に置きかえる移動平均（ティール）を取ると、ノイズが打ち消し合ってなめらかになり、右肩上がりのトレンドがはっきり見える。窓の幅を広げるほど平滑になるが、直近の変化への反応は遅くなる。</figcaption></figure>`,
  'scaleladder': `<figure class="g2-figure">${scaleladderSvg()}<figcaption class="g2-fig-cap">尺度は名義＜順序＜間隔＜比例の順に「できる計算」が増える階段。上位の尺度は下位の操作をすべて含む。名義は分類だけ、順序は大小、間隔はさらに差、比例は差に加えて比まで意味を持つ（「180cmは90cmの2倍」と言えるのは比例尺度だけ）。</figcaption></figure>`,
  'venn': `<figure class="g2-figure"><svg viewBox="0 0 320 172" role="img" aria-label="加法定理のベン図：A∪B は A と B を足して重なり A∩B を引く" class="g2-fig-svg">
    <circle cx="124" cy="84" r="62" fill="#0f766e" fill-opacity="0.16" stroke="#0f766e" stroke-width="1.8" /><circle cx="196" cy="84" r="62" fill="#dd5b2a" fill-opacity="0.14" stroke="#dd5b2a" stroke-width="1.8" />
    <text x="86" y="62" text-anchor="middle" font-size="17" font-weight="800" fill="#0b5a54">A</text><text x="234" y="62" text-anchor="middle" font-size="17" font-weight="800" fill="#b8461c">B</text>
    <text x="160" y="80" text-anchor="middle" font-size="11" font-weight="700" fill="#33302c">A∩B</text><text x="160" y="94" text-anchor="middle" font-size="8.5" fill="#615d59">（重なり）</text>
    <text x="160" y="162" text-anchor="middle" font-size="11" font-weight="700" fill="#33302c">P(A∪B) ＝ P(A) ＋ P(B) − P(A∩B)</text>
  </svg><figcaption class="g2-fig-cap">「A または B」（A∪B）の確率は、A と B をそのまま足すと重なり A∩B を<strong>二重に数えて</strong>しまう。だから重なりの分 P(A∩B) を1回引く——これが加法定理。A と B が排反（重なりなし＝A∩B が空）なら引く分がゼロなので、単純な足し算になる。</figcaption></figure>`,
  'binomial': `<figure class="g2-figure">${binomialSvg()}<figcaption class="g2-fig-cap">n＝10 回試して成功確率 p＝0.3 のときの「成功回数 k」の分布。棒の高さが各 k の起こりやすさ P(X＝k)。平均 np＝3 のあたりが最も高く、そこから離れるほど低くなる。左右非対称（p が 0.5 より小さいので右にやや裾を引く）なのが二項分布の特徴。</figcaption></figure>`,
  'zscore': `<figure class="g2-figure">${zscoreSvg()}<figcaption class="g2-fig-cap">平均も散らばりも違う数学（平均60・SD10）と英語（平均70・SD5）は、素点のままでは比べられない。各得点を z ＝ (得点 − 平均) ÷ SD に変換すると、どちらも「平均0・SD1」の共通の物差しに載る。数学80点は平均から2SD上（z=2）、英語75点は1SD上（z=1）なので、相対的には数学の方が上だとわかる。</figcaption></figure>`,
  'ppv': `<figure class="g2-figure">${ppvSvgG2()}<figcaption class="g2-fig-cap">感度・特異度が高くても、有病率が低いと陽性の大半が偽陽性になる（基本率の誤謬）。1000人のうち病気は10人で、その9割＝9人が陽性（真陽性）。一方で健康な990人の5%＝約50人も陽性になる（偽陽性）。陽性は合わせて59人だが、本当に病気なのは9人だけ。だから陽性適中率 PPV は 9/59 ≈ 15% にとどまる。確率でなく「実際の人数」で数えると直感がつかみやすい。</figcaption></figure>`,
};

function stripMarkdownSegment(text: string): string {
  return text
    .replace(/\[\[([a-z0-9-]+)\]\]/g, (_m, k) => FIGURES[k] || '')
    .replace(/\[([^\]\n]+)\]\([^)\n]+\)/g, '$1') // [ラベル](URL) → ラベルだけ残す
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/^[-*+]\s+/gm, '')
    .replace(/^\d+\.\s+/gm, '')
    .replace(/^\|.*\|$/gm, '')
    .replace(/^[-|:\s]+$/gm, '')
    .replace(/^---+$/gm, '')
    .replace(/[\u{1F300}-\u{1FFFF}]/gu, '')
    .replace(/[💡🎯⚠️✅❌🔴🟡🟢]/g, '');
}

// $...$/$$...$$は削除でなくrenderMathで実HTML化（2026-08-04・O-2-6再監査で発見・是正）。
function stripMarkdown(text: string): string {
  const tokens = text.split(/(\$\$[\s\S]+?\$\$|\$[^$\n]+\$)/g);
  const joined = tokens
    .map((t) => {
      if (t.startsWith('$$') && t.endsWith('$$') && t.length >= 4) return renderMath(t.slice(2, -2), true);
      if (t.startsWith('$') && t.endsWith('$') && t.length >= 2) return renderMath(t.slice(1, -1), false);
      return stripMarkdownSegment(t);
    })
    .join('');
  return joined.replace(/\n{3,}/g, '\n\n').trim();
}

console.log('--- Starting Static Site Generation (SSG) Pre-rendering ---');

if (!fs.existsSync(INDEX_HTML_PATH)) {
  console.error('Error: dist/index.html not found. Run "npm run build" first.');
  process.exit(1);
}

const templateHtml = fs.readFileSync(INDEX_HTML_PATH, 'utf-8');

// ── ルートindex.htmlに静的コンテンツを注入 ──────────
const moduleListHtml = modules.map(m =>
  `<li style="margin-bottom:12px"><a href="/stats-g2/${m.id}/" style="color:#2563eb;font-weight:600;text-decoration:none">${m.title}</a><br><span style="color:#555;font-size:0.9rem">${m.description}</span></li>`
).join('\n');

const rootStaticContent = `<div style="background:#eff6ff;border-bottom:1px solid #bfdbfe;padding:10px 16px;font-size:0.88rem;text-align:center;margin-bottom:16px;border-radius:6px;max-width:860px;margin-left:auto;margin-right:auto"><a href="https://study-apps.com/" style="color:#1e3a8a;text-decoration:none;font-weight:600">← study-apps.com 学習サイト集トップへ</a></div><article id="static-fallback" style="font-family:sans-serif;line-height:1.7;max-width:860px;margin:0 auto;padding:24px 16px">
  <h1 style="font-size:1.8rem;font-weight:700;border-bottom:2px solid #2563eb;padding-bottom:8px;margin-bottom:16px">統計検定 2級 学習リファレンス</h1>
  <p style="color:#444;margin-bottom:24px">確率・確率分布・推定・検定・回帰分析をインタラクティブな図と数式で解説する統計検定2級対策サイトです。大学教養レベルの統計学を、直感的な説明・グラフ・確認クイズで学べます。</p>
  <h2 style="font-size:1.3rem;font-weight:700;margin-bottom:12px">学習モジュール一覧</h2>
  <ul style="list-style:none;padding:0">
${moduleListHtml}
  </ul>
  <nav style="margin-top:32px;border-top:1px solid #ddd;padding-top:16px;display:flex;gap:16px;flex-wrap:wrap">
    <a href="/stats-g2/glossary/" style="color:#2563eb">用語集</a>
    <a href="/stats-g2/cheatsheet/" style="color:#2563eb">公式集</a>
    <a href="/stats-g2/guide/" style="color:#2563eb">試験ガイド</a>
    <a href="/stats-g2/usecase/" style="color:#2563eb">検定・分布の使い分けガイド</a>
    <a href="/stats-g2/about/" style="color:#2563eb">サイトについて</a>
    <a href="/stats-g2/privacy/" style="color:#2563eb;font-size:0.85rem">プライバシーポリシー</a>
  </nav>
  <p style="font-size:0.8rem;color:#888;margin-top:20px;border-top:1px solid #eee;padding-top:12px">※本サイトは個人による学習支援サイトであり、統計質保証推進協会・日本統計学会の公式サイトではありません。</p>
</article>`;

let rootIndexHtml = templateHtml.replace('<div id="root"></div>', `<div id="root">${rootStaticContent}</div>`);
const homeJsonLd = JSON.stringify({
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  'name': '統計検定 2級 学習リファレンス',
  'url': `${BASE_URL}/`,
  'description': '確率・確率分布・推定・検定・回帰分析をインタラクティブな図と数式で解説する統計検定2級対策サイト。',
  'inLanguage': 'ja'
});
rootIndexHtml = rootIndexHtml.replace('</head>', `<script type="application/ld+json">${homeJsonLd}</script>\n  </head>`);
fs.writeFileSync(INDEX_HTML_PATH, rootIndexHtml);

const subDirTemplateHtml = templateHtml
  .replace(/href="\.\/assets\//g, 'href="../assets/')
  .replace(/src="\.\/assets\//g, 'src="../assets/')
  .replace(/href="\.\/favicon.svg"/g, 'href="../favicon.svg"')
  .replace(/href="\.\/icons.svg"/g, 'href="../icons.svg"');

let generatedCount = 0;

for (const mod of modules) {
  const modDir = path.join(DIST_DIR, mod.id);
  if (!fs.existsSync(modDir)) {
    fs.mkdirSync(modDir, { recursive: true });
  }

  // 08-04・KaTeX SSR導入後はKaTeXのHTML出力が非常に冗長（1数式で数百字）なため、
  // 数式が多いモジュールでは旧来の8000字上限で本文後半が切り捨てられる実害が判明。
  // stats-pre1/stats-g3は同種の本文（mdToHtml）に上限を設けていない＝それに合わせて撤廃。
  const seoText = stripMarkdown(mod.content);
  const pageUrl = `${BASE_URL}/${mod.id}/`;
  const pageTitle = `${mod.title} | 統計検定 2級 学習リファレンス`;

  // クイズスニペット（最初の3問・静的HTMLにも本文として出す）
  const quizSnippet = mod.quiz.slice(0, 3).map((q, qi) => {
    const correctAnswer = q.options[q.correctAnswer];
    const qText = renderInlineMath(q.question).replace(/\*\*(.*?)\*\*/g, '$1');
    const aText = renderInlineMath(correctAnswer).replace(/\*\*(.*?)\*\*/g, '$1');
    return `<div style="margin-bottom:12px;padding:12px;background:#f8fafc;border-radius:6px;border-left:3px solid #2563eb">
  <p style="margin:0 0 6px;font-weight:600;color:#1e3a5f">Q${qi + 1}. ${qText}</p>
  <p style="margin:0;color:#444;font-size:0.92rem">A. ${aText}</p>
</div>`;
  }).join('\n');
  const quizSnippetHtml = `<section style="margin-top:28px">
  <h2 style="font-size:1.1rem;font-weight:700;margin-bottom:12px;color:#1e3a5f">確認クイズ（抜粋）</h2>
  ${quizSnippet}
  <p style="margin-top:12px;font-size:0.9rem;color:#555">全10問のクイズはサイトのインタラクティブ版でお試しください。</p>
</section>`;

  let modHtml = subDirTemplateHtml
    .replace('<title>統計検定 2級 学習リファレンス</title>', `<title>${pageTitle}</title>`)
    .replace('<meta name="description" content="統計検定2級の合格を目指す学習リファレンス。確率・確率分布・推定・検定・回帰分析をインタラクティブな図と数式で解説。" />', `<meta name="description" content="${mod.description}" />`)
    .replace('<meta property="og:title" content="統計検定 2級 学習リファレンス" />', `<meta property="og:title" content="${pageTitle}" />`)
    .replace('<meta property="og:description" content="確率・確率分布・推定・検定・回帰分析をインタラクティブな図と数式で解説する2級対策サイト。" />', `<meta property="og:description" content="${mod.description}" />`)
    .replace('<meta property="og:url" content="https://study-apps.com/stats-g2/" />', `<meta property="og:url" content="${pageUrl}" />`)
    .replace('<link rel="canonical" href="https://study-apps.com/stats-g2/" />', `<link rel="canonical" href="${pageUrl}" />`)
    .replace('<meta name="twitter:title" content="統計検定 2級 学習リファレンス" />', `<meta name="twitter:title" content="${pageTitle}" />`)
    .replace('<meta name="twitter:description" content="統計検定2級の合格を目指す学習リファレンス。確率・確率分布・推定・検定・回帰分析をインタラクティブな図と数式でわかりやすく解説。" />', `<meta name="twitter:description" content="${mod.description}" />`);

  const seoContentHtml = `<div style="background:#eff6ff;border-bottom:1px solid #bfdbfe;padding:10px 16px;font-size:0.88rem;text-align:center;margin-bottom:16px;border-radius:6px;max-width:860px;margin-left:auto;margin-right:auto"><a href="https://study-apps.com/" style="color:#1e3a8a;text-decoration:none;font-weight:600">← study-apps.com 学習サイト集トップへ</a></div><article id="static-fallback" style="font-family:sans-serif;line-height:1.7;max-width:860px;margin:0 auto;padding:24px 16px">
  <nav style="margin-bottom:16px"><a href="/stats-g2/" style="color:#2563eb;text-decoration:none">← 学習リファレンス ホーム</a></nav>
  <h1 style="font-size:1.6rem;font-weight:700;border-bottom:2px solid #2563eb;padding-bottom:8px;margin-bottom:12px">${mod.title}</h1>
  <p style="color:#555;margin-bottom:20px;font-size:1.05rem">${mod.description}</p>
  <div style="white-space:pre-line;color:#333">${seoText}</div>
  ${quizSnippetHtml}
  <nav style="margin-top:32px;border-top:1px solid #ddd;padding-top:16px">
    <a href="/stats-g2/" style="color:#2563eb;text-decoration:none">← ホームへ戻る</a>
  </nav>
  <p style="font-size:0.8rem;color:#888;margin-top:20px;border-top:1px solid #eee;padding-top:12px">※本サイトは個人による学習支援サイトであり、統計質保証推進協会・日本統計学会の公式サイトではありません。</p>
</article>`;

  modHtml = modHtml.replace('<div id="root"></div>', `<div id="root">${seoContentHtml}</div>`);
  // O-2-10（2026-08-05）：下層ページにBreadcrumbListが欠落していた（LearningResourceのみ）。
  // stats-pre1の実装パターンに合わせ、ホーム→章→モジュールの3階層を追加。
  const modJsonLd = JSON.stringify([
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      'itemListElement': [
        { '@type': 'ListItem', 'position': 1, 'name': 'ホーム', 'item': `${BASE_URL}/` },
        { '@type': 'ListItem', 'position': 2, 'name': chapterNames[mod.chapter] ?? `第${mod.chapter}章`, 'item': `${BASE_URL}/` },
        { '@type': 'ListItem', 'position': 3, 'name': mod.title, 'item': pageUrl }
      ]
    },
    {
      '@context': 'https://schema.org',
      '@type': 'LearningResource',
      'name': mod.title,
      'description': mod.description,
      'url': pageUrl,
      'inLanguage': 'ja',
      'learningResourceType': 'Article',
      'provider': { '@type': 'Organization', 'name': 'study-apps.com', 'url': 'https://study-apps.com' }
    }
  ]);
  modHtml = modHtml.replace('</head>', `<script type="application/ld+json">${modJsonLd}</script>\n  </head>`);

  fs.writeFileSync(path.join(modDir, 'index.html'), modHtml);
  generatedCount++;
}

const glossaryTermsHtml = Object.values(glossary).slice(0, 30).map((t: { term: string; level: string; explanation: string }) =>
  `<div style="margin-bottom:16px;padding-bottom:16px;border-bottom:1px solid #eee">
    <strong style="font-size:1rem;color:#1e3a5f">${t.term}</strong>
    <span style="display:inline-block;font-size:0.75rem;color:#fff;background:${t.level === '基礎' ? '#16a34a' : t.level === '中級' ? '#2563eb' : '#9333ea'};padding:1px 6px;border-radius:4px;margin-left:8px">${t.level}</span>
    <p style="margin:6px 0 0;color:#444;line-height:1.6">${t.explanation.replace(/\$[^$]+\$/g, '').replace(/\*\*(.*?)\*\*/g, '$1')}</p>
  </div>`
).join('\n');

const staticPageContents: Record<string, { title: string; description: string; bodyHtml: string }> = {
  glossary: {
    title: '用語集',
    description: '統計検定2級の頻出用語を一覧で解説。確率分布・推定・検定・回帰分析・多変量解析など試験に出る統計用語を網羅。',
    bodyHtml: `<div style="background:#eff6ff;border-bottom:1px solid #bfdbfe;padding:10px 16px;font-size:0.88rem;text-align:center;margin-bottom:16px;border-radius:6px;max-width:860px;margin-left:auto;margin-right:auto"><a href="https://study-apps.com/" style="color:#1e3a8a;text-decoration:none;font-weight:600">← study-apps.com 学習サイト集トップへ</a></div><article id="static-fallback" style="font-family:sans-serif;line-height:1.7;max-width:860px;margin:0 auto;padding:24px 16px">
  <nav style="margin-bottom:16px"><a href="/stats-g2/" style="color:#2563eb;text-decoration:none">← ホームへ戻る</a></nav>
  <h1 style="font-size:1.6rem;font-weight:700;border-bottom:2px solid #2563eb;padding-bottom:8px;margin-bottom:20px">用語集</h1>
  <p style="color:#555;margin-bottom:24px">統計検定2級の頻出用語を一覧で解説します。確率分布・推定・検定・回帰分析・多変量解析など試験に出る統計用語を網羅しています。</p>
${glossaryTermsHtml}
</article>`
  },
  cheatsheet: {
    title: '公式集',
    description: '統計検定2級の重要公式を一覧にまとめました。確率分布・推定・検定・回帰分析・相関の公式をすばやく確認できます。',
    bodyHtml: `<div style="background:#eff6ff;border-bottom:1px solid #bfdbfe;padding:10px 16px;font-size:0.88rem;text-align:center;margin-bottom:16px;border-radius:6px;max-width:860px;margin-left:auto;margin-right:auto"><a href="https://study-apps.com/" style="color:#1e3a8a;text-decoration:none;font-weight:600">← study-apps.com 学習サイト集トップへ</a></div><article id="static-fallback" style="font-family:sans-serif;line-height:1.7;max-width:860px;margin:0 auto;padding:24px 16px">
  <nav style="margin-bottom:16px"><a href="/stats-g2/" style="color:#2563eb;text-decoration:none">← ホームへ戻る</a></nav>
  <h1 style="font-size:1.6rem;font-weight:700;border-bottom:2px solid #2563eb;padding-bottom:8px;margin-bottom:20px">公式集</h1>
  <p style="color:#555;margin-bottom:24px">統計検定2級の重要公式を分野別にまとめています。</p>
  <h2 style="font-size:1.2rem;font-weight:700;margin:20px 0 8px">正規分布・標準化</h2>
  <p style="color:#444">正規分布N(μ,σ²)において、Z=(X−μ)/σで標準化すると標準正規分布N(0,1)に従います。</p>
  <h2 style="font-size:1.2rem;font-weight:700;margin:20px 0 8px">信頼区間（母平均）</h2>
  <p style="color:#444">母標準偏差既知の場合の95%信頼区間：標本平均 ± 1.96 × (σ/√n)。未知の場合はt分布を使用。</p>
  <h2 style="font-size:1.2rem;font-weight:700;margin:20px 0 8px">最尤推定法</h2>
  <p style="color:#444">尤度関数L(θ)を最大化するパラメータθを推定値とする手法。対数尤度の微分をゼロとおいて解を求めます。</p>
  <h2 style="font-size:1.2rem;font-weight:700;margin:20px 0 8px">回帰分析</h2>
  <p style="color:#444">最小二乗法でy = β0 + β1x + εの係数を推定。決定係数R²はモデルの当てはまりの良さを表します。</p>
  <h2 style="font-size:1.2rem;font-weight:700;margin:20px 0 8px">カイ二乗検定</h2>
  <p style="color:#444">観測度数と期待度数の差を検定する手法。独立性の検定・適合度検定に利用されます。</p>
  <p style="margin-top:24px"><a href="/stats-g2/" style="color:#2563eb">← ホームへ戻る</a></p>
</article>`
  },
  guide: {
    title: '試験ガイド',
    description: '統計検定2級の試験概要・出題範囲・学習の進め方を解説。合格基準・試験時間・推奨学習時間など受験に必要な情報をまとめました。',
    bodyHtml: `<div style="background:#eff6ff;border-bottom:1px solid #bfdbfe;padding:10px 16px;font-size:0.88rem;text-align:center;margin-bottom:16px;border-radius:6px;max-width:860px;margin-left:auto;margin-right:auto"><a href="https://study-apps.com/" style="color:#1e3a8a;text-decoration:none;font-weight:600">← study-apps.com 学習サイト集トップへ</a></div><article id="static-fallback" style="font-family:sans-serif;line-height:1.7;max-width:860px;margin:0 auto;padding:24px 16px">
  <nav style="margin-bottom:16px"><a href="/stats-g2/" style="color:#2563eb;text-decoration:none">← ホームへ戻る</a></nav>
  <h1 style="font-size:1.6rem;font-weight:700;border-bottom:2px solid #2563eb;padding-bottom:8px;margin-bottom:20px">試験ガイド</h1>
  <p style="color:#555;margin-bottom:24px">統計検定2級の試験概要・出題範囲・学習の進め方を解説します。</p>
  <h2 style="font-size:1.2rem;font-weight:700;margin:20px 0 8px">試験概要</h2>
  <p style="color:#444">統計検定2級は、大学教養レベルの統計学の知識と活用力を問う試験です。試験時間は90分、出題形式はマークシート（多肢選択式）です。</p>
  <h2 style="font-size:1.2rem;font-weight:700;margin:20px 0 8px">主な出題範囲</h2>
  <ul style="color:#444;padding-left:20px">
    <li>確率・確率分布（正規分布・二項分布・ポアソン分布）</li>
    <li>推定（点推定・区間推定・最尤推定）</li>
    <li>仮説検定（t検定・カイ二乗検定・F検定）</li>
    <li>回帰分析（単回帰・重回帰）</li>
    <li>分散分析（一元配置）</li>
    <li>多変量解析の基礎</li>
  </ul>
  <h2 style="font-size:1.2rem;font-weight:700;margin:20px 0 8px">合格基準</h2>
  <p style="color:#444">概ね正答率70%以上が合格の目安です（試験回によって調整あり）。</p>
  <h2 style="font-size:1.2rem;font-weight:700;margin:20px 0 8px">推奨学習時間</h2>
  <p style="color:#444">大学で統計の基礎を学んだ場合：50〜100時間程度。初学者の場合：150時間以上を目安に学習しましょう。</p>
  <p style="margin-top:24px;font-size:0.85rem;color:#888">※最新の試験情報は必ず公式サイトでご確認ください。</p>
  <p style="margin-top:16px"><a href="/stats-g2/" style="color:#2563eb">← ホームへ戻る</a></p>
</article>`
  },
  usecase: {
    title: '検定・分布の使い分けガイド',
    description: '統計検定2級の範囲で、どんなデータ・問いにどの確率分布／推定・検定／回帰・分散分析を使うかを状況から逆引きできる早見表。二項・正規分布、t検定・カイ二乗検定・ANOVA・回帰の選び方を整理。',
    bodyHtml: buildUsecaseHtml('/stats-g2')
  },
  about: {
    title: 'サイトについて',
    description: '統計検定2級 学習リファレンスについて。サイトの目的・コンテンツ構成・利用方法を説明します。',
    bodyHtml: `<div style="background:#eff6ff;border-bottom:1px solid #bfdbfe;padding:10px 16px;font-size:0.88rem;text-align:center;margin-bottom:16px;border-radius:6px;max-width:860px;margin-left:auto;margin-right:auto"><a href="https://study-apps.com/" style="color:#1e3a8a;text-decoration:none;font-weight:600">← study-apps.com 学習サイト集トップへ</a></div><article id="static-fallback" style="font-family:sans-serif;line-height:1.7;max-width:860px;margin:0 auto;padding:24px 16px">
  <nav style="margin-bottom:16px"><a href="/stats-g2/" style="color:#2563eb;text-decoration:none">← ホームへ戻る</a></nav>
  <h1 style="font-size:1.6rem;font-weight:700;border-bottom:2px solid #2563eb;padding-bottom:8px;margin-bottom:20px">サイトについて</h1>

  <section style="margin-bottom:28px">
    <h2 style="font-size:1.2rem;font-weight:700;margin-bottom:10px">このサイトについて</h2>
    <p style="color:#444">「統計検定 2級 学習リファレンス」は、統計検定2級の合格を目指す方のために作られた、個人運営の学習支援サイトです。大学教養レベルの統計学（確率分布・推定・検定・回帰分析・分散分析など）を、概念の直感的な説明・インタラクティブなグラフ・確認クイズの3つの柱で学べる構成にしています。</p>
    <p style="color:#444">本サイトの最大の特徴は「具体→抽象」の学習順序です。すべてのモジュールは日常の場面から出発し、直感的な理解を経て数式・定理へと進みます。「なぜその公式が成り立つのか」「どう使うのか」まで踏み込んだ解説を心がけています。</p>
    <p style="color:#888;font-size:0.9rem;border-left:3px solid #fbbf24;padding-left:12px;margin-top:12px">本サイトは個人による学習支援サイトであり、統計質保証推進協会および日本統計学会の公式サイトではありません。掲載内容は個人の見解に基づくものであり、公式の情報を保証するものではありません。</p>
  </section>

  <section style="margin-bottom:28px">
    <h2 style="font-size:1.2rem;font-weight:700;margin-bottom:10px">対象読者</h2>
    <p style="color:#444">高校数学の知識（数学I・A・II・Bの基本範囲）を前提に、大学初年度の統計学を体系的に学びたい方を主な対象としています。文系・理系を問わず、データ分析・心理学・経済学・看護学など実務で統計を使う方の入門にも適しています。</p>
  </section>

  <section style="margin-bottom:28px">
    <h2 style="font-size:1.2rem;font-weight:700;margin-bottom:10px">コンテンツ構成</h2>
    <ul style="color:#444;padding-left:20px;line-height:2">
      <li><strong>学習モジュール（全19モジュール・6章構成）</strong>：データの整理／確率／確率分布／推定／検定／回帰分析／分散分析／カイ二乗検定／時系列／公的統計・統計ソフト</li>
      <li><strong>用語集</strong>：2級頻出用語の解説（難易度別）</li>
      <li><strong>公式集</strong>：全分野の重要公式を一覧</li>
      <li><strong>試験ガイド</strong>：試験概要・出題範囲・学習の進め方</li>
      <li><strong>確認クイズ</strong>：各モジュール10問・全モジュール合計190問</li>
    </ul>
  </section>

  <section style="margin-bottom:28px">
    <h2 style="font-size:1.2rem;font-weight:700;margin-bottom:10px">編集・制作方針</h2>
    <p style="color:#444">本サイトのコンテンツは、統計検定の公式の出題範囲や一般に流通している統計学の教科書・参考書を参照しつつ、運営者が内容を一から再構成し、初学者がつまずきやすい点を補う形で独自に解説しています。他サイトの文章をそのまま転載することはありません。図解・確認クイズはすべて本サイト向けに独自に制作したものです。内容の誤りや古くなった情報に気づいた場合は、お問い合わせを受けて随時見直し・修正します。</p>
  </section>

  <section style="margin-bottom:28px">
    <h2 style="font-size:1.2rem;font-weight:700;margin-bottom:10px">運営者について</h2>
    <p style="color:#444">本サイトは、統計学の学習を個人的に進める中で、同じように学んでいる方の助けになればと思い作成・公開しています。広告収入（Google AdSense）はサイトの維持運営費用に充てています。</p>
  </section>

  <section style="margin-bottom:28px">
    <h2 style="font-size:1.2rem;font-weight:700;margin-bottom:10px">お問い合わせ</h2>
    <p style="color:#444">内容の誤り・ご意見・ご要望は<a href="https://forms.gle/ccMv7oKwz6ysDHBe6" target="_blank" rel="noopener noreferrer" style="color:#2563eb">こちらのGoogleフォーム</a>からお願いします。統計的な誤り・誤字脱字のご指摘も歓迎しています。</p>
  </section>

  <section>
    <h2 style="font-size:1.2rem;font-weight:700;margin-bottom:10px">免責事項</h2>
    <p style="color:#444">本サイトの解説・問題・公式は学習目的で作成されており、内容の正確性・完全性を保証するものではありません。本サイトの情報を利用したことによるいかなる損害についても、運営者は責任を負いかねます。また、本サイトは統計検定への合格を保証するものではありません。試験の最新情報・申込方法・合否については、必ず公式サイトをご確認ください。</p>
  </section>

  <p style="margin-top:32px"><a href="/stats-g2/" style="color:#2563eb">← ホームへ戻る</a></p>
</article>`
  },
  privacy: {
    title: 'プライバシーポリシー',
    description: '統計検定2級 学習リファレンスのプライバシーポリシー。個人情報の取り扱いについて説明します。',
    bodyHtml: `<div style="background:#eff6ff;border-bottom:1px solid #bfdbfe;padding:10px 16px;font-size:0.88rem;text-align:center;margin-bottom:16px;border-radius:6px;max-width:860px;margin-left:auto;margin-right:auto"><a href="https://study-apps.com/" style="color:#1e3a8a;text-decoration:none;font-weight:600">← study-apps.com 学習サイト集トップへ</a></div><article id="static-fallback" style="font-family:sans-serif;line-height:1.7;max-width:860px;margin:0 auto;padding:24px 16px">
  <nav style="margin-bottom:16px"><a href="/stats-g2/" style="color:#2563eb;text-decoration:none">← ホームへ戻る</a></nav>
  <h1 style="font-size:1.6rem;font-weight:700;border-bottom:2px solid #2563eb;padding-bottom:8px;margin-bottom:8px">プライバシーポリシー</h1>
  <p style="color:#888;font-size:0.9rem;margin-bottom:24px">最終更新：2025年4月</p>
  <section style="margin-bottom:20px">
    <h2 style="font-size:1.15rem;font-weight:700;margin-bottom:8px">1. サイトについて</h2>
    <p style="color:#444">本サイトは、統計検定2級の学習を支援することを目的とした個人運営のサイトです。</p>
  </section>
  <section style="margin-bottom:20px">
    <h2 style="font-size:1.15rem;font-weight:700;margin-bottom:8px">2. Google Analytics の利用</h2>
    <p style="color:#444">アクセス分析のためにGoogle Analyticsを使用しています。閲覧ページ・滞在時間・デバイス情報などがCookieを通じてGoogleに送信されます。個人を特定する情報は収集しません。</p>
  </section>
  <section style="margin-bottom:20px">
    <h2 style="font-size:1.15rem;font-weight:700;margin-bottom:8px">3. Google AdSense の利用</h2>
    <p style="color:#444">広告配信のためにGoogle AdSenseを使用しています。<a href="https://www.google.com/settings/ads" style="color:#2563eb">広告設定ページ</a>でパーソナライズ広告を無効にできます。</p>
  </section>
  <section style="margin-bottom:20px">
    <h2 style="font-size:1.15rem;font-weight:700;margin-bottom:8px">4. 学習進捗データ</h2>
    <p style="color:#444">クイズの得点・完了状況はブラウザのローカルストレージにのみ保存され、外部サーバーへの送信はありません。</p>
  </section>
  <section>
    <h2 style="font-size:1.15rem;font-weight:700;margin-bottom:8px">5. 免責事項</h2>
    <p style="color:#444">本サイトの解説・問題・公式は学習目的で作成されており、内容の正確性を保証するものではありません。</p>
  </section>
  <p style="margin-top:32px"><a href="/stats-g2/" style="color:#2563eb">← ホームへ戻る</a></p>
</article>`
  }
};

for (const [page, config] of Object.entries(staticPageContents)) {
  const pageDir = path.join(DIST_DIR, page);
  if (!fs.existsSync(pageDir)) {
    fs.mkdirSync(pageDir, { recursive: true });
  }

  const pageUrl = `${BASE_URL}/${page}/`;
  const pageTitle = `${config.title} | 統計検定 2級 学習リファレンス`;

  let pageHtml = subDirTemplateHtml
    .replace('<title>統計検定 2級 学習リファレンス</title>', `<title>${pageTitle}</title>`)
    .replace('<meta name="description" content="統計検定2級の合格を目指す学習リファレンス。確率・確率分布・推定・検定・回帰分析をインタラクティブな図と数式で解説。" />', `<meta name="description" content="${config.description}" />`)
    .replace('<meta property="og:title" content="統計検定 2級 学習リファレンス" />', `<meta property="og:title" content="${pageTitle}" />`)
    .replace('<meta property="og:description" content="確率・確率分布・推定・検定・回帰分析をインタラクティブな図と数式で解説する2級対策サイト。" />', `<meta property="og:description" content="${config.description}" />`)
    .replace('<meta property="og:url" content="https://study-apps.com/stats-g2/" />', `<meta property="og:url" content="${pageUrl}" />`)
    .replace('<link rel="canonical" href="https://study-apps.com/stats-g2/" />', `<link rel="canonical" href="${pageUrl}" />`)
    .replace('<meta name="twitter:title" content="統計検定 2級 学習リファレンス" />', `<meta name="twitter:title" content="${pageTitle}" />`)
    .replace('<meta name="twitter:description" content="統計検定2級の合格を目指す学習リファレンス。確率・確率分布・推定・検定・回帰分析をインタラクティブな図と数式でわかりやすく解説。" />', `<meta name="twitter:description" content="${config.description}" />`);

  pageHtml = pageHtml.replace('<div id="root"></div>', `<div id="root">${config.bodyHtml}</div>`);

  const pageJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: config.title,
    description: config.description,
    url: pageUrl,
    inLanguage: 'ja',
    isPartOf: { '@type': 'WebSite', name: '統計検定 2級 学習リファレンス', url: `${BASE_URL}/` },
  };
  pageHtml = pageHtml.replace('</head>', `<script type="application/ld+json">${JSON.stringify(pageJsonLd)}</script>\n  </head>`);

  fs.writeFileSync(path.join(pageDir, 'index.html'), pageHtml);
  generatedCount++;
}

// ── sitemap.xml ──────────────────────────────────
const today = new Date().toISOString().split('T')[0];

const moduleUrls = modules.map(m =>
  `  <url>\n    <loc>${BASE_URL}/${m.id}/</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.8</priority>\n  </url>`
).join('\n');

const staticUrls = ['glossary', 'cheatsheet', 'guide', 'usecase', 'about', 'privacy'].map(p =>
  `  <url>\n    <loc>${BASE_URL}/${p}/</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.6</priority>\n  </url>`
).join('\n');

const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${BASE_URL}/</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
${moduleUrls}
${staticUrls}
</urlset>`;

fs.writeFileSync(path.join(DIST_DIR, 'sitemap.xml'), sitemapXml);

// ── Legacy URL redirects (renamed modules) ────────
const legacyRedirects: { oldId: string; newId: string }[] = [
  { oldId: '4.4-proportion', newId: '4.4-two-sample' },
  { oldId: '4.3-two-sample', newId: '4.4-two-sample' },
];
for (const { oldId, newId } of legacyRedirects) {
  const legacyDir = path.join(DIST_DIR, oldId);
  if (!fs.existsSync(legacyDir)) fs.mkdirSync(legacyDir, { recursive: true });
  const newUrl = `${BASE_URL}/${newId}/`;
  fs.writeFileSync(path.join(legacyDir, 'index.html'), `<!doctype html>
<html lang="ja"><head>
<meta charset="UTF-8" />
<meta name="robots" content="noindex, follow" />
<link rel="canonical" href="${newUrl}" />
<meta http-equiv="refresh" content="0;url=${newUrl}" />
<title>ページが移動しました | 統計検定 2級 学習リファレンス</title>
<script>window.location.replace('${newUrl}');</script>
</head><body><p><a href="${newUrl}">こちらのページへ移動しました</a></p></body></html>`);
}

// ── Update deployed-ids.json ────────────────────────
// Records which module IDs are now live. The validator uses this to
// catch accidental removals before the next deploy.
const deployedIdsPath = path.join(process.cwd(), 'scripts', 'deployed-ids.json');
const deployedIdsData = {
  lastDeployedAt: new Date().toISOString().split('T')[0],
  ids: modules.map(m => m.id),
};
fs.writeFileSync(deployedIdsPath, JSON.stringify(deployedIdsData, null, 2) + '\n');

console.log(`✅ Generated ${generatedCount} static HTML files successfully!`);
console.log(`✅ Generated sitemap.xml with ${modules.length + 6} URLs.`);

// ── OGP Image Generation ─────────────────────────
const ogpSvg = `<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
  <rect width="1200" height="630" fill="#f8fafc"/>
  <rect width="1200" height="12" fill="#0075de"/>
  <rect x="0" y="0" width="360" height="630" fill="#0075de" fill-opacity="0.05"/>
  <rect x="80" y="230" width="8" height="160" rx="4" fill="#0075de"/>
  <text x="112" y="300" font-family="Yu Gothic UI,Yu Gothic,Meiryo,Hiragino Sans,sans-serif" font-size="52" font-weight="700" fill="#0f172a">統計検定 2級</text>
  <text x="112" y="368" font-family="Yu Gothic UI,Yu Gothic,Meiryo,Hiragino Sans,sans-serif" font-size="52" font-weight="700" fill="#0f172a">学習リファレンス</text>
  <text x="112" y="430" font-family="Yu Gothic UI,Yu Gothic,Meiryo,Hiragino Sans,sans-serif" font-size="26" fill="#64748b">確率・確率分布・推定・検定・回帰分析</text>
  <text x="1120" y="600" text-anchor="end" font-family="Arial,Helvetica,sans-serif" font-size="22" fill="#94a3b8">study-apps.com</text>
</svg>`;

const ogpBuffer = await sharp(Buffer.from(ogpSvg)).png().toBuffer();
fs.writeFileSync(path.join(DIST_DIR, 'ogp.png'), ogpBuffer);
console.log('✅ Generated ogp.png');
