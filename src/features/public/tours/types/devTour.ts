import type { PagedToursResponseDto, TourSearchItemDto } from './tour';

export interface DevTourSearchItemDto extends TourSearchItemDto { aggregateRating: number | null }
export interface DevPagedToursResponseDto extends PagedToursResponseDto { items: DevTourSearchItemDto[] }
export interface DevTourCategory { categoryId: number; code: string; name: string }
