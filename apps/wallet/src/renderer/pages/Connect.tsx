import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

export function Connect() {
  const [url, setUrl] = useState("");
  const [index, setIndex] = useState(0);
  const [type, setType] = useState<"p2wpkh" | "p2tr">("p2wpkh");
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void window.bpvp.settingsGet().then((s) => {
      if (!url) setUrl(s.dashboardUrl);
    });
  }, [url]);

  async function connect() {
    setStatus(null);
    setBusy(true);
    try {
      await window.bpvp.connectDashboard(url.trim(), index, type);
      setStatus("Connected (WebSocket).");
    } catch {
      setStatus("Connection failed. Check URL and that the wallet is unlocked.");
    } finally {
      setBusy(false);
    }
  }

  async function disconnect() {
    setBusy(true);
    try {
      await window.bpvp.disconnectDashboard();
      setStatus("Disconnected.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ padding: 24, maxWidth: 560, margin: "0 auto", minHeight: "100vh", background: "#020617", color: "#f8fafc" }}>
      <p>
        <Link to="/main" style={{ color: "#10b981", textDecoration: "none" }}>
          ← Wallet
        </Link>
      </p>
      <h2 style={{ marginTop: 8 }}>Connect to dashboard</h2>
      <p style={{ color: "#94a3b8", fontSize: 14 }}>
        Uses challenge–response over WebSocket (wss when the dashboard is https). The base URL is converted to a /ws endpoint.
      </p>
      <label style={{ display: "block", marginTop: 16, fontSize: 13, color: "#94a3b8" }}>
        Dashboard URL
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://dashboard.example.com"
          style={{
            display: "block",
            marginTop: 8,
            width: "100%",
            padding: 12,
            borderRadius: 8,
            border: "1px solid #1e293b",
            background: "#0f172a",
            color: "#f8fafc",
          }}
        />
      </label>
      <label style={{ display: "block", marginTop: 16, fontSize: 13, color: "#94a3b8" }}>
        Signing address index
        <input
          type="number"
          min={0}
          value={index}
          onChange={(e) => setIndex(Number(e.target.value) || 0)}
          style={{
            display: "block",
            marginTop: 8,
            width: "100%",
            padding: 12,
            borderRadius: 8,
            border: "1px solid #1e293b",
            background: "#0f172a",
            color: "#f8fafc",
          }}
        />
      </label>
      <label style={{ display: "block", marginTop: 16, fontSize: 13, color: "#94a3b8" }}>
        Address type for signing
        <select
          value={type}
          onChange={(e) => setType(e.target.value as "p2wpkh" | "p2tr")}
          style={{
            display: "block",
            marginTop: 8,
            width: "100%",
            padding: 12,
            borderRadius: 8,
            border: "1px solid #1e293b",
            background: "#0f172a",
            color: "#f8fafc",
          }}
        >
          <option value="p2wpkh">P2WPKH</option>
          <option value="p2tr">P2TR</option>
        </select>
      </label>
      <div style={{ display: "flex", gap: 12, marginTop: 20, flexWrap: "wrap" }}>
        <button
          type="button"
          disabled={busy || !url.trim()}
          onClick={() => void connect()}
          style={{
            padding: "12px 20px",
            borderRadius: 8,
            border: "none",
            background: "#10b981",
            color: "#020617",
            fontWeight: 600,
            cursor: busy || !url.trim() ? "not-allowed" : "pointer",
          }}
        >
          Connect
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => void disconnect()}
          style={{
            padding: "12px 20px",
            borderRadius: 8,
            border: "1px solid #334155",
            background: "#0f172a",
            color: "#f8fafc",
            cursor: busy ? "not-allowed" : "pointer",
          }}
        >
          Disconnect
        </button>
      </div>
      {status ? <p style={{ marginTop: 16, color: "#94a3b8" }}>{status}</p> : null}
    </div>
  );
}
