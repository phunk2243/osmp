"use client";

// --- app/marketplace/page.tsx ---

import { useState } from "react";
import { Header } from "../header";
import { BountyCard } from "../components/marketplace/BountyCard";
import { SubmitModal } from "../components/marketplace/SubmitModal";

const mockBounties = [
  {
    title: "FDA 820 Compliance",
    reward: 250_000,
    category: "Regulatory Compliance",
    description: "Build a plug-and-play FDA 820 quality system module.",
    status: "Open",
  },
  {
    title: "Part CAD Library",
    reward: 150_000,
    category: "CAD & Product Design",
    description: "Submit parametric CAD files and BOMs for rapid manufacturing adoption.",
    status: "In Review",
  },
  {
    title: "CNC Machining SOP",
    reward: 100_000,
    category: "Production SOPs",
    description: "Create standardized machining procedures for CNC-based factories.",
    status: "Closed",
  },
];

const categories = ["All", "Regulatory Compliance", "CAD & Product Design", "Production SOPs"];
const statuses = ["All", "Open", "In Review", "Closed"];

export default function MarketplacePage() {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [openModal, setOpenModal] = useState<string | null>(null);

  const filteredBounties = mockBounties.filter(b => {
    const categoryMatch = selectedCategory === "All" || b.category === selectedCategory;
    const statusMatch = selectedStatus === "All" || b.status === selectedStatus;
    return categoryMatch && statusMatch;
  });

  return (
    <>
      <Header />
      <main className="px-6 py-10">
        <h1 className="text-4xl font-bold mb-8">Module Marketplace</h1>

        <div className="flex flex-wrap items-center justify-between mb-8 gap-4">
          <div className="flex flex-wrap gap-4">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-full border text-sm ${selectedCategory === cat ? 'bg-primary text-white' : 'hover:bg-muted'}`}
              >
                {cat}
              </button>
            ))}
          </div>
          <div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-4 py-2 rounded-full border text-sm bg-background hover:bg-muted"
            >
              {statuses.map((status) => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBounties.map((bounty, idx) => (
            <BountyCard key={idx} {...bounty} onSubmit={() => setOpenModal(bounty.title)} />
          ))}
        </div>
      </main>

      {openModal && (
        <SubmitModal bountyTitle={openModal} onClose={() => setOpenModal(null)} />
      )}
    </>
  );
}
