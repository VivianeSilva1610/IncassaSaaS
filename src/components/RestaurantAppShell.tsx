"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";

export type RestaurantNavItem = { href: string; label: string; icon: string; group: string };

type Labels = { menu: string; closeMenu: string; workspace: string; signOut: string };

function NavIcon({ name }: { name: string }) {
  const paths: Record<string, ReactNode> = {
    overview: <><rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="3" width="7" height="7" rx="2"/><rect x="3" y="14" width="7" height="7" rx="2"/><rect x="14" y="14" width="7" height="7" rx="2"/></>,
    sales: <><path d="M4 19V9M10 19V5M16 19v-7M22 19H2"/></>,
    tables: <><circle cx="7" cy="7" r="3"/><circle cx="17" cy="7" r="3"/><path d="M3 21v-4a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4v4"/></>,
    kitchen: <><path d="M6 3v7a3 3 0 0 0 6 0V3M9 3v18M18 3v18M15 3h3a3 3 0 0 1 0 6h-3"/></>,
    production: <><path d="M4 20V10l5 3V9l5 3V5h6v15ZM8 20v-3h3v3"/></>,
    purchases: <><path d="M3 4h2l2.4 10.4a2 2 0 0 0 2 1.6H18a2 2 0 0 0 2-1.6L21 8H7"/><circle cx="10" cy="20" r="1"/><circle cx="18" cy="20" r="1"/></>,
    stock: <><path d="m3 7 9-4 9 4-9 4ZM3 7v10l9 4 9-4V7M12 11v10"/></>,
    menu: <><path d="M4 6h16M4 12h16M4 18h10"/></>,
    costs: <><circle cx="12" cy="12" r="9"/><path d="M16 8.5C15.2 7.6 14 7 12.5 7 10.6 7 9 8.1 9 9.5s1.2 2.1 3.5 2.5 3.5 1.1 3.5 2.5-1.6 2.5-3.5 2.5c-1.5 0-2.8-.6-3.5-1.5M12.5 5v2M12.5 17v2"/></>,
    cash: <><rect x="3" y="6" width="18" height="13" rx="2"/><path d="M7 10h4M7 14h2M15 12h2"/></>,
    finance: <><path d="m3 17 5-5 4 3 7-8M14 7h5v5"/></>,
    management: <><path d="M4 19V9M10 19V4M16 19v-6M22 19H2"/></>,
    fiscal: <><path d="M6 2h9l4 4v16H6ZM14 2v5h5M9 13h6M9 17h6M9 9h2"/></>,
    team: <><circle cx="9" cy="8" r="3"/><path d="M3 21v-2a6 6 0 0 1 12 0v2"/><circle cx="17" cy="9" r="2"/><path d="M17 14a4 4 0 0 1 4 4v2"/></>,
    domain: <><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18"/></>,
    integrations: <><path d="M8 12h8M12 8v8"/><rect x="3" y="3" width="18" height="18" rx="5"/></>,
    plan: <><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20M6 15h4"/></>,
  };
  return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">{paths[name] ?? paths.overview}</svg>;
}

function isActive(pathname: string, href: string) {
  return href === "/restaurante" ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
}

export function RestaurantAppShell({ children, navItems, restaurantName, businessName, documentLabel, documentValue, userEmail, labels, signOutAction }: {
  children: ReactNode;
  navItems: RestaurantNavItem[];
  restaurantName: string;
  businessName: string;
  documentLabel: string | null;
  documentValue: string | null;
  userEmail: string;
  labels: Labels;
  signOutAction: () => Promise<void>;
}) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const groups = navItems.reduce<Record<string, RestaurantNavItem[]>>((all, item) => { (all[item.group] ??= []).push(item); return all; }, {});
  const activeHref = navItems.filter(item => isActive(pathname, item.href)).sort((a, b) => b.href.length - a.href.length)[0]?.href;

  const sidebar = <div className="flex h-full flex-col">
    <div className="flex h-20 items-center gap-3 border-b border-stone-200 px-5">
      <Image src="/logo.png" alt="INCASSA" width={40} height={40} className="rounded-xl shadow-sm" priority />
      <div className="min-w-0"><p className="text-[11px] font-bold tracking-[0.18em] text-amber-600">INCASSA</p><p className="truncate text-sm font-semibold text-stone-900">{businessName}</p></div>
    </div>
    <nav aria-label={labels.menu} className="flex-1 overflow-y-auto px-3 py-5">
      {Object.entries(groups).map(([group, items]) => <div key={group} className="mb-5">
        <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.16em] text-stone-400">{group}</p>
        <div className="space-y-1">{items.map(item => {
          const active = item.href === activeHref;
          return <Link key={item.href} href={item.href} onClick={() => setMobileOpen(false)} aria-current={active ? "page" : undefined} className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${active ? "bg-amber-50 text-amber-800" : "text-stone-600 hover:bg-stone-100 hover:text-stone-950"}`}>
            <span className={`grid h-8 w-8 place-items-center rounded-lg ${active ? "bg-amber-100 text-amber-700" : "text-stone-400 group-hover:text-stone-700"}`}><NavIcon name={item.icon}/></span>
            <span>{item.label}</span>{active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-amber-500"/>}
          </Link>;
        })}</div>
      </div>)}
    </nav>
    <div className="border-t border-stone-200 p-3"><div className="rounded-xl bg-stone-50 p-3">
      <p className="truncate text-sm font-semibold text-stone-800">{restaurantName}</p>
      {documentLabel && documentValue && <p className="mt-0.5 truncate text-xs text-stone-500">{documentLabel}: {documentValue}</p>}
      <p className="mt-2 truncate text-xs text-stone-500">{userEmail}</p>
      <form action={signOutAction}><button type="submit" className="mt-3 w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-left text-xs font-semibold text-stone-600 transition hover:border-stone-300 hover:text-stone-950">{labels.signOut}</button></form>
    </div></div>
  </div>;

  return <div className="min-h-screen bg-[#f7f7f5] text-stone-900">
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-stone-200 bg-white lg:block">{sidebar}</aside>
    {mobileOpen && <div className="fixed inset-0 z-50 lg:hidden"><button aria-label={labels.closeMenu} className="absolute inset-0 bg-stone-950/30 backdrop-blur-[2px]" onClick={() => setMobileOpen(false)}/><aside className="relative h-full w-[min(86vw,19rem)] border-r border-stone-200 bg-white shadow-2xl">{sidebar}</aside></div>}
    <div className="lg:pl-64">
      <header className="sticky top-0 z-20 border-b border-stone-200/90 bg-white/90 backdrop-blur-xl"><div className="flex h-16 items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-3"><button type="button" onClick={() => setMobileOpen(true)} aria-label={labels.menu} className="grid h-10 w-10 place-items-center rounded-xl border border-stone-200 text-stone-600 lg:hidden"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5"><path d="M4 7h16M4 12h16M4 17h16"/></svg></button><div className="min-w-0"><p className="text-[10px] font-bold uppercase tracking-[0.14em] text-stone-400">{labels.workspace}</p><p className="truncate text-sm font-semibold text-stone-800">{restaurantName}</p></div></div>
        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-amber-100 text-sm font-bold text-amber-800" title={userEmail}>{(restaurantName || userEmail).trim().charAt(0).toUpperCase()}</div>
      </div></header>
      <main className="mx-auto w-full max-w-[1440px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8">{children}</main>
    </div>
  </div>;
}
