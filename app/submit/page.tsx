// --- src/pages/submit/page.tsx ---

"use client";

import React, { useState, useCallback } from "react";
import JSZip from "jszip";
import { Header } from "../header";
import { ModuleCard } from "../components/modules/ModuleCard";
import { mockModules } from "../lib/mockModules";
import ReactMarkdown from "react-markdown";

interface ModuleUpload {
  moduleId: string;
  title: string;
  category: string;
  version: string;
  downloads: number;
  creator: string;
  description: string;
  lastUpdated: string;
  tags: string[];
  readme?: string;
  fileNames?: string[];
}

const categories = ["Regulatory", "CAD", "Production SOPs"];

export default function SubmitModulePage() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState(categories[0]);
  const [tags, setTags] = useState("");
  const [version, setVersion] = useState("v1.0.0");
  const [files, setFiles] = useState<File[]>([]);
  const [readmeContent, setReadmeContent] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [dragActive, setDragActive] = useState(false);

  const processFiles = useCallback(async (fileList: FileList | File[]) => {
    setErrorMessage("");
    setReadmeContent("");

    const newFiles = Array.from(fileList);
    setFiles(prev => [...prev, ...newFiles]);

    for (const f of newFiles) {
      const name = f.name.toLowerCase();
      try {
        if (name.endsWith(".zip")) {
          const zip = await JSZip.loadAsync(f);
          const names = Object.keys(zip.files);
          const readmeEntry = names.find(p => /readme\.md$/i.test(p));
          if (readmeEntry) {
            const content = await zip.file(readmeEntry)!.async("text");
            setReadmeContent(content);
          }
        } else if (name === "readme.md") {
          const text = await f.text();
          setReadmeContent(text);
        }
      } catch (err) {
        console.error(err);
        setErrorMessage("Error reading file.");
      }
    }
  }, []);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      await processFiles(e.target.files);
    }
  };

  const handleDrop = useCallback(
    async (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);
      if (e.dataTransfer.files) {
        await processFiles(e.dataTransfer.files);
      }
    },
    [processFiles]
  );

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  }, []);

  const handleRemoveFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const newModule: ModuleUpload = {
      moduleId: title.toLowerCase().replace(/\s+/g, "-"),
      title,
      category,
      version,
      downloads: 0,
      creator: "0xYourAddress",
      description,
      lastUpdated: new Date().toISOString().split("T")[0],
      tags: tags.split(",").map(t => t.trim()),
      readme: readmeContent,
      fileNames: files.map(f => f.name),
    };

    mockModules.push(newModule as any);
    window.location.href = "/modules";
  };

  return (
    <>
      <Header />
      <main className="px-6 py-10">
        <h1 className="text-4xl font-bold mb-8">Submit New Module</h1>

        <div className="flex flex-col md:flex-row gap-10">
          <form onSubmit={handleSubmit} className="w-full md:w-2/3 space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">Title</label>
              <input
                type="text"
                className="px-4 py-2 rounded-md border w-full"
                value={title}
                onChange={e => setTitle(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Description</label>
              <textarea
                className="px-4 py-2 rounded-md border w-full"
                value={description}
                onChange={e => setDescription(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Category</label>
              <select
                className="px-4 py-2 rounded-md border w-full"
                value={category}
                onChange={e => setCategory(e.target.value)}
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Tags (comma-separated)</label>
              <input
                type="text"
                className="px-4 py-2 rounded-md border w-full"
                value={tags}
                onChange={e => setTags(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Version</label>
              <input
                type="text"
                className="px-4 py-2 rounded-md border w-full"
                value={version}
                onChange={e => setVersion(e.target.value)}
              />
            </div>

            {/* Drag & drop with files inside */}
            <div
              className={`flex flex-col items-center justify-center p-8 border-2 rounded-md cursor-pointer ${
                dragActive ? "border-primary bg-muted/50" : "border-dashed border-gray-400"
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <input
                type="file"
                multiple
                onChange={handleFileChange}
                className="hidden"
                id="file-upload"
              />
              <label htmlFor="file-upload" className="text-center w-full">
                {files.length > 0 ? (
                  <div className="space-y-1">
                    {files.map((f, idx) => (
                      <div key={idx} className="flex justify-between items-center text-sm">
                        <span>📦 {f.name}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveFile(idx)}
                          className="text-red-500 hover:text-red-700"
                        >❌</button>
                      </div>
                    ))}
                    <p className="text-xs text-muted-foreground mt-2">Change files?</p>
                  </div>
                ) : (
                  <>
                    <p className="text-sm">Drag & drop files here</p>
                    <p className="text-xs text-muted-foreground mt-2">or click to select</p>
                  </>
                )}
              </label>
            </div>

            <button
              type="submit"
              className="px-6 py-3 rounded-lg bg-primary text-white hover:bg-primary/80"
            >Submit Module</button>
          </form>

          {/* Live Preview */}
          <aside className="w-full md:w-1/3">
            <h2 className="text-lg font-semibold mb-4">Live Preview</h2>
            <div className="border rounded-xl p-6 bg-muted">
              <ModuleCard
                moduleId={title.toLowerCase().replace(/\s+/g, '-') || 'preview-id'}
                title={title || 'Module Title'}
                category={category}
                version={version}
                downloads={0}
                creator="0xYourAddress"
              />
              {readmeContent && (
                <div className="mt-4 border rounded p-2 max-h-40 overflow-y-auto prose prose-sm">
                  <h3 className="font-medium text-sm mb-1">README Preview:</h3>
                  <ReactMarkdown>{readmeContent}</ReactMarkdown>
                </div>
              )}
            </div>
          </aside>

        </div>
      </main>
    </>
  );
}
