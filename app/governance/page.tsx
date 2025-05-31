// src/app/governance/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Header } from "../header";

interface Proposal {
  id: string;
  title: string;
  status: "Voting" | "Executed" | "Failed";
  snapshot: string;
}

export default function GovernancePage() {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem("governanceProposals") || "[]") as Proposal[];
      setProposals(stored);
    } catch (err) {
      console.error("Error loading proposals:", err);
      setError("Failed to load governance proposals.");
    }
  }, []);

  return (
    <>
      <Header />
      <main className="px-6 py-10">
        <h1 className="text-4xl font-bold mb-8">Governance Hub</h1>

        {error && (
          <div className="bg-red-100 text-red-700 px-4 py-3 mb-6 rounded-lg">
            {error}
          </div>
        )}

        {/* Summary Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="p-6 bg-muted rounded-xl">
            <h2 className="text-lg font-semibold mb-2">Total Proposals</h2>
            <p className="text-2xl font-bold">{proposals.length}</p>
          </div>
          <div className="p-6 bg-muted rounded-xl">
            <h2 className="text-lg font-semibold mb-2">Active Quorum</h2>
            <p className="text-2xl font-bold">100,000 OSMP</p>
          </div>
          <div className="p-6 bg-muted rounded-xl">
            <h2 className="text-lg font-semibold mb-2">Voter Turnout</h2>
            <p className="text-2xl font-bold">28%</p>
          </div>
        </div>

        {/* Proposal List */}
        <h2 className="text-2xl font-bold mb-6">Active Proposals</h2>
        <div className="space-y-6">
          {proposals.map((proposal) => (
            <Link key={proposal.id} href={`/governance/${proposal.id}`}>
              <div className="p-6 bg-muted rounded-xl hover:shadow-md transition cursor-pointer">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-xl font-semibold">{proposal.title}</h3>
                  <span
                    className={`text-xs px-3 py-1 rounded-full font-medium ${
                      proposal.status === "Voting"
                        ? "bg-primary text-white"
                        : proposal.status === "Executed"
                        ? "bg-green-500 text-white"
                        : proposal.status === "Failed"
                        ? "bg-red-500 text-white"
                        : "bg-gray-300 text-black"
                    }`}
                  >
                    {proposal.status}
                  </span>
                </div>
                <p className="text-muted-foreground text-sm">
                  Snapshot: {proposal.snapshot}
                </p>
              </div>
            </Link>
          ))}
        </div>

        {/* New Proposal Button */}
        <div className="mt-12">
          <Link href="/governance/new">
            <button className="px-6 py-3 rounded-lg bg-primary text-white hover:bg-primary/80">
              ➕ New Proposal
            </button>
          </Link>
        </div>
      </main>
    </>
  );
}
