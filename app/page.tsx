import { Header } from "./header";

export default function Home() {
  return (
    <>
      <Header />
      <main className="flex flex-col items-center justify-center py-20">
        <h1 className="text-5xl font-extrabold text-center">Welcome to OSMP</h1>
        <p className="text-lg mt-6 text-center max-w-2xl">
          If Hugging Face built Xometry, but made it modular, on-chain, and open-source... that's OSMP.
        </p>
        <div className="mt-10 flex gap-4">
          <a href="/marketplace" className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/80">
            Explore Bounties
          </a>
          <a href="/dashboard" className="px-6 py-3 border rounded-lg hover:bg-muted">
            View Node Dashboard
          </a>
        </div>
      </main>
    </>
  );
}
