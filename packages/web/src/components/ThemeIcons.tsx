const svgBase = {
  width: 16,
  height: 16,
  viewBox: '0 0 16 16',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.5,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
}

export function SunIcon() {
  return (
    <svg {...svgBase} aria-hidden="true">
      <circle cx="8" cy="8" r="3" />
      <line x1="8" y1="1.5" x2="8" y2="3" />
      <line x1="8" y1="13" x2="8" y2="14.5" />
      <line x1="1.5" y1="8" x2="3" y2="8" />
      <line x1="13" y1="8" x2="14.5" y2="8" />
      <line x1="3.05" y1="3.05" x2="4.11" y2="4.11" />
      <line x1="11.89" y1="11.89" x2="12.95" y2="12.95" />
      <line x1="12.95" y1="3.05" x2="11.89" y2="4.11" />
      <line x1="4.11" y1="11.89" x2="3.05" y2="12.95" />
    </svg>
  )
}

export function MoonIcon() {
  return (
    <svg {...svgBase} aria-hidden="true">
      <path d="M 12 10.5 A 5.5 5.5 0 1 1 5.5 4 A 4 4 0 0 0 12 10.5 Z" />
    </svg>
  )
}

export function MonitorIcon() {
  return (
    <svg {...svgBase} aria-hidden="true">
      <rect x="1" y="2" width="14" height="9" rx="1.5" />
      <line x1="8" y1="11" x2="8" y2="13.5" />
      <line x1="5" y1="13.5" x2="11" y2="13.5" />
    </svg>
  )
}
