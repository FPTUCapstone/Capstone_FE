import { describe, expect, it } from 'vitest';

import { getSafeDocumentUrl } from './documentUrl';

describe('document link safety', () => {
  it('allows absolute HTTP and HTTPS URLs', () => {
    expect(getSafeDocumentUrl('https://storage.example.test/licence.pdf')).toBe(
      'https://storage.example.test/licence.pdf',
    );
    expect(getSafeDocumentUrl('http://storage.example.test/a.pdf')).toBe('http://storage.example.test/a.pdf');
    expect(getSafeDocumentUrl('  HTTPS://Storage.Example.Test/A.pdf  ')).toBe(
      'https://storage.example.test/A.pdf',
    );
  });

  it.each([
    ['javascript scheme', 'javascript:alert(1)'],
    ['mixed-case javascript scheme', 'JaVaScRiPt:alert(1)'],
    ['data scheme', 'data:text/html;base64,PHNjcmlwdD4='],
    ['unsupported scheme', 'ftp://storage.example.test/a.pdf'],
    ['file scheme', 'file:///etc/passwd'],
    ['relative path', '/files/licence.pdf'],
    ['bare relative path', 'files/licence.pdf'],
    ['protocol-relative URL', '//evil.example.test/licence.pdf'],
    ['malformed value', 'not a url'],
    ['empty value', ''],
    ['whitespace value', '   '],
  ])('rejects a %s', (_label, value) => {
    expect(getSafeDocumentUrl(value)).toBeNull();
  });

  it('rejects non-string values', () => {
    expect(getSafeDocumentUrl(undefined)).toBeNull();
    expect(getSafeDocumentUrl(null)).toBeNull();
  });
});
