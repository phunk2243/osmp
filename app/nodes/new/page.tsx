// src/app/nodes/new/page.tsx
"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Header } from "../../header";
import { useWalletClient } from "../../lib/web3/useWalletClient";
import { useContractRead } from "../../lib/web3/useContractRead";
import { useContractWrite } from "../../lib/web3/useContractWrite";
import { NodeNFT_ADDRESS, NodeNFT_ABI } from "../../lib/web3/contracts";
import { publicClient } from "../../lib/web3/publicClient";

interface NodeProfile {
  nodeId: string;
  name: string;
  location: string;
  ownerWallet: string;
  contactEmail?: string;
  certifications: string[];
  installedMachines: string[];
  status: "pending" | "approved" | "blacklisted";
  createdAt: string;
  escrowBalance: string;
  healthScore: number;
}

export default function NewNodePage() {
  const router = useRouter();
  const { address } = useWalletClient();
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [certifications, setCertifications] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const availableCertifications = ["ISO9001", "ISO13485", "FDA 820"];

  const { data: nextTokenId, loading: readingNext, error: readError } = useContractRead<bigint>({
    address: NodeNFT_ADDRESS,
    abi: NodeNFT_ABI,
    functionName: "nextTokenId",
  });

  const metadata = {
    name,
    description: `Manufacturing Node at ${location}`,
    attributes: [
      { trait_type: "Location", value: location },
      { trait_type: "Certifications", value: certifications.join(", ") },
      { trait_type: "Status", value: "pending" },
      { trait_type: "Created At", value: new Date().toISOString() },
      { trait_type: "Health Score", value: "100" },
      { trait_type: "Escrow Balance", value: "0" },
      { trait_type: "Capacity", value: "" }
    ],
  };
  

  const metadataURI =
    "data:application/json;base64," + window.btoa(JSON.stringify(metadata));

  const {
    write: mintNode,
    loading: minting,
    error: mintError,
  } = useContractWrite({
    address: NodeNFT_ADDRESS,
    abi: NodeNFT_ABI,
    functionName: "mintNode",
    args: [address || "", metadataURI],
  });

  const handleToggleCertification = (cert: string) => {
    setCertifications((prev) =>
      prev.includes(cert) ? prev.filter((c) => c !== cert) : [...prev, cert]
    );
  };

  const handleSave = async () => {
    setError(null);
    if (!address) {
      setError("Connect your wallet to create a node.");
      return;
    }
    if (!name.trim() || !location.trim()) {
      setError("Name and Location are required.");
      return;
    }
    if (readError) {
      setError(`Failed to read next token ID: ${readError.message}`);
      return;
    }
    if (readingNext) {
      setError("Still reading next token ID, please wait.");
      return;
    }

    const nodeId = nextTokenId?.toString();
    if (!nodeId) {
      setError("Invalid token ID");
      return;
    }

    const txHash = await mintNode();
    if (mintError || !txHash) {
      setError(`Minting failed: ${mintError?.message || "Unknown error"}`);
      return;
    }

    try {
      await publicClient.waitForTransactionReceipt({ hash: txHash });
    } catch (err) {
      setError(`Transaction confirmation failed: ${(err as Error).message}`);
      return;
    }

    const existing = JSON.parse(localStorage.getItem("nodeRegistry") || "[]") as NodeProfile[];
    if (existing.some((node) => node.nodeId === nodeId)) {
      setError(`A node with ID ${nodeId} already exists.`);
      return;
    }

    const newNode: NodeProfile = {
      nodeId,
      name,
      location,
      ownerWallet: address,
      contactEmail,
      certifications,
      installedMachines: [],
      status: "pending",
      createdAt: new Date().toISOString(),
      escrowBalance: "0",
      healthScore: 100,
    };

    localStorage.setItem("nodeRegistry", JSON.stringify([...existing, newNode]));
    router.push(`/nodes/${nodeId}`);
  };

  return (
    <>
      <Header />
      <main className="px-6 py-10 max-w-3xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">Register New Node</h1>
        {readingNext && <p>Reading next token ID...</p>}
        {error && <p className="text-red-600 mb-4">{error}</p>}
        {readError && <p className="text-red-600 mb-4">Contract read error: {readError.message}</p>}
        {mintError && <p className="text-red-600 mb-4">Mint error: {mintError.message}</p>}
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-semibold mb-1">Node Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="border rounded-md w-full px-4 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1">Location</label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="border rounded-md w-full px-4 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1">Contact Email (Optional)</label>
            <input
              type="email"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              className="border rounded-md w-full px-4 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1">Certifications</label>
            <div className="flex flex-wrap gap-2 mt-2">
              {availableCertifications.map((cert) => (
                <label key={cert} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={certifications.includes(cert)}
                    onChange={() => handleToggleCertification(cert)}
                  />
                  {cert}
                </label>
              ))}
            </div>
          </div>
          <div className="mt-8 flex justify-end">
            <button
              onClick={handleSave}
              disabled={!address || readingNext || minting}
              className="bg-primary hover:bg-primary/80 text-white font-bold py-2 px-6 rounded-md"
            >
              {minting ? "Minting Node NFT..." : "Create Node"}
            </button>
          </div>
        </div>
      </main>
    </>
  );
}
