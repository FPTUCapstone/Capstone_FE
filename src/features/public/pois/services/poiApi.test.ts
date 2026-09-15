import { describe, expect, it } from 'vitest';

import { parsePagedPois, parsePoiDetail } from './poiApi';

describe('POI API response parsing', () => {
  it('accepts nullable list fields without inventing values', () => {
    const page = parsePagedPois({
      page: 1,
      pageSize: 20,
      totalCount: 1,
      totalPages: 1,
      items: [
        {
          id: 42,
          name: 'Mỹ Khê',
          categoryId: 3,
          categoryName: 'Bãi biển',
          latitude: 16.061,
          longitude: 108.246,
          address: null,
          indoorOutdoor: 'Outdoor',
          averageVisitDurationMinutes: 90,
          hasShelter: false,
          averageRating: null,
          reviewCount: 0,
          thumbnailUrl: null,
          distanceKm: null,
          isOpenNow: true,
        },
      ],
    });

    expect(page.items[0]).toMatchObject({
      id: 42,
      address: null,
      averageRating: null,
      thumbnailUrl: null,
      distanceKm: null,
    });
  });

  it('rejects malformed detail payloads at the service boundary', () => {
    expect(() => parsePoiDetail({ id: '42', name: 'Mỹ Khê' })).toThrow(
      'Dữ liệu địa điểm không hợp lệ.',
    );
  });

  it('accepts null times when the backend marks an opening-hours row closed', () => {
    const detail = parsePoiDetail({
      id: 1,
      name: 'Da Lat Flower Park',
      description: 'Công viên hoa thử nghiệm TM-98',
      status: 'Active',
      categoryId: 1,
      categoryName: 'Attraction',
      latitude: 11.941755,
      longitude: 108.438278,
      address: 'Đà Lạt, Lâm Đồng',
      indoorOutdoor: 'Mixed',
      averageVisitDurationMinutes: 90,
      hasShelter: true,
      scenicScore: null,
      photoRating: null,
      averageRating: null,
      reviewCount: 0,
      isOpenNow: true,
      openingHours: [
        { dayOfWeek: 0, openTime: null, closeTime: null, isClosed: true },
        { dayOfWeek: 1, openTime: '08:00:00', closeTime: '17:00:00', isClosed: false },
      ],
      photos: [],
      tags: [{ id: 1, name: 'Nature' }],
      createdAtUtc: '2026-09-09T11:20:00Z',
      updatedAtUtc: '2026-09-09T11:20:00Z',
    });

    expect(detail.openingHours[0]).toEqual({
      dayOfWeek: 0,
      openTime: null,
      closeTime: null,
      isClosed: true,
    });
  });
});
