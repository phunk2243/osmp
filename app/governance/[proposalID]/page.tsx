// src/app/governance/[proposalID]/page.tsx
"use client";

import { Header } from "../../header";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";

interface Proposal {
  id: string;
  title: string;
  description: string;
  creator: string;
  snapshot: string;
  createdAt: string;
  status: "Voting" | "Executed" | "Failed";
  votesFor: number;
  votesAgainst: number;
  votesAbstain: number;
}

export default function ProposalDetailPage() {
  const { proposalID } = useParams() as { proposalID: string };
  const [proposal, setProposal] = useState<Proposal | null>(null);

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem("governanceProposals") || "[]") as Proposal[];
    const found = stored.find((p) => p.id === proposalID) || null;
    setProposal(found);
  }, [proposalID]);

  if (!proposalID) {
    return (
      <>
        <Header />
        <main className="px-6 py-10">
          <h1 className="text-4xl font-bold mb-6">Invalid Proposal ID</h1>
        </main>
      </>
    );
  }

  if (!proposal) {
    return (
      <>
        <Header />
        <main className="px-6 py-10">
          <h1 className="text-4xl font-bold mb-6">Proposal Not Found</h1>
          <p className="text-muted-foreground">ID: {proposalID}</p>
        </main>
      </>
    );
  }

  const totalVotes = proposal.votesFor + proposal.votesAgainst + proposal.votesAbstain;
  const percentFor = totalVotes > 0 ? (proposal.votesFor / totalVotes) * 100 : 0;
  const percentAgainst = totalVotes > 0 ? (proposal.votesAgainst / totalVotes) * 100 : 0;
  const percentAbstain = totalVotes > 0 ? (proposal.votesAbstain / totalVotes) * 100 : 0;

  return (
    <>
      <Header />
      <motion.main
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="px-6 py-10 max-w-4xl mx-auto"
      >
        <h1 className="text-4xl font-bold mb-4">{proposal.title}</h1>

        {/* Metadata */}
        <div className="text-sm text-muted-foreground mb-8">
          <p><strong>Creator:</strong> {proposal.creator}</p>
          <p><strong>Created:</strong> {proposal.createdAt}</p>
          <p><strong>Snapshot:</strong> {proposal.snapshot}</p>
        </div>

        {/* Description */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">📖 Proposal Details</h2>
          <p className="text-muted-foreground whitespace-pre-line">{proposal.description}</p>
        </section>

        {/* Vote Summary */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">🗳️ Vote Summary</h2>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-green-500 font-medium">For</span>
              <span>{proposal.votesFor.toLocaleString()} votes ({percentFor.toFixed(1)}%)</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-red-500 font-medium">Against</span>
              <span>{proposal.votesAgainst.toLocaleString()} votes ({percentAgainst.toFixed(1)}%)</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500 font-medium">Abstain</span>
              <span>{proposal.votesAbstain.toLocaleString()} votes ({percentAbstain.toFixed(1)}%)</span>
            </div>
          </div>
        </section>

        {/* Voting Actions */}
        {proposal.status === "Voting" && (
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-4">🗳️ Cast Your Vote</h2>
            <div className="flex gap-4">
              <button className="flex-1 px-6 py-3 rounded-lg bg-green-500 text-white hover:bg-green-600">
                👍 Vote For
              </button>
              <button className="flex-1 px-6 py-3 rounded-lg bg-red-500 text-white hover:bg-red-600">
                👎 Vote Against
              </button>
              <button className="flex-1 px-6 py-3 rounded-lg bg-gray-400 text-white hover:bg-gray-500">
                🤷 Abstain
              </button>
            </div>
          </section>
        )}

        {/* Status */}
        <section>
          <h2 className="text-2xl font-bold mb-4">📈 Current Status</h2>
          <span
            className={`px-4 py-2 rounded-full text-sm font-bold ${
              proposal.status === "Voting"
                ? "bg-primary text-white"
                : proposal.status === "Executed"
                ? "bg-green-500 text-white"
                : proposal.status === "Failed"
                ? "bg-red-500 text-white"
                : "bg-gray-400 text-black"
            }`}
          >
            {proposal.status}
          </span>
        </section>
      </motion.main>
    </>
  );
}
