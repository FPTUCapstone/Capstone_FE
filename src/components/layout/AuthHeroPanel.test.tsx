import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import AuthHeroPanel from './AuthHeroPanel';

describe('AuthHeroPanel shared layout', () => {
  it('renders required caller-owned title and description with the existing hero content', () => {
    render(<AuthHeroPanel title={<>Plan <em>your journey</em></>} description="Your description" />);
    expect(screen.getByRole('heading', { level: 1 }).innerHTML).toBe('Plan <em>your journey</em>');
    expect(screen.getByText('Your description')).not.toBeNull();
    expect(screen.getByText('Lịch trình thông minh')).not.toBeNull();
    expect(screen.getByText('120+')).not.toBeNull();
    expect(screen.getByRole('complementary').className).toBe('relative hidden lg:flex hero-bg text-white overflow-hidden');
  });

  it('supports the registration sticky desktop layout', () => {
    render(<AuthHeroPanel title="Registration" description="Join" sticky />);
    expect(screen.getByRole('complementary').className).toBe('relative hidden lg:flex lg:sticky lg:top-0 lg:h-screen hero-bg text-white overflow-hidden');
  });

  it.each([null, ''])('does not substitute default copy for an empty title (%s)', (title) => {
    const { container } = render(<AuthHeroPanel title={title} description="" />);
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('');
    expect(container.querySelector('p')?.textContent).toBe('');
  });
});
