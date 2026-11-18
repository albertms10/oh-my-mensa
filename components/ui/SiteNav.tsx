"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "Overview" },
  { href: "/details", label: "Details" },
];

export function SiteNav({ className = "" }: { className?: string }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Main" className={`inline-flex rounded-full border border-zinc-200 bg-white p-0.5 text-sm ${className}`}>
      {LINKS.map((l) => {
        const active = pathname === l.href;
        return (
          <Link key={l.href} href={l.href} aria-current={active ? "page" : undefined}
            className={`rounded-full px-3 py-1 font-medium ${active ? "bg-zinc-900 text-white" : "text-zinc-700 hover:bg-zinc-100"}`}>
            {l.label}
          </Link>
        );
      })}
    </nav>
  );
}
