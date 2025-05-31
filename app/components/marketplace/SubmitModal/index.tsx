// --- components/marketplace/SubmitModal.tsx ---

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export function SubmitModal({ bountyTitle, onClose }: { bountyTitle: string; onClose: () => void; }) {
  const [file, setFile] = useState<File | null>(null);
  const [description, setDescription] = useState("");

  function handleSubmit() {
    alert(`Submitted module for ${bountyTitle}! (mock)`);
    onClose();
  }

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="bg-background p-8 rounded-xl w-full max-w-md shadow-xl"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <h2 className="text-2xl font-bold mb-6">Submit Module for {bountyTitle}</h2>
          <input
            type="file"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="block w-full mb-4"
          />
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Short description..."
            className="w-full p-3 rounded border mb-6"
            rows={4}
          />
          <div className="flex gap-4 justify-end">
            <button onClick={onClose} className="px-4 py-2 rounded bg-muted">
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              className="px-4 py-2 rounded bg-primary text-white hover:bg-primary/80"
              disabled={!file || !description}
            >
              Submit
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
