// src/components/ExamGuide.tsx
import React from 'react';
import { CheckCircle2, Target, Lightbulb } from 'lucide-react';

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="card" style={{ marginBottom: '1.5rem' }}>
    <h3 style={{ margin: '0 0 1rem', fontSize: '1rem', color: 'var(--primary)', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem' }}>{title}</h3>
    {children}
  </div>
);

const Row: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', padding: '0.4rem 0', borderBottom: '1px solid #f1f5f9', gap: '1rem' }}>
    <span style={{ fontSize: '0.85rem', color: '#64748b', flexShrink: 0 }}>{label}</span>
    <span style={{ fontSize: '0.85rem', fontWeight: 600, textAlign: 'right' }}>{value}</span>
  </div>
);

const PhaseCard: React.FC<{ phase: string; title: string; period: string; body: string }> = ({ phase, title, period, body }) => (
  <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
    <div style={{ flexShrink: 0, width: 36, height: 36, borderRadius: '50%', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700 }}>{phase}</div>
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
        <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{title}</div>
        <span style={{ fontSize: '0.68rem', background: '#ecfdf5', color: 'var(--primary)', padding: '1px 6px', borderRadius: 6, fontWeight: 700 }}>{period}</span>
      </div>
      <div style={{ fontSize: '0.82rem', color: '#475569', lineHeight: 1.6 }}>{body}</div>
    </div>
  </div>
);

const BookItem: React.FC<{ title: string; stars: number; tag: string; desc: string }> = ({ title, stars, tag, desc }) => (
  <div style={{ padding: '0.6rem 0', borderBottom: '1px solid #f1f5f9' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
      <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>{title}</span>
      <span className="stat-badge" style={{ background: stars === 5 ? '#ef4444' : stars === 4 ? '#3b82f6' : '#6b7280', color: 'white', fontSize: '0.65rem' }}>{tag}</span>
    </div>
    <div style={{ fontSize: '0.78rem', color: '#64748b' }}>{'★'.repeat(stars) + '☆'.repeat(5 - stars)}　{desc}</div>
  </div>
);

const ResourceItem: React.FC<{ name: string; type: string; desc: string }> = ({ name, type, desc }) => (
  <div style={{ display: 'flex', gap: '0.75rem', padding: '0.5rem 0', borderBottom: '1px solid #f1f5f9', alignItems: 'flex-start' }}>
    <span className="stat-badge" style={{ flexShrink: 0, fontSize: '0.65rem', background: '#f1f5f9', color: '#475569' }}>{type}</span>
    <div>
      <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{name}</div>
      <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '0.15rem' }}>{desc}</div>
    </div>
  </div>
);

const FieldItem: React.FC<{ priority: '最重要' | '重要' | '標準'; title: string; detail: string }> = ({ priority, title, detail }) => {
  const color = priority === '最重要' ? '#ef4444' : priority === '重要' ? '#f59e0b' : '#3b82f6';
  return (
    <div style={{ display: 'flex', gap: '0.75rem', padding: '0.5rem 0', borderBottom: '1px solid #f1f5f9', alignItems: 'flex-start' }}>
      <span className="stat-badge" style={{ flexShrink: 0, fontSize: '0.65rem', background: color, color: 'white' }}>{priority}</span>
      <div>
        <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{title}</div>
        <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '0.15rem' }}>{detail}</div>
      </div>
    </div>
  );
};

export const ExamGuide: React.FC = () => (
  <div>
    <div style={{ marginBottom: '1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
        <Target size={20} color="var(--primary)" />
        <h2 style={{ margin: 0, fontSize: '1.1rem' }}>試験ガイド</h2>
      </div>
      <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>
        統計検定2級の試験概要・学習戦略・推奨リソースをまとめています。
      </p>
    </div>

    {/* 試験の概要 */}
    <Section title="試験の概要">
      <Row label="実施方式" value="CBT（Computer Based Testing）— 全国のテストセンターで通年受験可" />
      <Row label="出題形式" value="4〜5肢選択 ＋ 数値入力（半角数字のみ）" />
      <Row label="問題数 / 試験時間" value="約35問 / 90分（1問あたり約2.5分）" />
      <Row label="合格基準" value="100点満点中 60点以上" />
      <Row label="合格率の目安" value="30〜60%台で変動（年度・難易度により差あり）" />
      <Row label="受験料" value="一般 7,000円 / 学割 5,000円（税込）" />
      <Row label="電卓" value="持ち込み可（四則演算・ルート・メモリ機能のある一般電卓）" />
      <Row label="再受験" value="前回受験終了から最短1週間後に可" />
      <div style={{ marginTop: '0.75rem', padding: '0.6rem 0.8rem', background: '#f0fdf4', borderRadius: 8, fontSize: '0.8rem', color: '#166534' }}>
        <Lightbulb size={13} style={{ marginRight: 4, verticalAlign: 'middle' }} />
        2級は「統計的な考え方を使いこなせる」レベルを問う試験。公式・計算手順を丸暗記するより、<strong>なぜその式が成り立つのかを理解</strong>することが合格への近道です。
      </div>
      <div style={{ marginTop: '0.6rem', fontSize: '0.75rem', color: '#94a3b8' }}>
        ※ 受験料・試験形式は変更される場合があります。最新情報は<a href="https://www.toukei-kentei.jp/" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)' }}>統計検定公式サイト</a>でご確認ください。
      </div>
    </Section>

    {/* 学習時間の目安 */}
    <Section title="必要な学習時間の目安">
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.75rem' }}>
        {[
          { bg: '#fef2f2', border: '#fecaca', label: '統計学が初めて（文系）', time: '80〜150時間', period: '2〜5ヶ月', note: '高校数学の基礎から出発。シグマ記号・確率の復習も含む' },
          { bg: '#f0fdf4', border: '#bbf7d0', label: '数学・理系の素養あり', time: '30〜60時間', period: '2週間〜1ヶ月', note: '微積分・確率の基礎があれば統計特有の理論習得に集中できる' },
        ].map(c => (
          <div key={c.label} style={{ background: c.bg, border: `1px solid ${c.border}`, borderRadius: 10, padding: '0.75rem' }}>
            <div style={{ fontSize: '0.72rem', color: '#64748b', marginBottom: '0.25rem' }}>{c.note}</div>
            <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '0.1rem' }}>{c.label}</div>
            <div style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--primary)' }}>{c.time}</div>
            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{c.period}</div>
          </div>
        ))}
      </div>
      <div style={{ marginTop: '0.75rem', fontSize: '0.78rem', color: '#64748b' }}>
        ※ 2級は大学教養レベルの統計学が試験範囲。高校数学（数ⅡB）の確率・統計・微分の基礎を固めてから取り組むとスムーズです。
      </div>
    </Section>

    {/* 4段階学習フェーズ */}
    <Section title="4段階の学習フェーズ">
      <PhaseCard
        phase="1"
        title="概念の浸透フェーズ"
        period="1〜2週目"
        body="入門書や動画で「標準偏差・正規分布・仮説検定が何の役に立つのか」というイメージを形成する。この段階では厳密な証明は後回しにし、全体の流れを掴むことに注力。"
      />
      <PhaseCard
        phase="2"
        title="理論の体系化フェーズ"
        period="3〜5週目"
        body="「統計WEB」などで2級の全範囲を精読する。特に「標本分布」と「推定・検定」は2級の核心。数式を理解しながら読み進め、重要公式をノートに整理する。"
      />
      <PhaseCard
        phase="3"
        title="過去問演習・弱点抽出フェーズ"
        period="6〜8週目"
        body="公式問題集を時間を計って解く。間違えた問題は「なぜその公式を使うのか・なぜ他の選択肢は誤りなのか」を説明できるまで復習する。"
      />
      <PhaseCard
        phase="4"
        title="CBT特化対策・総仕上げフェーズ"
        period="直前2週間"
        body="数値入力問題の端数処理（小数第〇位まで）や電卓のメモリ機能の操作を練習。チートシートで公式を最終確認し、CBTの画面操作（見直しフラグ機能など）に慣れる。"
      />
    </Section>

    {/* 推奨書籍 */}
    <Section title="推奨書籍">
      <BookItem title="統計学入門（東京大学出版会）" stars={5} tag="必須" desc="通称「赤本」。2級の試験範囲をほぼ網羅。丁寧な導出で理解が深まる定番テキスト。辞書的に使うのも◎。" />
      <BookItem title="統計検定2級 公式問題集（CBT対応版）" stars={5} tag="必須" desc="過去問を解いて出題パターンを把握。直近3〜5年分を3周が目安。解説が簡素な問題はテキストで補完。" />
      <BookItem title="完全独習 統計学入門" stars={4} tag="入門" desc="統計学の直感的理解に優れた入門書。数学への抵抗感がある初学者が赤本に入る前の足がかりに最適。" />
      <BookItem title="マンガでわかる統計学" stars={4} tag="入門" desc="概念の視覚的理解に最適。図解中心で確率・検定の全体像を素早く掴みたいときに有効。" />
      <BookItem title="統計学が最強の学問である" stars={3} tag="参考" desc="統計学の全体像・活用事例を知るための読み物。モチベーション維持や背景知識の補強に。" />
    </Section>

    {/* オンラインリソース */}
    <Section title="おすすめ無料リソース">
      <ResourceItem name="統計WEB（BC Learning）" type="ウェブ" desc="2級の全範囲を無料で解説。Step1（基礎編）は必読。図解が豊富でわかりやすく、受験生の定番サイト。" />
      <ResourceItem name="とけたろうチャンネル" type="YouTube" desc="統計検定2級に特化した解説動画。計算手順を丁寧に説明しており、紙と電卓を手元に置いて一緒に解くのが効果的。" />
      <ResourceItem name="予備校のノリで学ぶ「大学の数学・物理」（ヨビノリ）" type="YouTube" desc="推定・検定の直感的理解に最適な大学数学解説チャンネル。数式の意味を丁寧に教えてくれる。" />
      <ResourceItem name="高校数学の美しい物語" type="ウェブ" desc="確率・数列・微分など数学の基礎をわかりやすく解説。2級前の数学復習に役立つ。" />
      <ResourceItem name="生成AI（ChatGPT / Claude）" type="AI" desc="わからない数式・概念をその場でステップバイステップで解説してもらえる。24時間使える個別指導として活用。" />
    </Section>

    {/* 重要出題分野 */}
    <Section title="重要出題分野">
      <FieldItem priority="最重要" title="正規分布・標準化・信頼区間" detail="z変換・t分布・信頼区間の計算が頻出。標準正規分布表の読み方も必須。配点が高い山場。" />
      <FieldItem priority="最重要" title="仮説検定" detail="t検定・カイ二乗検定の手順。p値・有意水準・第1種/第2種の誤りの意味。2択に絞れる問題も多い。" />
      <FieldItem priority="重要" title="確率分布" detail="二項分布・ポアソン分布・正規分布・t分布・カイ二乗分布・F分布の期待値・分散・形状の特徴。" />
      <FieldItem priority="重要" title="回帰分析・分散分析" detail="最小二乗法・決定係数・回帰係数の解釈。F値の構成（郡内変動・郡間変動への分解）も出題される。" />
      <FieldItem priority="重要" title="記述統計" detail="平均・分散・標準偏差・四分位数・相関係数の計算と解釈。歪度・尖度・ジニ係数も出題範囲。" />
      <FieldItem priority="標準" title="確率の基礎・ベイズの定理" detail="加法定理・乗法定理・条件付き確率。ベイズの定理は感度・特異度の計算問題として出題されることが多い。" />
    </Section>

    {/* 実践的アドバイス */}
    <Section title="本番に向けた実践アドバイス">
      {[
        { icon: '⏱', title: '1問あたり2.5分を意識する', body: '90分・約35問で1問平均2.5分。確実に解ける問題から先に解き、計算に詰まったら見直しフラグを付けて次へ進む。' },
        { icon: '🔢', title: '電卓のメモリ機能を練習する', body: 'M+でメモリ加算、M-でメモリ減算、MRで呼び出し。分散や標準偏差の計算で各項を計算してメモリに足していくと大幅な時間節約になる。' },
        { icon: '📊', title: '正規分布表の読み方を練習する', body: 'z = 1.96 で95%、z = 2.58 で99%など基本値は暗記。CBTでは別ウィンドウで表が開くため、画面上での視線移動に慣れておく。' },
        { icon: '💻', title: '数値入力の注意点', body: '数値入力問題は半角数字のみ有効。カンマ（,）を入力すると不正解となる場合があるため要注意。小数点と負符号も半角で入力する。' },
      ].map(a => (
        <div key={a.title} style={{ display: 'flex', gap: '0.75rem', padding: '0.5rem 0', borderBottom: '1px solid #f1f5f9' }}>
          <span style={{ fontSize: '1.1rem', flexShrink: 0 }}>{a.icon}</span>
          <div>
            <div style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.15rem' }}>{a.title}</div>
            <div style={{ fontSize: '0.78rem', color: '#475569', lineHeight: 1.6 }}>{a.body}</div>
          </div>
        </div>
      ))}
      <div style={{ marginTop: '0.75rem', padding: '0.6rem 0.8rem', background: '#f0fdf4', borderRadius: 8, fontSize: '0.8rem', color: '#166534', display: 'flex', gap: '0.5rem' }}>
        <CheckCircle2 size={14} style={{ flexShrink: 0, marginTop: 2 }} />
        <span>このサイトの学習リファレンスは、2級の試験範囲に沿って構成されています。各モジュールの理解度チェックで定着を確認しながら進めましょう。</span>
      </div>
    </Section>
  </div>
);
