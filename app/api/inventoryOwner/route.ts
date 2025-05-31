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
    const owner = await publicClient.readContract({
      address: InventoryNFT_ADDRESS,
      abi: InventoryNFT_ABI,
      functionName: "ownerOf",
      args: [BigInt(lotId)],
    });
    return new Response(JSON.stringify({ owner }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("Failed to fetch inventory owner:", err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
