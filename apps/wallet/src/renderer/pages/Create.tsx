import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

type NetworkId = "bitcoin" | "testnet" | "signet" | "regtest";

type Phase = "passphrase" | "mnemonic";

export function Create() {
  const nav = useNavigate();
  const [phase, setPhase] = useState<Phase>("passphrase");
  const [p1, setP1] = useState("");
  const [p2, setP2] = useState("");
  const [network, setNetwork] = useState<NetworkId>("testnet");
  const [mnemonicWords, setMnemonicWords] = useState<string[]>([]);
  const [confirmedWrite, setConfirmedWrite] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const strengthLabel = useMemo(() => {
    let s = 0;
    if (p1.length >= 12) s++;
    if (/[a-z]/.test(p1) && /[A-Z]/.test(p1)) s++;
    if (/\d/.test(p1)) s++;
    if (/[^a-zA-Z0-9]/.test(p1)) s++;
    if (s <= 1) return "weak";
    if (s === 2) return "medium";
    return "strong";
  }, [p1]);

  const strengthFrac = useMemo(() => {
    let s = 0;
    if (p1.length >= 12) s++;
    if (/[a-z]/.test(p1) && /[A-Z]/.test(p1)) s++;
    if (/\d/.test(p1)) s++;
    if (/[^a-zA-Z0-9]/.test(p1)) s++;
    return s / 4;
  }, [p1]);

  async function generateMnemonicStep() {
    setErr(null);
    if (p1.length < 12) {
      setErr("Passphrase must be at least 12 characters.");
      return;
    }
    if (p1 !== p2) {
      setErr("Passphrases do not match.");
      return;
    }
    setBusy(true);
    try {
      await window.bpvp.vaultCreate(p1, network);
      const { mnemonic } = await window.bpvp.seedGenerate();
      setMnemonicWords(mnemonic);
      await window.bpvp.setPrivacyScreen(true);
      setPhase("mnemonic");
      setConfirmedWrite(false);
    } catch {
      setErr("Could not create vault.");
    } finally {
      setBusy(false);
    }
  }

  function continueToBackup() {
    if (!confirmedWrite) return;
    nav("/backup", { state: { passphrase: p1 } });
  }

  if (phase === "mnemonic") {
    return (
      <div style={{ padding: 32, maxWidth: 900, margin: "0 auto", minHeight: "100vh", background: "#020617" }}>
        <h2 style={{ marginTop: 0, color: "#f8fafc" }}>Recovery phrase</h2>
        <p style={{ color: "#f43f5e", fontWeight: 700, fontSize: 15 }}>
          Write down. Never share. Never screenshot.
        </p>
        <p style={{ color: "#94a3b8", fontSize: 14 }}>
          Your 24-word phrase is the only way to recover this wallet. Store it offline.
        </p>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
            gap: 10,
            marginTop: 20,
          }}
        >
          {mnemonicWords.map((w, i) => (
            <div
              key={i}
              style={{
                padding: "12px 14px",
                borderRadius: 8,
                border: "1px solid #1e293b",
                background: "#0f172a",
                color: "#e2e8f0",
                fontSize: 14,
              }}
            >
              <span style={{ color: "#64748b", marginRight: 8 }}>{i + 1}.</span>
              {w}
            </div>
          ))}
        </div>
        <label
          style={{
            display: "flex",
            gap: 10,
            alignItems: "center",
            marginTop: 28,
            color: "#cbd5e1",
            fontSize: 14,
            cursor: "pointer",
          }}
        >
          <input
            type="checkbox"
            checked={confirmedWrite}
            onChange={(e) => setConfirmedWrite(e.target.checked)}
          />
          I have written down my recovery phrase
        </label>
        <button
          type="button"
          disabled={!confirmedWrite}
          onClick={() => continueToBackup()}
          style={{
            marginTop: 20,
            padding: "14px 28px",
            borderRadius: 8,
            border: "none",
            background: confirmedWrite ? "#10b981" : "#334155",
            color: "#020617",
            fontWeight: 600,
            cursor: confirmedWrite ? "pointer" : "not-allowed",
          }}
        >
          Continue to verification
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: 32, maxWidth: 520, margin: "0 auto", minHeight: "100vh", background: "#020617" }}>
      <h2 style={{ marginTop: 0, color: "#f8fafc" }}>Create wallet</h2>
      <p style={{ color: "#94a3b8", fontSize: 14 }}>
        Choose a strong passphrase. It encrypts your vault on disk (AES-256-GCM + Argon2id).
      </p>
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
        Passphrase
        <input
          type="password"
          value={p1}
          onChange={(e) => setP1(e.target.value)}
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
      <div style={{ marginTop: 10, display: "flex", justifyContent: "space-between", fontSize: 12 }}>
        <span style={{ color: "#64748b" }}>Strength</span>
        <span
          style={{
            color: strengthLabel === "weak" ? "#f43f5e" : strengthLabel === "medium" ? "#f59e0b" : "#10b981",
            fontWeight: 600,
            textTransform: "capitalize",
          }}
        >
          {strengthLabel}
        </span>
      </div>
      <div style={{ marginTop: 6, height: 6, background: "#1e293b", borderRadius: 4 }}>
        <div
          style={{
            height: "100%",
            width: `${strengthFrac * 100}%`,
            background:
              strengthLabel === "weak" ? "#f43f5e" : strengthLabel === "medium" ? "#f59e0b" : "#10b981",
            borderRadius: 4,
            transition: "width 0.15s ease-out",
          }}
        />
      </div>
      <label style={{ display: "block", marginTop: 20, fontSize: 13, color: "#94a3b8" }}>
        Confirm passphrase
        <input
          type="password"
          value={p2}
          onChange={(e) => setP2(e.target.value)}
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
      {err ? <p style={{ color: "#f43f5e", marginTop: 16 }}>{err}</p> : null}
      <button
        type="button"
        onClick={() => void generateMnemonicStep()}
        disabled={busy}
        style={{
          marginTop: 28,
          padding: "14px 28px",
          borderRadius: 8,
          border: "none",
          background: "#10b981",
          color: "#020617",
          fontWeight: 600,
          cursor: busy ? "wait" : "pointer",
        }}
      >
        Generate recovery phrase
      </button>
    </div>
  );
}
