// --- components/marketplace/BountyCard.tsx ---

export function BountyCard({ title, reward, category, description, status, onSubmit }: { title: string; reward: number; category: string; description: string; status: string; onSubmit?: () => void; }) {
  const statusColor = status === "Open" ? "text-green-600" : status === "In Review" ? "text-yellow-500" : "text-gray-400";

  return (
    <div className="border rounded-xl p-6 bg-muted hover:shadow-lg transition">
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-2xl font-semibold">{title}</h2>
        <span className={`text-xs font-bold uppercase ${statusColor}`}>{status}</span>
      </div>
      <p className="text-muted-foreground text-sm mb-4">{category}</p>
      <p className="text-base mb-6">{description}</p>
      <div className="flex justify-between items-center">
        <span className="font-bold">{reward.toLocaleString()} OSMP</span>
        {status === "Open" && (
          <button
            onClick={onSubmit}
            className="px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary/80 text-sm"
          >
            Submit Module
          </button>
        )}
      </div>
    </div>
  );
}