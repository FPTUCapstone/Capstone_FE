export default function BrandLogo({ size = 24 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path
        d="M12 2a8 8 0 0 0-8 8c0 5.25 8 12 8 12s8-6.75 8-12a8 8 0 0 0-8-8z"
        className="text-brand-brightTeal fill-brand-teal/30"
      />
      <circle cx="12" cy="10" r="3" className="fill-white stroke-white" />
      <path d="M12 7v1" stroke="#FF7043" strokeWidth="2" />
    </svg>
  );
}
