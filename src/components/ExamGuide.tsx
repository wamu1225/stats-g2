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

const PhaseCard: React.FC<{ phase: string; title: string; body: string }> = ({ phase, title, body }) => (
  <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
    <div style={{ flexShrink: 0, width: 36, height: 36, borderRadius: '50%', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700 }}>{phase}</div>
    <div>
      <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '0.25rem' }}>{title}</div>
      <div style={{ fontSize: '0.82rem', color: '#475569', lineHeight: 1.6 }}>{body}</div>
    </div>
  </div>
);

const BookItem: React.FC<{ title: string; stars: number; tag: string; desc: string }> = ({ title, stars, tag, desc }) => (
  <div style={{ padding: '0.6rem 0', borderBottom: '1px solid #f1f5f9' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
      <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>{title}</span>
      <span className="stat-badge" style={{ background: stars === 5 ? '#ef4444' : '#3b82f6', color: 'white', fontSize: '0.65rem' }}>{tag}</span>
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
      <Row label="実施方式" value="CBT（Computer Based Testing）— 通年受験可" />
      <Row label="出題形式" value="5肢選択 ＋ 数値入力" />
      <Row label="問題数 / 試験時間" value="35問 / 90分（1問あたり約2.5分）" />
      <Row label="合格基準" value="100点満点中 60点以上" />
      <Row label="受験料" value="一般 7,000円 / 学割 5,000円（税込）" />
      <Row label="電卓" value="持ち込み可（四則演算・ルート・メモリのみ）" />
      <Row label="再受験" value="前回受験終了から7日以上経過後に可" />
      <div style={{ marginTop: '0.75rem', padding: '0.6rem 0.8rem', background: '#fef9c3', borderRadius: 8, fontSize: '0.8rem', color: '#92400e' }}>
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
          { bg: '#fef2f2', border: '#fecaca', label: '統計学が初めて', time: '100〜200時間', period: '3〜6ヶ月', note: '高校数学の知識から出発' },
          { bg: '#eff6ff', border: '#bfdbfe', label: '高校数学が得意', time: '50〜100時間', period: '1〜3ヶ月', note: '数学ⅡBの確率・統計を学習済み' },
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

    {/* 3段階学習フェーズ */}
    <Section title="3段階の学習フェーズ">
      <PhaseCard
        phase="1"
        title="インプット・概観フェーズ"
        body="教科書を一通り読み、データの記述・確率・推測・回帰の全体像を把握する。数式の細部より「なぜこの手法を使うのか」という目的を先に理解することが重要。"
      />
      <PhaseCard
        phase="2"
        title="問題演習・定着フェーズ"
        body="過去問や章末問題を繰り返し解く。計算ミスのパターンを記録し、特に正規分布の標準化・信頼区間・t検定の手順を反射的に解けるようにする。"
      />
      <PhaseCard
        phase="3"
        title="仕上げ・弱点補強フェーズ"
        body="模擬試験形式で時間を計って解く。間違えた問題の「なぜ間違えたか」を言語化し、本番前2週間で集中的に補強する。"
      />
    </Section>

    {/* 推奨書籍 */}
    <Section title="推奨書籍">
      <BookItem title="統計学入門（東京大学出版会）" stars={5} tag="必須" desc="通称「赤本」。2級の試験範囲をほぼ網羅。丁寧な導出で理解が深まる定番テキスト。" />
      <BookItem title="統計検定2級 公式問題集" stars={5} tag="必須" desc="過去問を解いて出題パターンを把握。解説が簡素な問題はテキストで補完。" />
      <BookItem title="マンガでわかる統計学" stars={4} tag="入門" desc="初学者向け。概念の直感的理解に最適。テキストの前に読むと効果的。" />
      <BookItem title="統計学が最強の学問である" stars={3} tag="参考" desc="統計学の全体像・活用事例を知るための読み物。モチベーション維持に。" />
    </Section>

    {/* オンラインリソース */}
    <Section title="おすすめ無料リソース">
      <ResourceItem name="統計WEB（BC Learning）" type="ウェブ" desc="2級の全範囲を無料で解説。図解が豊富でわかりやすく、受験生の定番サイト。" />
      <ResourceItem name="高校数学の美しい物語" type="ウェブ" desc="確率・数列・微分など数学の基礎をわかりやすく解説。2級前の数学復習に。" />
      <ResourceItem name="とある男が授業をしてみた" type="YouTube" desc="高校数学の確率・統計分野を無料で学べる授業動画。初学者の数学補強に。" />
      <ResourceItem name="生成AI（ChatGPT / Claude）" type="AI" desc="わからない数式・概念をその場でステップバイステップで解説してもらえる。24時間使える個別指導として活用。" />
    </Section>

    {/* 重要出題分野 */}
    <Section title="重要出題分野">
      <FieldItem priority="最重要" title="正規分布・標準化・信頼区間" detail="z変換・t分布・信頼区間の計算が頻出。標準正規分布表の読み方も必須。" />
      <FieldItem priority="最重要" title="仮説検定" detail="t検定・カイ二乗検定の手順。p値・有意水準・第1種/第2種の誤りの意味。" />
      <FieldItem priority="重要" title="確率分布" detail="二項分布・ポアソン分布・正規分布の期待値・分散・形状の特徴。" />
      <FieldItem priority="重要" title="回帰分析" detail="最小二乗法・決定係数・回帰係数の解釈。残差の意味も問われる。" />
      <FieldItem priority="重要" title="記述統計" detail="平均・分散・標準偏差・四分位数・相関係数の計算と解釈。" />
      <FieldItem priority="標準" title="確率の基礎・ベイズの定理" detail="加法定理・乗法定理・条件付き確率。ベイズの定理の計算は計算量が多い。" />
    </Section>

    {/* 実践的アドバイス */}
    <Section title="本番に向けた実践アドバイス">
      {[
        { icon: '⏱', title: '時間感覚を身につける', body: '1問あたり平均2.5分が目安。確実に解ける問題から先に解き、計算に詰まったら後回しにする。' },
        { icon: '🔢', title: '電卓操作に習熟する', body: 'ルート計算やメモリ機能を使った計算に慣れておく。標準化の計算など繰り返しが多い問題で時間を節約できる。' },
        { icon: '📊', title: '正規分布表の読み方を練習する', body: '試験では正規分布表が配布される。z = 1.96 で95%、z = 2.58 で99%など基本値は暗記しておく。' },
        { icon: '📐', title: '数学の基礎を確認する', body: '微分・積分・シグマ記号・組合せの扱いに慣れておくと計算がスムーズ。' },
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
