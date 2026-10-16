import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { ItineraryLegRow } from '../components/ItineraryLegRow';
import { ItineraryStopMenu } from '../components/ItineraryStopMenu';

function renderStopMenu() {
  const actions = {
    replace: vi.fn(),
    remove: vi.fn(),
    reviews: vi.fn(),
  };
  render(
    <ItineraryStopMenu
      stopName="Ngũ Hành Sơn"
      actions={[
        { label: 'Thay địa điểm', onSelect: actions.replace },
        { label: 'Bỏ khỏi lịch', onSelect: actions.remove },
        { label: 'Xem đánh giá', onSelect: actions.reviews },
      ]}
    />,
  );
  return { actions, trigger: screen.getByRole('button', { name: 'Thao tác với Ngũ Hành Sơn' }) };
}

describe('ARIA menu keyboard support (review finding 8)', () => {
  it('moves focus into the menu and cycles with the arrow keys, Home and End', () => {
    const { trigger } = renderStopMenu();
    fireEvent.click(trigger);

    const items = screen.getAllByRole('menuitem');
    expect(document.activeElement).toBe(items[0]);

    fireEvent.keyDown(document.activeElement!, { key: 'ArrowDown' });
    expect(document.activeElement).toBe(items[1]);
    fireEvent.keyDown(document.activeElement!, { key: 'End' });
    expect(document.activeElement).toBe(items[2]);
    fireEvent.keyDown(document.activeElement!, { key: 'ArrowDown' });
    expect(document.activeElement).toBe(items[0]);
    fireEvent.keyDown(document.activeElement!, { key: 'ArrowUp' });
    expect(document.activeElement).toBe(items[2]);
    fireEvent.keyDown(document.activeElement!, { key: 'Home' });
    expect(document.activeElement).toBe(items[0]);
  });

  it('closes on Escape and returns focus to the trigger', () => {
    const { trigger } = renderStopMenu();
    fireEvent.click(trigger);

    fireEvent.keyDown(document.activeElement!, { key: 'Escape' });

    expect(screen.queryByRole('menu')).toBeNull();
    expect(document.activeElement).toBe(trigger);
  });

  it('returns focus to the trigger after choosing an action', () => {
    const { trigger, actions } = renderStopMenu();
    fireEvent.click(trigger);

    fireEvent.click(screen.getByRole('menuitem', { name: 'Bỏ khỏi lịch' }));

    expect(actions.remove).toHaveBeenCalled();
    expect(document.activeElement).toBe(trigger);
  });

  it('focuses the current mode first in the transport picker', () => {
    const onChangeMode = vi.fn();
    render(
      <ItineraryLegRow toName="Ngũ Hành Sơn" minutes={22} meters={9400} mode="Motorbike" onChangeMode={onChangeMode} />,
    );
    const trigger = screen.getByRole('button', { name: 'Đổi phương tiện đến Ngũ Hành Sơn' });
    fireEvent.click(trigger);

    expect(document.activeElement).toBe(screen.getByRole('menuitemradio', { name: '🛵 Xe máy' }));
    fireEvent.keyDown(document.activeElement!, { key: 'ArrowDown' });
    expect(document.activeElement).toBe(screen.getByRole('menuitemradio', { name: '🚗 Ô tô/taxi' }));

    fireEvent.click(document.activeElement!);
    expect(onChangeMode).toHaveBeenCalledWith('Car');
    expect(document.activeElement).toBe(trigger);
  });
});
