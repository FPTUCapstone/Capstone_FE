import React from 'react';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ItineraryReorderDialog } from '../components/ItineraryReorderDialog';
import { ItineraryDetailItemDto } from '../types/schedulingTypes';

function makeVisit(overrides: Partial<ItineraryDetailItemDto>): ItineraryDetailItemDto {
  return {
    itemId: 1,
    sequenceNo: 1,
    poiId: 10,
    poiName: 'Bảo tàng Chăm',
    category: 'Văn hóa',
    kind: 'Visit',
    plannedArrival: '2026-10-20T08:00:00+07:00',
    plannedDeparture: '2026-10-20T09:00:00+07:00',
    travelDurationFromPreviousMinutes: null,
    stayDurationMinutes: 60,
    estimatedCost: 60000,
    costKind: 'AdmissionTicket',
    isMandatory: false,
    recommendationReason: null,
    isUnavailable: false,
    ...overrides,
  };
}

const sampleItems: ItineraryDetailItemDto[] = [
  makeVisit({
    itemId: 1,
    sequenceNo: 1,
    poiId: 11,
    poiName: 'Bãi biển Mỹ Khê',
    isMandatory: true,
    plannedArrival: '2026-10-20T08:00:00+07:00',
    stayDurationMinutes: 60,
  }),
  makeVisit({
    itemId: 2,
    sequenceNo: 2,
    poiId: 22,
    poiName: 'Ngũ Hành Sơn',
    plannedArrival: '2026-10-20T09:30:00+07:00',
    stayDurationMinutes: 90,
  }),
  makeVisit({
    itemId: 3,
    sequenceNo: 3,
    poiId: 33,
    poiName: 'Bánh xèo 76',
    category: 'Ẩm thực',
    costKind: 'AverageSpend',
    plannedArrival: '2026-10-20T12:00:00+07:00',
    stayDurationMinutes: 45,
  }),
];

describe('ItineraryReorderDialog', () => {
  afterEach(() => {
    cleanup();
  });

  it('renders stops with metadata and disables saving until the order changes', () => {
    render(
      <ItineraryReorderDialog
        items={sampleItems}
        busy={false}
        error={null}
        onSave={vi.fn()}
        onClose={vi.fn()}
      />,
    );

    const dialog = screen.getByRole('dialog', { name: 'Sắp xếp lại các điểm tham quan' });
    const rows = within(dialog).getAllByRole('listitem');
    expect(rows).toHaveLength(3);
    expect(within(rows[0]).getByText('Bãi biển Mỹ Khê')).toBeDefined();
    expect(within(rows[0]).getByText('Bắt buộc')).toBeDefined();
    expect(within(rows[2]).getByText('Ăn uống')).toBeDefined();
    expect(within(dialog).getByText('3 điểm dừng · Chưa có thay đổi')).toBeDefined();

    const saveButton = within(dialog).getByRole('button', { name: 'Lưu thứ tự mới' }) as HTMLButtonElement;
    expect(saveButton.disabled).toBe(true);
    expect(within(rows[0]).getByRole('button', { name: 'Di chuyển Bãi biển Mỹ Khê lên' }).hasAttribute('disabled')).toBe(true);
    expect(within(rows[2]).getByRole('button', { name: 'Di chuyển Bánh xèo 76 xuống' }).hasAttribute('disabled')).toBe(true);
  });

  it('reorders stops with up/down controls, shows origin badge, and submits updated poiIds', () => {
    const onSave = vi.fn();
    render(
      <ItineraryReorderDialog
        items={sampleItems}
        busy={false}
        error={null}
        onSave={onSave}
        onClose={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Di chuyển Bánh xèo 76 lên' }));

    const rows = screen.getAllByRole('listitem');
    expect(within(rows[1]).getByText('Bánh xèo 76')).toBeDefined();
    expect(within(rows[1]).getByText('từ #3')).toBeDefined();
    expect(within(rows[2]).getByText('Ngũ Hành Sơn')).toBeDefined();
    expect(within(rows[2]).getByText('từ #2')).toBeDefined();

    const saveButton = screen.getByRole('button', { name: 'Lưu thứ tự mới' }) as HTMLButtonElement;
    expect(saveButton.disabled).toBe(false);
    fireEvent.click(saveButton);

    expect(onSave).toHaveBeenCalledWith([11, 33, 22]);
  });

  it('supports drag-and-drop reordering and submits the dragged order', () => {
    const onSave = vi.fn();
    render(
      <ItineraryReorderDialog
        items={sampleItems}
        busy={false}
        error={null}
        onSave={onSave}
        onClose={vi.fn()}
      />,
    );

    const rows = screen.getAllByRole('listitem');
    fireEvent.dragStart(rows[2]);
    fireEvent.dragOver(rows[0]);
    fireEvent.drop(rows[0]);
    fireEvent.dragEnd(rows[2]);

    const updatedRows = screen.getAllByRole('listitem');
    expect(within(updatedRows[0]).getByText('Bánh xèo 76')).toBeDefined();
    expect(within(updatedRows[0]).getByText('từ #3')).toBeDefined();

    fireEvent.click(screen.getByRole('button', { name: 'Lưu thứ tự mới' }));
    expect(onSave).toHaveBeenCalledWith([33, 11, 22]);
  });

  it('restores original order and disables save when reset is clicked', () => {
    render(
      <ItineraryReorderDialog
        items={sampleItems}
        busy={false}
        error={null}
        onSave={vi.fn()}
        onClose={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Di chuyển Ngũ Hành Sơn lên' }));
    expect(screen.getByText('Đã thay đổi vị trí')).toBeDefined();

    fireEvent.click(screen.getByRole('button', { name: 'Đặt lại' }));

    const rows = screen.getAllByRole('listitem');
    expect(within(rows[0]).getByText('Bãi biển Mỹ Khê')).toBeDefined();
    expect(within(rows[1]).getByText('Ngũ Hành Sơn')).toBeDefined();
    expect(screen.queryByText(/từ #/)).toBeNull();
    expect((screen.getByRole('button', { name: 'Lưu thứ tự mới' }) as HTMLButtonElement).disabled).toBe(true);
  });

  it('closes without saving on Cancel, Escape, and backdrop click, and displays save errors', () => {
    const onSave = vi.fn();
    const onClose = vi.fn();
    const { rerender } = render(
      <ItineraryReorderDialog
        items={sampleItems}
        busy={false}
        error="Không thể lưu thứ tự mới."
        onSave={onSave}
        onClose={onClose}
      />,
    );

    expect(screen.getByRole('alert').textContent).toBe('Không thể lưu thứ tự mới.');

    fireEvent.click(screen.getByRole('button', { name: 'Hủy' }));
    expect(onClose).toHaveBeenCalledTimes(1);

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(2);

    const backdrop = screen.getByRole('dialog').parentElement!;
    fireEvent.mouseDown(backdrop);
    expect(onClose).toHaveBeenCalledTimes(3);
    expect(onSave).not.toHaveBeenCalled();

    // Busy state prevents accidental backdrop dismissal
    rerender(
      <ItineraryReorderDialog
        items={sampleItems}
        busy={true}
        error={null}
        onSave={onSave}
        onClose={onClose}
      />,
    );
    fireEvent.mouseDown(backdrop);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(3);
  });
});
