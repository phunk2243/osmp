// --- components/modules/ModuleCard.tsx ---

import Link from "next/link";

export function ModuleCard({ moduleId, title, category, version, downloads, creator }: { moduleId: string; title: string; category: string; version: string; downloads: number; creator: string; }) {
  return (
    <Link href={`/modules/${moduleId}`}>
      <div className="border rounded-xl p-6 bg-muted hover:shadow-lg transition cursor-pointer">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-xl font-semibold">{title}</h2>
          <span className="text-xs font-bold uppercase">{version}</span>
        </div>
        <p className="text-muted-foreground text-sm mb-2">{category}</p>
        <p className="text-sm">Downloads: <span className="font-bold">{downloads.toLocaleString()}</span></p>
        <p className="text-sm">Creator: <span className="font-bold">{creator}</span></p>
      </div>
    </Link>
  );
}