"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Header } from "../../header";
import { useWalletClient } from "../../lib/web3/useWalletClient";
import { useContractWrite } from "../../lib/web3/useContractWrite";
import { publicClient } from "../../lib/web3/publicClient";

import {
  MachineNFT_ADDRESS,
  MachineNFT_ABI,
} from "../../lib/web3/machine abi";
import {
  SkuNFT_ADDRESS,
  SkuNFT_ABI,
} from "../../lib/web3/sku abi";
import {
  NodeNFT_ADDRESS,
  NodeNFT_ABI,
} from "../../lib/web3/contracts";

/*────────────────────────── types ──────────────────────────*/
interface SKUProfile {
  sku: string;               // tokenId
  description: string;
  visibility: "global" | "private";
  createdByNodeID: string;
}
interface NodeProfile {
  nodeId: string;
  name:   string;
}

/*────────────────────────── page ───────────────────────────*/
export default function NewMachinePage() {
  const router  = useRouter();
  const { address } = useWalletClient();

  /* basic form fields */
  const [form, setForm] = useState({
    name: "",
    type: "",
    manufacturer: "",
    model: "",
    serialNumber: "",
    installationDate: "",    // YYYY‑MM‑DD
    maintenanceDueDate: "",  // YYYY‑MM‑DD
    status: "operational" as "operational" | "maintenance" | "offline",
  });

  /* node + SKU state */
  const [availableNodes, setAvailableNodes] = useState<NodeProfile[]>([]);
  const [availableSKUs,  setAvailableSKUs]  = useState<SKUProfile[]>([]);
  const [selectedNodeID, setSelectedNodeID] = useState("");
  const [selectedSKUs,   setSelectedSKUs]   = useState<string[]>([]);

  const [error, setError] = useState<string | null>(null);

  /*────────────── load Nodes ──────────────*/
  useEffect(() => {
    (async () => {
      try {
        const nextId = await publicClient.readContract({
          address: NodeNFT_ADDRESS,
          abi: NodeNFT_ABI,
          functionName: "nextTokenId",
        }) as bigint;

        const nodes: NodeProfile[] = [];
        for (let i = 0; i < Number(nextId); i++) {
          try {
            const uri = await publicClient.readContract({
              address: NodeNFT_ADDRESS,
              abi: NodeNFT_ABI,
              functionName: "tokenURI",
              args: [BigInt(i)],
            }) as string;

            const json = uri.startsWith("data:")
              ? JSON.parse(atob(uri.split(",")[1]))
              : await (await fetch(uri)).json();

            nodes.push({ nodeId: i.toString(), name: json.name });
          } catch {/* skip */}
        }
        setAvailableNodes(nodes);
      } catch (err) { console.error(err); }
    })();
  }, []);

  /*────────────── load SKUs ──────────────*/
  useEffect(() => {
    (async () => {
      try {
        const nextId = await publicClient.readContract({
          address: SkuNFT_ADDRESS,
          abi: SkuNFT_ABI,
          functionName: "nextTokenId",
        }) as bigint;

        const skus: SKUProfile[] = [];
        for (let i = 0; i < Number(nextId); i++) {
          try {
            const exists = await publicClient.readContract({
              address: SkuNFT_ADDRESS,
              abi: SkuNFT_ABI,
              functionName: "skuExists",
              args: [BigInt(i)],
            }) as boolean;
            if (!exists) continue;

            const uri = await publicClient.readContract({
              address: SkuNFT_ADDRESS,
              abi: SkuNFT_ABI,
              functionName: "tokenURI",
              args: [BigInt(i)],
            }) as string;

            const meta = uri.startsWith("data:")
              ? JSON.parse(atob(uri.split(",")[1]))
              : await (await fetch(uri)).json();

            const isGlobal = await publicClient.readContract({
              address: SkuNFT_ADDRESS,
              abi: SkuNFT_ABI,
              functionName: "skuIsGlobal",
              args: [BigInt(i)],
            }) as boolean;

            const createdBy =
              meta.attributes?.find((a: any) => a.trait_type === "Created By Node")?.value || "";

            skus.push({
              sku: i.toString(),
              description: meta.description || meta.name || `SKU #${i}`,
              visibility: isGlobal ? "global" : "private",
              createdByNodeID: createdBy,
            });
          } catch {/* skip */}
        }
        setAvailableSKUs(skus);
      } catch (err) { console.error(err); }
    })();
  }, []);

  /*────────────── metadata URI ──────────────*/
  const metadataURI = useMemo(() => {
    if (!form.name) return "";
    const md = {
      name: form.name,
      description: `Machine ${form.model} by ${form.manufacturer}`,
      attributes: [
        { trait_type: "Node ID",      value: selectedNodeID },
        { trait_type: "SKU IDs",      value: selectedSKUs.join(",") },
        { trait_type: "Type",         value: form.type },
        { trait_type: "Serial Number",value: form.serialNumber },
        { trait_type: "Installation Date", value: form.installationDate },
        { trait_type: "Maintenance Due Date", value: form.maintenanceDueDate },
        { trait_type: "Status", value: form.status },
      ],
    };
    return "data:application/json;base64," + btoa(JSON.stringify(md));
  }, [form, selectedNodeID, selectedSKUs]);

  /*────────────── write hook ──────────────*/
  const { write: mintMachine, loading: minting, error: mintError } =
    useContractWrite({
      address: MachineNFT_ADDRESS,
      abi: MachineNFT_ABI,
      functionName: "mintMachine",
    });

  /*────────────── save handler ──────────────*/
  const handleSave = async () => {
    setError(null);

    if (!address)             return setError("Please connect your wallet.");
    if (!selectedNodeID)      return setError("Select a Node.");
    if (selectedSKUs.length === 0)
                             return setError("Select at least one SKU.");
    if (Object.values(form).some((v) => !v))
                             return setError("All fields are required.");
    if (!metadataURI)         return setError("Failed to build metadata.");

    const installationTs = Math.floor(new Date(form.installationDate).getTime() / 1000);
    const maintenanceTs  = Math.floor(new Date(form.maintenanceDueDate).getTime() / 1000);

    try {
      const txHash = await mintMachine([
        address as `0x${string}`,
        BigInt(selectedNodeID),
        selectedSKUs.map((id) => BigInt(id)),   // ← uint256[] array
        metadataURI,
        BigInt(installationTs),
        BigInt(maintenanceTs),
      ]);

      if (!txHash) return setError("Transaction hash missing.");

      await publicClient.waitForTransactionReceipt({ hash: txHash });
      router.push("/machine");
    } catch (e: any) {
      setError(`Transaction failed: ${e.message || e}`);
    }
  };

  /*────────────────────────── UI ──────────────────────────*/
  return (
    <>
      <Header />
      <main className="px-6 py-10 max-w-3xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">Register New Machine</h1>

        {error &&     <p className="text-red-600 mb-4">{error}</p>}
        {mintError && <p className="text-red-600 mb-4">Mint error: {mintError.message}</p>}

        <div className="space-y-6">
          {/* Node selector */}
          <Dropdown
            label="Node"
            value={selectedNodeID}
            onChange={setSelectedNodeID}
            options={availableNodes.map((n) => ({ value: n.nodeId, label: n.name }))}
            placeholder="Select Node…"
          />

          {/* SKU multi‑select */}
          <MultiSelect
            label="Allowed SKUs"
            options={availableSKUs
              .filter(
                (s) =>
                  s.visibility === "global" ||
                  s.createdByNodeID === selectedNodeID
              )
              .map((s) => ({
                value: s.sku,
                label: `${s.sku} – ${s.description}`,
              }))}
            selected={selectedSKUs}
            setSelected={setSelectedSKUs}
            placeholder="Select one or more SKUs…"
          />

          {/* Basic fields */}
          {[
            { label: "Name", key: "name", type: "text" },
            { label: "Type", key: "type", type: "text" },
            { label: "Manufacturer", key: "manufacturer", type: "text" },
            { label: "Model", key: "model", type: "text" },
            { label: "Serial Number", key: "serialNumber", type: "text" },
            { label: "Installation Date", key: "installationDate", type: "date" },
            { label: "Maintenance Due Date", key: "maintenanceDueDate", type: "date" },
          ].map(({ label, key, type }) => (
            <Field
              key={key}
              label={label}
              type={type}
              value={(form as any)[key]}
              onChange={(v) => setForm((p) => ({ ...p, [key]: v }))}
            />
          ))}

          {/* Status dropdown */}
          <Dropdown
            label="Status"
            value={form.status}
            onChange={(v) =>
              setForm((p) => ({
                ...p,
                status: v as "operational" | "maintenance" | "offline",
              }))
            }
            options={[
              { value: "operational", label: "Operational" },
              { value: "maintenance", label: "Maintenance" },
              { value: "offline",     label: "Offline" },
            ]}
          />

          {/* Save btn */}
          <div className="mt-8 flex justify-end">
            <button
              onClick={handleSave}
              disabled={minting}
              className="bg-primary hover:bg-primary/80 text-white font-bold py-2 px-6 rounded-md"
            >
              {minting ? "Minting Machine NFT…" : "Create Machine"}
            </button>
          </div>
        </div>
      </main>
    </>
  );
}

/*──────────────── helper components ───────────────*/
function Field({
  label,
  type,
  value,
  onChange,
}: {
  label: string;
  type: string;
  value: string;
  onChange: (val: string) => void;
}) {
  return (
    <div>
      <label className="block text-sm font-semibold mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="border rounded-md w-full px-4 py-2"
      />
    </div>
  );
}

function Dropdown({
  label,
  value,
  onChange,
  options,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (val: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-semibold mb-1">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="border rounded-md w-full px-4 py-2"
      >
        <option value="">{placeholder || "Select…"}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

/* very lightweight multi‑select using checkboxes */
function MultiSelect({
  label,
  options,
  selected,
  setSelected,
  placeholder,
}: {
  label: string;
  options: { value: string; label: string }[];
  selected: string[];
  setSelected: (x: string[]) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-semibold mb-1">{label}</label>

      {options.length === 0 ? (
        <p className="text-sm text-muted-foreground">{placeholder || "No options"}</p>
      ) : (
        <div className="border rounded-md p-4 max-h-40 overflow-y-auto space-y-2">
          {options.map((o) => {
            const checked = selected.includes(o.value);
            return (
              <label key={o.value} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() =>
                    setSelected(
                      checked
                        ? selected.filter((v) => v !== o.value)
                        : [...selected, o.value]
                    )
                  }
                />
                <span>{o.label}</span>
              </label>
            );
          })}
        </div>
      )}
    </div>
  );
}
