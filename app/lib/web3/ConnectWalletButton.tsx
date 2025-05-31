// src/components/web3/ConnectWalletButton.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useWalletClient } from "../../lib/web3/useWalletClient";

export function ConnectWalletButton() {
  const { address } = useWalletClient();
  const [connecting, setConnecting] = useState(false);
  const router = useRouter();

  async function handleConnect() {
    if (!window.ethereum) {
      alert("No wallet found. Please install MetaMask or another provider.");
      return;
    }
    try {
      setConnecting(true);
      await window.ethereum.request({ method: "eth_requestAccounts" });
      // address updates automatically via the hook
    } catch (err) {
      console.error("Connection error", err);
    } finally {
      setConnecting(false);
    }
  }

  /* ───────── render ───────── */
  return address ? (
    <button
      onClick={() => router.push("/dashboard")}   
      className="border px-4 py-2 rounded-md bg-muted text-muted-foreground hover:bg-muted/50"
      title={address}
    >
      {address.slice(0, 6)}…{address.slice(-4)}
    </button>
  ) : (
    <button
      onClick={handleConnect}
      className="bg-primary text-white font-bold px-4 py-2 rounded-md hover:bg-primary/80"
      disabled={connecting}
    >
      {connecting ? "Connecting…" : "Connect Wallet"}
    </button>
  );
}
