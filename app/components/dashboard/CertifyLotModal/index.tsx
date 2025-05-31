"use client";

import React, { useState, useEffect } from "react";

interface CertifyLotModalProps {
  sku: string;
  complianceMode: "none" | "iso9001" | "iso13485";
  onCertify: (quantity: number, qualityInspection: QualityInspectionReport) => void;
  onCancel: () => void;
}

export interface QualityInspectionReport {
  inspectorName: string;
  date: string;
  visualInspectionPassed: boolean;
  criticalMeasurements: string;
  notes: string;
}


const complianceChecklist = {
  none: [],
  iso9001: [
    "Document Control Verified",
    "Training Completed",
  ],
  iso13485: [
    "Document Control Verified",
    "Training Completed",
    "Risk Analysis Completed",
    "Complaint Handling Process Confirmed",
  ],
};

export function CertifyLotModal({
  sku,
  complianceMode,
  onCertify,
  onCancel,
}: CertifyLotModalProps) {
  const [quantity, setQuantity] = useState("");
  const [checklist, setChecklist] = useState<{ [key: string]: boolean }>({});
  const [inspectorName, setInspectorName] = useState("");
  const [visualInspectionPassed, setVisualInspectionPassed] = useState(true);
  const [criticalMeasurements, setCriticalMeasurements] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    const initialChecklist: { [key: string]: boolean } = {};
    complianceChecklist[complianceMode].forEach((item) => {
      initialChecklist[item] = false;
    });
    setChecklist(initialChecklist);
  }, [complianceMode]);

  const isChecklistComplete =
    Object.values(checklist).every((v) => v) ||
    complianceMode === "none";

  const isInspectionFormComplete =
    inspectorName.trim() !== "" &&
    criticalMeasurements.trim() !== "";

  const canCertify =
    quantity.trim() !== "" &&
    Number(quantity) > 0 &&
    isChecklistComplete &&
    isInspectionFormComplete;

  const handleSubmit = () => {
    if (!canCertify) return;

    const report: QualityInspectionReport = {
      inspectorName,
      date: new Date().toISOString(),
      visualInspectionPassed,
      criticalMeasurements,
      notes,
    };

    onCertify(Number(quantity), report);
  };

  return (
    <div
      className="fixed inset-0 bg-black/80 flex items-center justify-center z-50"
      onClick={onCancel}
    >
      <div
        className="bg-black rounded-xl shadow-xl p-8 space-y-6 w-full max-w-2xl animate-in fade-in zoom-in-95 overflow-y-auto max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-2xl font-bold">Certify Pending Lot</h2>
        <p className="text-muted-foreground mb-4">SKU: <span className="font-semibold">{sku}</span></p>

        <div className="space-y-4">
          <input
            type="number"
            placeholder="Quantity to certify"
            className="w-full bg-muted border border-muted-foreground/20 px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
          />

          {complianceMode !== "none" && (
            <>
              <h3 className="text-lg font-bold mt-6">✅ Compliance Checklist</h3>
              <div className="space-y-2">
                {Object.keys(checklist).map((item) => (
                  <label key={item} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={checklist[item]}
                      onChange={(e) =>
                        setChecklist({ ...checklist, [item]: e.target.checked })
                      }
                    />
                    {item}
                  </label>
                ))}
              </div>
            </>
          )}

          {(complianceMode === "iso9001" || complianceMode === "iso13485") && (
            <>
              <h3 className="text-lg font-bold mt-8">📝 Quality Inspection Report</h3>

              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Inspector Name"
                  className="w-full bg-muted border border-muted-foreground/20 px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  value={inspectorName}
                  onChange={(e) => setInspectorName(e.target.value)}
                />

                <div className="flex items-center gap-3">
                  <label className="font-semibold">Visual Inspection Result:</label>
                  <select
                    value={visualInspectionPassed ? "pass" : "fail"}
                    onChange={(e) => setVisualInspectionPassed(e.target.value === "pass")}
                    className="border rounded-md px-3 py-2 text-sm"
                  >
                    <option value="pass">Pass</option>
                    <option value="fail">Fail</option>
                  </select>
                </div>

                <textarea
                  placeholder="Critical Measurements (dimensions, etc.)"
                  className="w-full bg-muted border border-muted-foreground/20 px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  value={criticalMeasurements}
                  onChange={(e) => setCriticalMeasurements(e.target.value)}
                  rows={3}
                />

                <textarea
                  placeholder="Additional Notes (optional)"
                  className="w-full bg-muted border border-muted-foreground/20 px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                />
              </div>
            </>
          )}
        </div>

        <div className="flex gap-4 mt-8">
          <button
            className={`flex-1 font-bold rounded-md px-6 py-3 ${
              canCertify
                ? "bg-primary text-white hover:bg-primary/80"
                : "bg-muted-foreground text-muted cursor-not-allowed"
            }`}
            disabled={!canCertify}
            onClick={handleSubmit}
          >
            Certify Lot
          </button>
          <button
            className="flex-1 bg-muted text-muted-foreground hover:bg-muted/50 font-bold rounded-md px-6 py-3"
            onClick={onCancel}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
