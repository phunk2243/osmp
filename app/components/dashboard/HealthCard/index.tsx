// --- components/dashboard/HealthCard.tsx ---

export function HealthCard() {
  return (
    <div className="border rounded-xl p-6 bg-muted shadow">
      <h2 className="text-2xl font-semibold mb-4">Operational Health</h2>
      <ul className="space-y-2">
        <li>Last Heartbeat: <span className="font-bold">2 hours ago</span></li>
        <li>Uptime 30d: <span className="font-bold">99.7%</span></li>
        <li>SLA Breaches: <span className="font-bold">0</span></li>
      </ul>
    </div>
  );
}
