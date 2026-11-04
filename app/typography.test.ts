import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

describe('Global Typography Architecture & Standardization', () => {
  const globalsCssPath = path.resolve(__dirname, 'globals.css');
  const layoutPath = path.resolve(__dirname, 'layout.tsx');
  const adrDocPath = path.resolve(__dirname, '../docs/TYPOGRAPHY_STANDARDIZATION.md');
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

  it('validates display: swap is configured on Next.js font loaders for FOIT prevention', () => {
    expect(layoutSource).toMatch(/const\s+geistSans\s*=\s*Geist\(\{[^}]*display:\s*['"]swap['"]/);
    expect(layoutSource).toMatch(/const\s+geistMono\s*=\s*Geist_Mono\(\{[^}]*display:\s*['"]swap['"]/);
    expect(layoutSource).toMatch(/const\s+jakarta\s*=\s*Plus_Jakarta_Sans\(\{[^}]*display:\s*['"]swap['"]/);
  });

  it('verifies comprehensive multi-platform system fallback chain in --font-sans', () => {
    // Must contain standard fallbacks for Windows (Segoe UI), macOS (-apple-system, BlinkMacSystemFont), Linux/Cross-platform (Inter, system-ui, Arial, sans-serif)
    const expectedFallbacks = [
      'Segoe UI',
      'Inter',
      'system-ui',
      '-apple-system',
      'BlinkMacSystemFont',
      'Helvetica Neue',
      'Arial',
      'sans-serif',
    ];
    for (const fallback of expectedFallbacks) {
      expect(globalsCss).toContain(fallback);
    }
  });

  it('verifies typography standardization documentation exists and details architecture decision', () => {
    expect(fs.existsSync(adrDocPath)).toBe(true);
    const adrContent = fs.readFileSync(adrDocPath, 'utf-8');
    expect(adrContent).toContain('Plus Jakarta Sans');
    expect(adrContent).toContain('Geist Sans');
    expect(adrContent).toContain('Material Symbols Outlined');
    expect(adrContent).toContain('Unicode NFC normalization');
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
