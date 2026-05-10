import { useEffect } from "react";
import { HashRouter, Navigate, Route, Routes } from "react-router-dom";
import { Backup } from "./pages/Backup";
import { Connect } from "./pages/Connect";
import { Create } from "./pages/Create";
import { ImportWallet } from "./pages/ImportWallet";
import { Main } from "./pages/Main";
import { Receive } from "./pages/Receive";
import { Send } from "./pages/Send";
import { Settings } from "./pages/Settings";
import { Sign } from "./pages/Sign";
import { Welcome } from "./pages/Welcome";

export function App() {
  useEffect(() => {
    const off = window.bpvp.onLocked(() => {
      window.location.hash = "#/welcome";
    });
    return off;
  }, []);

  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/welcome" replace />} />
        <Route path="/welcome" element={<Welcome />} />
        <Route path="/create" element={<Create />} />
        <Route path="/import" element={<ImportWallet />} />
        <Route path="/backup" element={<Backup />} />
        <Route path="/main" element={<Main />} />
        <Route path="/send" element={<Send />} />
        <Route path="/receive" element={<Receive />} />
        <Route path="/sign" element={<Sign />} />
        <Route path="/connect" element={<Connect />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </HashRouter>
  );
}
