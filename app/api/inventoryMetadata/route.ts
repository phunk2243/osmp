import { NextRequest } from "next/server";
import { publicClient } from "../../lib/web3/publicClient";
import { InventoryNFT_ADDRESS, InventoryNFT_ABI } from "../../lib/web3/inventoryABI";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const lotId = searchParams.get("lotId");
  if (!lotId) {
    return new Response(JSON.stringify({ error: "Missing lotId" }), { status: 400 });
  }

  try {
    const id = BigInt(lotId);

    // 1. Read on-chain Lot struct
    const onChain = await publicClient.readContract({
      address: InventoryNFT_ADDRESS,
      abi: InventoryNFT_ABI,
      functionName: "lots",
      args: [id],
    });

    // 2. Read tokenURI
    const tokenURI = await publicClient.readContract({
      address: InventoryNFT_ADDRESS,
      abi: InventoryNFT_ABI,
      functionName: "tokenURI",
      args: [id],
    }) as string;

    // 3. Parse metadata JSON
    let metadata: any;
    if (tokenURI.startsWith("data:application/json;base64,")) {
      metadata = JSON.parse(atob(tokenURI.split(",")[1]));
    } else {
      const res = await fetch(tokenURI);
      metadata = await res.json();
    }

    return new Response(
      JSON.stringify({ onChain, tokenURI, metadata }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (err: any) {
    console.error("Failed to fetch inventory metadata:", err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
