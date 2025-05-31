// --- components/dashboard/EscrowCard.tsx ---

export function EscrowCard() {
  return (
    <div className="border rounded-xl p-6 bg-muted shadow">
      <h2 className="text-2xl font-semibold mb-4">Escrow Status</h2>
      <ul className="space-y-2">
        <li>Current Escrow: <span className="font-bold">4,200 OSMP</span></li>
        <li>Vesting in 30d: <span className="font-bold">1,800 OSMP</span></li>
        <li>Penalties YTD: <span className="font-bold">0 OSMP</span></li>
      </ul>
    </div>
  );
}