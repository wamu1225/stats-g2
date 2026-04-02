// stats-app/src/components/MathDisplay.tsx
import React, { useMemo } from 'react';
import katex from 'katex';
import { Info } from 'lucide-react';

interface Props {
  formula: string;
  block?: boolean;
}

const symbolGuide: Record<string, { label: string; desc: string }> = {
  '\\mu': { label: 'μ (ミュー)', desc: '平均値。データの中心。' },
  '\\sigma^2': { label: 'σ² (シグマ二乗)', desc: '分散。ばらつきの大きさ。' },
  '\\sigma': { label: 'σ (シグマ)', desc: '標準偏差。ばらつきの尺度。' },
  '\\pi': { label: 'π (パイ)', desc: '円周率。' },
  'e': { label: 'e (ネイピア数)', desc: '自然対数の底。' },
  'x': { label: 'x (エックス)', desc: '観測値。' },
  'n': { label: 'n', desc: 'サンプルサイズ。データの数。' },
  '\\beta': { label: 'β (ベータ)', desc: '回帰係数。影響の強さ。' },
  '\\epsilon': { label: 'ε (イプシロン)', desc: '誤差項。' }
};

export const MathDisplay: React.FC<Props> = ({ formula, block }) => {
  const html = useMemo(() => {
    try {
      return katex.renderToString(formula, {
        displayMode: block,
        throwOnError: false,
        output: 'html' // Ensure HTML output
      });
    } catch (e) {
      console.error('KaTeX rendering error:', e);
      return formula;
    }
  }, [formula, block]);

  const activeSymbols = Object.keys(symbolGuide).filter(s => formula.includes(s));

  if (!block) {
    return (
      <span 
        className="katex-inline"
        dangerouslySetInnerHTML={{ __html: html }} 
      />
    );
  }

  return (
    <div className="math-block-container" style={{ margin: '1rem 0' }}>
      <div 
        className="katex-display"
        dangerouslySetInnerHTML={{ __html: html }} 
      />
      
      {activeSymbols.length > 0 && (
        <div className="symbol-guide" style={{ 
          marginTop: '1rem', 
          background: '#f8fafc', 
          padding: '0.75rem', 
          borderRadius: '0.5rem', 
          fontSize: '0.75rem',
          border: '1px dashed #cbd5e1',
          textAlign: 'left'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--primary)', fontWeight: 600, marginBottom: '0.5rem' }}>
            <Info size={14} /> 記号の解説
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '0.5rem' }}>
            {activeSymbols.map(s => (
              <div key={s}>
                <span style={{ fontWeight: 600, color: 'var(--text)' }}>{symbolGuide[s].label}</span>: 
                <span style={{ color: 'var(--text-muted)' }}> {symbolGuide[s].desc}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
