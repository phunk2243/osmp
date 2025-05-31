import { NextRequest } from "next/server";
import { publicClient } from "../../lib/web3/publicClient";
import {
  MachineNFT_ADDRESS,
  MachineNFT_ABI,
} from "../../lib/web3/machine abi";

/**
 * GET /api/machineMetadata?machineId=42
 *
 * Response shape:
 * {
 *   onChain:  { ...decoded Machine struct with strings },
 *   tokenURI: "data:application/json;base64,..." | "ipfs://...",
 *   metadata: { ...parsed JSON metadata }
 * }
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const idParam = searchParams.get("machineId");

  if (!idParam) {
    return new Response(JSON.stringify({ error: "Missing machineId" }), {
      status: 400,
    });
  }

  try {
    const machineId = BigInt(idParam);

    /* 1️⃣  Read on‑chain Machine struct
       Machine(
         uint256 machineId,
         uint256 nodeId,
         uint256[] skuIds,
         uint256 installationTs,
         uint256 maintenanceDue,
         uint8    status
       )
    */
    const onChainRaw = (await publicClient.readContract({
      address: MachineNFT_ADDRESS,
      abi: MachineNFT_ABI,
      functionName: "getMachine",
      args: [machineId],
    })) as readonly [
      bigint,
      bigint,
      bigint[],
      bigint,
      bigint,
      number
    ];

    const [
      id,
      nodeId,
      skuIdsArr,
      installationTs,
      maintenanceDue,
      statusEnum,
    ] = onChainRaw;

    /* stringify bigints & array elements for JSON safety */
    const onChain = {
      machineId: id.toString(),
      nodeId: nodeId.toString(),
      skuIds: skuIdsArr.map((x) => x.toString()),
      installationTs: installationTs.toString(),
      maintenanceDue: maintenanceDue.toString(),
      status: statusEnum, // keep as number (0=Operational,1=Maintenance,2=Offline)
    };

    /* 2️⃣  Read tokenURI */
    const tokenURI = (await publicClient.readContract({
      address: MachineNFT_ADDRESS,
      abi: MachineNFT_ABI,
      functionName: "tokenURI",
      args: [machineId],
    })) as string;

    /* 3️⃣  Decode metadata JSON */
    let metadata: any;
    if (tokenURI.startsWith("data:application/json;base64,")) {
      metadata = JSON.parse(atob(tokenURI.split(",")[1]));
    } else {
      const res = await fetch(tokenURI);
      metadata = await res.json();
    }

    return new Response(JSON.stringify({ onChain, tokenURI, metadata }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("Failed to fetch machine metadata:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
    });
  }
}
