"use client";

import { useState } from "react";
import { useWalletClient } from "./useWalletClient";
import { getContract, type Abi, type WriteContractParameters } from "viem";
import { publicClient } from "./publicClient";

interface UseContractWriteProps {
  address: `0x${string}`;
  abi: Abi;
  functionName: string;
  args?: readonly unknown[]; // Optional args in props
}

export function useContractWrite({ address, abi, functionName, args = [] }: UseContractWriteProps) {
  const { client: walletClient, address: walletAddress } = useWalletClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [txHash, setTxHash] = useState<`0x${string}` | null>(null);

  async function write(overrideArgs?: readonly unknown[]) {
    const finalArgs = overrideArgs ?? args; // Use overrideArgs if provided, else fall back to props args
    console.log("Attempting to write contract:", { functionName, args: finalArgs, walletAddress, walletClient });

    if (!walletClient || !walletAddress) {
      const error = new Error("Wallet not connected");
      setError(error);
      console.error(error.message);
      return;
    }

    setLoading(true);
    setError(null);
    setTxHash(null);

    try {
      const contract = getContract({
        address,
        abi,
        client: {
          public: publicClient,
          wallet: walletClient,
        },
      });

      const hash = await contract.write[functionName](finalArgs, {
        account: walletAddress,
      } as WriteContractParameters);

      console.log("Transaction hash:", hash);
      setTxHash(hash);
      return hash;
    } catch (err) {
      const error = err as Error;
      setError(error);
      console.error("Contract write failed:", error);
      return undefined;
    } finally {
      setLoading(false);
    }
  }

  return {
    write,
    loading,
    error,
    txHash,
  };
}