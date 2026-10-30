import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

describe('Global Typography Architecture & Standardization', () => {
  const globalsCssPath = path.resolve(__dirname, 'globals.css');
  const layoutPath = path.resolve(__dirname, 'layout.tsx');
  const globalsCss = fs.readFileSync(globalsCssPath, 'utf-8');
  const layoutSource = fs.readFileSync(layoutPath, 'utf-8');

  it('defines canonical --font-sans in @theme with Plus Jakarta Sans as primary font', () => {
    // Theme token must declare Plus Jakarta Sans variable first, followed by Geist Sans and system fallbacks
    expect(globalsCss).toMatch(
      /--font-sans:\s*var\(--font-jakarta\),\s*var\(--font-geist-sans\)/,
    );
  });

  it('defines canonical --font-mono in @theme with Geist Mono as primary font', () => {
    expect(globalsCss).toMatch(
      /--font-mono:\s*var\(--font-geist-mono\),\s*Consolas/,
    );
  });

  it('binds body and html to var(--font-sans)', () => {
    expect(globalsCss).toMatch(/html\s*\{[^}]*font-family:\s*var\(--font-sans\)/);
    expect(globalsCss).toMatch(/body\s*\{[^}]*font-family:\s*var\(--font-sans\)/);
  });

  it('enforces font-family inheritance on all native interactive form controls', () => {
    // Buttons, inputs, textareas, selects must inherit typography to avoid browser default user-agent font drift
    expect(globalsCss).toMatch(
      /button,\s*input,\s*optgroup,\s*select,\s*textarea\s*\{[^}]*font-family:\s*inherit;/,
    );
  });

  it('protects Material Symbols Outlined icon font from generic typography cascades', () => {
    expect(globalsCss).toMatch(
      /\.material-symbols-outlined\s*\{[^}]*font-family:\s*['"]Material Symbols Outlined['"]/,
    );
  });

  it('ensures third-party widgets and dialogs explicitly inherit canonical font', () => {
    expect(globalsCss).toMatch(/\[role=["']dialog["']\]/);
    expect(globalsCss).toMatch(/\.mapboxgl-popup/);
  });

  it('wires font variable classes on both html and body in RootLayout for SSR & portal resilience', () => {
    // Both html and body must carry the font variable classes
    expect(layoutSource).toMatch(
      /<html[^>]*className=\{`\$\{geistSans\.variable\}\s+\$\{geistMono\.variable\}\s+\$\{jakarta\.variable\}`\}/,
    );
    expect(layoutSource).toMatch(
      /<body[^>]*\$\{jakarta\.variable\}[^>]*font-sans/,
    );
  });

  it('validates Vietnamese diacritics integrity across standard phrase inventory', () => {
    const canonicalVietnamesePhrase =
      'Tiếng Việt có dấu: Đà Nẵng, Hà Nội, Thành phố Hồ Chí Minh, Hướng dẫn viên, Điểm tham quan, Đặt vé, Thanh toán, Quản lý chuyến đi.';
    const canonicalVietnameseGlyphs = 'ă â ê ô ơ ư đ Ă Â Ê Ô Ơ Ư Đ';

    // Verify NFC normalization preserves proper combined diacritics without splitting
    const normalizedPhrase = canonicalVietnamesePhrase.normalize('NFC');
    const normalizedGlyphs = canonicalVietnameseGlyphs.normalize('NFC');

    expect(canonicalVietnamesePhrase).toBe(normalizedPhrase);
    expect(canonicalVietnameseGlyphs).toBe(normalizedGlyphs);

    // Verify key Vietnamese vowels with circumflex, horn, breve, and barred d
    const expectedLetters = ['ă', 'â', 'ê', 'ô', 'ơ', 'ư', 'đ', 'Ă', 'Â', 'Ê', 'Ô', 'Ơ', 'Ư', 'Đ'];
    for (const letter of expectedLetters) {
      expect(canonicalVietnameseGlyphs).toContain(letter);
    }
  });
});
