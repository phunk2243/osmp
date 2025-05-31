"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Header } from "../header";
import { useWalletClient } from "../lib/web3/useWalletClient";
import { publicClient } from "../lib/web3/publicClient";

import {
  InventoryNFT_ADDRESS,
  InventoryNFT_ABI,
} from "../lib/web3/inventoryABI";
import {
  MachineNFT_ADDRESS,
  MachineNFT_ABI,
} from "../lib/web3/machine abi";
import {
  NodeNFT_ADDRESS,
  NodeNFT_ABI,
} from "../lib/web3/contracts";

/*──────── types ────────*/
interface NodeProfile { nodeId:string; name:string; location:string; }
interface MachineProfile { machineId:string; nodeId:string; name:string; skuIds:string; }
type QC = "Certified" | "Failed" | "Pending";
interface LotProfile { lotId:string; nodeId:string; machineId:string; sku:string; qty:number; qc:QC; }

const qcFromTuple = (cert: boolean, fail: string): QC =>
  cert ? "Certified" : fail ? "Failed" : "Pending";

/*──────── page ────────*/
export default function DashboardPage() {
  const { address } = useWalletClient();

  const [nodes,   setNodes]   = useState<NodeProfile[]>([]);
  const [machines,setMachines]= useState<MachineProfile[]>([]);
  const [lots,    setLots]    = useState<LotProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [lotFilter, setLotFilter] = useState<"All"|QC>("All");

  /*──────── load chain data ────────*/
  useEffect(() => {
    if (!address) return;

    (async () => {
      setLoading(true);
      try {
        /* 1️⃣ Nodes */
        const nextNodeId = await publicClient.readContract({
          address: NodeNFT_ADDRESS, abi: NodeNFT_ABI, functionName:"nextTokenId",
        }) as bigint;

        const nodeArr:NodeProfile[]=[];
        for(let i=0;i<Number(nextNodeId);i++){
          try{
            const owner = await publicClient.readContract({
              address:NodeNFT_ADDRESS,abi:NodeNFT_ABI,functionName:"ownerOf",args:[BigInt(i)],
            }) as string;
            if(owner.toLowerCase()!==address.toLowerCase()) continue;

            const uri = await publicClient.readContract({
              address:NodeNFT_ADDRESS,abi:NodeNFT_ABI,functionName:"tokenURI",args:[BigInt(i)],
            }) as string;

            const meta = uri.startsWith("data:")
              ? JSON.parse(atob(uri.split(",")[1]))
              : await (await fetch(uri)).json();

            nodeArr.push({
              nodeId:i.toString(),
              name:meta.name,
              location:meta.attributes?.find((a:any)=>a.trait_type==="Location")?.value||"",
            });
          }catch{}
        }
        setNodes(nodeArr);
        const nodeIds=new Set(nodeArr.map(n=>n.nodeId));

        /* 2️⃣ Machines */
        const nextMachId = await publicClient.readContract({
          address:MachineNFT_ADDRESS,abi:MachineNFT_ABI,functionName:"nextMachineId",
        }) as bigint;

        const machArr:MachineProfile[]=[];
        for(let i=0;i<Number(nextMachId);i++){
          try{
            const m = await publicClient.readContract({
              address:MachineNFT_ADDRESS,abi:MachineNFT_ABI,functionName:"getMachine",args:[BigInt(i)],
            }) as {machineId:bigint;nodeId:bigint;skuIds:bigint[];installationTs:bigint;maintenanceDue:bigint;status:number};

            if(!nodeIds.has(m.nodeId.toString())) continue;

            const uri = await publicClient.readContract({
              address:MachineNFT_ADDRESS,abi:MachineNFT_ABI,functionName:"tokenURI",args:[BigInt(i)],
            }) as string;

            const meta = uri.startsWith("data:")
              ? JSON.parse(atob(uri.split(",")[1]))
              : await (await fetch(uri)).json();

            machArr.push({
              machineId:i.toString(),
              nodeId:m.nodeId.toString(),
              name:meta.name,
              skuIds:m.skuIds.map(x=>x.toString()).join(", "),
            });
          }catch{}
        }
        setMachines(machArr);
        const machIds=new Set(machArr.map(m=>m.machineId));

        /* 3️⃣ Lots (decode 9‑field struct) */
        const nextLotId = await publicClient.readContract({
          address:InventoryNFT_ADDRESS,abi:InventoryNFT_ABI,functionName:"nextLotId",
        }) as bigint;

        const lotArr:LotProfile[]=[];
        for(let i=0;i<Number(nextLotId);i++){
          try{
            const tuple = await publicClient.readContract({
              address:InventoryNFT_ADDRESS,abi:InventoryNFT_ABI,functionName:"lots",args:[BigInt(i)],
            }) as readonly [
              bigint, bigint, bigint, bigint, bigint, boolean, string, string
            ];

            const [_id,nodeBN,machBN,skuBN,qtyBN,cert,certHash,failReason] = tuple;
            const nodeId=nodeBN.toString();
            const machineId=machBN.toString();

            if(!nodeIds.has(nodeId)&&!machIds.has(machineId)) continue;

            lotArr.push({
              lotId:i.toString(),
              nodeId,machineId,
              sku:skuBN.toString(),
              qty:Number(qtyBN),
              qc:qcFromTuple(cert,failReason),
            });
          }catch{}
        }
        setLots(lotArr);
      }finally{ setLoading(false); }
    })();
  },[address]);

  const visibleLots = lotFilter==="All"?lots:lots.filter(l=>l.qc===lotFilter);

  /*──────── ui ────────*/
  return (
    <>
      <Header />
      <main className="px-6 py-10 max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">📊 My Dashboard</h1>

        {!address ? (
          <p className="text-muted-foreground">Connect your wallet to view your dashboard.</p>
        ) : loading ? <p>Loading on‑chain data…</p> : (
          <div className="space-y-12">

            {/* Nodes */}
            <Section title="🏣 Nodes">
              {nodes.length?(
                <ul className="space-y-2">
                  {nodes.map(n=>(
                    <li key={n.nodeId} className="border rounded p-4 bg-muted hover:bg-muted/70">
                      <Link href={`/nodes/${n.nodeId}`}>
                        <strong>{n.name}</strong> — {n.location} (ID {n.nodeId})
                      </Link>
                    </li>
                  ))}
                </ul>
              ):<p>No nodes owned by this wallet.</p>}
            </Section>

            {/* Machines */}
            <Section title="🛠️ Machines">
              {machines.length?(
                <ul className="space-y-2">
                  {machines.map(m=>(
                    <li key={m.machineId} className="border rounded p-4 bg-muted">
                      <Link href={`/machine/${m.machineId}`}>
                        <strong>{m.name}</strong> — SKUs {m.skuIds} (ID {m.machineId})
                      </Link>
                    </li>
                  ))}
                </ul>
              ):<p>No machines linked to your nodes.</p>}
            </Section>

            {/* Lots */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold">📦 Lots</h2>
                <select
                  value={lotFilter}
                  onChange={e=>setLotFilter(e.target.value as any)}
                  className="border rounded-md px-3 py-2 text-sm"
                >
                  {["All","Certified","Failed","Pending"].map(s=>(
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              {visibleLots.length?(
                <ul className="space-y-2">
                  {visibleLots.map(l=>(
                    <li key={l.lotId} className="border rounded p-4 bg-muted">
                      <Link href={`/inventory/${l.lotId}`}>
                        Lot {l.lotId} — SKU {l.sku} — {l.qty} units — {
                          l.qc==="Certified"?"✅":l.qc==="Failed"?"❌":"⏳"}
                      </Link>
                    </li>
                  ))}
                </ul>
              ):<p>No lots match this filter.</p>}
            </section>

          </div>
        )}
      </main>
    </>
  );
}

/* simple section wrapper */
function Section({title,children}:{title:string;children:React.ReactNode}){
  return (
    <section>
      <h2 className="text-2xl font-bold mb-4">{title}</h2>
      {children}
    </section>
  );
}
