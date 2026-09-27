'use client';

import { useState } from 'react';
import { FAQS } from '@/data/landingData';
import { ScrollReveal } from '@/components/ui/ScrollReveal';

export function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id="faq" className="scroll-mt-20 py-16 sm:py-24 bg-[#f4f7fc] px-4 sm:px-8 border-b border-slate-200">
      <div className="mx-auto max-w-4xl">
        <ScrollReveal animation="fade-up">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#9edbd2] bg-teal-50 px-3.5 py-1.5 text-xs font-black uppercase tracking-widest text-[#007d6e] mb-3">
              <span className="material-symbols-outlined text-base">help</span>
              <span>Giải đáp Thắc mắc</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-[#00152a] tracking-tight">
              Câu hỏi thường gặp về <span className="text-[#007d6e]">TripMate</span>
            </h2>
            <p className="mt-3 text-slate-500 text-sm sm:text-base">
              Tổng hợp các câu hỏi về thuật toán CSP, cơ chế cứu nguy thời tiết và quy trình bảo vệ quyền lợi du khách.
            </p>
          </div>
        </ScrollReveal>

        <div className="space-y-4">
          {FAQS.map((faq, index) => {
            const isOpen = openIndex === index;
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
                    onClick={() => setOpenIndex(isOpen ? null : index)}
                    className="w-full p-5 text-left flex items-center justify-between gap-4 font-bold text-sm sm:text-base text-[#00152a] hover:text-[#007d6e] transition-colors cursor-pointer"
                  >
                    <span>{faq.q}</span>
                    <span className={`material-symbols-outlined text-slate-400 transition-transform duration-300 ${isOpen ? 'rotate-180 text-[#007d6e]' : ''}`}>
                      expand_more
                    </span>
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-5 pt-1 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-100 animate-in fade-in slide-in-from-top-1 duration-200">
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
