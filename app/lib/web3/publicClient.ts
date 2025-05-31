// src/lib/web3/publicClient.ts
import { createPublicClient, http } from "viem";
import { sepolia } from "viem/chains";

/**
 * Public client for read-only interactions on Sepolia.
 */
export const publicClient = createPublicClient({
  chain: sepolia,
  transport: http("https://rpc.ankr.com/eth_sepolia/8e128a01f6bddd0bd548ede4bb978556c4778b1678d66159e1bc1fe48b4f6e99"),
});
