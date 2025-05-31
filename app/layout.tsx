// --- app/layout.tsx (global layout) ---

import "./globals.css";
import { Inter } from "next/font/google";
//import { WagmiProvider } from "wagmi";
//import { config } from "../wagmiConfig"; // we will define later

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className + " bg-background text-foreground min-h-screen"}>
        {/* <WagmiProvider config={config}> */} 
          {children}
       {/*} </WagmiProvider> */}
      </body>
    </html>
  );
}