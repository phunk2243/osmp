/*─────────────────────────────────────────────────────────*\
  useMarket.ts — hooks for UniversalMarket
\*─────────────────────────────────────────────────────────*/

import { Market_ADDRESS, Market_ABI } from "./marketABI";
import { publicClient } from "./publicClient";
import { useContractWrite } from "./useContractWrite";
import { useContractRead } from "./useContractRead";
import { parseAbi, Log } from "viem";
import { useEffect } from "react";

/*──────────────────── WRITE hooks ────────────────────*/

/** Hook to list an item on the market */
export const useList = () =>
  useContractWrite({
    address: Market_ADDRESS,
    abi: Market_ABI,
    functionName: "list",
  });

/** Hook to buy an item from the market */
export const useBuy = () =>
  useContractWrite({
    address: Market_ADDRESS,
    abi: Market_ABI,
    functionName: "buy",
  });

/** Hook to cancel a listing on the market */
export const useCancel = () =>
  useContractWrite({
    address: Market_ADDRESS,
    abi: Market_ABI,
    functionName: "cancel",
  });

/*──────────────────── READ hook ──────────────────────*/

/** Hook to read listing details for a specific token */
export const useListing = (collection: `0x${string}`, tokenId: bigint) =>
  useContractRead({
    address: Market_ADDRESS,
    abi: Market_ABI,
    functionName: "listings",
    args: [collection, tokenId],
    // Optional: Uncomment if your wrapper supports it
    // refreshInterval: 5_000   // ms
  });

/*────────────────── Event feed helper ────────────────*/

// Define event argument types
type ListedEvt = {
  collection: `0x${string}`;
  tokenId: bigint;
  price: bigint;
  seller: `0x${string}`;
};

type CancelledEvt = {
  collection: `0x${string}`;
  tokenId: bigint;
  seller: `0x${string}`;
};

type SaleEvt = {
  collection: `0x${string}`;
  tokenId: bigint;
  price: bigint;
  buyer: `0x${string}`;
};

// Define event-specific log types
interface ListedLog extends Log<bigint, number> {
  args: ListedEvt;
}

interface CancelledLog extends Log<bigint, number> {
  args: CancelledEvt;
}

interface SaleLog extends Log<bigint, number> {
  args: SaleEvt;
}

/**
 * Hook to listen for market events (Listed, Cancelled, Sale)
 * @param onListed Callback for Listed events
 * @param onCancelled Callback for Cancelled events
 * @param onSale Callback for Sale events
 */
export function useListingFeed(
  onListed: (e: ListedEvt) => void,
  onCancelled: (e: CancelledEvt) => void,
  onSale: (e: SaleEvt) => void,
) {
  useEffect(() => {
    // Watch for Listed events
    const unsubscribeListed = publicClient.watchContractEvent({
      address: Market_ADDRESS,
      abi: Market_ABI,
      eventName: "Listed",
      onLogs: (logs) => {
        (logs as ListedLog[]).forEach((log) => onListed(log.args));
      },
    });

    // Watch for Cancelled events
    const unsubscribeCancelled = publicClient.watchContractEvent({
      address: Market_ADDRESS,
      abi: Market_ABI,
      eventName: "Cancelled",
      onLogs: (logs) => {
        (logs as CancelledLog[]).forEach((log) => onCancelled(log.args));
      },
    });

    // Watch for Sale events
    const unsubscribeSale = publicClient.watchContractEvent({
      address: Market_ADDRESS,
      abi: Market_ABI,
      eventName: "Sale",
      onLogs: (logs) => {
        (logs as SaleLog[]).forEach((log) => onSale(log.args));
      },
    });

    // Cleanup subscriptions on unmount
    return () => {
      unsubscribeListed();
      unsubscribeCancelled();
      unsubscribeSale();
    };
  }, [onListed, onCancelled, onSale]);
}

/*──────────────── USDC approve helper ────────────────*/

const USDC_ADDRESS = "0x94a9D9AC8a22534E3FaCa9F4e7F2E2cf85d5E4C8" as const;

/** Hook to approve USDC spending */
export const useUSDCApprove = () =>
  useContractWrite({
    address: USDC_ADDRESS,
    abi: parseAbi(["function approve(address spender,uint256 amount) returns (bool)"]),
    functionName: "approve",
  });