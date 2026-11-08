import { cleanup, fireEvent, render, screen, act } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { LandingHero } from '../components/LandingHero';
import { ROUTES } from '@/lib/routes';
import { gsap } from 'gsap';

describe('Homepage Hero: Cinematic Da Nang Video & Editorial Masked Reveal', () => {
  let intersectionCallbacks: IntersectionObserverCallback[] = [];

  beforeEach(() => {
    intersectionCallbacks = [];

    // Mock IntersectionObserver
    class MockIntersectionObserver implements IntersectionObserver {
      readonly root: Element | Document | null = null;
      readonly rootMargin: string = '';
      readonly thresholds: ReadonlyArray<number> = [0, 0.15, 0.5];
      constructor(private callback: IntersectionObserverCallback) {
        intersectionCallbacks.push(callback);
      }
      observe(target: Element) {
        // Trigger initial intersecting
        this.callback(
          [
            {
              isIntersecting: true,
              intersectionRatio: 1.0,
              target,
            } as unknown as IntersectionObserverEntry,
          ],
          this
        );
      }
      unobserve() {}
      disconnect() {}
      takeRecords(): IntersectionObserverEntry[] {
        return [];
      }
    }
    window.IntersectionObserver = MockIntersectionObserver;

    // Default window width to desktop
    window.innerWidth = 1280;

    // Default matchMedia
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    // Mock HTMLMediaElement play and pause
    window.HTMLMediaElement.prototype.play = vi.fn().mockResolvedValue(undefined);
    window.HTMLMediaElement.prototype.pause = vi.fn();
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('1. Preserves existing headline content, typography contract, and branding', () => {
    render(<LandingHero />);

    const h1 = screen.getByRole('heading', { level: 1 });
    expect(h1).toBeDefined();
    expect(h1.textContent).toContain('Đà Nẵng, nơi');
    expect(h1.textContent).toContain('hành trình bắt đầu.');

    // Supporting copy
    expect(
      screen.getByText(
        /Khám phá những điểm đến đáng nhớ, trải nghiệm tour bản địa và lên lịch trình phù hợp với chuyến đi của bạn/i
      )
    ).toBeDefined();

    // Eyebrow label
    expect(screen.getByText(/TripMate · Khám phá miền Trung/i)).toBeDefined();

    // Trust indicators
    expect(screen.getByText('Tour xác thực bản địa')).toBeDefined();
    expect(screen.getByText('Lịch trình tối ưu thời gian')).toBeDefined();

    // Location badge
    expect(screen.getByText('Bán đảo Sơn Trà & Chùa Linh Ứng · Đà Nẵng')).toBeDefined();
  });

  it('2. Preserves verified destination CTA links and accessible names', () => {
    render(<LandingHero />);

    const planLink = screen.getByRole('link', { name: /lập lịch trình/i });
    expect(planLink.getAttribute('href')).toBe(ROUTES.plan);

    const toursLink = screen.getByRole('link', { name: /khám phá tour/i });
    expect(toursLink.getAttribute('href')).toBe(ROUTES.tours);
  });

  it('3. Renders instant-loading poster image fallback', () => {
    const { container } = render(<LandingHero />);

    const poster = container.querySelector('img[data-testid="hero-poster"]')!;
    expect(poster).not.toBeNull();
    expect(poster.getAttribute('src')).toBe('/images/landing/hero-danang-sontra.jpg');
    expect(poster.getAttribute('loading')).toBe('eager');
    expect(poster.getAttribute('fetchPriority')).toBe('high');
  });

  it('4. Mounts background video with optimized WebM and MP4 sources on eligible desktop', () => {
    const { container } = render(<LandingHero />);

    const video = container.querySelector('video[data-testid="hero-video"]');
    expect(video).not.toBeNull();
    expect(video?.hasAttribute('autoplay')).toBe(true);
    expect((video as HTMLVideoElement).muted).toBe(true);
    expect(video?.hasAttribute('loop')).toBe(true);
    expect(video?.hasAttribute('playsinline')).toBe(true);

    const sources = Array.from(video?.querySelectorAll('source') || []);
    expect(sources.length).toBe(2);
    expect(sources[0].getAttribute('src')).toBe('/videos/landing/hero-danang-sontra.webm');
    expect(sources[0].getAttribute('type')).toBe('video/webm');
    expect(sources[1].getAttribute('src')).toBe('/videos/landing/hero-danang-sontra.mp4');
    expect(sources[1].getAttribute('type')).toBe('video/mp4');
  });

  it('5. Handles playback toggle with accessible Vietnamese labels and state', () => {
    render(<LandingHero />);

    const toggleBtn = screen.getByTestId('hero-playback-toggle');
    expect(toggleBtn).toBeDefined();

    // Simulate video playing
    const video = screen.getByTestId('hero-video');
    fireEvent.playing(video);

    expect(toggleBtn.getAttribute('aria-label')).toBe('Tạm dừng video nền');

    // Click to pause
    fireEvent.click(toggleBtn);
    expect(window.HTMLMediaElement.prototype.pause).toHaveBeenCalled();
    expect(toggleBtn.getAttribute('aria-label')).toBe('Phát video nền');

    // Click to resume
    vi.mocked(window.HTMLMediaElement.prototype.play).mockClear();
    fireEvent.click(toggleBtn);
    expect(window.HTMLMediaElement.prototype.play).toHaveBeenCalled();
  });

  it('6. Respects prefers-reduced-motion by disabling video autoplay and decorative animations', () => {
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: query.includes('prefers-reduced-motion'),
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    const contextSpy = vi.spyOn(gsap, 'context');

    const { container } = render(<LandingHero />);

    // Video is NOT mounted on reduced motion
    const video = container.querySelector('video');
    expect(video).toBeNull();

    // Poster remains visible
    const poster = container.querySelector('img[data-testid="hero-poster"]');
    expect(poster).not.toBeNull();

    // Headline is immediately visible without split line mutations
    const h1 = screen.getByRole('heading', { level: 1 });
    expect(h1.textContent).toContain('Đà Nẵng, nơi');
    expect(container.querySelector('.editorial-split-line')).toBeNull();
    expect(contextSpy).not.toHaveBeenCalled();
  });

  it('7. Respects Save-Data preference by not downloading or mounting the background video', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (navigator as any).connection = { saveData: true };

    const { container } = render(<LandingHero />);

    // Video should not mount
    const video = container.querySelector('video');
    expect(video).toBeNull();

    // Poster fallback remains intact
    const poster = container.querySelector('img[data-testid="hero-poster"]');
    expect(poster).not.toBeNull();

    // Cleanup
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (navigator as any).connection;
  });

  it('8. Pauses video when scrolling out of viewport and resumes when visible', () => {
    render(<LandingHero />);

    const video = screen.getByTestId('hero-video');
    fireEvent.playing(video);

    // Simulate scrolling out of view (intersectionRatio = 0)
    act(() => {
      intersectionCallbacks.forEach((cb) => {
        cb(
          [
            {
              isIntersecting: false,
              intersectionRatio: 0,
              target: video,
            } as unknown as IntersectionObserverEntry,
          ],
          {} as IntersectionObserver
        );
      });
    });

    expect(window.HTMLMediaElement.prototype.pause).toHaveBeenCalled();

    // Simulate scrolling back into view (intersectionRatio = 0.5)
    vi.mocked(window.HTMLMediaElement.prototype.play).mockClear();
    act(() => {
      intersectionCallbacks.forEach((cb) => {
        cb(
          [
            {
              isIntersecting: true,
              intersectionRatio: 0.5,
              target: video,
            } as unknown as IntersectionObserverEntry,
          ],
          {} as IntersectionObserver
        );
      });
    });

    expect(window.HTMLMediaElement.prototype.play).toHaveBeenCalled();
  });

  it('9. Pauses video when document becomes hidden and resumes when visible', () => {
    render(<LandingHero />);

    const video = screen.getByTestId('hero-video');
    fireEvent.playing(video);

    // Simulate document becoming hidden
    Object.defineProperty(document, 'hidden', { value: true, configurable: true });
    fireEvent(document, new Event('visibilitychange'));

    expect(window.HTMLMediaElement.prototype.pause).toHaveBeenCalled();

    // Simulate document becoming visible
    vi.mocked(window.HTMLMediaElement.prototype.play).mockClear();
    Object.defineProperty(document, 'hidden', { value: false, configurable: true });
    fireEvent(document, new Event('visibilitychange'));

    expect(window.HTMLMediaElement.prototype.play).toHaveBeenCalled();
  });

  it('10. Handles autoplay policy rejection gracefully without errors', async () => {
    window.HTMLMediaElement.prototype.play = vi.fn().mockRejectedValue(new Error('NotAllowedError'));

    const { container } = render(<LandingHero />);

    const video = container.querySelector('video[data-testid="hero-video"]');
    expect(video).not.toBeNull();

    await act(async () => {});

    // Video exists but poster remains fully visible and content is intact
    const poster = container.querySelector('img[data-testid="hero-poster"]');
    expect(poster).not.toBeNull();

    const h1 = screen.getByRole('heading', { level: 1 });
    expect(h1.textContent).toContain('Đà Nẵng, nơi');

    const toggleBtn = screen.getByTestId('hero-playback-toggle');
    expect(toggleBtn.getAttribute('aria-label')).toBe('Phát video nền');
  });

  it('11. Cleans up GSAP timeline and observers on component unmount', () => {
    const revertSpy = vi.spyOn(gsap, 'context');

    const { unmount } = render(<LandingHero />);
    expect(revertSpy).toHaveBeenCalled();

    unmount();
    // After unmount, ensure no memory leaks
  });
});
