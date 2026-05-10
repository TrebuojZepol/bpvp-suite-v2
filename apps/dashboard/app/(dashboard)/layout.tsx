import type { ReactNode } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { SessionHydration } from "@/components/session-hydration";

export default function DashboardGroupLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <SessionHydration />
      <MainLayout>{children}</MainLayout>
    </>
  );
}
