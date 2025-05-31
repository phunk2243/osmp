"use client";

import Link from "next/link";

export function MachineCard({
  machineId,
  name,
  type,
  manufacturer,
  model,
  serialNumber,
  installationDate,
  maintenanceDueDate,
  status,
  createdByNodeID,
  linkedSKUs,             // 👈 plural
}: {
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
  linkedSKUs: string;     // comma‑joined list ("12, 15, 27")
}) {
  const statusColors = {
    operational: "bg-green-500",
    maintenance: "bg-yellow-500",
    offline: "bg-red-500",
  };

  return (
    <Link href={`/machine/${machineId}`}>
      <div className="border rounded-xl p-6 bg-muted hover:shadow-lg transition cursor-pointer">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">{name}</h2>
          <span
            className={`text-xs font-bold uppercase px-2 py-1 rounded-full text-white ${statusColors[status]}`}
          >
            {status}
          </span>
        </div>

        <p className="text-muted-foreground text-sm mb-2">{type}</p>

        <p className="text-sm mb-1">
          <span className="font-bold">Node:</span> {createdByNodeID}
        </p>
        <p className="text-sm mb-2">
          <span className="font-bold">SKU IDs:</span> {linkedSKUs}
        </p>

        <p className="text-sm">
          <span className="font-bold">Manufacturer:</span> {manufacturer}
        </p>
        <p className="text-sm">
          <span className="font-bold">Model:</span> {model}
        </p>
        <p className="text-sm">
          <span className="font-bold">Serial #:</span> {serialNumber}
        </p>
        <p className="text-sm mt-2">
          <span className="font-bold">Installed:</span>{" "}
          {new Date(installationDate).toLocaleDateString()}
        </p>
        <p className="text-sm">
          <span className="font-bold">Maintenance Due:</span>{" "}
          {new Date(maintenanceDueDate).toLocaleDateString()}
        </p>
      </div>
    </Link>
  );
}
