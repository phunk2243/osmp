// --- components/dashboard/NodeStats.tsx ---

export function NodeStats() {
  return (
    <div className="border rounded-xl p-6 bg-muted shadow">
      <h2 className="text-2xl font-semibold mb-4">Production Stats</h2>
      <ul className="space-y-2">
        <li>Units Produced: <span className="font-bold">12,340</span></li>
        <li>SKUs Active: <span className="font-bold">8</span></li>
        <li>Total Rewards: <span className="font-bold">45,200 OSMP</span></li>
      </ul>
    </div>
  );
}