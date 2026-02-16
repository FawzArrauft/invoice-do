"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  const NavLink = ({
    href,
    label,
  }: {
    href: string;
    label: string;
  }) => {
    const active = pathname === href;

    return (
      <Link
        href={href}
        className={[
          "rounded-xl px-4 py-2 text-sm transition border",
          active
            ? "bg-white text-zinc-950 border-white"
            : "bg-zinc-900/40 text-zinc-200 border-zinc-800 hover:bg-zinc-900/70",
        ].join(" ")}
      >
        {label}
      </Link>
    );
  };

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

        <div className="flex gap-2 items-center">
          <NavLink href="/" label="Dashboard" />
          <NavLink href="/muatan" label="Muatan" />
          <NavLink href="/reports" label="Reports" />
          
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="ml-2 rounded-xl px-4 py-2 text-sm transition border bg-red-500/10 text-red-400 border-red-500/30 hover:bg-red-500/20 disabled:opacity-50"
          >
            {loggingOut ? "..." : "Logout"}
          </button>
        </div>
      </div>
    </div>
  );
}
