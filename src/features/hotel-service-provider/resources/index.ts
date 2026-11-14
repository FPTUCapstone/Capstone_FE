export { hotelProviderVi, type HotelProviderViResources } from './vi';
export { hotelProviderEn, type HotelProviderEnResources } from './en';

// Primary Vietnamese-first resources as requested by Owner and UX Specification
import { hotelProviderVi } from './vi';
export const hotelProviderResource = hotelProviderVi;
export default hotelProviderResource;
