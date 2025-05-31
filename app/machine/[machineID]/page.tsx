"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Header } from "../../header";
import { ProductionHistory } from "../../components/dashboard/ProductionHistory";
import { ProduceLot } from "../../components/machine/ProduceLot";
import { publicClient } from "../../lib/web3/publicClient";

import {
  MachineNFT_ADDRESS,
  MachineNFT_ABI,
} from "../../lib/web3/machine abi";
import {
  NodeNFT_ADDRESS,
  NodeNFT_ABI,
} from "../../lib/web3/contracts";
import {
  SkuNFT_ADDRESS,
  SkuNFT_ABI,
} from "../../lib/web3/sku abi";

/*──────────────────────────── types ───────────────────────────*/
interface Machine {
  machineId:  string;
  name:       string;
  type:       string;
  manufacturer: string;
  model:      string;
  serialNumber: string;
  installationDate:   string;
  maintenanceDueDate: string;
  status:     "operational" | "maintenance" | "offline";
  nodeName:   string;
  nodeIdRaw:  string;

  skuNames:   string;     // comma‑joined for display
  skuIdsArr:  string[];   // array for ProduceLot
}

/*──────────────────────────── page ────────────────────────────*/
export default function MachineDetailPage() {
  const { machineID } = useParams() as { machineID: string };
  const router        = useRouter();
  const [machine, setMachine] = useState<Machine | null>(null);
  const [loading, setLoading] = useState(true);

  /* helper: decode any ERC‑721 metadata URI */
  async function loadMeta(addr: `0x${string}`, id: bigint) {
    const uri = (await publicClient.readContract({
      address: addr,
      abi: MachineNFT_ABI,
      functionName: "tokenURI",
      args: [id],
    })) as string;

    if (uri.startsWith("data:application/json;base64,")) {
      return JSON.parse(atob(uri.split(",")[1]));
    }
    return fetch(uri).then((r) => r.json());
  }

  /* fetch on mount */
  useEffect(() => {
    if (!machineID) return;

    (async () => {
      setLoading(true);
      try {
        /* 1️⃣  read getMachine() with new skuIds array */
        const m = (await publicClient.readContract({
          address: MachineNFT_ADDRESS,
          abi: MachineNFT_ABI,
          functionName: "getMachine",
          args: [BigInt(machineID)],
        })) as {
          machineId:     bigint;
          nodeId:        bigint;
          skuIds:        bigint[];
          installationTs: bigint;
          maintenanceDue: bigint;
          status:        number;
        };

        /* 2️⃣ metadata look‑ups */
        const [machineMeta, nodeMeta, skuTitles] = await Promise.all([
          loadMeta(MachineNFT_ADDRESS, m.machineId),
          loadMeta(NodeNFT_ADDRESS,    m.nodeId),
          Promise.all(
            m.skuIds.map(async (id) => {
              try {
                const sm = await loadMeta(SkuNFT_ADDRESS, id);
                return sm.description || sm.name || id.toString();
              } catch {
                return id.toString();
              }
            })
          ),
        ]);

        /* 3️⃣ state */
        setMachine({
          machineId: m.machineId.toString(),

          name: machineMeta.name,
          type: machineMeta.attributes?.find((x: any) => x.trait_type === "Type")?.value || "",
          manufacturer: machineMeta.attributes?.find((x: any) => x.trait_type === "Manufacturer")?.value || "",
          model: machineMeta.attributes?.find((x: any) => x.trait_type === "Model")?.value || "",
          serialNumber: machineMeta.attributes?.find((x: any) => x.trait_type === "Serial Number")?.value || "",

          installationDate:   new Date(Number(m.installationTs) * 1000).toISOString(),
          maintenanceDueDate: new Date(Number(m.maintenanceDue) * 1000).toISOString(),
          status: m.status === 0 ? "operational" : m.status === 1 ? "maintenance" : "offline",

          nodeName:  nodeMeta.name || m.nodeId.toString(),
          nodeIdRaw: m.nodeId.toString(),

          skuNames: skuTitles.join(", "),
          skuIdsArr: m.skuIds.map((id) => id.toString()),
        });
      } catch (err) {
        console.error("Failed to load machine", err);
        setMachine(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [machineID]);

  /*────────────────────────── render ──────────────────────────*/
  if (loading) {
    return (
      <>
        <Header />
        <main className="px-6 py-10"><p>Loading machine details…</p></main>
      </>
    );
  }
  if (!machine) {
    return (
      <>
        <Header />
        <main className="px-6 py-10">
          <h1 className="text-4xl font-bold mb-6">Machine Not Found</h1>
          <p>Machine ID: {machineID}</p>
          <button onClick={() => router.back()} className="mt-4 text-blue-600">← Back</button>
        </main>
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="px-6 py-10 max-w-4xl mx-auto">
        {/* heading */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-bold">{machine.name}</h1>
          <button
            onClick={() => router.back()}
            className="bg-muted text-muted-foreground hover:bg-muted/50 font-bold py-2 px-6 rounded-md"
          >
            ← Back
          </button>
        </div>

        {/* summary cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
          <InfoCard
            label="Node"
            value={machine.nodeName}
            onClick={() => router.push(`/nodes/${machine.nodeIdRaw}`)}
          />
          <InfoCard label="SKUs" value={machine.skuNames} />
          <InfoCard label="Type"            value={machine.type} />
          <InfoCard label="Manufacturer"    value={machine.manufacturer} />
          <InfoCard label="Model"           value={machine.model} />
          <InfoCard label="Serial Number"   value={machine.serialNumber} />
          <InfoCard label="Installation"    value={new Date(machine.installationDate).toLocaleDateString()} />
          <InfoCard label="Next Maintenance" value={new Date(machine.maintenanceDueDate).toLocaleDateString()} />
          <InfoCard label="Status"           value={machine.status} />
        </div>

        {/* ⛏️ Mint a new lot on this machine */}
        <ProduceLot
          nodeId={machine.nodeIdRaw}
          machineId={machine.machineId}
          skuOptions={machine.skuIdsArr}
        />

        {/* Machine‑specific Production History */}
        <ProductionHistory scope="machine" machineId={machineID} />
      </main>
    </>
  );
}

/*──────────────────────── InfoCard ────────────────────────*/
function InfoCard({
  label,
  value,
  onClick,
}: {
  label: string;
  value: string;
  onClick?: () => void;
}) {
  const Wrapper = onClick ? "button" : "div";
  return (
    <Wrapper
      onClick={onClick}
      className={`border rounded-xl p-6 bg-muted ${
        onClick ? "hover:bg-muted/50 cursor-pointer text-left" : ""
      }`}
    >
      <h2 className="text-sm font-semibold text-muted-foreground uppercase mb-1">
        {label}
      </h2>
      <p className="text-lg font-bold break-words">{value}</p>
    </Wrapper>
  );
}
