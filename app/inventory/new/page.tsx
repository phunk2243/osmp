"use client";

import { useState, useEffect } from "react";
import { Header } from "../../header";

interface Machine {
  machineId: string;
  name: string;
  type: string;
  manufacturer: string;
  model: string;
  serialNumber: string;
  installationDate: string;
  maintenanceDueDate: string;
  status: "operational" | "maintenance" | "offline";
  createdByNodeID: string;
  linkedSKU: string;
}

interface SKUProfile {
  sku: string;
  description: string;
  visibility: "global" | "private";
  createdByNodeID: string;
}

export default function NewMachinePage() {
  const [form, setForm] = useState({
    name: "",
    type: "",
    manufacturer: "",
    model: "",
    serialNumber: "",
    installationDate: "",
    maintenanceDueDate: "",
    status: "operational",
  });
  const [selectedNodeID, setSelectedNodeID] = useState("");
  const [selectedSKU, setSelectedSKU] = useState("");

  const [availableNodes, setAvailableNodes] = useState<string[]>([]);
  const [availableSKUs, setAvailableSKUs] = useState<SKUProfile[]>([]);

  useEffect(() => {
    const nodes = JSON.parse(localStorage.getItem("nodeRegistry") || "[]") as { nodeId: string }[];
    const skus = JSON.parse(localStorage.getItem("skuRegistry") || "[]") as SKUProfile[];

    setAvailableNodes(nodes.map((n) => n.nodeId));
    setAvailableSKUs(skus);
  }, []);

  const handleSave = () => {
    if (!selectedNodeID || !selectedSKU) {
      alert("Please select both a Node and a SKU.");
      return;
    }

    const newMachine: Machine = {
      machineId: Date.now().toString(), // temp ID
      name: form.name,
      type: form.type,
      manufacturer: form.manufacturer,
      model: form.model,
      serialNumber: form.serialNumber,
      installationDate: form.installationDate,
      maintenanceDueDate: form.maintenanceDueDate,
      status: form.status as "operational" | "maintenance" | "offline",
      createdByNodeID: selectedNodeID,
      linkedSKU: selectedSKU,
    };

    const existing = JSON.parse(localStorage.getItem("machineRegistry") || "[]") as Machine[];
    const updated = [...existing, newMachine];
    localStorage.setItem("machineRegistry", JSON.stringify(updated));

    window.location.href = "/machine"; // Navigate back to machine list
  };

  return (
    <>
      <Header />
      <main className="px-6 py-10 max-w-3xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">Register New Machine</h1>

        <div className="space-y-6">
          {/* Node Picker */}
          <div>
            <label className="block text-sm font-semibold mb-1">Node</label>
            <select
              value={selectedNodeID}
              onChange={(e) => setSelectedNodeID(e.target.value)}
              className="border rounded-md w-full px-4 py-2"
            >
              <option value="">Select Node...</option>
              {availableNodes.map((nodeID) => (
                <option key={nodeID} value={nodeID}>{nodeID}</option>
              ))}
            </select>
          </div>

          {/* SKU Picker */}
          <div>
            <label className="block text-sm font-semibold mb-1">Linked SKU</label>
            <select
              value={selectedSKU}
              onChange={(e) => setSelectedSKU(e.target.value)}
              className="border rounded-md w-full px-4 py-2"
            >
              <option value="">Select SKU...</option>
              {availableSKUs
                .filter((sku) => sku.visibility === "global" || sku.createdByNodeID === selectedNodeID)
                .map((sku) => (
                  <option key={sku.sku} value={sku.sku}>
                    {sku.sku} – {sku.description}
                  </option>
                ))}
            </select>
          </div>

          {/* Rest of the form */}
          {[
            { label: "Name", key: "name" },
            { label: "Type", key: "type" },
            { label: "Manufacturer", key: "manufacturer" },
            { label: "Model", key: "model" },
            { label: "Serial Number", key: "serialNumber" },
            { label: "Installation Date", key: "installationDate", type: "date" },
            { label: "Maintenance Due Date", key: "maintenanceDueDate", type: "date" },
          ].map(({ label, key, type }) => (
            <div key={key}>
              <label className="block text-sm font-semibold mb-1">{label}</label>
              <input
                type={type || "text"}
                value={(form as any)[key]}
                onChange={(e) => setForm((prev) => ({ ...prev, [key]: e.target.value }))}
                className="border rounded-md w-full px-4 py-2"
              />
            </div>
          ))}

          {/* Status dropdown */}
          <div>
            <label className="block text-sm font-semibold mb-1">Status</label>
            <select
              value={form.status}
              onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value as "operational" | "maintenance" | "offline" }))}
              className="border rounded-md w-full px-4 py-2"
            >
              <option value="operational">Operational</option>
              <option value="maintenance">Maintenance</option>
              <option value="offline">Offline</option>
            </select>
          </div>

          {/* Save Button */}
          <div className="mt-8 flex justify-end">
            <button
              onClick={handleSave}
              className="bg-primary hover:bg-primary/80 text-white font-bold py-2 px-6 rounded-md"
            >
              Save Machine
            </button>
          </div>
        </div>
      </main>
    </>
  );
}
