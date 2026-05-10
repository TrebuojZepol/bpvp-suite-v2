import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

type NetworkId = "bitcoin" | "testnet" | "signet" | "regtest";

export function Settings() {
  const [network, setNetwork] = useState<NetworkId>("testnet");
  const [dashboardUrl, setDashboardUrl] = useState("");
  const [autoLockMin, setAutoLockMin] = useState(15);
  const [defaultAddressType, setDefaultAddressType] = useState<"p2wpkh" | "p2tr" | "p2sh-p2wpkh" | "p2pkh">("p2wpkh");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    void window.bpvp.settingsGet().then((s) => {
      setNetwork(s.network);
      setDashboardUrl(s.dashboardUrl);
      setAutoLockMin(Math.max(1, Math.round(s.autoLockMs / 60_000)));
      setDefaultAddressType(s.defaultAddressType);
    });
  }, []);

  async function save() {
    await window.bpvp.settingsSet({
      network,
      dashboardUrl: dashboardUrl.trim(),
      autoLockMs: autoLockMin * 60_000,
      defaultAddressType,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div style={{ padding: 24, maxWidth: 560, margin: "0 auto", minHeight: "100vh", background: "#020617", color: "#f8fafc" }}>
      <p>
        <Link to="/main" style={{ color: "#10b981", textDecoration: "none" }}>
          ← Wallet
        </Link>
      </p>
      <h2 style={{ marginTop: 8 }}>Settings</h2>
      <label style={{ display: "block", marginTop: 20, fontSize: 13, color: "#94a3b8" }}>
        Network
        <select
          value={network}
          onChange={(e) => setNetwork(e.target.value as NetworkId)}
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
          <option value="testnet">Testnet</option>
          <option value="signet">Signet</option>
          <option value="bitcoin">Bitcoin mainnet</option>
          <option value="regtest">Regtest</option>
        </select>
      </label>
      <label style={{ display: "block", marginTop: 20, fontSize: 13, color: "#94a3b8" }}>
        Default address type
        <select
          value={defaultAddressType}
          onChange={(e) => setDefaultAddressType(e.target.value as typeof defaultAddressType)}
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
      <label style={{ display: "block", marginTop: 20, fontSize: 13, color: "#94a3b8" }}>
        Dashboard URL
        <input
          value={dashboardUrl}
          onChange={(e) => setDashboardUrl(e.target.value)}
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
      <label style={{ display: "block", marginTop: 20, fontSize: 13, color: "#94a3b8" }}>
        Auto-lock (minutes)
        <input
          type="number"
          min={1}
          value={autoLockMin}
          onChange={(e) => setAutoLockMin(Number(e.target.value) || 1)}
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
      <button
        type="button"
        onClick={() => void save()}
        style={{
          marginTop: 24,
          padding: "12px 20px",
          borderRadius: 8,
          border: "none",
          background: "#10b981",
          color: "#020617",
          fontWeight: 600,
          cursor: "pointer",
        }}
      >
        Save
      </button>
      {saved ? <p style={{ color: "#10b981", marginTop: 12 }}>Saved.</p> : null}
    </div>
  );
}
