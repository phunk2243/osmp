// --- src/app/dashboard/[nodeID]/inventory/page.tsx ---

"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { Header } from "../../../header";
import { mockInventory, InventoryItem } from "../../../lib/mockInventory";

export default function NodeInventoryPage() {
  const params = useParams(); // Get dynamic params
  const nodeID = params.nodeID as string; // Type assertion for nodeID

  const [filterType, setFilterType] = useState<string>("All");
  const [filterSKU, setFilterSKU] = useState<string>("All");

  // Filter inventory to this node
  const inventory = mockInventory.filter(item => item.nodeId === nodeID);

  // Unique filter options
  const types = ["All", ...Array.from(new Set(inventory.map(i => i.type)))];
  const skus = ["All", ...Array.from(new Set(inventory.map(i => i.sku)))];

  // Apply filters
  const filtered = inventory
    .filter(item => filterType === "All" || item.type === filterType)
    .filter(item => filterSKU === "All" || item.sku === filterSKU);

  return (
    <>
      <Header />
      <main className="px-6 py-10">
        <h1 className="text-4xl font-bold mb-8">Inventory for {nodeID}</h1>

        <div className="flex flex-wrap gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium mb-1">Type Filter</label>
            <select
              className="px-4 py-2 rounded-md border"
              value={filterType}
              onChange={e => setFilterType(e.target.value)}
            >
              {types.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">SKU Filter</label>
            <select
              className="px-4 py-2 rounded-md border"
              value={filterSKU}
              onChange={e => setFilterSKU(e.target.value)}
            >
              {skus.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto border rounded-xl bg-muted">
          <table className="min-w-full text-sm">
            <thead className="bg-muted-foreground/10">
              <tr>
                <th className="px-4 py-2 text-left">Lot ID</th>
                <th className="px-4 py-2 text-left">SKU</th>
                <th className="px-4 py-2 text-left">Type</th>
                <th className="px-4 py-2 text-left">Quantity</th>
                <th className="px-4 py-2 text-left">Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item: InventoryItem, idx) => (
                <tr key={idx} className="border-t hover:bg-muted/50">
                  <td className="px-4 py-3">{item.lotId}</td>
                  <td className="px-4 py-3">{item.sku}</td>
                  <td className="px-4 py-3">{item.type}</td>
                  <td className="px-4 py-3">{item.quantity.toLocaleString()}</td>
                  <td className="px-4 py-3">{new Date(item.timestamp).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </>
  );
}