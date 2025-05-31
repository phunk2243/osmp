"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { publicClient } from "../../../lib/web3/publicClient";
import {
  InventoryNFT_ADDRESS,
  InventoryNFT_ABI,
} from "../../../lib/web3/inventoryABI";

export interface ProductionLot {
  lotId: string;
  nodeId: string;
  machineId: string;
  sku: string;
  quantity: number;
  timestamp: string;
  qcPass: boolean | null;
  eventLog: { timestamp: string; event: string }[];
  qualityReports: { type: string; summary: string; timestamp: string }[];
}

type Scope = "global" | "node" | "machine";

interface Props {
  scope: Scope;
  nodeId?: string;
  machineId?: string;
  refreshTrigger?: number;
}

export function ProductionHistory({
  scope,
  nodeId,
  machineId,
  refreshTrigger,
}: Props) {
  const router = useRouter();
  const [lots, setLots]       = useState<ProductionLot[]>([]);
  const [filterSKU, setSKU]   = useState("All");
  const [loading, setLoading] = useState(true);

  /*──────────────────────── fetch & build lots ───────────────────────*/
  useEffect(() => {
    const loadHistory = async () => {
      setLoading(true);
      try {
        /* window */
        const latestBN  = await publicClient.getBlockNumber();
        const fromBlock = latestBN > 100_000n ? latestBN - 100_000n : 0n;

        const [mintedRaw, certifiedRaw, failedRaw] = await Promise.all([
          publicClient.getContractEvents({
            address: InventoryNFT_ADDRESS,
            abi: InventoryNFT_ABI,
            eventName: "LotMinted",
            fromBlock,
            toBlock: "latest",
          }),
          publicClient.getContractEvents({
            address: InventoryNFT_ADDRESS,
            abi: InventoryNFT_ABI,
            eventName: "LotCertified",
            fromBlock,
            toBlock: "latest",
          }),
          publicClient.getContractEvents({
            address: InventoryNFT_ADDRESS,
            abi: InventoryNFT_ABI,
            eventName: "LotFailed",
            fromBlock,
            toBlock: "latest",
          }),
        ]);

        /* type‑narrow */
        type Minted = {
          args: { lotId: bigint; sku: string; quantity: bigint };
          blockHash: `0x${string}`;
        };
        type Certified = {
          args: { lotId: bigint; certHash: string };
          blockHash: `0x${string}`;
        };
        type Failed = {
          args: { lotId: bigint; reason: string };
          blockHash: `0x${string}`;
        };

        const minted    = mintedRaw    as unknown as Minted[];
        const certified = certifiedRaw as unknown as Certified[];
        const failed    = failedRaw    as unknown as Failed[];

        /* timestamp cache */
        const tsCache = new Map<string, string>();
        async function tsOf(hash:`0x${string}`) {
          if (!tsCache.has(hash)) {
            const b = await publicClient.getBlock({ blockHash: hash });
            tsCache.set(hash, new Date(Number(b.timestamp) * 1000).toISOString());
          }
          return tsCache.get(hash)!;
        }

        /* build map */
        const map = new Map<string, ProductionLot>();

        await Promise.all(
          minted.map(async (log) => {
            const { lotId, sku, quantity } = log.args;
            const id  = lotId.toString();
            const ts  = await tsOf(log.blockHash);

            /* fallback owner */
            const owner = await publicClient.readContract({
              address: InventoryNFT_ADDRESS,
              abi: InventoryNFT_ABI,
              functionName: "ownerOf",
              args: [lotId],
            }) as string;

            /* read tokenURI → nodeId / machineId traits */
            let nodeFromMeta = "";
            let machFromMeta = "";
            try {
              const uri = await publicClient.readContract({
                address: InventoryNFT_ADDRESS,
                abi: InventoryNFT_ABI,
                functionName: "tokenURI",
                args: [lotId],
              }) as string;

              if (uri.startsWith("data:application/json;base64,")) {
                const json = JSON.parse(atob(uri.split(",")[1]));
                nodeFromMeta =
                  json.attributes?.find((a:any)=>a.trait_type==="Node ID")?.value || "";
                machFromMeta =
                  json.attributes?.find((a:any)=>a.trait_type==="Machine ID")?.value || "";
              }
            } catch {/* ignore */}

            map.set(id, {
              lotId: id,
              nodeId:    nodeFromMeta || owner,
              machineId: machFromMeta,
              sku,
              quantity: Number(quantity),
              timestamp: ts,
              qcPass: null,
              eventLog: [{ timestamp: ts, event: "Lot minted" }],
              qualityReports: [],
            });
          })
        );

        /* merge cert / fail */
        certified.forEach(log => {
          const e = map.get(log.args.lotId.toString()); if (!e) return;
          const ts = tsCache.get(log.blockHash)!;
          e.qcPass = true;
          e.eventLog.push({ timestamp: ts, event: "Lot certified" });
          e.qualityReports.push({ type:"Certification", summary:log.args.certHash, timestamp:ts });
        });
        failed.forEach(log => {
          const e = map.get(log.args.lotId.toString()); if (!e) return;
          const ts = tsCache.get(log.blockHash)!;
          e.qcPass = false;
          e.eventLog.push({ timestamp: ts, event: "Lot failed" });
          e.qualityReports.push({ type:"Failure", summary:log.args.reason, timestamp:ts });
        });

        /* apply scope filter (BigInt‑safe) */
        let all = Array.from(map.values());
        if (scope === "node" && nodeId) {
          all = all.filter(l => l.nodeId && BigInt(l.nodeId) === BigInt(nodeId));
        } else if (scope === "machine" && machineId) {
          all = all.filter(
            l => l.machineId && BigInt(l.machineId) === BigInt(machineId)
          );
        }

        setLots(all);
      } catch (err) {
        console.error("ProductionHistory error:", err);
        setLots([]);
      } finally {
        setLoading(false);
      }
    };

    loadHistory();
  }, [scope, nodeId, machineId, refreshTrigger]);

  /*──────────────────────── UI helpers ───────────────────────*/
  const skus    = Array.from(new Set(lots.map(l => l.sku)));
  const choices = ["All", ...skus];
  const display = lots
    .filter(l => filterSKU === "All" || l.sku === filterSKU)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  /*──────────────────────── render ───────────────────────────*/
  if (loading) {
    return (
      <div className="mt-12">
        <h2 className="text-2xl font-bold">📦 Production History</h2>
        <p>Loading…</p>
      </div>
    );
  }

  return (
    <div className="mt-12">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">📦 Production History</h2>
        <select
          className="border rounded-md px-3 py-2 text-sm"
          value={filterSKU}
          onChange={(e) => setSKU(e.target.value)}
        >
          {choices.map((s, idx) => (
            <option key={`${s}-${idx}`} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      <div className="overflow-x-auto border rounded-xl bg-muted">
        <table className="min-w-full text-sm">
          <thead className="bg-muted-foreground/10">
            <tr>
              <th className="px-4 py-2 text-left">Lot ID</th>
              <th className="px-4 py-2 text-left">Timestamp</th>
              <th className="px-4 py-2 text-left">SKU</th>
              <th className="px-4 py-2 text-left">Qty</th>
              <th className="px-4 py-2 text-left">QC</th>
            </tr>
          </thead>
          <tbody>
            {display.map((lot) => (
              <tr
                key={lot.lotId}
                className="border-t hover:bg-muted/50 cursor-pointer"
                onClick={() => router.push(`/inventory/${lot.lotId}`)}
              >
                <td className="px-4 py-3">{lot.lotId}</td>
                <td className="px-4 py-3">
                  {new Date(lot.timestamp).toLocaleString()}
                </td>
                <td className="px-4 py-3">{lot.sku}</td>
                <td className="px-4 py-3">{lot.quantity.toLocaleString()}</td>
                <td className="px-4 py-3">
                  {lot.qcPass === true
                    ? "✅ Passed"
                    : lot.qcPass === false
                    ? "❌ Failed"
                    : "⏳ Pending"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
