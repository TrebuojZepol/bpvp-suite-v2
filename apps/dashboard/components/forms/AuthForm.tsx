"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { api, isRateLimitError } from "@/lib/api";

export function AuthForm() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [totp, setTotp] = useState("");
  const [mfaRequired, setMfaRequired] = useState(false);
  const [walletMsg, setWalletMsg] = useState<string | null>(null);
  const { login, rateLimitRetryAfter } = useAuth();

  const err = login.error;
  const rateLimited = err && isRateLimitError(err);
  const msg =
    rateLimited && isRateLimitError(err)
      ? `${err.message}${err.retryAfterSec != null ? ` Retry after ${err.retryAfterSec}s.` : ""}`
      : err && !rateLimited
        ? "Invalid credentials or server error."
        : null;

  async function onWalletConnect() {
    setWalletMsg(null);
    try {
      const ch = await api.post<{ nonce: string; expires_at: string }>("/api/auth/wallet/challenge", {
        username: username || "wallet-user",
      });
      setWalletMsg(`Challenge issued. Sign nonce ${ch.data.nonce.slice(0, 8)}… in BPVP Wallet (demo flow).`);
    } catch {
      setWalletMsg("Could not start wallet challenge. Check API availability.");
    }
  }

  return (
    <Card className="w-full max-w-md border-bpvp-border">
      <CardHeader>
        <CardTitle>Sign in</CardTitle>
        <CardDescription>Institutional access — use your BPVP credentials.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className="text-xs font-medium text-bpvp-text-secondary">Username</label>
          <Input
            autoComplete="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="operator.id"
          />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-medium text-bpvp-text-secondary">Password</label>
          <Input
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <input
            id="mfa-toggle"
            type="checkbox"
            checked={mfaRequired}
            onChange={(e) => setMfaRequired(e.target.checked)}
            className="rounded border-bpvp-border bg-bpvp-bg"
          />
          <label htmlFor="mfa-toggle" className="text-sm text-bpvp-text-secondary">
            MFA code required
          </label>
        </div>
        {(mfaRequired || username) && (
          <div className="space-y-2">
            <label className="text-xs font-medium text-bpvp-text-secondary">TOTP (6 digits)</label>
            <Input
              inputMode="numeric"
              maxLength={6}
              value={totp}
              onChange={(e) => setTotp(e.target.value.replace(/\D/g, ""))}
              placeholder="000000"
              className={totp.length > 0 && totp.length < 6 ? "border-bpvp-accent/50" : ""}
            />
          </div>
        )}
        {msg ? (
          <p className="rounded-md border border-bpvp-danger/40 bg-rose-500/10 px-3 py-2 text-sm text-bpvp-danger">
            {msg}
            {rateLimitRetryAfter != null ? ` (retry-after: ${rateLimitRetryAfter}s)` : null}
          </p>
        ) : null}
        {walletMsg ? (
          <p className="rounded-md border border-bpvp-border bg-bpvp-bg px-3 py-2 text-xs text-bpvp-text-secondary">
            {walletMsg}
          </p>
        ) : null}
        <Button
          className="w-full"
          disabled={login.isPending || !username || !password}
          onClick={() =>
            login.mutate({
              username,
              password,
              totp: totp || undefined,
            })
          }
        >
          {login.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Sign in"}
        </Button>
        <Button type="button" variant="secondary" className="w-full" onClick={() => void onWalletConnect()}>
          Connect BPVP Wallet
        </Button>
      </CardContent>
    </Card>
  );
}
