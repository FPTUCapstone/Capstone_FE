import Link from 'next/link';

import { PublicNavigation } from '@/components/navigation/PublicNavigation';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { ROUTES } from '@/lib/routes';

const destinationCards = [
  { city: 'Da Nang', detail: 'Coast, city landmarks, and day-trip gateways', icon: 'waves' },
  { city: 'Hoi An', detail: 'Heritage streets, lanterns, and local craft', icon: 'festival' },
  { city: 'Hue', detail: 'Imperial heritage, gardens, and regional cuisine', icon: 'account_balance' },
];

export function LandingPage() {
  return (
    <div className="min-h-screen bg-[#f6f8fa] text-[#191c1e]">
      <PublicNavigation />
      <main>
        <section className="relative overflow-hidden border-b border-[#d8dadd] bg-[linear-gradient(120deg,#f3fbf9_0%,#f6f8fa_55%,#edf3f7_100%)] px-4 py-14 sm:px-8 md:py-20">
          <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[minmax(0,1.05fr)_minmax(420px,.95fr)]">
            <div className="relative z-10 max-w-2xl">
              <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#9edbd2] bg-white/80 px-3 py-1.5 text-xs font-extrabold uppercase tracking-[0.14em] text-[#006b5f]">
                <span className="material-symbols-outlined text-base" aria-hidden="true">explore</span>
                Central Vietnam travel
              </p>
              <h1 className="text-4xl font-black leading-[1.05] tracking-[-0.04em] text-[#00152a] sm:text-5xl md:text-6xl">
                Explore Central Vietnam <span className="text-[#007d6e]">with confidence.</span>
              </h1>
              <p className="mt-6 max-w-xl text-base leading-relaxed text-[#4f5863] sm:text-lg">
                Discover published destination information, compare available tours, and prepare your next journey with TripMate on the Web.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link href="#discover" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#007d6e] px-6 py-3 text-sm font-bold text-white shadow-md hover:bg-[#006b5f]">
                  Explore Points of Interest
                  <span className="material-symbols-outlined text-lg" aria-hidden="true">arrow_forward</span>
                </Link>
                <Link href="#tours" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#eb5b49] px-6 py-3 text-sm font-bold text-white shadow-md hover:bg-[#d94b3a]">
                  Search Published Tours
                </Link>
              </div>
              <div className="mt-8 flex gap-3 rounded-2xl border border-[#d8dadd] bg-white/75 p-4 text-sm leading-relaxed text-[#4f5863] backdrop-blur-sm">
                <span className="material-symbols-outlined text-xl text-[#006b5f]" aria-hidden="true">devices</span>
                <p>Planning and discovery are available on Web. Active-trip navigation and other device-dependent functions remain in the Mobile experience.</p>
              </div>
            </div>

            <div className="relative min-h-[440px] overflow-hidden rounded-[2rem] bg-[#00283a] p-6 text-white shadow-[0_28px_70px_rgba(0,40,58,0.25)] sm:p-8">
              <div className="absolute -right-24 -top-16 h-80 w-80 rounded-full border border-[#71f8e4]/40" />
              <div className="absolute -right-2 top-20 h-80 w-80 rounded-full border border-white/25" />
              <svg className="absolute inset-0 h-full w-full opacity-35" viewBox="0 0 520 440" fill="none" aria-hidden="true">
                <path d="M78 405C101 330 171 314 194 247C218 177 174 126 223 64C250 30 303 29 347 42" stroke="#71F8E4" strokeWidth="4" strokeLinecap="round" strokeDasharray="8 12" />
                <circle cx="80" cy="401" r="8" fill="#EB5B49" />
                <circle cx="194" cy="247" r="8" fill="#71F8E4" />
                <circle cx="347" cy="42" r="8" fill="#71F8E4" />
              </svg>
              <div className="relative flex h-full flex-col justify-between">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-[#71f8e4]">Published destination content</p>
                    <h2 className="mt-2 text-2xl font-extrabold">Central Vietnam</h2>
                  </div>
                  <StatusBadge tone="teal">Available</StatusBadge>
                </div>
                <div className="space-y-3">
                  {destinationCards.map((destination, index) => (
                    <article key={destination.city} className={`flex items-center gap-4 rounded-2xl border p-4 backdrop-blur-md ${index === 1 ? 'border-[#eb5b49] bg-[#eb5b49]/15' : 'border-white/20 bg-white/10'}`}>
                      <span className="material-symbols-outlined rounded-xl bg-white/10 p-2 text-[#71f8e4]" aria-hidden="true">{destination.icon}</span>
                      <div>
                        <h3 className="font-extrabold">{destination.city}</h3>
                        <p className="mt-1 text-xs leading-relaxed text-[#d1e4ff]">{destination.detail}</p>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="discover" className="scroll-mt-24 px-4 py-16 sm:px-8 md:py-20">
          <div className="mx-auto max-w-7xl">
            <div className="max-w-2xl">
              <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-[#006b5f]">Choose how to explore</p>
              <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-[#00152a] sm:text-4xl">Plan independently or discover a published tour.</h2>
            </div>
            <div className="mt-9 grid gap-6 md:grid-cols-2">
              <article className="rounded-3xl border border-[#d8dadd] bg-white p-7 shadow-[0_14px_40px_rgba(0,21,42,0.07)] sm:p-8">
                <span className="material-symbols-outlined rounded-2xl bg-[#e8f7f4] p-3 text-3xl text-[#006b5f]" aria-hidden="true">location_on</span>
                <h3 className="mt-6 text-2xl font-extrabold text-[#00152a]">Explore Points of Interest</h3>
                <p className="mt-3 text-sm leading-relaxed text-[#59616b]">Browse approved destination content and prepare a personal discovery plan.</p>
                <p className="mt-6 text-sm font-bold text-[#006b5f]">Public discovery entry</p>
              </article>
              <article id="tours" className="scroll-mt-24 rounded-3xl border border-[#d8dadd] bg-white p-7 shadow-[0_14px_40px_rgba(0,21,42,0.07)] sm:p-8">
                <span className="material-symbols-outlined rounded-2xl bg-[#fff0ed] p-3 text-3xl text-[#d94b3a]" aria-hidden="true">confirmation_number</span>
                <h3 className="mt-6 text-2xl font-extrabold text-[#00152a]">Search Published Tours</h3>
                <p className="mt-3 text-sm leading-relaxed text-[#59616b]">Review Tour Operator packages through a clear public discovery entry.</p>
                <p className="mt-6 text-sm font-bold text-[#d94b3a]">Published tour entry</p>
              </article>
            </div>
          </div>
        </section>

        <section className="bg-[#00152a] px-4 py-14 text-white sm:px-8">
          <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-7 md:flex-row md:items-center">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-[#71f8e4]">Grow with TripMate Partner</p>
              <h2 className="mt-3 text-3xl font-extrabold">Bring your travel business to TripMate.</h2>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[#d1e4ff]">Business guests can begin the approved Tour Operator application and follow its review status.</p>
            </div>
            <Link href={ROUTES.partner.register} className="inline-flex min-h-12 shrink-0 items-center justify-center rounded-xl bg-white px-6 py-3 text-sm font-bold text-[#00152a] hover:bg-[#e8f7f4]">
              Register as Tour Operator
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-[#d8dadd] bg-white px-4 py-6 text-sm text-[#59616b] sm:px-8">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4">
          <p>© 2026 TripMate. Batch 1 Web UI prototype.</p>
          <Link href={ROUTES.admin.login} className="font-semibold text-[#006b5f] hover:underline">Admin Portal</Link>
        </div>
      </footer>
    </div>
  );
}
