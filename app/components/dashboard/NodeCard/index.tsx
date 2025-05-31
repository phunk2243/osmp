// --- components/dashboard/NodeCard.tsx ---

import Link from "next/link";

export function NodeCard({ nodeId, location, status, unitsProduced, escrow }: { nodeId: string; location: string; status: string; unitsProduced: number; escrow: number; }) {
  const statusColor = status === "Healthy" ? "text-green-600" : status === "At Risk" ? "text-yellow-500" : "text-gray-400";

  return (
    <Link href={`/dashboard/${nodeId}`}>
      <div className="border rounded-xl p-6 bg-muted hover:shadow-lg transition cursor-pointer">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-xl font-semibold">{nodeId}</h2>
          <span className={`text-xs font-bold uppercase ${statusColor}`}>{status}</span>
        </div>
        <p className="text-muted-foreground text-sm mb-2">{location}</p>
        <p className="text-sm">Units Produced: <span className="font-bold">{unitsProduced}</span></p>
        <p className="text-sm">Escrow: <span className="font-bold">{escrow.toLocaleString()} OSMP</span></p>
      </div>
    </Link>
  );
}
