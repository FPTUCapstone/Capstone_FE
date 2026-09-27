export type PageItem = number | 'ellipsis';

interface CoordinateInput {
  id: number;
  latitude: number;
  longitude: number;
}

export interface ProjectedPoint {
  id: number;
  x: number;
  y: number;
}

export function projectPoiCoordinates(items: CoordinateInput[]): ProjectedPoint[] {
  const valid = items.filter(
    ({ latitude, longitude }) => Number.isFinite(latitude) && Number.isFinite(longitude),
  );
  if (valid.length === 0) return [];
  if (valid.length === 1) return [{ id: valid[0].id, x: 50, y: 50 }];

  const latitudes = valid.map(({ latitude }) => latitude);
  const longitudes = valid.map(({ longitude }) => longitude);
  const minLatitude = Math.min(...latitudes);
  const maxLatitude = Math.max(...latitudes);
  const minLongitude = Math.min(...longitudes);
  const maxLongitude = Math.max(...longitudes);
  const latitudeRange = Math.max(maxLatitude - minLatitude, 0.000001);
  const longitudeRange = Math.max(maxLongitude - minLongitude, 0.000001);

  return valid.map(({ id, latitude, longitude }) => ({
    id,
    x: 10 + ((longitude - minLongitude) / longitudeRange) * 80,
    y: 12 + ((maxLatitude - latitude) / latitudeRange) * 76,
  }));
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} phút`;
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return remainder ? `${hours} giờ ${remainder} phút` : `${hours} giờ`;
}

export function buildPageItems(currentPage: number, totalPages: number): PageItem[] {
  if (totalPages <= 1) return totalPages === 1 ? [1] : [];
  if (totalPages <= 9) return Array.from({ length: totalPages }, (_, index) => index + 1);

  const pages = new Set([1, totalPages]);
  for (let page = currentPage - 2; page <= currentPage + 2; page += 1) {
    if (page > 1 && page < totalPages) pages.add(page);
  }
  const ordered = [...pages].sort((a, b) => a - b);
  const result: PageItem[] = [];
  ordered.forEach((page, index) => {
    if (index > 0 && page - ordered[index - 1] > 1) result.push('ellipsis');
    result.push(page);
  });
  return result;
}

export function formatReviewCount(count: number): string {
  return new Intl.NumberFormat('vi-VN').format(count);
}
