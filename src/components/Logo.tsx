export function Logo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden>
      <rect width="40" height="40" rx="12" fill="#e5eedf" />
      <path d="M20 7.5 30.8 13.8v12.4L20 32.5 9.2 26.2V13.8Z" fill="#b1caa2" />
      <path d="M20 10.4 28.3 15.2v9.6L20 29.6l-8.3-4.8v-9.6Z" fill="#f2ead0" />
      <ellipse cx="18.6" cy="20.6" rx="5.6" ry="5.2" fill="#cfe7ef" />
      <circle cx="24.2" cy="16.6" r="2.6" fill="#9a88c4" />
    </svg>
  );
}
