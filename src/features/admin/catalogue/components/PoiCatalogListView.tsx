'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { ROUTES } from '@/lib/routes';

export interface AdminPoiItem {
  id: number;
  name: string;
  category: string;
  address: string;
  coordinates: { lat: number; lng: number };
  openingHoursSummary: string;
  status: 'Active' | 'Draft' | 'Archived';
}

interface PoiCatalogListViewProps {
  initialPois?: AdminPoiItem[];
}

export function PoiCatalogListView({ initialPois = [] }: PoiCatalogListViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const categories = useMemo(() => {
    const set = new Set<string>(['All']);
    for (const poi of initialPois) {
      if (poi.category) set.add(poi.category);
    }
    return Array.from(set);
  }, [initialPois]);

  const filteredPois = useMemo(() => {
    return initialPois.filter((poi) => {
      const matchesCategory = selectedCategory === 'All' || poi.category === selectedCategory;
      const matchesSearch =
        searchTerm === '' ||
        poi.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        poi.address.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [initialPois, searchTerm, selectedCategory]);

  return (
    <div className="pb-16 text-[#1C2923]">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <header className="mb-6 rounded-2xl border border-[#2A3B33] bg-[#1C2923] p-6 text-[#F7F6F2] shadow-sm md:p-8">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div>
              <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-[#758B74] bg-[#273830] px-3 py-1 text-xs font-bold tracking-wider text-[#E8EFE9] uppercase">
                <span className="material-symbols-outlined text-[14px]">location_on</span>
                <span>Master Data Management</span>
              </div>
              <h1 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
                Points of Interest Catalog
              </h1>
              <p className="mt-2 max-w-3xl text-sm leading-relaxed text-[#A3B3AB]">
                Screen #16: Manage tourist attractions, geo-coordinates, and operating schedules powering the TripMate routing engine.
              </p>
            </div>

            <Link
              href={ROUTES.admin.createPoi}
              className="inline-flex items-center gap-2 rounded-xl bg-[#245747] border border-[#758B74] px-4 py-2.5 text-xs font-bold text-white transition hover:bg-[#1B4337] shadow-xs"
            >
              <span className="material-symbols-outlined text-[16px]">add_location_alt</span>
              <span>Create New POI</span>
            </Link>
          </div>
        </header>

        {/* Filters and Search Bar */}
        <div className="mb-6 flex flex-col gap-4 rounded-2xl border border-[#E6E4DD] bg-[#FFFFFF] p-4 shadow-xs sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <label htmlFor="poi-category-filter" className="text-xs font-bold text-[#4A5851]">
              Category:
            </label>
            <select
              id="poi-category-filter"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="rounded-xl border border-[#D8D5CC] bg-[#F7F6F2] px-3 py-1.5 text-xs font-semibold text-[#1C2923] focus:border-[#245747] focus:bg-white focus:outline-hidden"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div className="relative w-full sm:w-72">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-[#74827B]">
              search
            </span>
            <input
              type="search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name or address…"
              aria-label="Search Points of Interest"
              className="w-full rounded-xl border border-[#D8D5CC] bg-[#F7F6F2] py-2 pl-9 pr-3 text-xs text-[#1C2923] placeholder-[#74827B] transition focus:border-[#245747] focus:bg-white focus:outline-hidden"
            />
          </div>
        </div>

        {/* POI Data Table */}
        <div className="overflow-hidden rounded-2xl border border-[#E6E4DD] bg-[#FFFFFF] shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs" aria-label="Points of Interest Data Table">
              <thead className="border-b border-[#E6E4DD] bg-[#F0EFEA] text-[11px] font-bold uppercase tracking-wider text-[#4A5851]">
                <tr>
                  <th scope="col" className="px-5 py-3.5">ID</th>
                  <th scope="col" className="px-5 py-3.5">Point of Interest</th>
                  <th scope="col" className="px-5 py-3.5">Category</th>
                  <th scope="col" className="px-5 py-3.5">Spatial Coordinates</th>
                  <th scope="col" className="px-5 py-3.5">Opening Schedule</th>
                  <th scope="col" className="px-5 py-3.5">Status</th>
                  <th scope="col" className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E6E4DD]">
                {filteredPois.length > 0 ? (
                  filteredPois.map((poi) => (
                    <tr key={poi.id} className="hover:bg-[#F7F6F2]/70 transition-colors">
                      <td className="px-5 py-4 font-mono font-bold text-[#1C2923]">
                        #{poi.id}
                      </td>
                      <td className="px-5 py-4">
                        <div className="font-bold text-[#1C2923]">{poi.name}</div>
                        <div className="text-[11px] text-[#74827B] truncate max-w-xs">{poi.address}</div>
                      </td>
                      <td className="px-5 py-4">
                        <span className="inline-flex rounded-full bg-[#E8EFE9] px-2.5 py-0.5 text-[11px] font-semibold text-[#1C2923]">
                          {poi.category}
                        </span>
                      </td>
                      <td className="px-5 py-4 font-mono text-[11px] text-[#4A5851]">
                        {poi.coordinates.lat.toFixed(4)}, {poi.coordinates.lng.toFixed(4)}
                      </td>
                      <td className="px-5 py-4 text-[#4A5851]">
                        {poi.openingHoursSummary}
                      </td>
                      <td className="px-5 py-4">
                        {poi.status === 'Active' ? (
                          <span className="inline-flex items-center gap-1 rounded-full border border-[#BCE0CD] bg-[#E7F2EC] px-2.5 py-0.5 text-[11px] font-semibold text-[#1B5E3C]">
                            <span className="material-symbols-outlined text-[12px]">check_circle</span>
                            <span>Active</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full border border-[#D8D5CC] bg-[#EDECE8] px-2.5 py-0.5 text-[11px] font-semibold text-[#74827B]">
                            <span className="material-symbols-outlined text-[12px]">edit_note</span>
                            <span>Draft</span>
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <Link
                          href={`/pois/${poi.id}`}
                          target="_blank"
                          className="inline-flex items-center gap-1 rounded-lg border border-[#D8D5CC] bg-white px-2.5 py-1 text-xs font-semibold text-[#1C2923] hover:bg-[#F0EFEA] transition"
                        >
                          <span>Preview</span>
                          <span className="material-symbols-outlined text-[14px]">open_in_new</span>
                        </Link>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="px-5 py-16 text-center text-[#74827B]">
                      <div className="mx-auto flex max-w-sm flex-col items-center">
                        <span className="material-symbols-outlined text-4xl text-[#758B74]">inventory_2</span>
                        <p className="mt-3 text-sm font-bold text-[#1C2923]">No points of interest available</p>
                        <p className="mt-1 text-xs text-[#74827B]">
                          Catalog records will appear here when the directory service is connected.
                        </p>
                        <Link
                          href={ROUTES.admin.createPoi}
                          className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-[#245747] px-4 py-2 text-xs font-bold text-white transition hover:bg-[#1B4337]"
                        >
                          <span className="material-symbols-outlined text-[16px]">add_location_alt</span>
                          <span>Create New POI</span>
                        </Link>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
