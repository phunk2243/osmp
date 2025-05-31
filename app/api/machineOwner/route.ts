// File: app/api/machineOwner/route.ts
import { NextRequest } from "next/server";
import { publicClient } from "../../lib/web3/publicClient";
import { MachineNFT_ADDRESS, MachineNFT_ABI } from "../../lib/web3/machine abi";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const machineId = searchParams.get("machineId");

  if (!machineId) {
    return new Response("Missing machineId", { status: 400 });
  }

  try {
    const owner = await publicClient.readContract({
      address: MachineNFT_ADDRESS,
      abi: MachineNFT_ABI,
      functionName: "ownerOf",
      args: [BigInt(machineId)],
    });

    return new Response(JSON.stringify({ owner }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("Failed to fetch ownerOf:", err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}