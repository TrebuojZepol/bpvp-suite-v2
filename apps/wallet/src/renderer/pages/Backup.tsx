import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

export function Backup() {
  const nav = useNavigate();
  const loc = useLocation() as { state?: { passphrase?: string } };
  const passphrase = loc.state?.passphrase ?? "";

  const [indices, setIndices] = useState<number[]>([]);
  const [inputs, setInputs] = useState(["", "", ""]);
  const [err, setErr] = useState<string | null>(null);
  const [loadErr, setLoadErr] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    void (async () => {
      try {
        const { indices: idx } = await window.bpvp.backupStart();
        setIndices(idx);
        setReady(true);
      } catch {
        setLoadErr("No active recovery phrase session. Start from Create.");
      }
    })();
  }, []);

  async function submitVerify() {
    setErr(null);
    const r = await window.bpvp.backupVerify(inputs);
    if (!r.ok) {
      setErr("Incorrect words. Check your backup and try again.");
      return;
    }
    try {
      await window.bpvp.walletCommit(passphrase);
      await window.bpvp.setPrivacyScreen(false);
      nav("/main");
    } catch {
      setErr("Could not finalize wallet.");
    }
  }

  if (!passphrase) {
    return (
      <div style={{ padding: 32, background: "#020617", minHeight: "100vh", color: "#f8fafc" }}>
        <p>Missing passphrase. Start from Create.</p>
        <button type="button" onClick={() => nav("/create")}>
          Back
        </button>
      </div>
    );
  }

  if (loadErr) {
    return (
      <div style={{ padding: 32, background: "#020617", minHeight: "100vh", color: "#f8fafc" }}>
        <p style={{ color: "#f43f5e" }}>{loadErr}</p>
        <button type="button" onClick={() => nav("/create")}>
          Back to Create
        </button>
      </div>
    );
  }

  if (!ready) {
    return (
      <div style={{ padding: 32, color: "#94a3b8", background: "#020617", minHeight: "100vh" }}>
        Loading…
      </div>
    );
  }

  return (
    <div style={{ padding: 32, maxWidth: 520, margin: "0 auto", background: "#020617", minHeight: "100vh" }}>
      <h2 style={{ marginTop: 0, color: "#f8fafc" }}>Confirm backup</h2>
      <p style={{ color: "#94a3b8", fontSize: 14 }}>
        Enter the following words from your recovery phrase (in order).
      </p>
      <p style={{ color: "#cbd5e1", fontWeight: 600 }}>Word positions: {indices.map((i) => i + 1).join(", ")}</p>
      {indices.map((idx, i) => (
        <label key={idx} style={{ display: "block", marginTop: 16, color: "#94a3b8", fontSize: 13 }}>
          Word #{idx + 1}
          <input
            value={inputs[i]}
            onChange={(e) => {
              const next = [...inputs];
              next[i] = e.target.value;
              setInputs(next);
            }}
            style={{
              display: "block",
              marginTop: 6,
              width: "100%",
              padding: 12,
              borderRadius: 8,
              border: "1px solid #1e293b",
              background: "#0f172a",
              color: "#f8fafc",
            }}
          />
        </label>
      ))}
      {err ? <p style={{ color: "#f43f5e", marginTop: 16 }}>{err}</p> : null}
      <button
        type="button"
        onClick={() => void submitVerify()}
        style={{
          marginTop: 24,
          padding: "14px 24px",
          borderRadius: 8,
          border: "none",
          background: "#10b981",
          color: "#020617",
          fontWeight: 600,
          cursor: "pointer",
        }}
      >
        Verify & finish
      </button>
    </div>
  );
}
