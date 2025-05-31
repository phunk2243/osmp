export interface Machine {
  machineId: string;
  name: string;
  type: string;
  manufacturer: string;
  model: string;
  serialNumber: string;
  installationDate: string;
  maintenanceDueDate: string;
  status: "operational" | "maintenance" | "offline";
  createdByNodeID: string;
}
