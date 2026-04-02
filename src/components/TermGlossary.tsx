// stats-app/src/components/TermGlossary.tsx
import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowRight, Link as LinkIcon } from 'lucide-react';
import { glossary } from '../data/glossary';
import { MathDisplay } from './MathDisplay';
import { modules } from '../data/modules';

interface Props {
  termId: string;
  children: React.ReactNode;
  onNavigate?: (moduleId: string) => void;
  renderMath?: (text: string) => React.ReactNode;
}

export const TermText: React.FC<Props> = ({ termId, children, onNavigate, renderMath }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTermId, setActiveTermId] = useState(termId);
  const data = glossary[activeTermId];

  const handleNavigate = useCallback((moduleId: string) => {
    setIsOpen(false);
    if (onNavigate) {
      setTimeout(() => onNavigate(moduleId), 50);
    }
  }, [onNavigate]);

  const switchTerm = useCallback((newId: string) => {
    setActiveTermId(newId);
  }, []);

  if (!data) return <>{children}</>;

  const levelColor = {
    '基礎': '#22c55e',
    '中級': '#eab308',
    '上級': '#ef4444'
  }[data.level];

  const relatedModules = modules.filter(m => m.content.includes(`[[term:${activeTermId}]]`));

  return (
    <>
      <span 
        onClick={(e) => {
          e.stopPropagation();
          setActiveTermId(termId); // Reset to original when opening
          setIsOpen(true);
        }}
        className="term-trigger"
        style={{ color: 'var(--primary)', textDecoration: 'underline dotted', cursor: 'help', fontWeight: 600, display: 'inline' }}
      >
        {children}
      </span>

      <AnimatePresence>
        {isOpen && (
          <div 
            style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(2px)' }}
            onClick={() => setIsOpen(false)}
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="card"
              style={{ maxWidth: '500px', width: '100%', position: 'relative', borderTop: `4px solid ${levelColor}`, maxHeight: '80vh', overflowY: 'auto', marginBottom: 0 }}
              onClick={e => e.stopPropagation()}
            >
              <button onClick={() => setIsOpen(false)} style={{ position: 'absolute', right: '1rem', top: '1rem', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={20} /></button>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <h3 style={{ margin: 0, fontSize: '1.2rem' }}>{data.term}</h3>
                <span style={{ fontSize: '0.6rem', padding: '0.1rem 0.4rem', borderRadius: '4px', background: `${levelColor}22`, color: levelColor, fontWeight: 700 }}>{data.level}</span>
              </div>

              <div style={{ margin: '1rem 0', fontSize: '0.9rem', lineHeight: '1.6', color: 'var(--text)' }}>
                {renderMath ? renderMath(data.explanation) : data.explanation}
              </div>

              {data.formula && (
                <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '8px', marginBottom: '1rem', textAlign: 'center' }}>
                  <MathDisplay formula={data.formula} block />
                </div>
              )}

              {data.relatedTerms && data.relatedTerms.length > 0 && (
                <div style={{ marginBottom: '1rem' }}>
                  <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700, marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <LinkIcon size={12} /> 関連用語：
                  </p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                    {data.relatedTerms.map(rtid => (
                      <button key={rtid} onClick={() => switchTerm(rtid)} style={{ background: '#f1f5f9', border: 'none', borderRadius: '4px', padding: '0.2rem 0.4rem', fontSize: '0.75rem', color: 'var(--primary)', cursor: 'pointer' }}>
                        {glossary[rtid]?.term || rtid}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {relatedModules.length > 0 && onNavigate && (
                <div style={{ borderTop: '1px dashed #e2e8f0', paddingTop: '1rem' }}>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, margin: '0 0 0.5rem' }}>解説ページで詳しく学ぶ：</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    {relatedModules.map(m => (
                      <button key={m.id} className="btn-link" style={{ justifyContent: 'space-between', padding: '0.5rem' }} onClick={() => handleNavigate(m.id)}>
                        {m.title} <ArrowRight size={14} />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
