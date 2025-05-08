import { http, createConfig } from "wagmi";
import { base, baseSepolia } from "wagmi/chains";
import { getDefaultConfig } from "@rainbow-me/rainbowkit";

export const config = getDefaultConfig({
  appName: "Arena Fighter NFT",
  projectId: "112ec4a1861dce77f142bfc08d8c0503", // Get one from https://cloud.walletconnect.com
  chains: [baseSepolia],
  transports: {
    [baseSepolia.id]: http(),
  },
});
