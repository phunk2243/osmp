// src/app/dashboard/[nodeID]/inventory/[sku]/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Header } from "../../../../header";
import Link from "next/link";

interface EventLogEntry {
  timestamp: string;
  event: string;
}

interface QualityReport {
  type: string;
  summary: string;
  timestamp: string;
}

export interface ProductionLot {
  lotId: string;
  sku: string;
  quantity: number;
  timestamp: string;
  qcPass: boolean | null;
  eventLog: EventLogEntry[];
  qualityReports: QualityReport[];
}

export default function InventoryDetailPage() {
  const params = useParams();
  const nodeID = params.nodeID as string;
  const sku = params.sku as string;

  const [lots, setLots] = useState<ProductionLot[]>([]);

  // aggregated metrics
  const [totalQuantity, setTotalQuantity] = useState(0);
  const [lotCount, setLotCount] = useState(0);
  const [avgLotSize, setAvgLotSize] = useState(0);
  const [lastReceipt, setLastReceipt] = useState("");

  useEffect(() => {
    const allLots: ProductionLot[] = JSON.parse(
      localStorage.getItem(`lots-${nodeID}`) || "[]"
    );
    const filtered = allLots.filter((l) => l.qcPass === true && l.sku === sku);
    setLots(filtered);

    if (filtered.length > 0) {
      const total = filtered.reduce((sum, l) => sum + l.quantity, 0);
      filtered.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setTotalQuantity(total);
      setLotCount(filtered.length);
      setAvgLotSize(total / filtered.length);
      setLastReceipt(new Date(filtered[0].timestamp).toLocaleDateString());
    }
  }, [nodeID, sku]);

  return (
    <>
      <Header />
      <main className="px-6 py-10 max-w-5xl mx-auto">
        <h1 className="text-4xl font-bold mb-6">Inventory: {sku}</h1>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 mb-8">
          <div className="border rounded-xl p-6 bg-muted">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase">
              Total Quantity
            </h2>
            <p className="text-2xl font-bold">{totalQuantity.toLocaleString()}</p>
          </div>

          <div className="border rounded-xl p-6 bg-muted">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase">
              Lots
            </h2>
            <p className="text-2xl font-bold">{lotCount}</p>
          </div>

          <div className="border rounded-xl p-6 bg-muted">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase">
              Avg Lot Size
            </h2>
            <p className="text-2xl font-bold">{avgLotSize.toFixed(1)}</p>
          </div>

          <div className="border rounded-xl p-6 bg-muted">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase">
              Last Receipt
            </h2>
            <p className="text-2xl font-bold">{lastReceipt || 'N/A'}</p>
          </div>
        </div>

        {/* Lots Table */}
        <div className="overflow-x-auto border rounded-xl bg-muted">
          <table className="min-w-full text-sm">
            <thead className="bg-muted-foreground/10">
              <tr>
                <th className="px-4 py-2 text-left">Lot ID</th>
                <th className="px-4 py-2 text-left">Quantity</th>
                <th className="px-4 py-2 text-left">Certified At</th>
                <th className="px-4 py-2 text-left"></th>
              </tr>
            </thead>
            <tbody>
              {lots.map((lot) => (
                <tr key={lot.lotId} className="border-t hover:bg-muted/50">
                  <td className="px-4 py-3">{lot.lotId}</td>
                  <td className="px-4 py-3">{lot.quantity.toLocaleString()}</td>
                  <td className="px-4 py-3">
                    {new Date(lot.timestamp).toLocaleString()}
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/dashboard/${nodeID}/lots/${lot.lotId}`}
                      className="text-primary underline text-sm"
                    >
                      View Details
                    </Link>
                  </td>
                </tr>
              ))}
              {lots.length === 0 && (
                <tr>
                  <td
                    colSpan={4}
                    className="px-4 py-6 text-center text-muted-foreground"
                  >
                    No certified lots for {sku}.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </main>
    </>
  );
}
