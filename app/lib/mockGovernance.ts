// --- src/lib/mockGovernance.ts ---

export type ProposalStatus = "Voting" | "Executed" | "Failed" | "Pending";

export interface Proposal {
  id: string;
  title: string;
  description: string;
  creator: string;
  createdAt: string;
  status: ProposalStatus;
  votesFor: number;
  votesAgainst: number;
  votesAbstain: number;
  snapshot: string;
}

export const mockProposals: Proposal[] = [
  {
    id: "1",
    title: "Add FDA 820 Module",
    description: "Proposal to add an FDA 820 compliance module to the marketplace.",
    creator: "0x123...456",
    createdAt: "2025-06-10",
    status: "Voting",
    votesFor: 12000,
    votesAgainst: 3000,
    votesAbstain: 500,
    snapshot: "snap12345",
  },
  {
    id: "2",
    title: "Increase Keeper Margin",
    description: "Proposal to increase the keeper margin from 28.5% to 30%.",
    creator: "0x789...abc",
    createdAt: "2025-06-07",
    status: "Executed",
    votesFor: 23000,
    votesAgainst: 5000,
    votesAbstain: 1000,
    snapshot: "snap12346",
  },
  {
    id: "3",
    title: "Reduce Treasury Fee",
    description: "Proposal to reduce the treasury gas fee from 2% to 1.5%.",
    creator: "0xdef...456",
    createdAt: "2025-06-01",
    status: "Failed",
    votesFor: 4000,
    votesAgainst: 10000,
    votesAbstain: 800,
    snapshot: "snap12347",
  },
  {
    id: "4",
    title: "Add SAP-ERP Integration",
    description: "Proposal to fund development of SAP ERP connector module.",
    creator: "0xghi...789",
    createdAt: "2025-06-12",
    status: "Pending",
    votesFor: 0,
    votesAgainst: 0,
    votesAbstain: 0,
    snapshot: "snap12348",
  },
];
