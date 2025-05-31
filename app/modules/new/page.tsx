"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Header } from "../../header";

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

export default function CreateModulePage() {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Training");
  const [version, setVersion] = useState("1.0");
  const [files, setFiles] = useState<ModuleFile[]>([]);
  const [tags, setTags] = useState<string>("");
  const [error, setError] = useState("");

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const uploadedFiles = Array.from(e.target.files).map((file) => ({
      name: file.name,
      url: URL.createObjectURL(file), // Local preview link
    }));
    setFiles((prev) => [...prev, ...uploadedFiles]);
  };

  const handleSave = () => {
    if (!title.trim()) {
      setError("Module title is required.");
      return;
    }

    const moduleId = `mod-${Date.now()}`; // 🧠 NFT ready format (temp)
    const creator = "SYSTEM"; // Later = Node ID or Wallet Address
    const newModule: Module = {
      moduleId,
      title,
      description,
      category,
      version,
      creator,
      downloads: 0,
      lastUpdated: new Date().toISOString(),
      tags: tags.split(",").map((tag) => tag.trim()),
      files,
      additionalMeta: {}, // Extendable for special types later
    };

    const existing = JSON.parse(localStorage.getItem("moduleRegistry") || "[]") as Module[];
    const updated = [...existing, newModule];
    localStorage.setItem("moduleRegistry", JSON.stringify(updated));

    router.push("/modules");
  };

  return (
    <>
      <Header />
      <main className="px-6 py-10 max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">➕ Create New Module</h1>

        {error && (
          <div className="bg-red-100 text-red-600 p-4 rounded-lg mb-6">
            {error}
          </div>
        )}

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-semibold mb-1">Module Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="border rounded-md w-full px-4 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="border rounded-md w-full px-4 py-2"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="border rounded-md w-full px-4 py-2"
              >
                <option value="Training">Training</option>
                <option value="CAD">CAD</option>
                <option value="Production SOPs">Production SOPs</option>
                <option value="Regulatory">Regulatory</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-1">Version</label>
              <input
                type="text"
                value={version}
                onChange={(e) => setVersion(e.target.value)}
                className="border rounded-md w-full px-4 py-2"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-1">Tags (comma separated)</label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className="border rounded-md w-full px-4 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-1">Upload Files (PDFs, Videos, etc)</label>
            <input
              type="file"
              multiple
              onChange={handleFileUpload}
              className="block text-sm"
            />
            <div className="mt-2">
              {files.map((file, idx) => (
                <div key={idx} className="text-sm text-muted-foreground">{file.name}</div>
              ))}
            </div>
          </div>

          <div className="mt-8 flex justify-end">
            <button
              onClick={handleSave}
              className="bg-primary hover:bg-primary/80 text-white font-bold py-2 px-6 rounded-md"
            >
              Save Module
            </button>
          </div>
        </div>
      </main>
    </>
  );
}
