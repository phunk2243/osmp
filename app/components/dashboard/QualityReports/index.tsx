// --- src/components/dashboard/QualityReports.tsx ---

"use client";

import React, { useState } from "react";

const mockFailedLots = [
  { lotId: "LOT-002", sku: "SKU-456", timestamp: "2025-07-19", defect: "Seal failure", capaOpen: true },
  { lotId: "LOT-005", sku: "SKU-789", timestamp: "2025-07-17", defect: "Tear in material", capaOpen: false },
];

export function QualityReports() {
  const [filter, setFilter] = useState("All");

  const filteredReports = mockFailedLots
    .filter((lot) => {
      if (filter === "All") return true;
      if (filter === "Open CAPA") return lot.capaOpen;
      if (filter === "Closed CAPA") return !lot.capaOpen;
    })
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const exportToCSV = () => {
    const headers = ["Lot ID", "SKU", "Timestamp", "Defect", "CAPA Status"];
    const rows = filteredReports.map((lot) => [
      lot.lotId,
      lot.sku,
      lot.timestamp,
      lot.defect,
      lot.capaOpen ? "Open" : "Closed",
    ]);

    let csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].map(e => e.join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "quality_reports.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="mt-12">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">🧪 Quality Control Reports</h2>
        <div className="flex gap-2">
          <select
            className="border rounded-md px-3 py-2 text-sm"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option>All</option>
            <option>Open CAPA</option>
            <option>Closed CAPA</option>
          </select>
          <button
            className="px-4 py-2 rounded-md bg-primary text-white text-sm hover:bg-primary/80"
            onClick={exportToCSV}
          >
            Export CSV
          </button>
        </div>
      </div>

      <div className="overflow-x-auto border rounded-xl bg-muted">
        <table className="min-w-full text-sm">
          <thead className="bg-muted-foreground/10">
            <tr>
              <th className="px-4 py-2 text-left">Lot ID</th>
              <th className="px-4 py-2 text-left">SKU</th>
              <th className="px-4 py-2 text-left">Timestamp</th>
              <th className="px-4 py-2 text-left">Defect</th>
              <th className="px-4 py-2 text-left">CAPA Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredReports.map((lot, idx) => (
              <tr key={idx} className="border-t hover:bg-muted/50">
                <td className="px-4 py-3">{lot.lotId}</td>
                <td className="px-4 py-3">{lot.sku}</td>
                <td className="px-4 py-3">{lot.timestamp}</td>
                <td className="px-4 py-3">{lot.defect}</td>
                <td className="px-4 py-3">
                  {lot.capaOpen ? (
                    <span className="text-orange-500 font-semibold">🟠 Open</span>
                  ) : (
                    <span className="text-green-600 font-semibold">🟢 Closed</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
