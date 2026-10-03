'use client';

import { useState } from 'react';
import { FAQS } from '@/data/landingData';
import { ScrollReveal } from '@/components/ui/ScrollReveal';
import { LandingEyebrow } from './LandingEyebrow';

export function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id="faq" className="scroll-mt-20 py-16 sm:py-24 bg-[#f4f7fc] px-4 sm:px-8 border-b border-slate-200">
      <div className="mx-auto max-w-4xl">
        <ScrollReveal animation="fade-up">
          <div className="text-center mb-12">
            <LandingEyebrow icon="help" className="mb-3">
              Giải đáp thắc mắc
            </LandingEyebrow>
            <h2 className="text-3xl sm:text-4xl font-black text-[#00152a] tracking-tight">
              Câu hỏi thường gặp về <span className="text-[#007d6e]">TripMate</span>
            </h2>
            <p className="mt-3 text-slate-500 text-sm sm:text-base text-pretty">
              Tổng hợp các câu hỏi về thuật toán CSP, cơ chế cứu nguy thời tiết và quy trình bảo vệ quyền lợi du khách.
            </p>
          </div>
        </ScrollReveal>

        <div className="space-y-4">
          {FAQS.map((faq, index) => {
            const isOpen = openIndex === index;
            const answerId = `faq-answer-${index}`;
            const questionId = `faq-question-${index}`;

            return (
              <ScrollReveal
                key={faq.q}
                animation="fade-up"
                delay={index * 90}
                duration={650}
              >
                <div
                  className={`rounded-2xl border transition-all duration-300 overflow-hidden shadow-xs ${
                    isOpen ? 'border-[#007d6e] bg-white shadow-md' : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <button
                    type="button"
                    id={questionId}
                    aria-expanded={isOpen}
                    aria-controls={answerId}
                    onClick={() => setOpenIndex(isOpen ? null : index)}
                    className="w-full p-5 text-left flex items-center justify-between gap-4 font-bold text-sm sm:text-base text-[#00152a] hover:text-[#007d6e] transition-colors cursor-pointer"
                  >
                    <span>{faq.q}</span>
                    <span
                      className={`material-symbols-outlined text-slate-400 transition-transform duration-300 ${
                        isOpen ? 'rotate-180 text-[#007d6e]' : ''
                      }`}
                      aria-hidden="true"
                    >
                      expand_more
                    </span>
                  </button>
                  {isOpen && (
                    <div
                      id={answerId}
                      role="region"
                      aria-labelledby={questionId}
                      className="px-5 pb-5 pt-1 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-100 animate-in fade-in slide-in-from-top-1 duration-200"
                    >
                      {faq.a}
                    </div>
                  )}
                </div>
              </ScrollReveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
