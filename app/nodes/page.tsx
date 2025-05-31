// src/app/nodes/page.tsx
"use client";

import { useEffect, useState } from "react";
import { Header } from "../header";
import Link from "next/link";
import { useContractRead } from "../lib/web3/useContractRead";
import { NodeNFT_ADDRESS, NodeNFT_ABI } from "../lib/web3/contracts";

interface NodeProfile {
  nodeId: string;
  name: string;
  location: string;
  ownerWallet: string;
  contactEmail?: string;
  certifications: string[];
  installedMachines: string[];
  capacity: string;
  status: "pending" | "approved" | "blacklisted";
  createdAt: string;
  escrowBalance: string;
  healthScore: number;
}

export default function NodesPage() {
  const [nodes, setNodes] = useState<NodeProfile[]>([]);
  const [totalSupply, setTotalSupply] = useState<number>(0);

  const { data: supply } = useContractRead({
    address: NodeNFT_ADDRESS,
    abi: NodeNFT_ABI,
    functionName: "nextTokenId",
  });

  useEffect(() => {
    if (supply !== undefined) {
      const count = Number(supply);
      setTotalSupply(count);
    }
  }, [supply]);

  useEffect(() => {
    const fetchNodes = async () => {
      const all: NodeProfile[] = [];
      for (let i = 0; i < totalSupply; i++) {
        try {
          const res = await fetch(`/api/nodeMetadata?tokenId=${i}`);
          if (!res.ok) continue;
          const data = await res.json();
          all.push({
            nodeId: i.toString(),
            name: data.name,
            location: data.attributes.find((a: any) => a.trait_type === "Location")?.value || "",
            certifications: data.attributes.find((a: any) => a.trait_type === "Certifications")?.value?.split(", ") || [],
            status: data.attributes.find((a: any) => a.trait_type === "Status")?.value || "pending",
            createdAt: data.attributes.find((a: any) => a.trait_type === "Created At")?.value || new Date().toISOString(),
            capacity: data.attributes.find((a: any) => a.trait_type === "Capacity")?.value || "",
            escrowBalance: data.attributes.find((a: any) => a.trait_type === "Escrow Balance")?.value || "0",
            healthScore: Number(data.attributes.find((a: any) => a.trait_type === "Health Score")?.value) || 100,
            ownerWallet: "",
            contactEmail: "",
            installedMachines: [],
          });
        } catch (err) {
          console.error("Failed to load node", i, err);
        }
      }
      setNodes(all);
      localStorage.setItem("allNodeMetadata", JSON.stringify({ timestamp: Date.now(), data: all }));
    };

    const cached = localStorage.getItem("allNodeMetadata");
    if (cached) {
      const { timestamp, data } = JSON.parse(cached);
      const isFresh = Date.now() - timestamp < 1000 * 60 * 10; // 10 minutes
      if (isFresh && data.length >= totalSupply) {
        setNodes(data);
        return;
      }
    }

    if (totalSupply > 0) fetchNodes();
  }, [totalSupply]);

  return (
    <>
      <Header />
      <main className="px-6 py-10">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold">🏣 Node Registry</h1>
          <Link href="/nodes/new">
            <button className="bg-primary hover:bg-primary/80 text-white font-bold py-2 px-6 rounded-md">
              ➕ Register Node
            </button>
          </Link>
        </div>

        {nodes.length === 0 ? (
          <p className="text-muted-foreground text-center">No nodes registered yet.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {nodes.map((node) => (
              <Link key={node.nodeId} href={`/nodes/${node.nodeId}`}>
                <div className="border rounded-xl p-6 bg-muted hover:shadow-lg transition cursor-pointer">
                  <div className="flex justify-between items-center mb-2">
                    <h2 className="text-xl font-semibold">{node.name}</h2>
                    <span className="text-xs font-bold uppercase">{node.status}</span>
                  </div>
                  <p className="text-muted-foreground text-sm mb-2">{node.location}</p>
                  <p className="text-sm">
                    Capacity: <span className="font-bold">{node.capacity || "Unknown"}</span>
                  </p>
                  <p className="text-sm">
                    Certifications: <span className="font-bold">
                      {node.certifications.length > 0 ? node.certifications.join(", ") : "None"}
                    </span>
                  </p>
                  <p className="text-sm">
                    Health Score: <span className="font-bold">{node.healthScore}/100</span>
                  </p>
                  <p className="text-sm">
                    Escrow Balance: <span className="font-bold">{node.escrowBalance} OSMP</span>
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </>
  );
}