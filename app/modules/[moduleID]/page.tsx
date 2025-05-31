// --- src/app/modules/[moduleID]/page.tsx ---

"use client";

import { useParams } from "next/navigation";
import { Header } from "../../header";
import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";

interface ModuleFile {
  name: string;
  url: string;
}

interface Module {
  moduleId: string;
  title: string;
  description: string;
  category: "Training" | "CAD" | "Regulatory" | "Production SOPs" | string;
  version: string;
  creator: string;
  downloads: number;
  lastUpdated: string;
  tags: string[];
  files: ModuleFile[];
  additionalMeta?: Record<string, any>;
}

export default function ModuleDetailPage() {
  const params = useParams(); // Get dynamic route parameters
  const moduleID = params.moduleID as string | undefined; // Type assertion

  if (!moduleID) {
    return (
      <>
        <Header />
        <main className="px-6 py-10">
          <h1 className="text-4xl font-bold mb-6">Invalid Module ID</h1>
          <p>No module ID provided in the URL.</p>
        </main>
      </>
    );
  }

  const allModules = JSON.parse(localStorage.getItem("moduleRegistry") || "[]") as Module[];
  const module = allModules.find((m) => m.moduleId === moduleID);

  if (!module) {
    return (
      <>
        <Header />
        <main className="px-6 py-10">
          <h1 className="text-4xl font-bold mb-6">Module Not Found</h1>
          <p>Module ID: {moduleID}</p>
        </main>
      </>
    );
  }

  const handleDownloadAll = () => {
    module.files.forEach((file) => {
      const link = document.createElement("a");
      link.href = file.url;
      link.download = file.name;
      link.click();
    });
  };

  return (
    <>
      <Header />
      <motion.main
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="px-6 py-10 max-w-4xl mx-auto"
      >
        {/* Title */}
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-4xl font-bold">{module.title}</h1>
          <span className="text-sm px-3 py-1 rounded-full bg-muted text-muted-foreground">
            {module.version}
          </span>
        </div>

        {/* Metadata */}
        <div className="text-sm text-muted-foreground mb-6">
          <p><strong>Creator:</strong> {module.creator}</p>
          <p><strong>Downloads:</strong> {module.downloads.toLocaleString()}</p>
          <p><strong>Last Updated:</strong> {new Date(module.lastUpdated).toLocaleDateString()}</p>
        </div>

        {/* Action Button */}
        <div className="mb-8">
          {module.category === "Training" ? (
            <button
              className="px-6 py-3 rounded-lg bg-primary text-white hover:bg-primary/80"
              onClick={() => alert("Training start placeholder (launch viewer later)")}
            >
              🎓 Start Training
            </button>
          ) : (
            <button
              className="px-6 py-3 rounded-lg bg-primary text-white hover:bg-primary/80"
              onClick={handleDownloadAll}
            >
              📥 Download All Files
            </button>
          )}
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-2 mb-8">
          {module.tags.map((tag, idx) => (
            <span
              key={idx}
              className="px-3 py-1 text-xs rounded-full bg-muted text-muted-foreground"
            >
              {tag}
            </span>
          ))}
        </div>

        {/* Divider */}
        <hr className="my-8 border-muted" />

        {/* Module Details */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">📖 Module Details</h2>
          <p className="text-muted-foreground mb-6">{module.description}</p>
          {/* Readme Viewer (optional later) */}
          {/* Future: Support module.readme here */}
        </section>

        {/* Version History */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">🕒 Version History</h2>
          <ul className="list-disc pl-6 text-muted-foreground">
            <li><strong>v{module.version}</strong> – Initial Release</li>
          </ul>
        </section>

        {/* License */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">🪪 License</h2>
          <p className="text-muted-foreground">MIT License</p>
        </section>
      </motion.main>
    </>
  );
}