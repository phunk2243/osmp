// src/app/governance/new/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Header } from "../../header";
import { useWalletClient } from "../../lib/web3/useWalletClient";

export default function NewProposalPage() {
  const router = useRouter();
  const { address } = useWalletClient();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [snapshotBlock, setSnapshotBlock] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!title || !description || !snapshotBlock) {
      setErrorMessage("All fields are required.");
      return;
    }

    const newProposal = {
      id: title.toLowerCase().replace(/\s+/g, "-").slice(0, 24),
      title,
      description,
      creator: address || "0x0000000000000000",
      snapshot: snapshotBlock,
      createdAt: new Date().toISOString(),
      status: "Voting",
      votesFor: 0,
      votesAgainst: 0,
      votesAbstain: 0,
    };

    const existing = JSON.parse(localStorage.getItem("governanceProposals") || "[]");
    localStorage.setItem("governanceProposals", JSON.stringify([newProposal, ...existing]));

    router.push(`/governance/${newProposal.id}`);
  };

  return (
    <>
      <Header />
      <main className="px-6 py-10 max-w-2xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">Create New Proposal</h1>

        {errorMessage && (
          <div className="mb-6 p-4 rounded-lg bg-red-100 text-red-700 text-sm">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2">Proposal Title</label>
            <input
              type="text"
              className="px-4 py-2 rounded-md border w-full"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Proposal Description</label>
            <textarea
              className="px-4 py-2 rounded-md border w-full"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={6}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Snapshot Block Number</label>
            <input
              type="text"
              className="px-4 py-2 rounded-md border w-full"
              value={snapshotBlock}
              onChange={(e) => setSnapshotBlock(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="px-6 py-3 rounded-lg bg-primary text-white hover:bg-primary/80 w-full"
          >
            Submit Proposal
          </button>
        </form>
      </main>
    </>
  );
}
