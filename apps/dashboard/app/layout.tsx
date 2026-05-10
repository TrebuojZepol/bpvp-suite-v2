import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Inter } from "next/font/google";
import { headers } from "next/headers";
import "@/styles/globals.css";
import { Providers } from "@/components/providers";

const inter = Inter({ subsets: ["latin"], display: "swap" });

export const metadata: Metadata = {
  title: "BPVP — Institutional Dashboard",
  description: "Bitcoin-native DeFi platform",
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const nonce = (await headers()).get("x-csp-nonce") ?? "";

  return (
    <html lang="en" className="dark">
      <head>
        <meta name="csp-nonce" content={nonce} />
      </head>
      <body className={`${inter.className} min-h-screen bg-bpvp-bg text-bpvp-text-primary`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
