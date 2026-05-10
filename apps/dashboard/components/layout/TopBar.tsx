"use client";

import { usePathname } from "next/navigation";
import { Bell, ChevronRight } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuthStore } from "@/lib/store";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

const NETWORK = process.env.NEXT_PUBLIC_BPVP_NETWORK ?? "testnet";

function crumbsFromPath(path: string) {
  const parts = path.split("/").filter(Boolean);
  return parts.map((p, i) => ({
    label: p.charAt(0).toUpperCase() + p.slice(1),
    href: "/" + parts.slice(0, i + 1).join("/"),
  }));
}

export function TopBar() {
  const pathname = usePathname();
  const sub = useAuthStore((s) => s.sub);
  const role = useAuthStore((s) => s.role);
  const { logout } = useAuth();
  const crumbs = crumbsFromPath(pathname);
  const isMain = NETWORK.toLowerCase() === "mainnet";

  return (
    <header className="flex h-14 items-center justify-between border-b border-bpvp-border bg-bpvp-card px-4 transition-all duration-150 ease-out">
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <nav className="flex min-w-0 items-center gap-1 text-sm text-bpvp-text-secondary">
          {crumbs.map((c, i) => (
            <span key={c.href} className="flex items-center gap-1 truncate">
              {i > 0 && <ChevronRight className="h-3 w-3 shrink-0 opacity-50" />}
              <span className={cn(i === crumbs.length - 1 && "font-medium text-bpvp-text-primary")}>
                {c.label}
              </span>
            </span>
          ))}
        </nav>
        <Badge variant={isMain ? "primary" : "accent"} className="shrink-0">
          {isMain ? "Mainnet" : "Testnet"}
        </Badge>
      </div>

      <div className="hidden flex-1 items-center justify-center gap-6 text-xs text-bpvp-text-secondary md:flex">
        <span>
          Sync: <span className="text-bpvp-primary">Synced</span>
        </span>
        <span>
          Block: <span className="text-bpvp-text-primary tabular-nums">982,441</span>
        </span>
        <span>
          Fee est.: <span className="text-bpvp-text-primary tabular-nums">12 sat/vB</span>
        </span>
      </div>

      <div className="flex flex-1 items-center justify-end gap-2">
        <Button variant="ghost" size="icon" aria-label="Notifications">
          <Bell className="h-4 w-4" />
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="secondary" size="sm" className="gap-2">
              <span className="max-w-[120px] truncate">{sub ?? "User"}</span>
              <Badge variant="default" className="text-[10px]">
                {role ?? "—"}
              </Badge>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem disabled className="text-bpvp-text-secondary">
              Role: {role ?? "—"}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => {
                void logout.mutateAsync();
              }}
            >
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
