'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

function LogoIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <defs>
        <linearGradient id="logo-g" x1="0" y1="0" x2="24" y2="24" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#00d4aa" />
          <stop offset="1" stopColor="#4c8dff" />
        </linearGradient>
      </defs>
      <path d="M12 2.5L21 7V17L12 21.5L3 17V7Z" stroke="url(#logo-g)" strokeWidth="1.6" />
      <path d="M8 15L12 7L16 15M9.5 12.5H14.5" stroke="#00d4aa" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

const ICONS = {
  star: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path d="M12 3l2.6 5.6 6 .7-4.5 4.2 1.2 6L12 16.8 6.7 19.5l1.2-6L3.4 9.3l6-.7z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  ),
  pulse: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path d="M3 12h4l2-6 4 12 2-6h6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  source: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path d="M4 6h16M4 12h16M4 18h10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <circle cx="18" cy="18" r="2.2" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  ),
  plus: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <rect x="3.5" y="3.5" width="17" height="17" rx="4" stroke="currentColor" strokeWidth="1.6" />
      <path d="M12 8v8M8 12h8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  ),
}

interface NavItemProps {
  icon: React.ReactNode
  label: string
  href: string
  active: boolean
  count?: number
}

function NavItem({ icon, label, href, active, count }: NavItemProps) {
  return (
    <Link
      href={href}
      className="relative flex items-center gap-2.5 px-2.5 py-[9px] my-0.5 rounded-lg text-[13px] transition-all duration-150"
      style={{
        color: active ? '#e6e9f2' : 'var(--text-dim)',
        border: active ? '1px solid rgba(0,212,170,0.22)' : '1px solid transparent',
        background: active
          ? 'linear-gradient(90deg, rgba(0,212,170,0.14), rgba(0,212,170,0.03))'
          : 'transparent',
      }}
    >
      {active && (
        <span
          className="absolute rounded-sm"
          style={{
            left: -14, top: 8, bottom: 8, width: 2,
            background: 'var(--accent)',
            boxShadow: '0 0 10px var(--accent)',
          }}
        />
      )}
      {icon}
      <span>{label}</span>
      {count !== undefined && (
        <span
          className="ml-auto text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
          style={{ background: 'rgba(255,255,255,0.06)', color: '#c8cfe0' }}
        >
          {count}
        </span>
      )}
    </Link>
  )
}

export default function Sidebar() {
  const searchParams = useSearchParams()
  const nav = searchParams.get('nav') ?? 'featured'

  return (
    <aside
      className="hidden md:flex w-[200px] flex-none flex-col min-h-screen sticky top-0 z-10"
      style={{
        background: '#0b0d13',
        borderRight: '1px solid var(--line-soft)',
        padding: '20px 14px 16px',
      }}
    >
      <div
        className="flex items-center gap-2.5 px-2 pb-[18px] mb-3.5"
        style={{ borderBottom: '1px solid var(--line-soft)' }}
      >
        <LogoIcon />
        <span className="font-bold tracking-[0.08em] text-sm text-[#e6e9f2]">AI HOT</span>
        <span
          className="w-[5px] h-[5px] rounded-full ml-1 mt-0.5"
          style={{ background: 'var(--accent)', boxShadow: '0 0 10px var(--accent)' }}
        />
      </div>

      <div
        className="text-[10px] tracking-[0.18em] uppercase px-2.5 py-1.5 font-semibold"
        style={{ color: 'var(--text-mute)' }}
      >
        浏览
      </div>
      <NavItem icon={ICONS.star}   label="精选"       href="/?nav=featured" active={nav === 'featured'} count={24} />
      <NavItem icon={ICONS.pulse}  label="全部AI动态"  href="/?nav=all"      active={nav === 'all'} />

      <div
        className="text-[10px] tracking-[0.18em] uppercase px-2.5 py-1.5 mt-3.5 font-semibold"
        style={{ color: 'var(--text-mute)' }}
      >
        信源
      </div>
      <NavItem icon={ICONS.source} label="信源"       href="/?nav=sources"  active={nav === 'sources'} />
      <NavItem icon={ICONS.plus}   label="信源提报"    href="/?nav=submit"   active={nav === 'submit'} />
    </aside>
  )
}
