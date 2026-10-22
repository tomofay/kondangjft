import React from 'react';

/**
 * Helper to render question text with styled underline for target words
 * marked with <u>...</u> (standard for JFT-Basic & JLPT questions)
 */
export function renderFormattedQuestion(text: string): React.ReactNode {
  if (!text) return null;
  if (!text.includes('<u>') && !text.includes('</u>')) {
    return text;
  }

  const parts = text.split(/(<u>.*?<\/u>)/g);
  return (
    <>
      {parts.map((part, idx) => {
        if (part.startsWith('<u>') && part.endsWith('</u>')) {
          const inner = part.slice(3, -4);
          return (
            <span
              key={idx}
              className="font-bold underline underline-offset-8 decoration-[2.5px] decoration-red-600 text-red-900 px-0.5 inline-block"
            >
              {inner}
            </span>
          );
        }
        return <React.Fragment key={idx}>{part}</React.Fragment>;
      })}
    </>
  );
}
