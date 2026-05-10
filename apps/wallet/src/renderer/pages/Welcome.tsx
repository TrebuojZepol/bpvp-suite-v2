import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export function Welcome() {
  const nav = useNavigate();
  const [hasVault, setHasVault] = useState(false);
  const [pass, setPass] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void window.bpvp.getStatus().then((s) => setHasVault(s.hasVault));
  }, []);

  async function unlock() {
    setErr(null);
    setBusy(true);
    try {
      const r = await window.bpvp.vaultLoad(pass);
      if (r.empty) {
        setErr("Wallet setup incomplete — continue from Create.");
        nav("/create");
        return;
      }
      nav("/main");
    } catch {
      setErr("Could not unlock. Check passphrase.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#020617",
        color: "#f8fafc",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
      }}
    >
      <div style={{ textAlign: "center", marginBottom: 40 }}>
        <div
          style={{
            fontSize: 36,
            fontWeight: 700,
            letterSpacing: "-0.02em",
            color: "#10b981",
            marginBottom: 8,
          }}
        >
          BPVP
        </div>
        <p style={{ margin: 0, color: "#94a3b8", fontSize: 15 }}>
          Institutional Bitcoin — desktop wallet
        </p>
      </div>

      {hasVault ? (
        <div style={{ width: "100%", maxWidth: 360, display: "flex", flexDirection: "column", gap: 12 }}>
          <p style={{ color: "#94a3b8", fontSize: 14, margin: 0 }}>Unlock your vault</p>
          <input
            type="password"
            placeholder="Passphrase"
            value={pass}
            onChange={(e) => setPass(e.target.value)}
            style={{
              padding: 14,
              borderRadius: 8,
              border: "1px solid #1e293b",
              background: "#0f172a",
              color: "#f8fafc",
              fontSize: 15,
            }}
          />
          {err ? <p style={{ color: "#f43f5e", fontSize: 14, margin: 0 }}>{err}</p> : null}
          <button
            type="button"
            disabled={busy || !pass}
            onClick={() => void unlock()}
            style={{
              padding: "14px 20px",
              borderRadius: 8,
              border: "none",
              background: "#10b981",
              color: "#020617",
              fontWeight: 600,
              fontSize: 15,
              cursor: busy || !pass ? "not-allowed" : "pointer",
              opacity: busy || !pass ? 0.6 : 1,
            }}
          >
            Unlock
          </button>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12, width: "100%", maxWidth: 320 }}>
          <button
            type="button"
            onClick={() => nav("/create")}
            style={{
              padding: "14px 20px",
              borderRadius: 8,
              border: "none",
              background: "#10b981",
              color: "#020617",
              fontWeight: 600,
              fontSize: 15,
              cursor: "pointer",
            }}
          >
            Create New Wallet
          </button>
          <button
            type="button"
            onClick={() => nav("/import")}
            style={{
              padding: "14px 20px",
              borderRadius: 8,
              border: "1px solid #334155",
              background: "#0f172a",
              color: "#f8fafc",
              fontSize: 15,
              cursor: "pointer",
            }}
          >
            Import Existing
          </button>
        </div>
      )}
    </div>
  );
}
