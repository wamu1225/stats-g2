// stats-app/src/components/DistributionSelector.tsx
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ArrowRight, HelpCircle } from 'lucide-react';

interface Question {
  id: string;
  text: string;
  options: { label: string; nextId: string | null; result?: string }[];
}

const flow: Record<string, Question> = {
  start: {
    id: 'start',
    text: '知りたいことはどれですか？',
    options: [
      { label: 'データの特徴を整理・要約したい', nextId: null, result: '1.1-descriptive' },
      { label: '確率・確率分布を理解したい', nextId: 'prob' },
      { label: '標本から母集団を推測したい（推定・検定）', nextId: 'infer' },
      { label: 'データの関係や予測をしたい', nextId: 'model' },
    ]
  },
  prob: {
    id: 'prob',
    text: '確率のどのテーマに興味がありますか？',
    options: [
      { label: '確率の基本ルール・条件付き確率', nextId: null, result: '2.1-probability' },
      { label: 'ベイズの定理・事後確率', nextId: null, result: '2.2-bayes' },
      { label: '離散型確率分布（二項・ポアソン）', nextId: null, result: '3.1-discrete' },
      { label: '連続型確率分布（正規・指数）', nextId: null, result: '3.2-continuous' },
    ]
  },
  infer: {
    id: 'infer',
    text: '推測統計のどのテーマですか？',
    options: [
      { label: '点推定・信頼区間（母平均・母分散）', nextId: null, result: '4.1-estimation' },
      { label: '仮説検定・p値・一標本t検定', nextId: null, result: '4.2-testing' },
      { label: '2標本の比較（F検定・2標本t検定）', nextId: null, result: '4.3-two-sample' },
      { label: '母比率の推定・検定', nextId: null, result: '4.4-proportion' },
    ]
  },
  model: {
    id: 'model',
    text: 'どのような分析ですか？',
    options: [
      { label: '変数間の関係を直線で表したい（回帰）', nextId: null, result: '5.1-regression' },
      { label: 'カテゴリデータの関連を調べたい（カイ二乗）', nextId: null, result: '5.2-chi2-test' },
    ]
  },
};

interface Props {
  onSelect: (id: string) => void;
}

export const DistributionSelector: React.FC<Props> = ({ onSelect }) => {
  const [currentId, setCurrentId] = useState('start');
  const [history, setHistory] = useState<string[]>([]);

  const handleOption = (nextId: string | null, result?: string) => {
    if (result) {
      onSelect(result);
    } else if (nextId) {
      setHistory([...history, currentId]);
      setCurrentId(nextId);
    }
  };

  const handleBack = () => {
    const prev = history[history.length - 1];
    if (prev) {
      setCurrentId(prev);
      setHistory(history.slice(0, -1));
    }
  };

  const current = flow[currentId];

  return (
    <div className="card" style={{ background: 'var(--primary)', color: 'white', border: 'none' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
        <Search size={20} />
        <h3 style={{ margin: 0 }}>目的から探す（逆引き診断）</h3>
      </div>
      
      <AnimatePresence mode="wait">
        <motion.div
          key={currentId}
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -10 }}
        >
          <p style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1.5rem' }}>{current.text}</p>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {current.options.map((opt, i) => (
              <button
                key={i}
                className="btn"
                style={{ 
                  background: 'rgba(255,255,255,0.2)', 
                  justifyContent: 'space-between', 
                  textAlign: 'left',
                  border: '1px solid rgba(255,255,255,0.3)'
                }}
                onClick={() => handleOption(opt.nextId, opt.result)}
              >
                <span>{opt.label}</span>
                <ArrowRight size={16} />
              </button>
            ))}
          </div>
        </motion.div>
      </AnimatePresence>

      {history.length > 0 && (
        <button 
          onClick={handleBack}
          style={{ 
            marginTop: '1.5rem', 
            background: 'none', 
            border: 'none', 
            color: 'rgba(255,255,255,0.7)', 
            fontSize: '0.875rem',
            cursor: 'pointer',
            textDecoration: 'underline'
          }}
        >
          前の質問に戻る
        </button>
      )}

      <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.1)', fontSize: '0.75rem', display: 'flex', gap: '0.5rem', color: 'rgba(255,255,255,0.8)' }}>
        <HelpCircle size={14} />
        <span>知りたい内容を選ぶだけで、適切な学習コンテンツへ導きます。</span>
      </div>
    </div>
  );
};
