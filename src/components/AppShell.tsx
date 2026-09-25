"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuth } from "./AuthProvider";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { KeyRound, LogOut, Menu, UserRound } from "lucide-react";
import { useRef, useState } from "react";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", permission: null },
  { href: "/blogs", label: "Blogs", permission: null },
  { href: "/review", label: "Review queue", permission: "blog.review" },
  { href: "/publish", label: "Publish queue", permission: "blog.publish" },
  { href: "/users", label: "Users", permission: "user.manage" },
  { href: "/companies", label: "Companies", permission: "company.manage" },
  { href: "/audit-logs", label: "Audit log", permission: "audit.view_company" },
] as const;

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, hasPermission, logout, activeCompanyId, setActiveCompanyId } =
    useAuth();
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileCloseTimer = useRef<number | null>(null);

  function cancelProfileClose() {
    if (profileCloseTimer.current) {
      window.clearTimeout(profileCloseTimer.current);
      profileCloseTimer.current = null;
    }
  }

  function scheduleProfileClose() {
    cancelProfileClose();
    profileCloseTimer.current = window.setTimeout(() => {
      setProfileOpen(false);
      profileCloseTimer.current = null;
    }, 250);
  }

  if (!user) return null;

  return (
    <div
      className="min-h-screen bg-canvas md:grid md:grid-cols-[var(--sidebar-width)_minmax(0,1fr)]"
      style={{ "--sidebar-width": "16rem" } as React.CSSProperties}
    >
      {drawerOpen && (
        <button
          aria-label="Close navigation"
          onClick={() => setDrawerOpen(false)}
          className="fixed inset-0 z-30 bg-ink/50 md:hidden"
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-[var(--sidebar-width)] -translate-x-full flex-col bg-sidebar text-white transition-transform duration-200 ease-in-out md:sticky md:top-0 md:h-screen md:translate-x-0 border-r border-white/10",
          drawerOpen && "translate-x-0",
        )}
      >
        <div className="flex h-16 items-center border-b border-white/10 px-6">
          <div className="flex flex-col justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/brand/crediple_dark.png"
              alt="Crediple"
              className="h-6 w-auto max-w-full object-contain"
            />
            <span className="font-mono text-[9px] uppercase tracking-[0.25em] text-white/50">
              Blog CMS
            </span>
          </div>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-4">
          {NAV_ITEMS.filter(
            (item) => !item.permission || hasPermission(item.permission),
          ).map((item) => {
            const active =
              pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setDrawerOpen(false)}
                className={cn(
                  "flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-accent text-white shadow-sm"
                    : "text-white/65 hover:bg-white/5 hover:text-white",
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      <div className="flex min-w-0 flex-col">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-4 border-b border-line bg-panel/95 px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <button
              aria-label="Open navigation"
              onClick={() => setDrawerOpen(true)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-ink hover:bg-ink/5 focus-visible:ring-2 focus-visible:ring-accent/40 md:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>

          <div className="ml-auto flex items-center gap-3">
            {user.companies.length > 1 ? (
              <select
                value={activeCompanyId ?? ""}
                onChange={(e) => setActiveCompanyId(e.target.value)}
                className="h-9 rounded-lg border border-line bg-panel px-3 text-xs font-medium text-ink outline-none transition-colors hover:border-line/80 focus:border-accent"
              >
                {user.companies.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            ) : (
              <span className="text-xs font-medium text-ink/60">
                {user.companies[0]?.name}
              </span>
            )}

            <ThemeToggle />

            <div
              className="relative"
              onMouseEnter={cancelProfileClose}
              onMouseLeave={scheduleProfileClose}
            >
              <button
                type="button"
                aria-label="Open profile menu"
                aria-expanded={profileOpen}
                aria-haspopup="menu"
                onClick={() => setProfileOpen((open) => !open)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-line bg-panel text-ink transition-colors hover:border-accent hover:bg-accent-soft focus-visible:ring-2 focus-visible:ring-accent/40"
              >
                <UserRound className="h-4 w-4" aria-hidden="true" />
              </button>

              {profileOpen && (
                <div
                  role="menu"
                  aria-label="Profile menu"
                  onMouseEnter={cancelProfileClose}
                  onMouseLeave={scheduleProfileClose}
                  className="absolute right-0 z-30 mt-2 w-60 overflow-hidden rounded-xl border border-line bg-panel shadow-lg animate-in fade-in-50 zoom-in-95 duration-100"
                >
                  <div className="border-b border-line px-4 py-3">
                    <p className="truncate text-sm font-semibold text-ink">
                      {user.name}
                    </p>
                    <p className="mt-0.5 truncate text-xs text-ink/70">
                      {user.role?.label ?? "User"}
                    </p>
                  </div>
                  <div className="p-1.5 space-y-0.5">
                    <Link
                      href="/change-password"
                      role="menuitem"
                      onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-ink/70 transition-colors hover:bg-ink/5 hover:text-ink
                      focus-visible:ring-2 focus-visible:ring-accent/40"
                    >
                      <KeyRound className="h-4 w-4" aria-hidden="true" />
                      Change password
                    </Link>
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        cancelProfileClose();
                        setProfileOpen(false);
                        void logout();
                      }}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-ink/70 transition-colors hover:bg-ink/5 hover:text-ink focus-visible:ring-2 focus-visible:ring-accent/40"
                    >
                      <LogOut className="h-4 w-4" aria-hidden="true" />
                      Log out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-8 bg-gray-50 dark:bg-transparent">
          {children}
        </main>
      </div>
    </div>
  );
}
