import { describe, expect, it } from 'vitest';
import { OPERATOR_TOUR_ROUTES, withTourDemoMode } from './routes';

describe('withTourDemoMode', () => {
  it('returns unchanged href when isDemo is false or omitted', () => {
    expect(withTourDemoMode('/partner/tours')).toBe('/partner/tours');
    expect(withTourDemoMode('/partner/tours', false)).toBe('/partner/tours');
    expect(withTourDemoMode(OPERATOR_TOUR_ROUTES.create, false)).toBe('/partner/tours/new');
    expect(withTourDemoMode(OPERATOR_TOUR_ROUTES.edit('tour-1'), false)).toBe('/partner/tours/tour-1/edit');
    expect(withTourDemoMode(OPERATOR_TOUR_ROUTES.submit('tour-1'), false)).toBe('/partner/tours/tour-1/submit');
  });

  it('appends demo=1 when isDemo is true and no query string exists', () => {
    expect(withTourDemoMode('/partner/tours', true)).toBe('/partner/tours?demo=1');
    expect(withTourDemoMode(OPERATOR_TOUR_ROUTES.create, true)).toBe('/partner/tours/new?demo=1');
    expect(withTourDemoMode(OPERATOR_TOUR_ROUTES.edit('tour-1'), true)).toBe('/partner/tours/tour-1/edit?demo=1');
    expect(withTourDemoMode(OPERATOR_TOUR_ROUTES.submit('tour-1'), true)).toBe('/partner/tours/tour-1/submit?demo=1');
  });

  it('preserves existing query parameters without duplicating demo', () => {
    expect(withTourDemoMode('/partner/tours?status=Draft', true)).toBe('/partner/tours?status=Draft&demo=1');
    expect(withTourDemoMode('/partner/tours?demo=1', true)).toBe('/partner/tours?demo=1');
    expect(withTourDemoMode('/partner/tours?demo=0', true)).toBe('/partner/tours?demo=1');
  });

  it('correctly handles URLs with hash fragments', () => {
    expect(withTourDemoMode('/partner/tours#section', true)).toBe('/partner/tours?demo=1#section');
    expect(withTourDemoMode('/partner/tours?filter=all#section', true)).toBe('/partner/tours?filter=all&demo=1#section');
  });

  it('handles empty or blank string gracefully', () => {
    expect(withTourDemoMode('', true)).toBe('');
    expect(withTourDemoMode('', false)).toBe('');
  });
});
