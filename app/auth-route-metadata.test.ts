import { describe, expect, it } from 'vitest';

import { metadata as registerMetadata } from './register/page';
import { metadata as signInMetadata } from './sign-in/page';
import { metadata as verifyEmailMetadata } from './verify-email/page';

describe('public authentication route metadata', () => {
  it('uses route-specific titles without duplicating the root TripMate suffix', () => {
    expect(signInMetadata.title).toBe('Đăng nhập');
    expect(registerMetadata.title).toBe('Đăng ký Traveler');
    expect(verifyEmailMetadata.title).toBe('Xác minh email');
  });
});
