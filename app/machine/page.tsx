"use client";

import { Header } from "../header";
import { Machines } from "../components/machine";
import Link from "next/link";

export default function MachinesPage() {
  return (
    <>
      <Header />
      <main className="px-6 py-10">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold">🛠️ Machine Registry</h1>
          <Link href="/machine/new">
            <button className="bg-primary hover:bg-primary/80 text-white font-bold py-2 px-6 rounded-md">
              ➕ Register New Machine
            </button>
          </Link>
        </div>

        {/* List all machines */}
        <Machines />
      </main>
    </>
  );
}
