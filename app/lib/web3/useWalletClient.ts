// src/lib/web3/useWalletClient.ts
"use client";

import { useEffect, useState } from "react";
import { createWalletClient, custom, type WalletClient } from "viem";
import { sepolia } from "viem/chains";

export function useWalletClient() {
  const [client, setClient] = useState<WalletClient | null>(null);
  const [address, setAddress] = useState<`0x${string}` | null>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !window.ethereum) return;

    const walletClient = createWalletClient({
      chain: sepolia,
      transport: custom(window.ethereum),
    });

    walletClient.requestAddresses().then((accounts) => {
      setClient(walletClient);
      setAddress(accounts[0]);
    });
  }, []);

  return { client, address };
}