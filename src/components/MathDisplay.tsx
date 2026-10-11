// stats-app/src/components/MathDisplay.tsx
import React, { useMemo } from 'react';
import katex from 'katex';

interface Props {
  formula: string;
  block?: boolean;
}


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
    </div>
  );
};
