"use client";

import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type Column<T> = {
  key: keyof T | string;
  header: string;
  accessor: (row: T) => ReactNode;
  sortable?: boolean;
};

type DataTableProps<T> = {
  data: T[];
  columns: Column<T>[];
  filterKeys?: (keyof T)[];
};

export function DataTable<T extends Record<string, unknown>>({
  data,
  columns,
  filterKeys,
}: DataTableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    if (!q.trim() || !filterKeys?.length) return data;
    const lower = q.toLowerCase();
    return data.filter((row) =>
      filterKeys.some((k) => String(row[k] ?? "").toLowerCase().includes(lower)),
    );
  }, [data, q, filterKeys]);

  const sorted = useMemo(() => {
    if (!sortKey) return filtered;
    const col = columns.find((c) => String(c.key) === sortKey);
    if (!col?.sortable) return filtered;
    const copy = [...filtered];
    copy.sort((a, b) => {
      const av = String(col.accessor(a) ?? "");
      const bv = String(col.accessor(b) ?? "");
      const cmp = av.localeCompare(bv, undefined, { numeric: true });
      return sortDir === "asc" ? cmp : -cmp;
    });
    return copy;
  }, [filtered, sortKey, sortDir, columns]);

  function toggleSort(key: string) {
    if (sortKey !== key) {
      setSortKey(key);
      setSortDir("asc");
    } else {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    }
  }

  return (
    <div className="space-y-3">
      {filterKeys ? (
        <Input placeholder="Filter…" value={q} onChange={(e) => setQ(e.target.value)} className="max-w-sm" />
      ) : null}
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((c) => (
              <TableHead key={String(c.key)}>
                {c.sortable ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="-ml-2 h-8 gap-1 px-2 text-bpvp-text-secondary hover:text-bpvp-text-primary"
                    onClick={() => toggleSort(String(c.key))}
                  >
                    {c.header}
                    <span className={cn(sortKey === String(c.key) ? "opacity-100" : "opacity-0")}>
                      {sortDir === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
                    </span>
                  </Button>
                ) : (
                  c.header
                )}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {sorted.map((row, i) => (
            <TableRow key={i}>
              {columns.map((c) => (
                <TableCell key={String(c.key)}>{c.accessor(row)}</TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
