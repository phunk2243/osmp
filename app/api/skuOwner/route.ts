import { NextRequest } from "next/server";
import { publicClient } from "../../lib/web3/publicClient";
import { NodeNFT_ADDRESS, NodeNFT_ABI } from "../../lib/web3/contracts";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const tokenId = searchParams.get("tokenId");

  if (!tokenId) {
    return new Response("Missing tokenId", { status: 400 });
  }

  try {
    const owner = await publicClient.readContract({
      address: NodeNFT_ADDRESS,
      abi: NodeNFT_ABI,
      functionName: "ownerOf",
      args: [BigInt(tokenId)],
    });

    return new Response(JSON.stringify(owner), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("Failed to fetch ownerOf:", err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
