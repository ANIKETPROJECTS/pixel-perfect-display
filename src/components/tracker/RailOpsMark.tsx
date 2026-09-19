export function RailOpsMark({ className = "size-6" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="RailsOps Workforce Tracker"
    >
      <rect width="48" height="48" rx="13" fill="currentColor" />
      <path d="M14 9.5H34L31.5 25.5C31 29 28 31 24 31C20 31 17 29 16.5 25.5L14 9.5Z" fill="#E8F3F7" />
      <path d="M18.5 35L13.5 41M29.5 35L34.5 41M19 36H29" stroke="#E8F3F7" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M18.5 15H29.5M17.5 21H30.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <circle cx="24" cy="26" r="2" fill="#F3B33D" />
      <path d="M37.5 12V24" stroke="#F3B33D" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="37.5" cy="9" r="3" fill="#F3B33D" />
    </svg>
  );
}