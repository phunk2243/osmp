// src/global.d.ts

interface EthereumProvider {
  isMetaMask?: boolean;
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
  on?: (...args: any[]) => void;
  removeListener?: (...args: any[]) => void;
}

declare global {
  interface Window {
    ethereum?: EthereumProvider;
  }
}

export {};
