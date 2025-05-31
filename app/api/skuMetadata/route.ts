// src/app/api/skuMetadata/route.ts
import { NextRequest } from "next/server";
import { publicClient } from "../../lib/web3/publicClient";
import { SkuNFT_ADDRESS, SkuNFT_ABI } from "../../lib/web3/sku abi";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const skuId = searchParams.get("skuId");

  if (!skuId) {
    return new Response(JSON.stringify({ error: "Missing skuId" }), { status: 400 });
  }

  try {
    const uri = await publicClient.readContract({
      address: SkuNFT_ADDRESS,
      abi: SkuNFT_ABI,
      functionName: "tokenURI",
      args: [BigInt(skuId)],
    }) as string;

    if (!uri.startsWith("data:application/json;base64,")) {
      return new Response(JSON.stringify({ error: "Invalid tokenURI format" }), { status: 500 });
    }

    const json = JSON.parse(Buffer.from(uri.split(",")[1], "base64").toString("utf-8"));
    const attributes = json.attributes || [];

    const getAttr = (key: string) =>
      attributes.find((a: any) => a.trait_type === key)?.value;

    const data = {
      skuId,
      sku: getAttr("SKU ID"),
      description: json.description || "",
      qaComplianceMode: getAttr("Compliance") || "none",
      documentControlRequired: getAttr("Document Control") === "true",
      trainingRequired: getAttr("Training Required") === "true",
      riskAnalysisRequired: getAttr("Risk Analysis") === "true",
      complaintHandlingRequired: getAttr("Complaint Handling") === "true",
      createdAt: getAttr("Created At") || new Date().toISOString(),
      createdByNodeID: getAttr("Created By Node") || "SYSTEM",
    };

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("Failed to fetch SKU metadata:", err);
    return new Response(JSON.stringify({ error: err.message || "Unknown error" }), {
      status: 500,
    });
  }
}
