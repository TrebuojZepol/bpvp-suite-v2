import { useState } from "react";
import { Link } from "react-router-dom";

export function Send() {
  const [to, setTo] = useState("");
  const [valid, setValid] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function checkAddr() {
    setErr(null);
    setBusy(true);
    try {
      const r = await window.bpvp.validateAddress(to.trim());
      setValid(r.ok);
      if (!r.ok) setErr("Invalid address for current network.");
    } catch {
      setValid(false);
      setErr("Validation failed.");
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
      <h2 style={{ marginTop: 8 }}>Send</h2>
      <p style={{ color: "#94a3b8", fontSize: 14 }}>
        Build &amp; broadcast flows plug into your dashboard or engine. Here you can verify a destination address.
      </p>
      <label style={{ display: "block", marginTop: 20, fontSize: 13, color: "#94a3b8" }}>
        To address
        <input
          value={to}
          onChange={(e) => {
            setTo(e.target.value);
            setValid(null);
          }}
          style={{
            display: "block",
            marginTop: 8,
            width: "100%",
            padding: 12,
            borderRadius: 8,
            border: "1px solid #1e293b",
            background: "#0f172a",
            color: "#f8fafc",
            fontFamily: "monospace",
            fontSize: 14,
          }}
        />
      </label>
      {valid === true ? <p style={{ color: "#10b981", marginTop: 12 }}>Address valid.</p> : null}
      {err ? <p style={{ color: "#f43f5e", marginTop: 12 }}>{err}</p> : null}
      <button
        type="button"
        disabled={busy || !to.trim()}
        onClick={() => void checkAddr()}
        style={{
          marginTop: 20,
          padding: "12px 20px",
          borderRadius: 8,
          border: "none",
          background: "#10b981",
          color: "#020617",
          fontWeight: 600,
          cursor: busy || !to.trim() ? "not-allowed" : "pointer",
        }}
      >
        Validate address
      </button>
    </div>
  );
}
