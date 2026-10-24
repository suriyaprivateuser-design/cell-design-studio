"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpenCheck, Home, Library, Network, Target } from "lucide-react";
import { Logo } from "./Logo";

const NAV = [
  { href: "/", label: "หน้าแรก", icon: Home },
  { href: "/missions", label: "ภารกิจ", icon: Target },
  { href: "/library", label: "คลังเนื้อเยื่อ", icon: Library },
  { href: "/classification", label: "แผนผัง", icon: Network },
  { href: "/quiz", label: "แบบทดสอบ", icon: BookOpenCheck },
];

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

export function AppHeader() {
  const pathname = usePathname();
  return (
    <header className="sticky top-0 z-30 border-b border-line/70 bg-canvas/85 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 md:h-16 md:px-6">
        <Link href="/" className="flex items-center gap-2.5" aria-label="Cell Design Studio หน้าแรก">
          <Logo className="h-8 w-8" />
          <span className="text-[15px] font-semibold tracking-tight text-sage-900 md:text-base">Cell Design Studio</span>
        </Link>
        <nav className="hidden items-center gap-1 md:flex" aria-label="เมนูหลัก">
          {NAV.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={`rounded-full px-3.5 py-2 text-sm transition-colors ${
                isActive(pathname, href) ? "bg-sage-100 font-medium text-sage-900" : "text-muted hover:bg-sage-50 hover:text-ink"
              }`}
            >
              {label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}

export function MobileNav() {
  const pathname = usePathname();
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
      aria-label="เมนูหลัก"
    >
      <div className="mx-auto grid max-w-md grid-cols-5">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = isActive(pathname, href);
          return (
            <Link key={href} href={href} className="flex flex-col items-center gap-0.5 py-2 text-[10.5px]">
              <Icon className={`h-5 w-5 ${active ? "text-sage-700" : "text-faint"}`} strokeWidth={active ? 2.2 : 1.8} />
              <span className={active ? "font-medium text-sage-800" : "text-muted"}>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
