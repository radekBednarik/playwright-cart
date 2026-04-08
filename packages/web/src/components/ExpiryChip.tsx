type Tier = 'green' | 'yellow' | 'red'

const CHIP_STYLES: Record<Tier, string> = {
  green: 'bg-tn-green/15 text-tn-green',
  yellow: 'bg-tn-yellow/15 text-tn-yellow',
  red: 'bg-tn-red/15 text-tn-red',
}

const DOT_STYLES: Record<Tier, string> = {
  green: 'bg-tn-green',
  yellow: 'bg-tn-yellow',
  red: 'bg-tn-red',
}

export default function ExpiryChip({ label, tier }: { label: string; tier: Tier }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 font-display text-xs font-semibold ${CHIP_STYLES[tier]}`}
    >
      <span className={`inline-block size-1.5 flex-shrink-0 rounded-full ${DOT_STYLES[tier]}`} />
      {label}
    </span>
  )
}
