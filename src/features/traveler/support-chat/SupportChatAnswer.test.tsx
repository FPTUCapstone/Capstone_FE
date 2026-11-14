import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { SupportChatAnswer } from './SupportChatAnswer';

describe('SupportChatAnswer', () => {
  it('formats case labels supplied inline with their bullet', () => {
    render(<SupportChatAnswer text={'• Bạn tự hủy: Trên 14 ngày hoàn 100%.\n• Nhà điều hành hủy booking: Hoàn 100% sau xác nhận.'} />);
    expect(screen.getByRole('heading', { name: 'Bạn tự hủy' })).toBeDefined();
    expect(screen.getByText('Trên 14 ngày hoàn 100%.')).toBeDefined();
  });
  it('renders short case headings and real bullet lists', () => {
    render(<SupportChatAnswer text={'Bạn tự hủy\n• Trên 14 ngày — hoàn 100%.\n• 10–14 ngày — hoàn 50%.\n\nNhà điều hành hủy booking\n• Hoàn 100% sau xác nhận.'} />);
    expect(screen.getByText('Bạn tự hủy').tagName).toBe('H3');
    expect(screen.getAllByRole('list')).toHaveLength(2);
    expect(screen.getAllByRole('listitem')).toHaveLength(3);
  });

  it('keeps unsafe markup as text', () => {
    const { container } = render(<SupportChatAnswer text={'<img src=x onerror=alert(1)>\n<script>alert(1)</script>'} />);
    expect(container.querySelector('img, script')).toBeNull();
    expect(screen.getByText(/<img src=x/)).toBeDefined();
  });

  it('preserves paragraphs and numeric policy conditions', () => {
    render(<SupportChatAnswer text={'Dưới 10 ngày — hoàn 0%.\n\nCần xác nhận trước khi hủy.'} />);
    expect(screen.getByText('Dưới 10 ngày — hoàn 0%.')).toBeDefined();
    expect(screen.getByText('Cần xác nhận trước khi hủy.')).toBeDefined();
  });
});
