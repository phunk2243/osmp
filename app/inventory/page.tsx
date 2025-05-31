// src/app/inventory/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Header } from "../header";
import { publicClient } from "../lib/web3/publicClient";

import {
  InventoryNFT_ADDRESS,
  InventoryNFT_ABI,
} from "../lib/web3/inventoryABI";
import { Market_ADDRESS, Market_ABI } from "../lib/web3/marketABI";

type PageView = "home" | "cart";
type CatalogFilter = "all" | "listed";

interface InventoryItem {
  lotId: string;
  tag: string;
  quantity: number;
  image: string;
  description: string;
}

interface MarketListing {
  collection: string;
  tokenId: string;
  price: number;
  image: string;
  description: string;
}

export default function InventoryPage() {
  const [ inventory, setInventory ] = useState<InventoryItem[]>([]);
  const [ listings,  setListings  ] = useState<MarketListing[]>([]);
  const [ loadingInv, setLoadingInv ] = useState(true);
  const [ loadingLst, setLoadingLst ] = useState(true);

  const [ page,      setPage      ] = useState<PageView>("home");
  const [ filter,    setFilter    ] = useState<CatalogFilter>("all");
  const [ cart,      setCart      ] = useState<Record<string, number>>({});

  // ── 1️⃣ load certified inventory lots ──────────────────────────
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoadingInv(true);
      try {
        const nextId = await publicClient.readContract({
          address: InventoryNFT_ADDRESS,
          abi: InventoryNFT_ABI,
          functionName: "nextLotId",
        }) as bigint;

        const arr: InventoryItem[] = [];
        for (let i = 0; i < Number(nextId); i++) {
          try {
            const [
              , , , skuBN, qtyBN, certified
            ] = await publicClient.readContract({
              address: InventoryNFT_ADDRESS,
              abi: InventoryNFT_ABI,
              functionName: "lots",
              args: [BigInt(i)],
            }) as readonly [
              bigint, bigint, bigint, bigint, bigint,
              boolean, string, string
            ];
            if (!certified) continue;

            const uri = await publicClient.readContract({
              address: InventoryNFT_ADDRESS,
              abi: InventoryNFT_ABI,
              functionName: "tokenURI",
              args: [BigInt(i)],
            }) as string;

            let tag = skuBN.toString();
            let image = "/images/package.png";
            if (uri.startsWith("data:application/json;base64,")) {
              const meta = JSON.parse(atob(uri.split(",")[1])) as any;
              tag = meta.attributes?.find((a:any)=>a.trait_type==="Tag")?.value || tag;
              image = meta.image || image;
            }

            arr.push({
              lotId: `${i}`,
              tag,
              quantity: Number(qtyBN),
              image,
              description: `Lot ${i} — ${qtyBN.toString()} units`,
            });
          } catch {
            // skip bad entries
          }
        }
        if (!cancelled) setInventory(arr);
      } finally {
        if (!cancelled) setLoadingInv(false);
      }
    })();
    return () => { cancelled = true };
  }, []);

  // ── 2️⃣ load latest 100k-block range of market listings ─────────
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoadingLst(true);
      try {
        // determine a safe fromBlock window
        const latest = await publicClient.getBlockNumber() as bigint;
        const window = 100_000n;
        const fromBlock = latest > window ? latest - window : 0n;

        const evs = await publicClient.getContractEvents({
          address: Market_ADDRESS,
          abi: Market_ABI,
          eventName: "Listed",
          fromBlock,
          toBlock: "latest",
        });
        const map = new Map<string, MarketListing>();
        for (const ev of evs) {
          const args = (ev as any).args as {
            collection: `0x${string}`;
            tokenId: bigint;
            price: bigint;
          };
          const id = args.tokenId.toString();
          // only keep the _latest_ listing per token
          map.set(id, {
            collection: args.collection,
            tokenId: id,
            price: Number(args.price) / 1e6,
            image: "/images/placeholder.png",
            description: `${args.collection} #${id}`,
          });
        }
        if (!cancelled) setListings(Array.from(map.values()));
      } finally {
        if (!cancelled) setLoadingLst(false);
      }
    })();
    return () => { cancelled = true };
  }, []);

  // ── cart helpers ───────────────────────────────────────────────
  const add    = (id: string) => setCart(c => ({ ...c, [id]: (c[id]||0)+1 }));
  const inc    = (id: string) => setCart(c => ({ ...c, [id]: c[id]+1 }));
  const dec    = (id: string) => {
    setCart(c => {
      const n = (c[id]||1)-1;
      if (n <= 0) {
        const { [id]:_, ...rest } = c;
        return rest;
      }
      return { ...c, [id]: n };
    });
  };
  const total  = () => Object.entries(cart).reduce((sum,[id,qty]) => {
    const it = inventory.find(x=>x.lotId===id);
    return it ? sum + it.quantity * qty : sum;
  }, 0);

  // ── apply filter to inventory if in home view ────────────────
  const visibleInventory = filter === "all"
    ? inventory
    : inventory.filter(it => listings.some(l => l.tokenId === it.lotId));

  return (
    <>
      <Header />
      <main className="px-6 py-10 max-w-6xl mx-auto">
        {/* top bar */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-4xl font-bold">Marketplace</h1>
          <div className="flex items-center gap-4">
            {page === "home" && (
              <select
                value={filter}
                onChange={e=>setFilter(e.target.value as CatalogFilter)}
                className="border rounded px-3 py-1 text-sm"
              >
                <option value="all">All Certified</option>
                <option value="listed">Only Listed</option>
              </select>
            )}
            <button
              onClick={() => setPage(p=> p==="home" ? "cart" : "home")}
              className="bg-primary text-white px-4 py-2 rounded"
            >
              {page==="home"
                ? `Cart (${Object.values(cart).reduce((a,b)=>a+b,0)})`
                : "Back to Catalog"}
            </button>
          </div>
        </div>

        {page === "home" ? (
          loadingInv ? (
            <p>Loading inventory…</p>
          ) : visibleInventory.length === 0 ? (
            <p className="text-muted-foreground">
              {filter==="all"
                ? "No certified inventory."
                : "No listed inventory."}
            </p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
              {visibleInventory.map(it=>(
                <div key={it.lotId} className="border rounded p-4 flex flex-col items-center">
                  <img src={it.image} alt="" className="h-20 mb-2"/>
                  <p className="font-bold mb-1 text-center">{it.description}</p>
                  <button
                    onClick={()=>add(it.lotId)}
                    className="bg-button px-3 py-1 text-xs border hover:bg-secondary-pink"
                  >
                    Add to Cart
                  </button>
                  <Link
                    href={`/inventory/${it.lotId}`}
                    className="text-blue-600 text-xs mt-1 hover:underline"
                  >
                    Details
                  </Link>
                </div>
              ))}
            </div>
          )
        ) : (
          // ── cart view ───────────────────────────────────────
          <div className="mt-4">
            <h2 className="text-2xl font-bold mb-4">🛒 Your Cart</h2>
            {Object.keys(cart).length === 0 ? (
              <p>Your cart is empty.</p>
            ) : (
              <>
                {Object.entries(cart).map(([id,qty]) => {
                  const it = inventory.find(x=>x.lotId===id)!;
                  return (
                    <div key={id} className="flex items-center mb-4 border p-3">
                      <img src={it.image} alt="" className="h-12 mr-4"/>
                      <div className="flex-1">
                        <p className="font-bold">{it.description}</p>
                        <p className="text-sm">{it.quantity} units</p>
                      </div>
                      <div className="flex items-center">
                        <button onClick={()=>dec(id)} className="px-2 border">–</button>
                        <span className="px-3">{qty}</span>
                        <button onClick={()=>inc(id)} className="px-2 border">+</button>
                      </div>
                    </div>
                  );
                })}
                <p className="font-bold mb-4">Total units: {total()}</p>
                <button
                  onClick={()=>alert("Checkout TBD")}
                  className="bg-primary text-white px-6 py-2 rounded disabled:opacity-50"
                  disabled={total()===0}
                >
                  Checkout
                </button>
              </>
            )}
          </div>
        )}
      </main>
    </>
  );
}
