// src/app/components/header.tsx
"use client";

import Link from "next/link";
import { ConnectWalletButton } from "./lib/web3/ConnectWalletButton";

export function Header() {
  return (
    <header className="w-full px-6 py-4 border-b flex justify-between items-center">
      <Link href="/" className="text-xl font-bold">
        OSMP
      </Link>
      <nav className="flex gap-4 items-center">
        <Link href="/modules">Modules</Link>
        <Link href="/catalog">Catalog</Link>
        <Link href="/inventory">Inventory</Link>
        <Link href="/marketplace">Bounties</Link>
        <Link href="/nodes">Nodes</Link>
        <Link href="/machine">Machines</Link>
        <Link href="/governance">Governance</Link>
      </nav>
      <ConnectWalletButton />
    </header>
  );
}
