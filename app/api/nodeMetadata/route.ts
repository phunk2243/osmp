// src/app/api/nodeMetadata/route.ts
import { NextRequest } from "next/server";
import { publicClient } from "../../lib/web3/publicClient";
import { NodeNFT_ADDRESS, NodeNFT_ABI } from "../../lib/web3/contracts";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const tokenId = searchParams.get("tokenId");

  if (!tokenId) {
    return new Response(JSON.stringify({ error: "Missing tokenId" }), { status: 400 });
  }

  try {
    const uri = await publicClient.readContract({
      address: NodeNFT_ADDRESS,
      abi: NodeNFT_ABI,
      functionName: "tokenURI",
      args: [BigInt(tokenId)],
    }) as string;
    

    if (!uri.startsWith("data:application/json;base64,")) {
      return new Response(JSON.stringify({ error: "Invalid tokenURI format" }), { status: 500 });
    }

    const json = JSON.parse(Buffer.from(uri.split(",")[1], "base64").toString("utf-8"));

    return new Response(JSON.stringify(json), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("Failed to fetch tokenURI:", err);
    return new Response(JSON.stringify({ error: err.message || "Unknown error" }), {
      status: 500,
    });
  }
}
