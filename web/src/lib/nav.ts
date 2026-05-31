import type { LucideIcon } from "lucide-react";
import { LayoutDashboard, Users, FlaskConical } from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  description: string;
}

export const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard, description: "Portfolio health & call queue" },
  { href: "/accounts", label: "Accounts", icon: Users, description: "Debtor book & record pages" },
  {
    href: "/evaluations",
    label: "Compliance Lab",
    icon: FlaskConical,
    description: "Cekura simulate → evaluate → auto-improve",
  },
];

/** Resolve the active nav item for a pathname (longest-prefix match). */
export function activeNav(pathname: string): NavItem | undefined {
  if (pathname === "/") return NAV_ITEMS[0];
  return NAV_ITEMS.filter((n) => n.href !== "/" && pathname.startsWith(n.href)).sort(
    (a, b) => b.href.length - a.href.length,
  )[0];
}
