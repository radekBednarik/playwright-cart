import type { AnchorHTMLAttributes, ReactNode } from 'react'

interface Props extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'children' | 'href'> {
  href: string
  children: ReactNode
}

export default function ExternalLink({ children, className, rel, target, ...props }: Props) {
  return (
    <a
      {...props}
      target={target ?? '_blank'}
      rel={rel ?? 'noopener noreferrer'}
      className={className}
    >
      {children}
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        className="size-4"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M14 5h5v5" />
        <path d="M10 14 19 5" />
        <path d="M19 14v5h-14v-14h5" />
      </svg>
      <span className="sr-only">Opens in new tab</span>
    </a>
  )
}
