import { useState } from "react";
import { useNavigate } from "react-router-dom";

type NetworkId = "bitcoin" | "testnet" | "signet" | "regtest";

export function ImportWallet() {
  const nav = useNavigate();
  const [mnemonic, setMnemonic] = useState("");
  const [pass, setPass] = useState("");
  const [pass2, setPass2] = useState("");
  const [network, setNetwork] = useState<NetworkId>("testnet");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit() {
    setErr(null);
    if (pass.length < 12) {
      setErr("Passphrase must be at least 12 characters.");
      return;
    }
    if (pass !== pass2) {
      setErr("Passphrases do not match.");
      return;
    }
    const words = mnemonic.trim().split(/\s+/);
    if (words.length < 12) {
      setErr("Enter a valid BIP39 mnemonic.");
      return;
    }
    setBusy(true);
    try {
      await window.bpvp.settingsSet({ network });
      await window.bpvp.vaultImport(mnemonic.trim(), pass);
      nav("/main");
    } catch {
      setErr("Import failed. Check mnemonic and passphrase.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ padding: 32, maxWidth: 520, margin: "0 auto", minHeight: "100vh", background: "#020617", color: "#f8fafc" }}>
      <h2 style={{ marginTop: 0 }}>Import wallet</h2>
      <p style={{ color: "#94a3b8", fontSize: 14 }}>
        Your recovery phrase encrypts into the local vault. It is never sent to the network.
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
        Recovery phrase
        <textarea
          value={mnemonic}
          onChange={(e) => setMnemonic(e.target.value)}
          rows={4}
          placeholder="word1 word2 …"
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
      <label style={{ display: "block", marginTop: 20, fontSize: 13, color: "#94a3b8" }}>
        New vault passphrase
        <input
          type="password"
          value={pass}
          onChange={(e) => setPass(e.target.value)}
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
        Confirm passphrase
        <input
          type="password"
          value={pass2}
          onChange={(e) => setPass2(e.target.value)}
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
      <p style={{ marginTop: 16 }}>
        <button
          type="button"
          onClick={() => nav("/welcome")}
          style={{
            padding: "12px 16px",
            borderRadius: 8,
            border: "1px solid #334155",
            background: "transparent",
            color: "#94a3b8",
            marginRight: 12,
            cursor: "pointer",
          }}
        >
          Back
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => void submit()}
          style={{
            padding: "12px 20px",
            borderRadius: 8,
            border: "none",
            background: "#10b981",
            color: "#020617",
            fontWeight: 600,
            cursor: busy ? "wait" : "pointer",
          }}
        >
          Import
        </button>
      </p>
    </div>
  );
}
