// --- src/lib/mockQualityReports.ts ---

export const mockQualityReports = [
  {
    lotID: "LOT-001",
    qcPassed: true,
    inspector: "Inspector A",
    timestamp: "2025-07-20T10:30",
    notes: "All units within tolerance. No issues found.",
    defectsFound: 0,
  },
  {
    lotID: "LOT-002",
    qcPassed: false,
    inspector: "Inspector B",
    timestamp: "2025-07-19T14:45",
    notes: "Surface blemishes found on 5% of units. Lot failed QC.",
    defectsFound: 37,
  },
  {
    lotID: "LOT-003",
    qcPassed: true,
    inspector: "Inspector C",
    timestamp: "2025-07-18T09:00",
    notes: "Minor cosmetic defects but within acceptable limits.",
    defectsFound: 2,
  },
];
