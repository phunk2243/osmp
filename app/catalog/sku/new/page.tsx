"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Header } from "../../../header";
import { useWalletClient } from "../../../lib/web3/useWalletClient";
import { useContractWrite } from "../../../lib/web3/useContractWrite";
import { SkuNFT_ADDRESS, SkuNFT_ABI } from "../../../lib/web3/sku abi";
import { publicClient } from "../../../lib/web3/publicClient";
import { useContractRead } from "../../../lib/web3/useContractRead";
import { NodeNFT_ADDRESS, NodeNFT_ABI } from "../../../lib/web3/contracts";

interface NodeProfile {
  nodeId: string;
  name: string;
}

export default function SKURegistrationPage() {
  const router = useRouter();
  const params = useParams();
  const nodeID = (params.nodeID as string) || "SYSTEM";

  const { address } = useWalletClient();
  const [sku, setSku] = useState("");
  const [description, setDescription] = useState("");
  const [qaComplianceMode, setQaComplianceMode] = useState<"none" | "iso9001" | "iso13485">("none");
  const [visibility, setVisibility] = useState<"global" | "private">("global");
  const [documentControlRequired, setDocumentControlRequired] = useState(false);
  const [trainingRequired, setTrainingRequired] = useState(false);
  const [riskAnalysisRequired, setRiskAnalysisRequired] = useState(false);
  const [complaintHandlingRequired, setComplaintHandlingRequired] = useState(false);
  const [whitelistedNodes, setWhitelistedNodes] = useState<string[]>([]);
  const [availableNodes, setAvailableNodes] = useState<NodeProfile[]>([]);
  const [error, setError] = useState<string | null>(null);

  const { data: nextNodeTokenId } = useContractRead({
    address: NodeNFT_ADDRESS,
    abi: NodeNFT_ABI,
    functionName: "nextTokenId",
  });

  useEffect(() => {
    const fetchValidNodes = async () => {
      if (typeof nextNodeTokenId !== "bigint") return;
      const all: NodeProfile[] = [];
      for (let i = 0; i < Number(nextNodeTokenId); i++) {
        try {
          const res = await fetch(`/api/nodeMetadata?tokenId=${i}`);
          if (!res.ok) continue;
          const metadata = await res.json();
          all.push({ nodeId: i.toString(), name: metadata.name });
        } catch (err) {
          console.warn("Failed to fetch node", i, err);
        }
      }
      setAvailableNodes(all);
    };
    fetchValidNodes();
  }, [nextNodeTokenId]);

  const metadata = {
    name: sku.toUpperCase(),
    description,
    attributes: [
      { trait_type: "SKU ID", value: sku.toUpperCase() },
      { trait_type: "Compliance", value: qaComplianceMode },
      { trait_type: "Document Control", value: documentControlRequired.toString() },
      { trait_type: "Training Required", value: trainingRequired.toString() },
      { trait_type: "Risk Analysis", value: riskAnalysisRequired.toString() },
      { trait_type: "Complaint Handling", value: complaintHandlingRequired.toString() },
      { trait_type: "Created By Node", value: nodeID },
      { trait_type: "Visibility", value: visibility },
    ],
  };

  const metadataURI = sku
    ? "data:application/json;base64," + window.btoa(JSON.stringify(metadata))
    : "";

  const {
    write: mintSku,
    loading: minting,
    error: mintError,
    txHash,
  } = useContractWrite({
    address: SkuNFT_ADDRESS,
    abi: SkuNFT_ABI,
    functionName: "mintSku",
    args: [address || "0x0", metadataURI, visibility === "global"], // Predefined args
  });

  const {
    write: whitelistNodes,
    error: whitelistError,
    txHash: whitelistTxHash,
  } = useContractWrite({
    address: SkuNFT_ADDRESS,
    abi: SkuNFT_ABI,
    functionName: "batchWhitelistNodes",
    // No args here, as they'll be provided dynamically
  });

  const handleComplianceChange = (mode: "none" | "iso9001" | "iso13485") => {
    setQaComplianceMode(mode);
    if (mode === "none") {
      setDocumentControlRequired(false);
      setTrainingRequired(false);
      setRiskAnalysisRequired(false);
      setComplaintHandlingRequired(false);
    } else if (mode === "iso9001") {
      setDocumentControlRequired(true);
      setTrainingRequired(true);
      setRiskAnalysisRequired(false);
      setComplaintHandlingRequired(false);
    } else if (mode === "iso13485") {
      setDocumentControlRequired(true);
      setTrainingRequired(true);
      setRiskAnalysisRequired(true);
      setComplaintHandlingRequired(true);
    }
  };

  const handleSave = async () => {
    setError(null);
    if (!address) return setError("Connect your wallet to mint SKU.");
    if (!sku.trim()) return setError("SKU code is required.");
    if (!metadataURI) return setError("Metadata incomplete.");

    try {
      // Call mintSku with no arguments, using predefined args from hook
      await mintSku();
      if (mintError) {
        setError(`Mint error: ${mintError.message}`);
        return;
      }

      if (txHash) {
        await publicClient.waitForTransactionReceipt({ hash: txHash });

        const receipt = await publicClient.getTransactionReceipt({ hash: txHash });
        const log = receipt.logs.find(
          (l) => l.topics?.[0]?.toLowerCase() === "0x2bafad09b154aa2273f07ae043df823e0f8a0b3c07f4e25a512a6900c1c940a8"
        );
        const skuId = log?.topics?.[1] ? parseInt(log.topics[1], 16) : null;

        if (skuId !== null && visibility === "private" && whitelistedNodes.length > 0) {
          // Call whitelistNodes with dynamic args
          await whitelistNodes([
            BigInt(skuId),
            whitelistedNodes.map((id) => BigInt(id)),
          ]);
          if (whitelistError) {
            setError(`Failed to whitelist nodes: ${whitelistError.message}`);
            return;
          }
          if (whitelistTxHash) {
            await publicClient.waitForTransactionReceipt({ hash: whitelistTxHash });
          }
        }
      }
    } catch (err: any) {
      setError(`Transaction confirmation failed: ${err.message}`);
      return;
    }

    router.push("/catalog");
  };

  return (
    <>
      <Header />
      <main className="px-6 py-10 max-w-3xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">Register New SKU</h1>

        {error && <p className="text-red-600 mb-4">{error}</p>}
        {mintError && <p className="text-red-600 mb-4">Mint error: {mintError.message}</p>}
        {whitelistError && <p className="text-red-600 mb-4">Whitelist error: {whitelistError.message}</p>}

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-semibold mb-1">SKU Code</label>
            <input
              type="text"
              value={sku}
              onChange={(e) => setSku(e.target.value.toUpperCase())}
              className="border rounded-md w-full px-4 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-1">Product Name</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="border rounded-md w-full px-4 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-1">Compliance Mode</label>
            <select
              value={qaComplianceMode}
              onChange={(e) => handleComplianceChange(e.target.value as any)}
              className="border rounded-md w-full px-4 py-2"
            >
              <option value="none">None</option>
              <option value="iso9001">ISO 9001</option>
              <option value="iso13485">ISO 13485</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-1">Access Control</label>
            <select
              value={visibility}
              onChange={(e) => setVisibility(e.target.value as any)}
              className="border rounded-md w-full px-4 py-2"
            >
              <option value="global">Global</option>
              <option value="private">Private</option>
            </select>
          </div>

          {visibility === "private" && (
            <div>
              <label className="block text-sm font-semibold mb-1">Select Nodes</label>
              <select
                multiple
                className="border rounded-md w-full px-4 py-2 text-sm"
                value={whitelistedNodes}
                onChange={(e) => {
                  const selected = Array.from(e.target.selectedOptions).map((o) => o.value);
                  setWhitelistedNodes(selected);
                }}
              >
                {availableNodes.map((node) => (
                  <option key={node.nodeId} value={node.nodeId}>
                    {node.name} (ID: {node.nodeId})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="mt-8 flex justify-end">
            <button
              onClick={handleSave}
              disabled={minting}
              className="bg-primary hover:bg-primary/80 text-white font-bold py-2 px-6 rounded-md"
            >
              {minting ? "Minting SKU..." : "Create SKU"}
            </button>
          </div>
        </div>
      </main>
    </>
  );
}