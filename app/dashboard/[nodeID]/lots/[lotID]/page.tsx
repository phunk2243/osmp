// src/app/dashboard/[nodeID]/lots/[lotID]/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Header } from "../../../../header";

interface EventLogEntry {
  timestamp: string;
  event: string;
}

interface QualityReport {
  type: string;
  summary: string;
  timestamp: string;
}

interface ProductionLot {
  lotId: string;
  sku: string;
  quantity: number;
  timestamp: string;
  qcPass: boolean | null;
  eventLog: EventLogEntry[];
  qualityReports: QualityReport[];
}

export default function LotDetailPage() {
  const params = useParams();
  const nodeID = params.nodeID as string;
  const lotID = params.lotID as string;

  const [lot, setLot] = useState<ProductionLot | null>(null);

  useEffect(() => {
    const stored = JSON.parse(
      localStorage.getItem(`lots-${nodeID}`) || "[]"
    ) as ProductionLot[];
    const found = stored.find((l) => l.lotId === lotID) || null;
    setLot(found);
  }, [nodeID, lotID]);

  if (!lot) {
    return (
      <>
        <Header />
        <main className="px-6 py-10">
          <h1 className="text-3xl font-bold mb-6">Lot Not Found</h1>
          <p>Node ID: {nodeID}</p>
          <p>Lot ID: {lotID}</p>
        </main>
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="px-6 py-10 max-w-5xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">📦 {lot.lotId} Overview</h1>

        {/* Basic Info Section */}
        <section className="mb-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="border rounded-xl p-6 bg-muted">
              <h2 className="text-xl font-semibold mb-2">SKU</h2>
              <p className="text-muted-foreground">{lot.sku}</p>
            </div>
            <div className="border rounded-xl p-6 bg-muted">
              <h2 className="text-xl font-semibold mb-2">Quantity</h2>
              <p className="text-muted-foreground">
                {lot.quantity.toLocaleString()}
              </p>
            </div>
            <div className="border rounded-xl p-6 bg-muted">
              <h2 className="text-xl font-semibold mb-2">Timestamp</h2>
              <p className="text-muted-foreground">
                {new Date(lot.timestamp).toLocaleString()}
              </p>
            </div>
            <div className="border rounded-xl p-6 bg-muted">
              <h2 className="text-xl font-semibold mb-2">QC Status</h2>
              <p
                className={`font-semibold ${
                  lot.qcPass === true
                    ? "text-green-600"
                    : lot.qcPass === false
                    ? "text-red-500"
                    : "text-yellow-500"
                }`}
              >
                {lot.qcPass === true
                  ? "✅ Passed"
                  : lot.qcPass === false
                  ? "❌ Failed"
                  : "⏳ Pending"}
              </p>
            </div>
          </div>
        </section>

        {/* Quality Reports Section */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">📝 Quality Reports</h2>
          {lot.qualityReports.length > 0 ? (
            <div className="space-y-4">
              {lot.qualityReports.map((report, idx) => (
                <div
                  key={idx}
                  className="border rounded-lg p-4 bg-muted text-sm"
                >
                  <p>
                    <strong>Type:</strong> {report.type}
                  </p>
                  <p>
                    <strong>Summary:</strong> {report.summary}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(report.timestamp).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">
              No quality reports found for this lot.
            </p>
          )}
        </section>

        {/* Event Log Section */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">📜 Event Log</h2>
          {lot.eventLog.length > 0 ? (
            <ul className="space-y-2 text-sm">
              {lot.eventLog.map((event, idx) => (
                <li
                  key={idx}
                  className="border rounded p-3 bg-muted"
                >
                  <strong>
                    {new Date(event.timestamp).toLocaleString()}:
                  </strong>{" "}
                  {event.event}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted-foreground text-sm">
              No events logged for this lot yet.
            </p>
          )}
        </section>
      </main>
    </>
  );
}
