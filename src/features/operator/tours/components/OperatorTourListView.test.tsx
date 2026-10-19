import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { OperatorTourListView } from './OperatorTourListView';
import type { TourPackageDto } from '../types/tourLifecycle';

const mockTours: TourPackageDto[] = [
  {
    id: 'tour-draft-1',
    tourCode: 'TP-001',
    operatorUserId: 101,
    title: 'Tour Bản Nháp Mẫu',
    destination: 'Đà Nẵng',
    category: 'Di sản & Thiên nhiên',
    durationDays: 1,
    basePrice: 500000,
    maxCapacity: 20,
    description: 'Mô tả',
    cancellationPolicy: 'Chính sách',
    status: 'Draft',
    version: 1,
    itinerary: [],
    schedules: [],
    media: [],
    createdAt: '2026-10-01',
    updatedAt: '2026-10-01',
  },
  {
    id: 'tour-approved-1',
    tourCode: 'TP-002',
    operatorUserId: 101,
    title: 'Tour Đã Xuất Bản',
    destination: 'Hội An',
    category: 'Văn hóa & Lịch sử',
    durationDays: 2,
    basePrice: 1200000,
    maxCapacity: 25,
    description: 'Mô tả',
    cancellationPolicy: 'Chính sách',
    status: 'Approved',
    version: 2,
    itinerary: [],
    schedules: [],
    media: [],
    createdAt: '2026-10-01',
    updatedAt: '2026-10-01',
  },
  {
    id: 'tour-pending-1',
    tourCode: 'TP-003',
    operatorUserId: 101,
    title: 'Tour Chờ Duyệt',
    destination: 'Huế',
    category: 'Di sản & Thiên nhiên',
    durationDays: 3,
    basePrice: 2000000,
    maxCapacity: 15,
    description: 'Mô tả',
    cancellationPolicy: 'Chính sách',
    status: 'Pending',
    version: 1,
    itinerary: [],
    schedules: [],
    media: [],
    createdAt: '2026-10-01',
    updatedAt: '2026-10-01',
  },
];

describe('OperatorTourListView', () => {
  describe('Demo Mode (?demo=1 continuity)', () => {
    it('preserves demo=1 on all action and navigation links when isDemo is true', () => {
      render(<OperatorTourListView tours={mockTours} isDemo={true} />);

      // Create Tour Link
      const createLink = screen.getByRole('link', { name: /Tạo gói tour mới/i });
      expect(createLink.getAttribute('href')).toBe('/partner/tours/new?demo=1');

      // Edit Draft Link
      const editButtons = screen.getAllByRole('link', { name: /Chỉnh sửa/i });
      expect(editButtons[0].getAttribute('href')).toBe('/partner/tours/tour-draft-1/edit?demo=1');
      expect(editButtons[1].getAttribute('href')).toBe('/partner/tours/tour-approved-1/edit?demo=1');

      // View Pending Link
      const viewPendingLink = screen.getByRole('link', { name: /Xem chi tiết/i });
      expect(viewPendingLink.getAttribute('href')).toBe('/partner/tours/tour-pending-1/edit?demo=1');

      // Submit Draft Link
      const submitLink = screen.getByRole('link', { name: /Gửi duyệt/i });
      expect(submitLink.getAttribute('href')).toBe('/partner/tours/tour-draft-1/submit?demo=1');

      // Title link
      const titleLink = screen.getByRole('link', { name: /Tour Bản Nháp Mẫu/i });
      expect(titleLink.getAttribute('href')).toBe('/partner/tours/tour-draft-1/edit?demo=1');
    });

    it('keeps production URLs clean without demo parameter when isDemo is false', () => {
      render(<OperatorTourListView tours={mockTours} isDemo={false} />);

      const createLink = screen.getByRole('link', { name: /Tạo gói tour mới/i });
      expect(createLink.getAttribute('href')).toBe('/partner/tours/new');

      const editButtons = screen.getAllByRole('link', { name: /Chỉnh sửa/i });
      expect(editButtons[0].getAttribute('href')).toBe('/partner/tours/tour-draft-1/edit');
      expect(editButtons[1].getAttribute('href')).toBe('/partner/tours/tour-approved-1/edit');

      const viewPendingLink = screen.getByRole('link', { name: /Xem chi tiết/i });
      expect(viewPendingLink.getAttribute('href')).toBe('/partner/tours/tour-pending-1/edit');

      const submitLink = screen.getByRole('link', { name: /Gửi duyệt/i });
      expect(submitLink.getAttribute('href')).toBe('/partner/tours/tour-draft-1/submit');

      const titleLink = screen.getByRole('link', { name: /Tour Bản Nháp Mẫu/i });
      expect(titleLink.getAttribute('href')).toBe('/partner/tours/tour-draft-1/edit');
    });
  });
});
