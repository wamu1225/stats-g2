// stats-app/src/components/Quiz.tsx
import React, { useState } from 'react';
import { type QuizQuestion } from '../data/modules';
import { CheckCircle2, XCircle, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';

interface Props {
  questions: QuizQuestion[];
  onComplete: (score: number, total: number) => void;
  renderContent: (text: string) => React.ReactNode;
  showModuleLabel?: string;
}

export const Quiz: React.FC<Props> = ({ questions, onComplete, renderContent, showModuleLabel }) => {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [correctCount, setCorrectCount] = useState(0);

  const question = questions[currentIdx];

  const handleSelect = (idx: number) => {
    if (selected !== null) return;
    setSelected(idx);
    const correct = idx === question.correctAnswer;
    setIsCorrect(correct);
    if (correct) setCorrectCount(c => c + 1);
  };

  const next = () => {
    if (currentIdx + 1 < questions.length) {
      setCurrentIdx(currentIdx + 1);
      setSelected(null);
      setIsCorrect(null);
    } else {
      const finalScore = correctCount + (isCorrect ? 1 : 0);
      onComplete(finalScore, questions.length);
    }
  };

  if (!question) return null;

  // Decide if we should use 2-column layout based on option length
  const isCompact = question.options.every(opt => opt.length < 15);

  return (
    <div className="card" style={{ border: '1px solid #e2e8f0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '1.1rem' }}>理解度チェック</h3>
          {showModuleLabel && <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>{showModuleLabel}</span>}
        </div>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          質問 {currentIdx + 1} / {questions.length}
        </span>
      </div>
      
      <div style={{ marginBottom: '1.25rem', fontSize: '1rem', fontWeight: 600, lineHeight: 1.6 }}>
        {renderContent(question.question)}
      </div>
      
      <div className={clsx("quiz-options", isCompact && "compact")}>
        {question.options.map((opt, i) => (
          <button
            key={`${currentIdx}-${i}`}
            className="btn"
            style={{
              background: selected === i 
                ? (i === question.correctAnswer ? '#22c55e' : '#ef4444')
                : '#ffffff',
              color: selected === i ? 'white' : 'var(--text)',
              justifyContent: 'space-between',
              border: selected === i ? 'none' : '1px solid #e2e8f0',
              textAlign: 'left',
              padding: '0.75rem 1rem',
              boxShadow: 'none',
              fontWeight: 500,
              fontSize: '0.9rem'
            }}
            onClick={() => handleSelect(i)}
          >
            <div style={{ flex: 1 }}>{renderContent(opt)}</div>
            {selected === i && (
              i === question.correctAnswer ? <CheckCircle2 size={18} /> : <XCircle size={18} />
            )}
          </button>
        ))}
      </div>

      <AnimatePresence>
        {selected !== null && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ marginTop: '1.5rem', padding: '1rem', background: '#f8fafc', borderRadius: '0.5rem', border: '1px solid #e2e8f0' }}
          >
            <p style={{ margin: 0, fontSize: '0.85rem', lineHeight: 1.6 }}>
              <strong style={{ color: isCorrect ? '#22c55e' : '#ef4444' }}>
                {isCorrect ? '正解！' : '不正解...'}
              </strong><br />
              {renderContent(question.explanation)}
            </p>
            <button 
              className="btn" 
              style={{ marginTop: '1rem', width: 'auto', padding: '0.5rem 1rem' }} 
              onClick={next}
            >
              {currentIdx + 1 < questions.length ? '次の問題へ' : 'セクションを完了する'}
              <ChevronRight size={18} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
