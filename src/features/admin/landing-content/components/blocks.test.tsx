import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('../landingContentService', () => ({ uploadImage: vi.fn() }));

import { emptyContent, type DestinationEntry } from '../landingContent';
import { BannerBlock } from './BannerBlock';
import { DestinationsBlock } from './DestinationsBlock';
import { FeaturedToursBlock } from './FeaturedToursBlock';
import { HeroBlock } from './HeroBlock';
import { PreviewPanel } from './PreviewPanel';

afterEach(() => cleanup());

const image = { mediaId: 'm1', url: '/m1.png' };

describe('HeroBlock', () => {
  it('labels every field and reports edits as a new hero value', () => {
    const onChange = vi.fn();
    const hero = emptyContent().hero;
    render(<HeroBlock value={hero} errors={{}} onChange={onChange} disabled={false} />);
    for (const label of ['Headline', 'Sub-headline', 'Call-to-action Label', 'Call-to-action Target']) {
      expect(screen.getByLabelText(label)).toBeTruthy();
    }
    fireEvent.change(screen.getByLabelText('Headline'), { target: { value: 'Hello' } });
    expect(onChange).toHaveBeenCalledWith({ ...hero, headline: 'Hello' });
  });

  it('shows the required message under the field and marks it invalid', () => {
    render(
      <HeroBlock
        value={emptyContent().hero}
        errors={{ 'hero.headline': 'required' }}
        onChange={() => {}}
        disabled={false}
      />,
    );
    const input = screen.getByLabelText('Headline');
    expect(input.getAttribute('aria-invalid')).toBe('true');
    expect(screen.getByText('This field is required.')).toBeTruthy();
  });

  it('disables every field', () => {
    render(<HeroBlock value={emptyContent().hero} errors={{}} onChange={() => {}} disabled />);
    expect((screen.getByLabelText('Headline') as HTMLInputElement).disabled).toBe(true);
  });
});

describe('DestinationsBlock', () => {
  const entries: DestinationEntry[] = [
    { id: 'a', name: 'Hue', image, description: 'Old capital' },
    { id: 'b', name: 'Hoi An', image, description: 'Lanterns' },
  ];

  it('adds an empty destination', () => {
    const onChange = vi.fn();
    render(<DestinationsBlock value={entries} errors={{}} onChange={onChange} disabled={false} />);
    fireEvent.click(screen.getByRole('button', { name: 'Add destination' }));
    const next = onChange.mock.calls[0][0] as DestinationEntry[];
    expect(next).toHaveLength(3);
    expect(next[2]).toMatchObject({ name: '', description: '', image: null });
    expect(next[2].id).not.toBe('a');
  });

  it('removes the chosen destination only', () => {
    const onChange = vi.fn();
    render(<DestinationsBlock value={entries} errors={{}} onChange={onChange} disabled={false} />);
    fireEvent.click(screen.getByRole('button', { name: 'Remove destination 1' }));
    expect(onChange).toHaveBeenCalledWith([entries[1]]);
  });

  it('moves a destination up and down, and disables the edges', () => {
    const onChange = vi.fn();
    render(<DestinationsBlock value={entries} errors={{}} onChange={onChange} disabled={false} />);
    fireEvent.click(screen.getByRole('button', { name: 'Move destination up 2' }));
    expect(onChange).toHaveBeenLastCalledWith([entries[1], entries[0]]);
    fireEvent.click(screen.getByRole('button', { name: 'Move destination down 1' }));
    expect(onChange).toHaveBeenLastCalledWith([entries[1], entries[0]]);
    expect((screen.getByRole('button', { name: 'Move destination up 1' }) as HTMLButtonElement).disabled).toBe(true);
    expect((screen.getByRole('button', { name: 'Move destination down 2' }) as HTMLButtonElement).disabled).toBe(true);
  });

  it('attaches an error to the entry at its current index', () => {
    render(
      <DestinationsBlock
        value={[entries[1]]}
        errors={{ 'destinations.0.name': 'required' }}
        onChange={() => {}}
        disabled={false}
      />,
    );
    expect(screen.getByLabelText('Name').getAttribute('aria-invalid')).toBe('true');
    expect(screen.getAllByText('This field is required.')).toHaveLength(1);
  });
});

describe('FeaturedToursBlock', () => {
  const tours = [
    { tourId: 't1', title: 'Hue heritage' },
    { tourId: 't2', title: 'Hoi An lanterns' },
  ];

  it('lists only the approved tours it was given and toggles a selection', () => {
    const onChange = vi.fn();
    render(<FeaturedToursBlock value={['t1']} tours={tours} errors={{}} onChange={onChange} disabled={false} />);
    expect(screen.getAllByRole('checkbox')).toHaveLength(2);
    fireEvent.click(screen.getByLabelText('Hoi An lanterns'));
    expect(onChange).toHaveBeenCalledWith(['t1', 't2']);
    fireEvent.click(screen.getByLabelText('Hue heritage'));
    expect(onChange).toHaveBeenLastCalledWith([]);
  });

  it('shows a selected tour that is no longer approved with the unavailable message', () => {
    render(
      <FeaturedToursBlock
        value={['gone']}
        tours={tours}
        errors={{ 'featuredTourIds.gone': 'tourUnavailable' }}
        onChange={() => {}}
        disabled={false}
      />,
    );
    expect(screen.getByText('This tour package is currently unavailable for booking.')).toBeTruthy();
  });

  it('says when no approved tours exist', () => {
    render(<FeaturedToursBlock value={[]} tours={[]} errors={{}} onChange={() => {}} disabled={false} />);
    expect(screen.getByText('No approved tours are available.')).toBeTruthy();
  });
});

describe('BannerBlock', () => {
  it('labels the fields and reports a date edit', () => {
    const onChange = vi.fn();
    const banner = emptyContent().banner;
    render(<BannerBlock value={banner} errors={{}} onChange={onChange} disabled={false} />);
    fireEvent.change(screen.getByLabelText('Display end'), { target: { value: '2026-10-20' } });
    expect(onChange).toHaveBeenCalledWith({ ...banner, displayEnd: '2026-10-20' });
    expect(screen.getByLabelText('Link')).toBeTruthy();
    expect(screen.getByLabelText('Banner Image')).toBeTruthy();
  });

  it('shows the period error under the end date', () => {
    render(
      <BannerBlock
        value={emptyContent().banner}
        errors={{ 'banner.displayEnd': 'invalidPeriod' }}
        onChange={() => {}}
        disabled={false}
      />,
    );
    expect(screen.getByText('The display end date must not be before the display start date.')).toBeTruthy();
  });
});

describe('PreviewPanel', () => {
  it('renders the draft text read-only', () => {
    const content = emptyContent();
    content.hero.headline = 'Discover Central Vietnam';
    content.destinations = [{ id: 'a', name: 'Hue', image, description: 'Old capital' }];
    render(<PreviewPanel content={content} />);
    expect(screen.getByText('Discover Central Vietnam')).toBeTruthy();
    expect(screen.getByText('Hue')).toBeTruthy();
    expect(screen.queryAllByRole('textbox')).toHaveLength(0);
  });
});
