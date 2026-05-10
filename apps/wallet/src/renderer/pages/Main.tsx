import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { QRCodeSVG } from "react-qr-code";

type Tab = "addresses" | "tx" | "sign" | "connect";

type AddrRow = {
  index: number;
  p2wpkh: { address: string; path: string };
  p2tr: { address: string; path: string };
};

export function Main() {
  const [tab, setTab] = useState<Tab>("addresses");
  const [rows, setRows] = useState<AddrRow[]>([]);
  const [settings, setSettings] = useState<Awaited<ReturnType<typeof window.bpvp.settingsGet>> | null>(
    null,
  );

  useEffect(() => {
    void window.bpvp.settingsGet().then(setSettings);
  }, []);

  useEffect(() => {
    void (async () => {
      const list: AddrRow[] = [];
      for (let i = 0; i < 5; i++) {
        const wpkh = await window.bpvp.deriveAddress(i, "p2wpkh");
        const tr = await window.bpvp.deriveAddress(i, "p2tr");
        list.push({
          index: i,
          p2wpkh: { address: wpkh.address, path: wpkh.path },
          p2tr: { address: tr.address, path: tr.path },
        });
      }
      setRows(list);
    })();
  }, [settings?.network]);

  const isTestnet = settings?.network !== "bitcoin";

  return (
    <div style={{ padding: 24, paddingBottom: 56, minHeight: "100vh", background: "#020617", color: "#f8fafc" }}>
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 24,
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <div>
          <h1 style={{ margin: 0, fontSize: 22 }}>Wallet</h1>
          <p style={{ margin: "4px 0 0", color: "#94a3b8", fontSize: 13 }}>
            {isTestnet ? "Testnet — balances are not real funds." : "Mainnet — handle with care."}
          </p>
        </div>
        <nav style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
          <Link to="/send" style={{ color: "#10b981", textDecoration: "none", fontSize: 14 }}>
            Send
          </Link>
          <Link to="/receive" style={{ color: "#10b981", textDecoration: "none", fontSize: 14 }}>
            Receive
          </Link>
          <Link to="/sign" style={{ color: "#10b981", textDecoration: "none", fontSize: 14 }}>
            Sign
          </Link>
          <Link to="/connect" style={{ color: "#10b981", textDecoration: "none", fontSize: 14 }}>
            Connect
          </Link>
          <Link to="/settings" style={{ color: "#64748b", textDecoration: "none", fontSize: 14 }}>
            Settings
          </Link>
          <button
            type="button"
            onClick={() => {
              void window.bpvp.walletLock().then(() => {
                window.location.hash = "#/welcome";
              });
            }}
            style={{
              background: "none",
              border: "1px solid #334155",
              color: "#94a3b8",
              padding: "6px 12px",
              borderRadius: 6,
              cursor: "pointer",
              fontSize: 13,
            }}
          >
            Lock
          </button>
        </nav>
      </header>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 16,
          marginBottom: 20,
          maxWidth: 480,
        }}
      >
        <div style={{ padding: 16, borderRadius: 8, border: "1px solid #1e293b", background: "#0f172a" }}>
          <div style={{ fontSize: 12, color: "#94a3b8" }}>Balance (BTC)</div>
          <div style={{ fontSize: 22, fontWeight: 600, marginTop: 4 }}>—</div>
        </div>
        <div style={{ padding: 16, borderRadius: 8, border: "1px solid #1e293b", background: "#0f172a" }}>
          <div style={{ fontSize: 12, color: "#94a3b8" }}>Fiat (indicative)</div>
          <div style={{ fontSize: 22, fontWeight: 600, marginTop: 4 }}>—</div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 4, marginBottom: 16, borderBottom: "1px solid #1e293b" }}>
        {(
          [
            ["addresses", "Addresses"],
            ["tx", "Transactions"],
            ["sign", "Sign"],
            ["connect", "Connect"],
          ] as const
        ).map(([k, label]) => (
          <button
            key={k}
            type="button"
            onClick={() => setTab(k)}
            style={{
              padding: "10px 14px",
              border: "none",
              background: "none",
              color: tab === k ? "#10b981" : "#64748b",
              borderBottom: tab === k ? "2px solid #10b981" : "2px solid transparent",
              cursor: "pointer",
              marginBottom: -1,
              fontSize: 14,
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "addresses" && (
        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {rows.map((r) => (
            <li
              key={r.index}
              style={{
                padding: 16,
                borderRadius: 8,
                border: "1px solid #1e293b",
                marginBottom: 16,
                background: "#0f172a",
              }}
            >
              <div style={{ fontSize: 12, color: "#64748b", marginBottom: 8 }}>Index #{r.index}</div>
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 11, color: "#94a3b8" }}>Native SegWit (P2WPKH)</div>
                <div style={{ fontFamily: "monospace", fontSize: 13, wordBreak: "break-all" }}>
                  {r.p2wpkh.address}
                </div>
                <div style={{ fontSize: 11, color: "#475569", marginTop: 4 }}>{r.p2wpkh.path}</div>
                <div style={{ marginTop: 8, background: "#fff", padding: 8, borderRadius: 6, display: "inline-block" }}>
                  <QRCodeSVG value={r.p2wpkh.address} size={96} level="M" />
                </div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: "#94a3b8" }}>Taproot (P2TR)</div>
                <div style={{ fontFamily: "monospace", fontSize: 13, wordBreak: "break-all" }}>
                  {r.p2tr.address}
                </div>
                <div style={{ fontSize: 11, color: "#475569", marginTop: 4 }}>{r.p2tr.path}</div>
                <div style={{ marginTop: 8, background: "#fff", padding: 8, borderRadius: 6, display: "inline-block" }}>
                  <QRCodeSVG value={r.p2tr.address} size={96} level="M" />
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {tab === "tx" && (
        <p style={{ color: "#94a3b8" }}>No transactions — connect an indexer or dashboard for history.</p>
      )}

      {tab === "sign" && (
        <p style={{ color: "#94a3b8" }}>
          Message signing runs in the secure main process.{" "}
          <Link to="/sign" style={{ color: "#10b981" }}>
            Open Sign
          </Link>
        </p>
      )}

      {tab === "connect" && (
        <p style={{ color: "#94a3b8" }}>
          <Link to="/connect" style={{ color: "#10b981" }}>
            Connect to dashboard
          </Link>{" "}
          for challenge-response sessions.
        </p>
      )}

      <footer
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          padding: "10px 16px",
          fontSize: 12,
          color: "#94a3b8",
          borderTop: "1px solid #1e293b",
          background: "#020617",
          display: "flex",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 8,
        }}
      >
        <span>Network: {settings?.network ?? "—"}</span>
        <span>Sync: idle</span>
        <span>Block height: —</span>
      </footer>
    </div>
  );
}
