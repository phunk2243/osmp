"use client";

import React, { useEffect, useState } from "react";
import { publicClient } from "../../lib/web3/publicClient";
import { MachineCard } from "./MachineCard";
import {
  MachineNFT_ADDRESS,
  MachineNFT_ABI,
} from "../../lib/web3/machine abi";

interface Machine {
  machineId: string;
  name:      string;
  type:      string;
  manufacturer: string;
  model:     string;
  serialNumber: string;
  installationDate:   string;
  maintenanceDueDate: string;
  status:    "operational" | "maintenance" | "offline";
  createdByNodeID: string;
  linkedSKUs: string;   // comma‑joined list for display
}

export function Machines({ filterByNodeID }: { filterByNodeID?: string }) {
  const [machines, setMachines] = useState<Machine[]>([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    const loadMachines = async () => {
      setLoading(true);
      try {
        /* 1️⃣  total minted */
        const nextId = await publicClient.readContract({
          address: MachineNFT_ADDRESS,
          abi: MachineNFT_ABI,
          functionName: "nextMachineId",
        }) as bigint;

        const list: Machine[] = [];

        /* 2️⃣  iterate IDs */
        for (let i = 0; i < Number(nextId); i++) {
          try {
            /* 3️⃣  struct — try new shape first */
            let raw: any;
            try {
              raw = await publicClient.readContract({
                address: MachineNFT_ADDRESS,
                abi: MachineNFT_ABI,
                functionName: "getMachine",
                args: [BigInt(i)],
              }) as {
                machineId:     bigint;
                nodeId:        bigint;
                skuIds:        bigint[];   // NEW
                installationTs: bigint;
                maintenanceDue: bigint;
                status:         number;
              };
            } catch {
              /* fallback: old shape with single linkedSkuId */
              const legacy = await publicClient.readContract({
                address: MachineNFT_ADDRESS,
                abi: MachineNFT_ABI,
                functionName: "getMachine",
                args: [BigInt(i)],
              }) as {
                machineId:     bigint;
                nodeId:        bigint;
                linkedSkuId:   bigint;
                installationTs: bigint;
                maintenanceDue: bigint;
                status:         number;
              };
              raw = {
                ...legacy,
                skuIds: [legacy.linkedSkuId], // normalize to array
              };
            }

            /* 4️⃣  metadata */
            const uri = await publicClient.readContract({
              address: MachineNFT_ADDRESS,
              abi: MachineNFT_ABI,
              functionName: "tokenURI",
              args: [BigInt(i)],
            }) as string;

            const meta = uri.startsWith("data:")
              ? JSON.parse(atob(uri.split(",")[1]))
              : await (await fetch(uri)).json();

            /* 5️⃣  push normalized object */
            list.push({
              machineId: i.toString(),
              name: meta.name,
              type: meta.attributes?.find((a:any)=>a.trait_type==="Type")?.value || "",
              manufacturer: meta.attributes?.find((a:any)=>a.trait_type==="Manufacturer")?.value || "",
              model: meta.attributes?.find((a:any)=>a.trait_type==="Model")?.value || "",
              serialNumber: meta.attributes?.find((a:any)=>a.trait_type==="Serial Number")?.value || "",
              installationDate: new Date(Number(raw.installationTs)*1000).toLocaleDateString(),
              maintenanceDueDate: new Date(Number(raw.maintenanceDue)*1000).toLocaleDateString(),
              status: raw.status === 0 ? "operational" : raw.status === 1 ? "maintenance" : "offline",
              createdByNodeID: raw.nodeId.toString(),
              linkedSKUs: raw.skuIds.map((id: bigint) => id.toString()).join(", "),
            });
          } catch {/* skip id */}
        }

        /* 6️⃣  optional node filter */
        const filtered = filterByNodeID
          ? list.filter((m) => m.createdByNodeID === filterByNodeID)
          : list;

        setMachines(filtered);
      } catch (err) {
        console.error("Failed to load machines:", err);
        setMachines([]);
      } finally {
        setLoading(false);
      }
    };

    loadMachines();
  }, [filterByNodeID]);

  if (loading)            return <p>Loading machines…</p>;
  if (machines.length===0) return <p className="text-muted-foreground">No machines registered yet.</p>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {machines.map((m) => (
        <MachineCard key={m.machineId} {...m} />
      ))}
    </div>
  );
}
