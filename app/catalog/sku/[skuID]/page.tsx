"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Header } from "../../../header";
import { publicClient } from "../../../lib/web3/publicClient";
import { SkuNFT_ADDRESS, SkuNFT_ABI } from "../../../lib/web3/sku abi";
import { NodeNFT_ADDRESS, NodeNFT_ABI } from "../../../lib/web3/contracts";

interface SKUProfile {
  skuId: string;
  sku: string;
  description: string;
  qaComplianceMode: "none" | "iso9001" | "iso13485";
  documentControlRequired: boolean;
  trainingRequired: boolean;
  riskAnalysisRequired: boolean;
  complaintHandlingRequired: boolean;
  createdAt: string;
  createdByNodeID: string;
  visibility: "global" | "private";
}

interface NodeProfile {
  nodeId: string;
  name: string;
}

export default function SKUDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { skuID } = params as { skuID: string };

  const [skuData, setSkuData] = useState<SKUProfile | null>(null);
  const [whitelisted, setWhitelisted] = useState<NodeProfile[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSku = async () => {
      try {
        const res = await fetch(`/api/skuMetadata?skuId=${skuID}`);
        if (!res.ok) throw new Error("Not found");
        const metadata = await res.json();

        const isGlobal = (await publicClient.readContract({
          address: SkuNFT_ADDRESS,
          abi: SkuNFT_ABI,
          functionName: "skuIsGlobal",
          args: [BigInt(skuID)],
        })) as boolean;

        setSkuData({ ...metadata, visibility: isGlobal ? "global" : "private" });

        if (!isGlobal) {
          const nodes: NodeProfile[] = [];
          for (let i = 0; i < 100; i++) {
            try {
              const result = await publicClient.readContract({
                address: SkuNFT_ADDRESS,
                abi: SkuNFT_ABI,
                functionName: "isNodeWhitelisted",
                args: [BigInt(skuID), BigInt(i)],
              });
              if (result) {
                const meta = await fetch(`/api/nodeMetadata?tokenId=${i}`);
                if (meta.ok) {
                  const json = await meta.json();
                  nodes.push({ nodeId: i.toString(), name: json.name });
                }
              }
            } catch (_) {
              continue;
            }
          }
          setWhitelisted(nodes);
        }
      } catch (err: any) {
        console.error("Error fetching SKU:", err);
        setSkuData(null);
        setError("Failed to fetch SKU data.");
      }
    };
    fetchSku();
  }, [skuID]);

  if (!skuData) {
    return (
      <>
        <Header />
        <main className="px-6 py-10 max-w-3xl mx-auto">
          <h1 className="text-4xl font-bold mb-6">SKU Not Found</h1>
          <p className="text-muted-foreground">No SKU matching ID {skuID} was found in the catalog.</p>
          {error && <p className="text-sm text-red-500 mt-4">{error}</p>}
        </main>
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="px-6 py-10 max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-bold">{skuData.description || skuData.sku}</h1>
          <button
            onClick={() => router.push("/catalog")}
            className="bg-muted text-muted-foreground hover:bg-muted/50 font-bold py-2 px-6 rounded-md"
          >
            ← Back to Catalog
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-12">
          <div className="border rounded-xl p-6 bg-muted">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase mb-1">Product Name</h2>
            <p className="text-lg font-bold">{skuData.description || skuData.sku}</p>
          </div>

          <div className="border rounded-xl p-6 bg-muted">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase mb-1">Compliance Mode</h2>
            <p className="capitalize font-bold text-lg">
              {skuData.qaComplianceMode === "none"
                ? "None"
                : skuData.qaComplianceMode === "iso9001"
                ? "ISO 9001"
                : "ISO 13485"}
            </p>
          </div>

          <div className="border rounded-xl p-6 bg-muted">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase mb-1">Access Control</h2>
            <p className="capitalize font-bold text-lg">
              {skuData.visibility === "global"
                ? "Global"
                : "Private"}
            </p>
          </div>

          <div className="border rounded-xl p-6 bg-muted">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase mb-1">Created At</h2>
            <p className="text-lg font-bold">{new Date(skuData.createdAt).toLocaleDateString()}</p>
          </div>
        </div>

        <h2 className="text-2xl font-bold mb-4">Compliance Requirements</h2>
        <ul className="space-y-2 text-sm mb-10">
          <li>Document Control: {skuData.documentControlRequired ? "✅ Required" : "❌ Not Required"}</li>
          <li>Training: {skuData.trainingRequired ? "✅ Required" : "❌ Not Required"}</li>
          <li>Risk Analysis: {skuData.riskAnalysisRequired ? "✅ Required" : "❌ Not Required"}</li>
          <li>Complaint Handling: {skuData.complaintHandlingRequired ? "✅ Required" : "❌ Not Required"}</li>
        </ul>

        {skuData.visibility === "private" && (
          <div>
            <h2 className="text-2xl font-bold mb-4">Whitelisted Nodes</h2>
            <ul className="list-disc pl-5 text-sm">
              {whitelisted.length > 0 ? (
                whitelisted.map((node) => (
                  <li key={node.nodeId}>
                    {node.name} (ID: {node.nodeId})
                  </li>
                ))
              ) : (
                <li>No nodes currently whitelisted for this SKU.</li>
              )}
            </ul>
          </div>
        )}
      </main>
    </>
  );
}
