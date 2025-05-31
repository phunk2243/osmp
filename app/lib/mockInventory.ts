// --- src/lib/mockInventory.ts ---

export interface InventoryItem {
  lotId: string;
  nodeId: string;
  sku: string;
  quantity: number;
  timestamp: string;
  type: "Raw Material" | "WIP" | "Finished Good";
}

// Generate inventory from production lots that passed QC
// For now, defaulting all passed lots to "Finished Good"
export const mockInventory: InventoryItem[] = [
  {
    lotId: "LOT-001",
    nodeId: "Node-01",
    sku: "Surgical Mask V3",
    quantity: 1200,
    timestamp: "2025-07-20T10:15:00Z",
    type: "Finished Good",
  },
  {
    lotId: "LOT-003",
    nodeId: "Node-01",
    sku: "Gown Type 4",
    quantity: 200,
    timestamp: "2025-07-18T09:05:00Z",
    type: "Finished Good",
  },
  // Add more inventory items here as needed
];