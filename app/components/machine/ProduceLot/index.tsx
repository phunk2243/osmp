"use client";

import { useState } from "react";
import { publicClient } from "../../../lib/web3/publicClient";
import {
  InventoryNFT_ADDRESS,
  InventoryNFT_ABI,
} from "../../../lib/web3/inventoryABI";
import { useContractWrite } from "../../../lib/web3/useContractWrite";
import { useWalletClient } from "../../../lib/web3/useWalletClient";

export function ProduceLot({
  nodeId,
  machineId,
  skuOptions,
}: {
  nodeId: string;
  machineId: string;
  /** Allowed SKU IDs (uint256 strings) for this machine */
  skuOptions: string[];
}) {
  const { address } = useWalletClient();
  const [skuId, setSkuId] = useState<string>(skuOptions[0] || "");
  const [qty, setQty] = useState<number>(100);
  const [status, setStatus] = useState<"idle" | "minting" | "done">("idle");

  const { write } = useContractWrite({
    address: InventoryNFT_ADDRESS,
    abi: InventoryNFT_ABI,
    functionName: "mintLot",
  });

  async function handleMint() {
    if (!address) {
      alert("Connect your wallet first");
      return;
    }
    if (!skuId) {
      alert("No SKU selected");
      return;
    }
    setStatus("minting");

    /* metadata — records Node, Machine & SKU IDs */
    const meta = {
      name: `Lot - SKU ${skuId}`,
      attributes: [
        { trait_type: "Node ID",    value: nodeId },
        { trait_type: "Machine ID", value: machineId },
        { trait_type: "SKU ID",     value: skuId },
        { trait_type: "Timestamp",  value: new Date().toISOString() },
      ],
    };
    const uri = "data:application/json;base64," + btoa(JSON.stringify(meta));

    try {
      const txHash = await write([
        address as `0x${string}`,
        BigInt(nodeId),
        BigInt(machineId),
        BigInt(skuId),
        BigInt(qty),
        uri,
      ]);

      if (!txHash) {
        setStatus("idle");
        return;
      }
      await publicClient.waitForTransactionReceipt({ hash: txHash });
      setStatus("done");
    } catch (e) {
      console.error(e);
      setStatus("idle");
    }
  }

  return (
    <div className="border rounded-xl p-6 bg-muted mt-10">
      <h3 className="text-lg font-bold mb-4">🚀 Produce Lot</h3>

      <div className="flex flex-wrap gap-4 items-end">
        {/* SKU selector restricted to allowed IDs */}
        <select
          value={skuId}
          onChange={(e) => setSkuId(e.target.value)}
          className="border px-3 py-2"
          disabled={skuOptions.length === 1}
        >
          {skuOptions.map((id) => (
            <option key={id} value={id}>
              {id}
            </option>
          ))}
        </select>

        {/* Quantity input */}
        <input
          type="number"
          value={qty}
          onChange={(e) => setQty(parseInt(e.target.value, 10))}
          className="border px-3 py-2 w-28"
          min={1}
        />

        <button
          disabled={status === "minting"}
          onClick={handleMint}
          className="bg-primary text-white px-6 py-2 rounded-md"
        >
          {status === "minting" ? "Minting…" : "Mint Lot"}
        </button>
      </div>

      {status === "done" && (
        <p className="text-green-600 mt-2">✅ Lot minted!</p>
      )}
    </div>
  );
}
