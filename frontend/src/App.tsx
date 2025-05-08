import { RainbowKitProvider, ConnectButton } from "@rainbow-me/rainbowkit";
import { WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { config } from "./config/wagmi";
import "@rainbow-me/rainbowkit/styles.css";
import { GameLobby } from "./components/GameLobby";

const queryClient = new QueryClient();

function App() {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>
          <div className="min-h-screen bg-gray-900 text-white">
            <div className="container mx-auto px-4">
              <header className="py-6 border-b border-gray-800 mb-8">
                <div className="flex justify-between items-center">
                  <h1 className="text-3xl font-bold">Milady Arena</h1>
                  <ConnectButton />
                </div>
              </header>
              <main>
                <GameLobby />
              </main>
            </div>
          </div>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

export default App;
