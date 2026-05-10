import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { QRCodeSVG } from "react-qr-code";

export function Receive() {
  const [index, setIndex] = useState(0);
  const [type, setType] = useState<"p2wpkh" | "p2tr">("p2wpkh");
  const [address, setAddress] = useState("");
  const [path, setPath] = useState("");

  useEffect(() => {
    void (async () => {
      const d = await window.bpvp.deriveAddress(index, type);
      setAddress(d.address);
      setPath(d.path);
    })();
  }, [index, type]);

  return (
    <div style={{ padding: 24, maxWidth: 560, margin: "0 auto", minHeight: "100vh", background: "#020617", color: "#f8fafc" }}>
      <p>
        <Link to="/main" style={{ color: "#10b981", textDecoration: "none" }}>
          ← Wallet
        </Link>
      </p>
      <h2 style={{ marginTop: 8 }}>Receive</h2>
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
        Type
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
          <option value="p2wpkh">Native SegWit (P2WPKH)</option>
          <option value="p2tr">Taproot (P2TR)</option>
        </select>
      </label>
      {address ? (
        <div style={{ marginTop: 24 }}>
          <div style={{ background: "#fff", padding: 16, borderRadius: 8, display: "inline-block" }}>
            <QRCodeSVG value={address} size={180} level="M" />
          </div>
          <p style={{ fontFamily: "monospace", fontSize: 14, wordBreak: "break-all", marginTop: 16 }}>{address}</p>
          <p style={{ fontSize: 12, color: "#64748b" }}>{path}</p>
        </div>
      ) : (
        <p style={{ color: "#94a3b8", marginTop: 24 }}>Unlock the wallet to derive addresses.</p>
      )}
    </div>
  );
}
