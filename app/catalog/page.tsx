"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Header } from "../header";
import Link from "next/link";
import { useContractRead } from "../lib/web3/useContractRead";
import { SkuNFT_ADDRESS, SkuNFT_ABI } from "../lib/web3/sku abi";

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

export default function SKUListPage() {
  const router = useRouter();
  const [skus, setSkus] = useState<SKUProfile[]>([]);
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [loading, setLoading] = useState(true);

  const { data: nextTokenId } = useContractRead({
    address: SkuNFT_ADDRESS,
    abi: SkuNFT_ABI,
    functionName: "nextTokenId",
  });

  useEffect(() => {
    const fetchAllSKUs = async () => {
      if (typeof nextTokenId !== "bigint") return;

      const cacheKey = `skuCatalogCache_${SkuNFT_ADDRESS}`;
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        const { timestamp, data }: { timestamp: number; data: SKUProfile[] } = JSON.parse(cached);
        const isFresh = Date.now() - timestamp < 1000 * 60 * 10;
        const isComplete = data.length >= Number(nextTokenId);
        if (isFresh && isComplete) {
          setSkus(data);
          setLoading(false);
          return;
        }
      }

      const total = Number(nextTokenId);
      const fetched: SKUProfile[] = [];

      for (let i = 0; i < total; i++) {
        try {
          const res = await fetch(`/api/skuMetadata?skuId=${i}`);
          if (!res.ok) continue;
          const data = await res.json();
          fetched.push({ ...data, skuId: i.toString() });
        } catch (err) {
          console.error("Failed to fetch SKU", i, err);
        }
      }

      setSkus(fetched);
      setLoading(false);
      localStorage.setItem(cacheKey, JSON.stringify({ timestamp: Date.now(), data: fetched }));
    };

    fetchAllSKUs();
  }, [nextTokenId]);

  return (
    <>
      <Header />
      <main className="px-6 py-10 max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-bold">📦 SKU Catalog</h1>
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode(viewMode === "grid" ? "table" : "grid")}
              className="bg-muted text-muted-foreground hover:bg-muted/50 font-bold py-2 px-4 rounded-md"
            >
              {viewMode === "grid" ? "🔲 Table View" : "📦 Grid View"}
            </button>
            <button
              onClick={() => router.push("/catalog/sku/new")}
              className="bg-primary hover:bg-primary/80 text-white font-bold py-2 px-6 rounded-md"
            >
              ➕ Register SKU
            </button>
          </div>
        </div>

        {loading ? (
          <p className="text-muted-foreground">Loading SKUs...</p>
        ) : skus.length === 0 ? (
          <p className="text-muted-foreground">No SKUs registered yet.</p>
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {skus.map((sku) => (
              <Link
                key={sku.skuId}
                href={`/catalog/sku/${sku.skuId}`}
                className="block border rounded-xl p-6 bg-muted hover:bg-muted/50"
              >
                <h2 className="text-xl font-bold mb-2">{sku.description || sku.sku}</h2>
                <p className="text-muted-foreground text-sm mb-4">{sku.sku}</p>
                <div className="text-xs space-y-1">
                  <div>Compliance: <span className="capitalize">{sku.qaComplianceMode}</span></div>
                  <div>Access: {sku.visibility === "global" ? "Open" : "Restricted"}</div>
                  <div>Created: {new Date(sku.createdAt).toLocaleDateString()}</div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto border rounded-xl bg-muted">
            <table className="min-w-full text-sm">
              <thead className="bg-muted-foreground/10">
                <tr>
                  <th className="px-4 py-2 text-left">Product Name</th>
                  <th className="px-4 py-2 text-left">SKU Code</th>
                  <th className="px-4 py-2 text-left">Compliance</th>
                  <th className="px-4 py-2 text-left">Access</th>
                  <th className="px-4 py-2 text-left">Created</th>
                </tr>
              </thead>
              <tbody>
                {skus.map((sku) => (
                  <tr key={sku.skuId} className="border-t hover:bg-muted/50">
                    <td className="px-4 py-3 font-semibold">
                      <Link href={`/catalog/sku/${sku.skuId}`}>{sku.description || sku.sku}</Link>
                    </td>
                    <td className="px-4 py-3">{sku.sku}</td>
                    <td className="px-4 py-3 capitalize">{sku.qaComplianceMode}</td>
                    <td className="px-4 py-3 capitalize">
                      {sku.visibility === "global" ? "Open Access" : "Restricted Access"}
                    </td>
                    <td className="px-4 py-3">{new Date(sku.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </>
  );
}
