"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  BarChart3,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Coins,
  LayoutDashboard,
  Shield,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore, useUIStore } from "@/lib/store";
import { roleBadgeVariant } from "@/lib/auth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type NavItem = { href: string; label: string; icon: ReactNode };

const trading: NavItem[] = [
  { href: "/market", label: "Market", icon: <BarChart3 className="h-4 w-4" /> },
  { href: "/otc", label: "OTC Desk", icon: <Coins className="h-4 w-4" /> },
  { href: "/lending", label: "Lending", icon: <BookOpen className="h-4 w-4" /> },
];

const operations: NavItem[] = [
  { href: "/trust", label: "Trust", icon: <Shield className="h-4 w-4" /> },
  { href: "/quant", label: "Quant", icon: <Activity className="h-4 w-4" /> },
];

const admin: NavItem[] = [
  { href: "/admin/users", label: "Users", icon: <Users className="h-4 w-4" /> },
  { href: "/admin/audit", label: "Audit", icon: <ClipboardList className="h-4 w-4" /> },
];

function NavGroup({ title, items, collapsed }: { title: string; items: NavItem[]; collapsed: boolean }) {
  const pathname = usePathname();
  return (
    <div className="mb-6">
      {!collapsed && (
        <p className="mb-2 px-3 text-xs font-medium uppercase tracking-wider text-bpvp-text-secondary">
          {title}
        </p>
      )}
      <nav className="flex flex-col gap-0.5">
        {items.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-all duration-150 ease-out",
                active
                  ? "bg-bpvp-bg text-bpvp-primary"
                  : "text-bpvp-text-secondary hover:bg-bpvp-bg hover:text-bpvp-text-primary",
                collapsed && "justify-center px-2",
              )}
            >
              {item.icon}
              {!collapsed && item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const collapsed = useUIStore((s) => s.sidebarCollapsed);
  const toggleSidebar = useUIStore((s) => s.toggleSidebar);
  const role = useAuthStore((s) => s.role);

  return (
    <aside
      className={cn(
        "flex h-full flex-col border-r border-bpvp-border bg-bpvp-card transition-all duration-150 ease-out",
        collapsed ? "w-[72px]" : "w-[280px]",
      )}
    >
      <div className="flex h-14 items-center justify-between border-b border-bpvp-border px-3">
        <Link href="/dashboard" className="flex items-center gap-2 font-semibold text-bpvp-text-primary">
          <LayoutDashboard className="h-5 w-5 text-bpvp-primary" />
          {!collapsed && <span>BPVP</span>}
        </Link>
        <Button variant="ghost" size="icon" onClick={toggleSidebar} className="shrink-0" aria-label="Toggle sidebar">
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        <div className="mb-4">
          <Link
            href="/dashboard"
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-all duration-150 ease-out",
              pathname === "/dashboard"
                ? "bg-bpvp-bg text-bpvp-primary"
                : "text-bpvp-text-secondary hover:bg-bpvp-bg hover:text-bpvp-text-primary",
              collapsed && "justify-center px-2",
            )}
          >
            <LayoutDashboard className="h-4 w-4" />
            {!collapsed && "Overview"}
          </Link>
        </div>
        <NavGroup title="Trading" items={trading} collapsed={collapsed} />
        <NavGroup title="Operations" items={operations} collapsed={collapsed} />
        <NavGroup title="Admin" items={admin} collapsed={collapsed} />
      </div>

      <div className="border-t border-bpvp-border p-3">
        <div className={cn("flex items-center gap-2", collapsed && "justify-center")}>
          <Badge variant={role ? roleBadgeVariant(role) : "default"}>{role ?? "—"}</Badge>
        </div>
      </div>
    </aside>
  );
}
