"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Header } from "../header";
import { ModuleCard } from "../components/modules/ModuleCard";

interface Module {
  moduleId: string;
  title: string;
  description: string;
  category: "Training" | "CAD" | "Regulatory" | "Production SOPs" | string;
  version: string;
  downloads: number;
  creator: string;
  lastUpdated: string;
  tags: string[];
  files: { name: string; url: string }[];
}

const categories = ["All", "Training", "Regulatory", "CAD", "Production SOPs"];

export default function ModulesPage() {
  const router = useRouter();

  const [modules, setModules] = useState<Module[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOption, setSortOption] = useState("Newest");
  const [selectedCategory, setSelectedCategory] = useState("All");

  useEffect(() => {
    const storedModules = JSON.parse(localStorage.getItem("moduleRegistry") || "[]") as Module[];
    setModules(storedModules);
  }, []);

  const filteredModules = modules
    .filter(
      (m) =>
        m.title.toLowerCase().includes(searchTerm.toLowerCase()) &&
        (selectedCategory === "All" || m.category === selectedCategory)
    )
    .sort((a, b) => {
      if (sortOption === "Most Downloaded") {
        return b.downloads - a.downloads;
      }
      return new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime(); // newest default
    });

  return (
    <>
      <Header />
      <main className="px-6 py-10">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-bold">Module Library</h1>
          <button
            onClick={() => router.push("/modules/new")}
            className="bg-primary hover:bg-primary/80 text-white font-bold py-2 px-6 rounded-md"
          >
            ➕ Create Module
          </button>
        </div>

        <div className="flex flex-col md:flex-row gap-10">
          {/* Left column: Categories */}
          <aside className="w-full md:w-1/4">
            <h2 className="text-lg font-semibold mb-4">Categories</h2>
            <div className="flex flex-wrap md:flex-col gap-2">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-2 rounded-full border text-sm ${
                    selectedCategory === cat
                      ? "bg-primary text-white"
                      : "hover:bg-muted"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </aside>

          {/* Right column: Search, Sort, Modules */}
          <section className="flex-1">
            <div className="flex flex-wrap items-center justify-between mb-8 gap-4">
              <input
                type="text"
                placeholder="Search modules..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="px-4 py-2 rounded-full border text-sm w-full md:w-1/3"
              />
              <select
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value)}
                className="px-4 py-2 rounded-full border text-sm"
              >
                <option value="Newest">Newest</option>
                <option value="Most Downloaded">Most Downloaded</option>
              </select>
            </div>

            {filteredModules.length === 0 ? (
              <p className="text-muted-foreground">No modules found.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredModules.map((module) => (
                  <ModuleCard key={module.moduleId} {...module} />
                ))}
              </div>
            )}
          </section>
        </div>
      </main>
    </>
  );
}
