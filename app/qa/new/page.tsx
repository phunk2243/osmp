// src/app/qa/new/page.tsx
"use client";

import React, { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Header } from "../../header";
import { useContractWrite } from "../../lib/web3/useContractWrite";
import { publicClient } from "../../lib/web3/publicClient";
import {
  InventoryNFT_ADDRESS,
  InventoryNFT_ABI,
} from "../../lib/web3/inventoryABI";

export default function QANewPage() {
  const searchParams = useSearchParams();
  const lotID = searchParams.get("lotID");
  const router = useRouter();

  /* write hooks */
  const { write: certifyWrite, loading: certBusy } = useContractWrite({
    address: InventoryNFT_ADDRESS,
    abi: InventoryNFT_ABI,
    functionName: "certifyLot",
  });
  const { write: failWrite, loading: failBusy } = useContractWrite({
    address: InventoryNFT_ADDRESS,
    abi: InventoryNFT_ABI,
    functionName: "failLot",
  });

  /* form state */
  const [inspectorName, setInspectorName]   = useState("");
  const [standard,       setStandard]       = useState("iso9001");
  const [passed,         setPassed]         = useState(true);
  const [measurements,   setMeasurements]   = useState("");
  const [notes,          setNotes]          = useState("");
  const [txBusy,         setTxBusy]         = useState(false);

  if (!lotID) {
    return (
      <>
        <Header />
        <main className="px-6 py-10">
          <h1 className="text-3xl font-bold mb-4">Create QA Report</h1>
          <p className="text-muted-foreground">
            No lot selected. Please navigate here from a lot detail page.
          </p>
        </main>
      </>
    );
  }

  /*──────────────── submit handler ────────────────*/
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTxBusy(true);

    try {
      const summary = `Inspector: ${inspectorName}. Measurements: ${measurements}. Notes: ${notes || "None"}`;
      let txHash: `0x${string}` | undefined;

      if (passed) {
        /* For a pass we need an IPFS/Arweave hash of the certification doc. */
        const certHash = prompt(
          "Enter IPFS (or other) hash of the signed QC certificate:"
        );
        if (!certHash) { setTxBusy(false); return; }

        txHash = await certifyWrite([
          BigInt(lotID),
          certHash
        ]);
      } else {
        /* For a fail, we pass the summary as the fail reason. */
        txHash = await failWrite([
          BigInt(lotID),
          summary.slice(0, 256)   /* keep it short */
        ]);
      }

      if (!txHash) { setTxBusy(false); return; } // user rejected

      await publicClient.waitForTransactionReceipt({ hash: txHash });
      router.push(`/inventory/${lotID}`);
    } catch (err) {
      alert(`Transaction failed: ${err}`);
    } finally {
      setTxBusy(false);
    }
  };

  /*──────────────── UI ────────────────*/
  const anyBusy = txBusy || certBusy || failBusy;

  return (
    <>
      <Header />
      <main className="px-6 py-10 max-w-3xl mx-auto">
        <button
          onClick={() => router.back()}
          className="mb-4 text-primary font-semibold"
        >
          ← Back
        </button>
        <h1 className="text-3xl font-bold mb-6">
          🛡️ Create QA Report for Lot {lotID}
        </h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Lot ID (readonly) */}
          <Field label="Lot ID">
            <input
              type="text"
              value={lotID}
              readOnly
              className="w-full border rounded px-3 py-2 bg-muted-foreground/20"
            />
          </Field>

          {/* Inspector */}
          <Field label="Inspector Name">
            <input
              type="text"
              required
              value={inspectorName}
              onChange={(e) => setInspectorName(e.target.value)}
              className="w-full border rounded px-3 py-2"
            />
          </Field>

          {/* Standard */}
          <Field label="Standard">
            <select
              value={standard}
              onChange={(e) => setStandard(e.target.value)}
              className="w-full border rounded px-3 py-2"
            >
              <option value="iso9001">ISO 9001</option>
              <option value="iso13485">ISO 13485</option>
            </select>
          </Field>

          {/* Result radio */}
          <Field label="Visual Inspection">
            <label className="mr-4">
              <input
                type="radio"
                name="pass"
                checked={passed}
                onChange={() => setPassed(true)}
              />{" "}
              Passed
            </label>
            <label>
              <input
                type="radio"
                name="pass"
                checked={!passed}
                onChange={() => setPassed(false)}
              />{" "}
              Failed
            </label>
          </Field>

          {/* Measurements */}
          <Field label="Critical Measurements">
            <textarea
              required
              value={measurements}
              onChange={(e) => setMeasurements(e.target.value)}
              className="w-full border rounded px-3 py-2"
              rows={3}
            />
          </Field>

          {/* Notes */}
          <Field label="Notes">
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full border rounded px-3 py-2"
              rows={2}
            />
          </Field>

          {/* Submit */}
          <button
            type="submit"
            disabled={anyBusy}
            className="w-full bg-primary text-white font-bold py-2 rounded-md hover:bg-primary/80 disabled:opacity-50"
          >
            {anyBusy ? "Submitting…" : "Submit QA Report"}
          </button>
        </form>
      </main>
    </>
  );
}

/* small wrapper */
function Field({ label, children }:{label:string; children:React.ReactNode}) {
  return (
    <div>
      <label className="block mb-1 font-medium">{label}</label>
      {children}
    </div>
  );
}
