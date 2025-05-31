export interface QualityReport {
  type: string;
  summary: string;
  timestamp: string;
}

export interface EventLogEntry {
  timestamp: string;
  event: string;
}

export interface ProductionLot {
  lotId: string;
  sku: string;
  quantity: number;
  timestamp: string;
  qcPass: boolean | null;
  eventLog: EventLogEntry[];
  qualityReports: QualityReport[];
}

export interface PendingUnit {
  sku: string;
  quantity: number;
  timestamps: string[];
}

// Per-node storage
export const productionLotsByNode: { [nodeId: string]: ProductionLot[] } = {};
export const pendingUnitsByNode: { [nodeId: string]: PendingUnit[] } = {};

// Preload Node-01 with sample lots
productionLotsByNode["Node-01"] = [
  {
    lotId: "LOT-0001",
    sku: "SKU-123",
    quantity: 100,
    timestamp: "2025-02-20T10:00:00Z",
    qcPass: true,
    eventLog: [
      { timestamp: "2025-02-20T10:00:00Z", event: "Produced" },
      { timestamp: "2025-02-20T10:30:00Z", event: "QC Passed" }
    ],
    qualityReports: [
      { type: "Initial QC", summary: "All specs met.", timestamp: "2025-07-20T10:30:00Z" }
    ]
  },
  {
    lotId: "LOT-0002",
    sku: "SKU-456",
    quantity: 75,
    timestamp: "2025-02-19T14:00:00Z",
    qcPass: false,
    eventLog: [
      { timestamp: "2025-02-19T14:00:00Z", event: "Produced" },
      { timestamp: "2025-02-19T14:45:00Z", event: "QC Failed" }
    ],
    qualityReports: [
      { type: "QC Failure", summary: "Packaging defect noted.", timestamp: "2025-07-19T14:45:00Z" }
    ]
  },
  {
    lotId: "LOT-0003",
    sku: "SKU-789",
    quantity: 200,
    timestamp: "2025-02-18T09:00:00Z",
    qcPass: true,
    eventLog: [
      { timestamp: "2025-02-18T09:00:00Z", event: "Produced" },
      { timestamp: "2025-02-18T09:30:00Z", event: "QC Passed" }
    ],
    qualityReports: []
  }
];

pendingUnitsByNode["Node-01"] = [];

export function simulateFactoryStartup(nodeId: string) {
  if (!productionLotsByNode[nodeId]) {
    productionLotsByNode[nodeId] = [];
  }
  if (!pendingUnitsByNode[nodeId]) {
    pendingUnitsByNode[nodeId] = [];
  }
}

export function simulateInventoryMinted(nodeId: string, sku: string, quantity: number) {
  simulateFactoryStartup(nodeId);
  const nodePending = pendingUnitsByNode[nodeId];
  const timestamp = new Date().toISOString();
  const existing = nodePending.find(p => p.sku === sku);

  if (existing) {
    existing.quantity += quantity;
    existing.timestamps.push(timestamp);
  } else {
    nodePending.push({ sku, quantity, timestamps: [timestamp] });
  }
}

export function simulateLotCertified(nodeId: string, lotId: string, quantity: number) {
  simulateFactoryStartup(nodeId);
  const nodePending = pendingUnitsByNode[nodeId];

  if (!nodePending.length) return;

  const pending = nodePending[0];
  if (pending.quantity < quantity) {
    console.warn("Not enough pending quantity to certify.");
    return;
  }

  productionLotsByNode[nodeId].push({
    lotId,
    sku: pending.sku,
    quantity,
    timestamp: new Date().toISOString(),
    qcPass: null,
    eventLog: [
      { timestamp: new Date().toISOString(), event: "Lot Certified" }
    ],
    qualityReports: []
  });

  pending.quantity -= quantity;
  pending.timestamps.splice(0, quantity);

  if (pending.quantity <= 0) {
    nodePending.shift();
  }
}