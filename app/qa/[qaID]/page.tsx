// src/app/machine/[machineID]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Header } from "../../header";
import { ProductionHistory } from "../../components/dashboard/ProductionHistory";

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

interface ProductionLot {
  lotId: string;
  nodeId: string;
  machineId: string;
  sku: string;
  quantity: number;
  timestamp: string;
  qcPass: boolean | null;
  eventLog: { timestamp: string; event: string }[];
  qualityReports: { type: string; summary: string; timestamp: string }[];
}

export default function MachineDetailPage() {
  const { machineID } = useParams() as { machineID: string };
  const router = useRouter();

  const [machine, setMachine] = useState<Machine | null>(null);
  const [isProducing, setIsProducing] = useState(false);
  const [runtime, setRuntime] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);
  const [historyVersion, setHistoryVersion] = useState(0);

  useEffect(() => {
    const stored = JSON.parse(
      localStorage.getItem("machineRegistry") || "[]"
    ) as Machine[];
    const found = stored.find((m) => m.machineId === machineID);
    if (found) setMachine(found);
  }, [machineID]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isProducing) {
      timer = setInterval(() => {
        setRuntime((r) => r + 1);
        setPendingCount((p) => p + 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isProducing]);

  if (!machine) {
    return (
      <>
        <Header />
        <main className="px-6 py-10">
          <h1 className="text-4xl font-bold mb-6">Machine Not Found</h1>
          <p>Machine ID: {machineID}</p>
        </main>
      </>
    );
  }

  const handleStartProduction = () => {
    setRuntime(0);
    setPendingCount(0);
    setIsProducing(true);
  };

  const handleStopProduction = () => {
    setIsProducing(false);

    if (pendingCount > 0) {
      const lotId = `LOT-${Date.now()}`;
      const existingLots = JSON.parse(
        localStorage.getItem("lotRegistry") || "[]"
      ) as ProductionLot[];

      const newLot: ProductionLot = {
        lotId,
        nodeId: machine.createdByNodeID,
        machineId: machine.machineId,
        sku: machine.linkedSKU,
        quantity: pendingCount,
        timestamp: new Date().toISOString(),
        qcPass: null,
        eventLog: [{ timestamp: new Date().toISOString(), event: "Lot created from simulated production" }],
        qualityReports: [],
      };

      localStorage.setItem(
        "lotRegistry",
        JSON.stringify([...existingLots, newLot])
      );

      // trigger in-place history refresh
      setHistoryVersion((v) => v + 1);

      setRuntime(0);
      setPendingCount(0);
    }
  };

  return (
    <>
      <Header />
      <main className="px-6 py-10 max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-bold">{machine.name}</h1>
          <button
            onClick={() => window.history.back()}
            className="bg-muted text-muted-foreground hover:bg-muted/50 font-bold py-2 px-6 rounded-md"
          >
            ← Back
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
          <InfoCard label="Node ID" value={machine.createdByNodeID} />
          <InfoCard label="Linked SKU" value={machine.linkedSKU} />
          <InfoCard label="Type" value={machine.type} />
          <InfoCard label="Manufacturer" value={machine.manufacturer} />
          <InfoCard label="Model" value={machine.model} />
          <InfoCard label="Serial Number" value={machine.serialNumber} />
          <InfoCard label="Installation Date" value={new Date(machine.installationDate).toLocaleDateString()} />
          <InfoCard label="Next Maintenance" value={new Date(machine.maintenanceDueDate).toLocaleDateString()} />
          <InfoCard label="Status" value={machine.status} />
        </div>

        {/* Production Simulation Panel */}
        <div className="border rounded-xl p-6 bg-muted mb-8">
          <h2 className="text-2xl font-bold mb-4">🛠️ Production Simulation</h2>

          <div className="flex items-center gap-6 mb-6">
            <button
              onClick={handleStartProduction}
              disabled={isProducing}
              className="bg-primary hover:bg-primary/80 text-white font-bold py-2 px-6 rounded-md"
            >
              ▶️ Start Production
            </button>
            <button
              onClick={handleStopProduction}
              disabled={!isProducing}
              className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-6 rounded-md"
            >
              ⏹️ Stop Production
            </button>
          </div>

          <div className="grid grid-cols-2 gap-6 text-center mb-8">
            <div className="border rounded-xl p-6 bg-muted-foreground/10">
              <h3 className="text-sm text-muted-foreground mb-2">Runtime</h3>
              <p className="text-2xl font-bold">{runtime} sec</p>
            </div>
            <div className="border rounded-xl p-6 bg-muted-foreground/10">
              <h3 className="text-sm text-muted-foreground mb-2">Pending Units</h3>
              <p className="text-2xl font-bold">{pendingCount}</p>
            </div>
          </div>

          {/* Machine-specific Production History */}
          <ProductionHistory
            scope="machine"
            machineId={machineID}
            refreshTrigger={historyVersion}
          />
        </div>
      </main>
    </>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="border rounded-xl p-6 bg-muted">
      <h2 className="text-sm font-semibold text-muted-foreground uppercase mb-1">{label}</h2>
      <p className="text-lg font-bold break-words">{value}</p>
    </div>
  );
}