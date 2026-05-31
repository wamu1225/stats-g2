import * as fs from 'fs';
import * as path from 'path';
import sharp from 'sharp';
import { modules } from '../src/data/modules';
import { glossary } from '../src/data/glossary';

const DIST_DIR = path.resolve(process.cwd(), 'dist');
const INDEX_HTML_PATH = path.join(DIST_DIR, 'index.html');
const BASE_URL = 'https://study-apps.com/stats-g2';

function stripMarkdown(text: string): string {
  return text
    .replace(/\[\[.*?\]\]/g, '')
    .replace(/\$\$[\s\S]*?\$\$/g, '')
    .replace(/\$[^$]+\$/g, '')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/^[-*+]\s+/gm, '')
    .replace(/^\d+\.\s+/gm, '')
    .replace(/^\|.*\|$/gm, '')
    .replace(/^[-|:\s]+$/gm, '')
    .replace(/^---+$/gm, '')
    .replace(/[\u{1F300}-\u{1FFFF}]/gu, '')
    .replace(/[💡🎯⚠️✅❌🔴🟡🟢]/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
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

  const seoText = stripMarkdown(mod.content).slice(0, 2000);
  const pageUrl = `${BASE_URL}/${mod.id}/`;
  const pageTitle = `${mod.title} | 統計検定 2級 学習リファレンス`;

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
  <nav style="margin-top:32px;border-top:1px solid #ddd;padding-top:16px">
    <a href="/stats-g2/" style="color:#2563eb;text-decoration:none">← ホームへ戻る</a>
  </nav>
  <p style="font-size:0.8rem;color:#888;margin-top:20px;border-top:1px solid #eee;padding-top:12px">※本サイトは個人による学習支援サイトであり、統計質保証推進協会・日本統計学会の公式サイトではありません。</p>
</article>`;

  modHtml = modHtml.replace('<div id="root"></div>', `<div id="root">${seoContentHtml}</div>`);
  const modJsonLd = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'LearningResource',
    'name': mod.title,
    'description': mod.description,
    'url': pageUrl,
    'inLanguage': 'ja',
    'learningResourceType': 'Article',
    'provider': { '@type': 'Organization', 'name': 'study-apps.com', 'url': 'https://study-apps.com' }
  });
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

  fs.writeFileSync(path.join(pageDir, 'index.html'), pageHtml);
  generatedCount++;
}

// ── sitemap.xml ──────────────────────────────────
const today = new Date().toISOString().split('T')[0];

const moduleUrls = modules.map(m =>
  `  <url>\n    <loc>${BASE_URL}/${m.id}/</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.8</priority>\n  </url>`
).join('\n');

const staticUrls = ['glossary', 'cheatsheet', 'guide', 'about', 'privacy'].map(p =>
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
