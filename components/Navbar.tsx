"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faFileInvoiceDollar,
  faTruckFast,
  faChartBar,
  faGear,
  faRightFromBracket,
  faBars,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { href: "/", label: "Dashboard", icon: faFileInvoiceDollar },
    { href: "/muatan", label: "Muatan", icon: faTruckFast },
    { href: "/reports", label: "Reports", icon: faChartBar },
    { href: "/settings", label: "Settings", icon: faGear },
  ];

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await fetch("/api/login", { method: "DELETE" });
      router.replace("/login");
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setLoggingOut(false);
    }
  }

  return (
    <div className="sticky top-0 z-50 border-b border-zinc-800 bg-zinc-950/90 backdrop-blur">
      <div className="mx-auto max-w-6xl px-4 py-4 flex items-center justify-between">
        <div className="font-semibold text-lg">
          Logistics Billing
        </div>

        {/* Desktop nav */}
        <div className="hidden md:flex gap-2 items-center">
          {navItems.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={[
                  "rounded-xl px-4 py-2 text-sm transition border flex items-center gap-2",
                  active
                    ? "bg-white text-zinc-950 border-white"
                    : "bg-zinc-900/40 text-zinc-200 border-zinc-800 hover:bg-zinc-900/70",
                ].join(" ")}
              >
                <FontAwesomeIcon icon={item.icon} className="w-4 h-4" />
                {item.label}
              </Link>
            );
          })}

          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="ml-2 rounded-xl px-4 py-2 text-sm transition border bg-red-500/10 text-red-400 border-red-500/30 hover:bg-red-500/20 disabled:opacity-50 flex items-center gap-2"
          >
            <FontAwesomeIcon icon={faRightFromBracket} className="w-4 h-4" />
            {loggingOut ? "..." : "Logout"}
          </button>
        </div>

        {/* Mobile menu toggle */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden rounded-xl border border-zinc-800 bg-zinc-900/40 p-2 text-zinc-200"
        >
          <FontAwesomeIcon icon={mobileMenuOpen ? faXmark : faBars} className="w-5 h-5" />
        </button>
      </div>

      {/* Mobile nav menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-zinc-800 bg-zinc-950/95 backdrop-blur px-4 py-3 space-y-2">
          {navItems.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={[
                  "rounded-xl px-4 py-3 text-sm transition border flex items-center gap-3 w-full",
                  active
                    ? "bg-white text-zinc-950 border-white"
                    : "bg-zinc-900/40 text-zinc-200 border-zinc-800 hover:bg-zinc-900/70",
                ].join(" ")}
              >
                <FontAwesomeIcon icon={item.icon} className="w-4 h-4" />
                {item.label}
              </Link>
            );
          })}
          <button
            onClick={() => {
              setMobileMenuOpen(false);
              handleLogout();
            }}
            disabled={loggingOut}
            className="rounded-xl px-4 py-3 text-sm transition border bg-red-500/10 text-red-400 border-red-500/30 hover:bg-red-500/20 disabled:opacity-50 flex items-center gap-3 w-full"
          >
            <FontAwesomeIcon icon={faRightFromBracket} className="w-4 h-4" />
            {loggingOut ? "Logging out..." : "Logout"}
          </button>
        </div>
      )}
    </div>
  );
}
