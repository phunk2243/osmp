"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Header } from "../../header";
import { ProductionHistory } from "../../components/dashboard/ProductionHistory";
import { Inventory } from "../../components/dashboard/Inventory";
import { Machines } from "../../components/machine";
import { useContractRead } from "../../lib/web3/useContractRead";
import { NodeNFT_ADDRESS, NodeNFT_ABI } from "../../lib/web3/contracts";

interface NodeProfile {
  nodeId: string;                // NFT token ID (stringified)
  name: string;
  location: string;
  ownerWallet: string;           // on‑chain owner address
  certifications: string[];
  status: "pending" | "approved" | "blacklisted";
  createdAt: string;
  healthScore: number;
  escrowBalance: string;
}

export default function NodeDetailPage() {
  const params   = useParams();
  const router   = useRouter();
  const rawId    = params.nodeID;
  const nodeID   = Array.isArray(rawId) ? rawId[0] : rawId;   // URL param

  const [node, setNode] = useState<NodeProfile | null>(null);

  /* ──────────────────────────── on‑chain reads ──────────────────────────── */
  const { data: tokenURI } = useContractRead<string>({
    address: NodeNFT_ADDRESS,
    abi: NodeNFT_ABI,
    functionName: "tokenURI",
    args: [BigInt(nodeID || "0")],
  });

  const { data: ownerWallet } = useContractRead<`0x${string}`>({
    address: NodeNFT_ADDRESS,
    abi: NodeNFT_ABI,
    functionName: "ownerOf",
    args: [BigInt(nodeID || "0")],
  });

  /* ───────────────────────────── set local state ────────────────────────── */
  useEffect(() => {
    if (!nodeID || !tokenURI) return;

    if (
      typeof tokenURI === "string" &&
      tokenURI.startsWith("data:application/json;base64,")
    ) {
      try {
        const json      = JSON.parse(atob(tokenURI.split(",")[1]));
        const certAttr  =
          json.attributes?.find((a: any) => a.trait_type === "Certifications")
            ?.value;

        setNode({
          nodeId: nodeID,
          name:        json.name,
          location:
            json.attributes?.find((a: any) => a.trait_type === "Location")
              ?.value || "",
          certifications:
            certAttr ? (certAttr as string).split(", ") : [],
          status:
            (json.attributes?.find((a: any) => a.trait_type === "Status")
              ?.value as NodeProfile["status"]) || "pending",
          createdAt:
            (json.attributes?.find((a: any) => a.trait_type === "Created At")
              ?.value as string) || new Date().toISOString(),
          healthScore: Number(
            json.attributes?.find((a: any) => a.trait_type === "Health Score")
              ?.value || 100
          ),
          escrowBalance:
            (json.attributes?.find((a: any) => a.trait_type === "Escrow Balance")
              ?.value as string) || "0",
          ownerWallet: ownerWallet || "",
        });
      } catch (err) {
        console.error("Failed to parse tokenURI metadata", err);
        router.push("/nodes");
      }
    }
  }, [tokenURI, ownerWallet, nodeID, router]);

  /* ──────────────────────────── render ──────────────────────────── */
  if (!nodeID)            return <p className="p-6 text-red-600">Invalid node ID</p>;
  if (!node)              return <p className="p-6">Loading node data…</p>;

  return (
    <>
      <Header />

      <main className="px-6 py-10 max-w-5xl mx-auto">
        {/* heading + back btn */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-bold">{node.name} Overview</h1>
          <button
            onClick={() => router.back()}
            className="bg-muted text-muted-foreground hover:bg-muted/50 font-bold py-2 px-6 rounded-md"
          >
            ← Back
          </button>
        </div>

        {/* summary cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          <InfoCard label="Location"        value={node.location} />
          <InfoCard label="Status"          value={node.status} />
          <InfoCard label="Certifications"  value={node.certifications.length ? node.certifications.join(", ") : "None"} />
          <InfoCard label="Registered"      value={new Date(node.createdAt).toLocaleDateString()} />
          <InfoCard label="Health Score"    value={`${node.healthScore}/100`} />
          <InfoCard label="Escrow Balance"  value={`${node.escrowBalance} OSMP`} />
          <InfoCard label="Wallet Address"  value={node.ownerWallet} />
        </div>

        {/* node‑scoped sections */}
        <div className="space-y-12">
          <Inventory />

          {/* ⬇️ now filtered by Node NFT ID, not wallet address */}
          <ProductionHistory scope="node" nodeId={nodeID} />

          <section>
            <h2 className="text-2xl font-bold mb-6">🛠️ Machines</h2>
            <Machines filterByNodeID={nodeID} />
          </section>
        </div>
      </main>
    </>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="border rounded-xl p-6 bg-muted">
      <h2 className="text-sm font-semibold text-muted-foreground uppercase mb-1">
        {label}
      </h2>
      <p className="font-bold break-words">{value}</p>
    </div>
  );
}
