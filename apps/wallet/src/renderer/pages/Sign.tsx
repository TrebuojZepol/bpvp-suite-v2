import { useState } from "react";
import { Link } from "react-router-dom";

export function Sign() {
  const [index, setIndex] = useState(0);
  const [type, setType] = useState<"p2wpkh" | "p2tr" | "p2sh-p2wpkh" | "p2pkh">("p2wpkh");
  const [message, setMessage] = useState("");
  const [out, setOut] = useState<{ signature: string; address: string } | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function sign() {
    setErr(null);
    setOut(null);
    setBusy(true);
    try {
      const r = await window.bpvp.signMessage(index, type, message);
      setOut(r);
    } catch {
      setErr("Signing failed. Is the wallet unlocked?");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ padding: 24, maxWidth: 640, margin: "0 auto", minHeight: "100vh", background: "#020617", color: "#f8fafc" }}>
      <p>
        <Link to="/main" style={{ color: "#10b981", textDecoration: "none" }}>
          ← Wallet
        </Link>
      </p>
      <h2 style={{ marginTop: 8 }}>Sign message</h2>
      <p style={{ color: "#94a3b8", fontSize: 14 }}>Signatures are produced in the secure main process.</p>
      <label style={{ display: "block", marginTop: 16, fontSize: 13, color: "#94a3b8" }}>
        Address index
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
        Address type
        <select
          value={type}
          onChange={(e) => setType(e.target.value as typeof type)}
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
          <option value="p2sh-p2wpkh">P2SH-P2WPKH</option>
          <option value="p2pkh">P2PKH</option>
        </select>
      </label>
      <label style={{ display: "block", marginTop: 16, fontSize: 13, color: "#94a3b8" }}>
        Message
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={5}
          style={{
            display: "block",
            marginTop: 8,
            width: "100%",
            padding: 12,
            borderRadius: 8,
            border: "1px solid #1e293b",
            background: "#0f172a",
            color: "#f8fafc",
            resize: "vertical",
          }}
        />
      </label>
      {err ? <p style={{ color: "#f43f5e", marginTop: 12 }}>{err}</p> : null}
      <button
        type="button"
        disabled={busy || !message}
        onClick={() => void sign()}
        style={{
          marginTop: 16,
          padding: "12px 20px",
          borderRadius: 8,
          border: "none",
          background: "#10b981",
          color: "#020617",
          fontWeight: 600,
          cursor: busy || !message ? "not-allowed" : "pointer",
        }}
      >
        Sign
      </button>
      {out ? (
        <div style={{ marginTop: 24, padding: 16, borderRadius: 8, border: "1px solid #1e293b", background: "#0f172a" }}>
          <div style={{ fontSize: 12, color: "#94a3b8" }}>Address</div>
          <div style={{ fontFamily: "monospace", fontSize: 13, wordBreak: "break-all" }}>{out.address}</div>
          <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 12 }}>Signature (base64)</div>
          <div style={{ fontFamily: "monospace", fontSize: 12, wordBreak: "break-all" }}>{out.signature}</div>
        </div>
      ) : null}
    </div>
  );
}
