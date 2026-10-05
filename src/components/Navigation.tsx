"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Ship,
  Columns2,
  BookOpen,
  RotateCcw,
  ClipboardCheck,
  Settings,
  Info,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";

const navItems = [
  { href: "/", label: "Home", icon: Ship },
  { href: "/explore", label: "Explore", icon: Columns2 },
  { href: "/learn", label: "Learn", icon: BookOpen },
  { href: "/review", label: "Review", icon: RotateCcw },
  { href: "/exam", label: "Exam", icon: ClipboardCheck },
  { href: "/settings", label: "Settings", icon: Settings },
  { href: "/about", label: "About", icon: Info },
];

export function BottomNav() {
  const pathname = usePathname();
  const [isLandscape, setIsLandscape] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(orientation: landscape) and (max-height: 500px)");
    setIsLandscape(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsLandscape(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  if (pathname === "/login") return null;
  if (pathname.startsWith("/explore") && isLandscape) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-sky bg-white md:hidden">
      <div className="flex items-center justify-around py-2">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-col items-center gap-0.5 px-3 py-1 text-xs font-medium transition-colors",
                active ? "text-ocean" : "text-muted hover:text-navy"
              )}
            >
              <Icon className="h-5 w-5" />
              <span>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const { user, signOut } = useAuth();

  if (pathname === "/login") return null;

  const initial = user?.email?.charAt(0).toUpperCase() ?? "?";

  return (
    <aside className="hidden md:flex md:w-56 md:flex-col md:border-r md:border-sky md:bg-white">
      <div className="flex items-center gap-2 px-5 py-5">
        <span className="text-2xl">⚓</span>
        <span className="text-lg font-semibold text-navy">Leinen los!</span>
      </div>
      <nav className="flex flex-1 flex-col gap-1 px-3">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-sky text-ocean"
                  : "text-muted hover:bg-sky/50 hover:text-navy"
              )}
            >
              <Icon className="h-5 w-5" />
              {label}
            </Link>
          );
        })}
      </nav>
      {user && (
        <div className="border-t border-sky px-3 py-3">
          <div className="flex items-center gap-2 px-3">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-ocean text-xs font-semibold text-white">
              {initial}
            </div>
            <span className="flex-1 truncate text-xs text-muted">
              {user.email}
            </span>
            <button
              onClick={signOut}
              className="text-muted transition-colors hover:text-navy"
              title="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </aside>
  );
}
