"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { publicClient } from "../../../lib/web3/publicClient";
import {
  InventoryNFT_ADDRESS,
  InventoryNFT_ABI,
} from "../../../lib/web3/inventoryABI";

/*────────────────────────── types ──────────────────────────*/
interface OnChainLot {
  lotId:     string;
  nodeId:    string;
  sku:       string;
  quantity:  number;
  qcStatus:  "Certified" | "Failed" | "Pending";
  timestamp: string;
}
interface InventoryGroup {
  sku:            string;
  totalQuantity:  number;
  lotCount:       number;
  avgLotSize:     number;
  lastReceipt:    string;
}

/*────────────────────────── util ──────────────────────────*/
const statusMap = (certified: boolean, failReason: string): OnChainLot["qcStatus"] =>
  certified ? "Certified" : failReason ? "Failed" : "Pending";

/*────────────────────────── component ─────────────────────*/
export function Inventory() {
  const router = useRouter();
  const { nodeID } = useParams() as { nodeID?: string };

  const [lots,    setLots]    = useState<OnChainLot[]>([]);
  const [groups,  setGroups]  = useState<InventoryGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] =
    useState<"All" | "Certified" | "Failed" | "Pending">("All");

  /*────────────── load lots once nodeID is known ─────────────*/
  useEffect(() => {
    if (!nodeID) return;

    (async () => {
      setLoading(true);
      try {
        const nextLotId = await publicClient.readContract({
          address: InventoryNFT_ADDRESS,
          abi: InventoryNFT_ABI,
          functionName: "nextLotId",
        }) as bigint;

        const temp: OnChainLot[] = [];

        for (let i = 0; i < Number(nextLotId); i++) {
          try {
            /* struct */
            const ls = await publicClient.readContract({
              address: InventoryNFT_ADDRESS,
              abi: InventoryNFT_ABI,
              functionName: "lots",
              args: [BigInt(i)],
            }) as {
              sku:      string;
              quantity: bigint;
              certified:boolean;
              certHash: string;
              failReason:string;
            };

            /* traits */
            const uri = await publicClient.readContract({
              address: InventoryNFT_ADDRESS,
              abi: InventoryNFT_ABI,
              functionName: "tokenURI",
              args: [BigInt(i)],
            }) as string;

            let nodeIdTrait = "";
            if (uri.startsWith("data:")) {
              const json = JSON.parse(atob(uri.split(",")[1]));
              nodeIdTrait =
                json.attributes?.find((a:any)=>a.trait_type==="Node ID")?.value || "";
            }

            if (nodeIdTrait !== nodeID) continue;

            temp.push({
              lotId: i.toString(),
              nodeId: nodeIdTrait,
              sku: ls.sku,
              quantity: Number(ls.quantity),
              qcStatus: statusMap(ls.certified, ls.failReason),
              timestamp: new Date().toISOString(), // replace w/ block ts if needed
            });
          } catch {/* skip */}
        }
        setLots(temp);
      } finally {
        setLoading(false);
      }
    })();
  }, [nodeID]);

  /*────────────── regroup whenever lots or filter change ─────────────*/
  useEffect(() => {
    if (loading) return;

    const show = filterStatus === "All"
      ? lots
      : lots.filter(l => l.qcStatus === filterStatus);

    /* aggregate */
    const map = new Map<string,{qty:number; arr:OnChainLot[]}>();
    show.forEach(l => {
      const e = map.get(l.sku) ?? { qty:0, arr:[] };
      e.qty += l.quantity;
      e.arr.push(l);
      map.set(l.sku, e);
    });

    const agg: InventoryGroup[] = Array.from(map, ([sku,{qty,arr}]) => ({
      sku,
      totalQuantity: qty,
      lotCount: arr.length,
      avgLotSize: qty / arr.length,
      lastReceipt: arr[0].timestamp,
    }));
    setGroups(agg);
  }, [lots, filterStatus, loading]);

  /*────────────────────────── render ──────────────────────────*/
  if (loading) {
    return (
      <div className="mt-12">
        <h2 className="text-2xl font-bold">📦 Inventory</h2>
        <p>Loading inventory…</p>
      </div>
    );
  }

  return (
    <div className="mt-12">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">
          📦 Inventory for Node #{nodeID}
        </h2>
        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value as any)}
          className="border rounded-md px-3 py-2 text-sm"
        >
          {["All", "Certified", "Failed", "Pending"].map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      {groups.length === 0 ? (
        <p className="text-muted-foreground">
          No lots match this filter.
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {groups.map(g => (
            <div
              key={g.sku}
              className="border rounded-xl p-6 bg-muted hover:bg-muted/50 transition cursor-pointer"
              onClick={() => router.push(`/dashboard/${nodeID}/inventory/${g.sku}`)}
            >
              <h3 className="text-xl font-semibold mb-2">{g.sku}</h3>
              <p className="text-2xl font-bold text-primary mb-1">
                {g.totalQuantity.toLocaleString()} units
              </p>
              <div className="text-sm text-muted-foreground space-y-1">
                <p>Lots: {g.lotCount}</p>
                <p>Avg Lot Size: {g.avgLotSize.toFixed(1)}</p>
                <p>
                  Last Receipt:{" "}
                  {new Date(g.lastReceipt).toLocaleDateString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
