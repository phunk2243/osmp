// src/lib/web3/useContractRead.ts
"use client";

import { useEffect, useState } from "react";
import type { Abi } from "viem";
import { publicClient } from "./publicClient";

interface UseContractReadProps {
  address: `0x${string}`;
  abi: Abi;
  functionName: string;
  args?: unknown[];
}

/**
 * Hook to perform a read-only contract call using Viem's public client.
 * Supports BigInt in args by stringifying them safely.
 */
export function useContractRead<T>({
  address,
  abi,
  functionName,
  args = [],
}: UseContractReadProps) {
  const [data, setData] = useState<T | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Create a stable key for args that safely serializes BigInt → string
  const argsKey = JSON.stringify(
    args,
    (_key, value) =>
      typeof value === "bigint" ? value.toString() : value
  );

  useEffect(() => {
    let canceled = false;
    setLoading(true);
    setError(null);

    publicClient
      .readContract({
        address,
        abi,
        functionName,
        // Pass the original args (with BigInt) to viem
        args: args as any,
      })
      .then((result: unknown) => {
        if (!canceled) {
          setData(result as T);
        }
      })
      .catch((err: unknown) => {
        if (!canceled) {
          setError(err as Error);
        }
      })
      .finally(() => {
        if (!canceled) {
          setLoading(false);
        }
      });

    return () => {
      canceled = true;
    };
  }, [address, abi, functionName, argsKey]);

  return { data, loading, error };
}
