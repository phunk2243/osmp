// --- src/components/dashboard/NewCAPAReport.tsx ---

"use client";

import React, { useState } from "react";

export function NewCAPAReport() {
  const [lotId, setLotId] = useState("");
  const [issueDescription, setIssueDescription] = useState("");
  const [correctiveAction, setCorrectiveAction] = useState("");
  const [status, setStatus] = useState("Open");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Temporary placeholder behavior (later send to API or mock DB)
    alert(`CAPA Report Submitted:\nLot ID: ${lotId}\nStatus: ${status}`);

    // Reset fields
    setLotId("");
    setIssueDescription("");
    setCorrectiveAction("");
    setStatus("Open");
  };

  return (
    <div className="mt-12">
      <h2 className="text-2xl font-bold mb-6">📝 New CAPA Report</h2>
      <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
        <div>
          <label className="block text-sm font-medium mb-2">Lot ID</label>
          <input
            type="text"
            value={lotId}
            onChange={(e) => setLotId(e.target.value)}
            className="border rounded-md px-4 py-2 w-full"
            placeholder="e.g., LOT-004"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Issue Description</label>
          <textarea
            value={issueDescription}
            onChange={(e) => setIssueDescription(e.target.value)}
            className="border rounded-md px-4 py-2 w-full"
            rows={4}
            placeholder="Describe the problem identified during QC..."
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Corrective Action Plan</label>
          <textarea
            value={correctiveAction}
            onChange={(e) => setCorrectiveAction(e.target.value)}
            className="border rounded-md px-4 py-2 w-full"
            rows={4}
            placeholder="Describe proposed fixes, rework, or disposal..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="border rounded-md px-4 py-2 w-full"
          >
            <option value="Open">Open</option>
            <option value="Closed">Closed</option>
          </select>
        </div>

        <button
          type="submit"
          className="px-6 py-3 rounded-lg bg-primary text-white hover:bg-primary/80"
        >
          Submit CAPA Report
        </button>
      </form>
    </div>
  );
}
