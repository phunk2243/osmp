// src/app/inventory/[lotID]/page.tsx
"use client";

import React, { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { Header } from "../../header";
import { publicClient } from "../../lib/web3/publicClient";
import { useWalletClient } from "../../lib/web3/useWalletClient";
import { useContractRead } from "../../lib/web3/useContractRead";
import { useContractWrite } from "../../lib/web3/useContractWrite";
import { InventoryNFT_ADDRESS, InventoryNFT_ABI } from "../../lib/web3/inventoryABI";
import { Market_ADDRESS, Market_ABI } from "../../lib/web3/marketABI";
import { useList, useBuy, useCancel, useUSDCApprove, useListingFeed } from "../../lib/web3/useMarket";

interface EventLogEntry { timestamp: string; event: string; }
interface QualityReport { type: string; summary: string; timestamp: string; }

interface ProductionLot {
  lotId: string;
  nodeId: string;
  machineId: string;
  sku: string;
  quantity: number;
  timestamp: string;
  qcPass: boolean | null;
  certHash: string;
  failReason: string;
  eventLog: EventLogEntry[];
  qualityReports: QualityReport[];
}

interface Listing {
  collection: `0x${string}`;
  tokenId: bigint;
  price: bigint;
  seller: `0x${string}`;
}

export default function LotDetailPage() {
  const { lotID } = useParams() as { lotID?: string };
  const router = useRouter();
  const { address } = useWalletClient();

  const [lot, setLot] = useState<ProductionLot | null>(null);
  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [priceInput, setPriceInput] = useState("");
  const [transactionStatus, setTransactionStatus] = useState<"idle" | "approving" | "listing" | "success" | "error">("idle");
  const [transactionError, setTransactionError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const transactionStatusRef = useRef(transactionStatus);
  const lotIDRef = useRef(lotID);

  useEffect(() => { transactionStatusRef.current = transactionStatus; }, [transactionStatus]);
  useEffect(() => { lotIDRef.current = lotID; }, [lotID]);

  // Fetch listing status like InventoryPage
  useEffect(() => {
    if (!lotID) return;
    (async () => {
      try {
        // Determine a safe block window (same as InventoryPage)
        const latest = await publicClient.getBlockNumber();
        const window = 100_000n;
        const fromBlock = latest > window ? latest - window : 0n;

        // Fetch Listed events
        const listedEvents = await publicClient.getContractEvents({
          address: Market_ADDRESS,
          abi: Market_ABI,
          eventName: "Listed",
          fromBlock,
          toBlock: "latest",
        });

        // Fetch Cancelled events to filter out cancelled listings
        const cancelledEvents = await publicClient.getContractEvents({
          address: Market_ADDRESS,
          abi: Market_ABI,
          eventName: "Cancelled",
          fromBlock,
          toBlock: "latest",
        });

        // Find the latest Listed event for this lotID
        const listedEvent = listedEvents
          .reverse() // Latest first
          .find((ev) => {
            const args = (ev as any).args as {
              collection: `0x${string}`;
              tokenId: bigint;
              price: bigint;
              seller: `0x${string}`;
            };
            return (
              args.collection.toLowerCase() === InventoryNFT_ADDRESS.toLowerCase() &&
              args.tokenId === BigInt(lotID)
            );
          });

        // Check if the listing was cancelled
        const isCancelled = cancelledEvents.some((ev) => {
          const args = (ev as any).args as {
            collection: `0x${string}`;
            tokenId: bigint;
            seller: `0x${string}`;
          };
          return (
            args.collection.toLowerCase() === InventoryNFT_ADDRESS.toLowerCase() &&
            args.tokenId === BigInt(lotID) &&
            // Ensure cancellation happened after listing
            listedEvent ? ev.blockNumber > listedEvent.blockNumber : false
          );
        });

        if (listedEvent && !isCancelled) {
          const args = (listedEvent as any).args as {
            collection: `0x${string}`;
            tokenId: bigint;
            price: bigint;
            seller: `0x${string}`;
          };
          setListing({
            collection: args.collection,
            tokenId: args.tokenId,
            price: args.price,
            seller: args.seller,
          });
        } else {
          setListing(null);
        }
      } catch (err) {
        console.error("Failed to fetch listing:", err);
        setListing(null);
      }
    })();
  }, [lotID, refreshKey]);

  const isListed = !!listing && listing.price > 0n;
  const amISeller = !!listing && address && listing.seller.toLowerCase() === address.toLowerCase();

  const { write: listWrite, loading: listingLoading } = useList();
  const { write: cancelWrite, loading: cancelling } = useCancel();
  const { write: buyWrite, loading: buying } = useBuy();
  const { write: approveUSDC, loading: approvingUSDC } = useUSDCApprove();
  const { write: nftApprove, loading: nftApproving } = useContractWrite({
    address: InventoryNFT_ADDRESS,
    abi: InventoryNFT_ABI,
    functionName: "setApprovalForAll",
  });

  const { data: isApproved } = useContractRead({
    address: InventoryNFT_ADDRESS,
    abi: InventoryNFT_ABI,
    functionName: "isApprovedForAll",
    args: [
      address ?? "0x0000000000000000000000000000000000000000",
      Market_ADDRESS,
    ],
  }) as { data: boolean | undefined };

  useListingFeed(
    (e) => {
      if (
        transactionStatusRef.current === "listing" &&
        lotIDRef.current &&
        e.collection.toLowerCase() === InventoryNFT_ADDRESS.toLowerCase() &&
        e.tokenId === BigInt(lotIDRef.current)
      ) {
        setTransactionStatus("success");
        setRefreshKey((prev) => prev + 1); // Trigger re-fetch
      }
    },
    (e) => {
      if (
        lotIDRef.current &&
        e.collection.toLowerCase() === InventoryNFT_ADDRESS.toLowerCase() &&
        e.tokenId === BigInt(lotIDRef.current)
      ) {
        setRefreshKey((prev) => prev + 1); // Refresh on cancel
      }
    },
    (e) => {
      if (
        lotIDRef.current &&
        e.collection.toLowerCase() === InventoryNFT_ADDRESS.toLowerCase() &&
        e.tokenId === BigInt(lotIDRef.current)
      ) {
        setRefreshKey((prev) => prev + 1); // Refresh on sale
      }
    }
  );

  useEffect(() => {
    if (transactionStatus === "listing") {
      const timeout = setTimeout(() => {
        if (transactionStatusRef.current === "listing") {
          setTransactionStatus("error");
          setTransactionError("Timeout waiting for listing confirmation");
        }
      }, 30000);
      return () => clearTimeout(timeout);
    }
  }, [transactionStatus]);

  async function handleList() {
    if (!priceInput || !lotID || !address) return;
    setTransactionStatus("approving");
    setTransactionError(null);
    try {
      if (!isApproved) {
        const tx1 = await nftApprove([Market_ADDRESS, true]);
        const receipt = await publicClient.waitForTransactionReceipt({ hash: tx1! });
        if (receipt.status !== "success") throw new Error("NFT approval failed");
      }
      const priceBn = BigInt(Math.floor(parseFloat(priceInput) * 1e6));
      setTransactionStatus("listing");
      const tx2 = await listWrite([
        InventoryNFT_ADDRESS,
        BigInt(lotID),
        priceBn,
      ]);
      await publicClient.waitForTransactionReceipt({ hash: tx2! });
    } catch (err: any) {
      console.error("Listing failed:", err);
      setTransactionStatus("error");
      setTransactionError(err.message);
    }
  }

  async function handleCancel() {
    if (!lotID) return;
    try {
      const tx = await cancelWrite([InventoryNFT_ADDRESS, BigInt(lotID)]);
      await publicClient.waitForTransactionReceipt({ hash: tx! });
    } catch (err) {
      console.error("Cancel failed:", err);
    }
  }

  async function handleBuy() {
    if (!lotID || !listing) return;
    try {
      const tx1 = await approveUSDC();
      await publicClient.waitForTransactionReceipt({ hash: tx1! });
      const tx2 = await buyWrite([InventoryNFT_ADDRESS, BigInt(lotID)]);
      await publicClient.waitForTransactionReceipt({ hash: tx2! });
    } catch (err) {
      console.error("Buy failed:", err);
    }
  }

  useEffect(() => {
    if (!lotID) return;
    (async () => {
      setLoading(true);
      try {
        const tup = (await publicClient.readContract({
          address: InventoryNFT_ADDRESS,
          abi: InventoryNFT_ABI,
          functionName: "lots",
          args: [BigInt(lotID)],
        })) as readonly [bigint, bigint, bigint, bigint, bigint, boolean, string, string];

        const [, nodeBN, machBN, skuBN, qtyBN, certified, certHash, failReason] = tup;

        const uri = (await publicClient.readContract({
          address: InventoryNFT_ADDRESS,
          abi: InventoryNFT_ABI,
          functionName: "tokenURI",
          args: [BigInt(lotID)],
        })) as string;

        let ts = new Date().toISOString();
        if (uri.startsWith("data:application/json;base64,")) {
          const meta = JSON.parse(atob(uri.split(",")[1]));
          ts = meta.attributes?.find((a: any) => a.trait_type === "Timestamp")?.value || ts;
        }

        const qcPass = certified ? true : failReason ? false : null;
        const events: EventLogEntry[] = [{ timestamp: ts, event: "Lot minted" }];
        const reports: QualityReport[] = [];

        if (certified) {
          events.push({ timestamp: ts, event: "Lot certified" });
          reports.push({ type: "Certification", summary: certHash, timestamp: ts });
        } else if (failReason) {
          events.push({ timestamp: ts, event: "Lot failed" });
          reports.push({ type: "Failure", summary: failReason, timestamp: ts });
        }

        setLot({
          lotId: lotID,
          nodeId: nodeBN.toString(),
          machineId: machBN.toString(),
          sku: skuBN.toString(),
          quantity: Number(qtyBN),
          timestamp: ts,
          qcPass,
          certHash,
          failReason,
          eventLog: events,
          qualityReports: reports,
        });
      } finally {
        setLoading(false);
      }
    })();
  }, [lotID]);

  if (loading) {
    return (
      <>
        <Header />
        <main className="px-6 py-10"><p>Loading lot…</p></main>
      </>
    );
  }

  if (!lot) {
    return (
      <>
        <Header />
        <main className="px-6 py-10">
          <h1 className="text-3xl font-bold mb-4">Lot Not Found</h1>
          <p>Lot ID: {lotID}</p>
        </main>
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="px-6 py-10 max-w-5xl mx-auto">
        <button onClick={() => router.back()} className="text-primary font-semibold mb-6">
          ← Back
        </button>

        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-bold">📦 Lot {lot.lotId}</h1>
          {lot.qcPass === null && (
            <button onClick={() => router.push(`/qa/new?lotID=${lotID}`)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
              Create QA Report
            </button>
          )}
        </div>

        <section className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {([
            ["Node ID", lot.nodeId],
            ["Machine ID", lot.machineId],
            ["SKU", lot.sku],
            ["Quantity", lot.quantity.toLocaleString()],
            ["Timestamp", new Date(lot.timestamp).toLocaleString()],
            ["QC Status",
              lot.qcPass === true ? "✅ Certified" :
              lot.qcPass === false ? "❌ Failed" :
              "⏳ Pending"
            ],
          ] as [string, string][]).map(([label, val]) => (
            <div key={label} className="border rounded-xl p-6 bg-muted">
              <h2 className="text-xl font-semibold mb-2">{label}</h2>
              <p className="text-muted-foreground break-all">{val}</p>
            </div>
          ))}
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">📝 Quality Reports</h2>
          {lot.qualityReports.length > 0 ? (
            <ul className="space-y-4">
              {lot.qualityReports.map((r, i) => (
                <li key={i} className="border rounded p-4 bg-muted text-sm">
                  <p><strong>{r.type}:</strong> {r.summary}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(r.timestamp).toLocaleString()}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted-foreground text-sm">No quality reports.</p>
          )}
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">📜 Event Log</h2>
          {lot.eventLog.length > 0 ? (
            <ul className="space-y-2 text-sm">
              {lot.eventLog.map((e, i) => (
                <li key={i} className="border rounded p-3 bg-muted">
                  <strong>{new Date(e.timestamp).toLocaleString()}:</strong> {e.event}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted-foreground text-sm">No events.</p>
          )}
        </section>

        <section className="border-t pt-6">
          {!isListed ? (
            lot.qcPass ? (
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="USDC price"
                    value={priceInput}
                    onChange={(e) => setPriceInput(e.target.value)}
                    className="border rounded px-3 py-1 w-28"
                    disabled={transactionStatus === "approving" || transactionStatus === "listing"}
                  />
                  <button
                    onClick={handleList}
                    disabled={!priceInput || listingLoading || nftApproving || transactionStatus !== "idle"}
                    className="px-4 py-2 bg-green-600 text-white rounded-md disabled:opacity-50"
                  >
                    {transactionStatus === "approving" ? "Approving…" :
                     transactionStatus === "listing" ? "Listing…" :
                     "List for Sale"}
                  </button>
                </div>
                {transactionStatus === "success" && (
                  <p className="text-green-600">Listing successful!</p>
                )}
                {transactionStatus === "error" && (
                  <p className="text-red-600">{transactionError}</p>
                )}
              </div>
            ) : (
              <p className="text-red-600">You must certify this lot before listing.</p>
            )
          ) : (
            <div className="flex items-center gap-4">
              <span>🔖 Listed at {(Number(listing.price) / 1e6).toFixed(2)} USDC</span>
              {amISeller ? (
                <button onClick={handleCancel} disabled={cancelling}
                  className="px-4 py-2 bg-yellow-600 text-white rounded-md disabled:opacity-50">
                  {cancelling ? "Cancelling…" : "Cancel Listing"}
                </button>
              ) : (
                <button onClick={handleBuy} disabled={approvingUSDC || buying}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md disabled:opacity-50">
                  {buying ? "Buying…" : "Buy Now"}
                </button>
              )}
            </div>
          )}
        </section>
      </main>
    </>
  );
}