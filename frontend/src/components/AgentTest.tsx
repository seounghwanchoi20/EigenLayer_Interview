import { useAccount, useReadContract, usePublicClient } from "wagmi";
import { useState, useEffect } from "react";
import { createAgent } from "../systems/agent/traitParser";
import { SPECIAL_MOVES, type MoveType } from "../systems/agent/specialMoves";
import type { Agent } from "../systems/agent/types";
import { BattleArena } from "./BattleArena";

const CONTRACT_ADDRESS = "0xE835d7E3674fF39699C0843cc0A68cdB873D8529";
const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;

const nftAbi = [
  {
    inputs: [{ name: "owner", type: "address" }],
    name: "balanceOf",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "tokenId", type: "uint256" }],
    name: "getNFTTraits",
    outputs: [
      {
        components: [
          { name: "background", type: "string" },
          { name: "skin", type: "string" },
          { name: "eyes", type: "string" },
          { name: "mouth", type: "string" },
          { name: "headwear", type: "string" },
          { name: "clothes", type: "string" },
          { name: "accessory", type: "string" },
          { name: "special", type: "string" },
          { name: "mood", type: "string" },
          { name: "weather", type: "string" },
        ],
        name: "traits",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { name: "owner", type: "address" },
      { name: "index", type: "uint256" },
    ],
    name: "tokenOfOwnerByIndex",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

// Add move type colors
const MOVE_TYPE_COLORS = {
  Physical: "from-red-500 to-red-700",
  Magical: "from-blue-500 to-blue-700",
  Support: "from-green-500 to-green-700",
  Ultimate: "from-purple-500 to-purple-700",
} as const;

// Generate different test traits based on token ID
function generateTestTraits(tokenId: number) {
  const traitSets = [
    {
      background: "Red",
      skin: "Dark",
      eyes: "Angry",
      mouth: "Grin",
      headwear: "Horns",
      clothes: "Armor",
      accessory: "None",
      special: "Tattoo",
      mood: "Fierce",
      weather: "Thunder",
    },
    {
      background: "Blue",
      skin: "Pale",
      eyes: "Mysterious",
      mouth: "Peaceful",
      headwear: "Crown",
      clothes: "Robe",
      accessory: "Amulet",
      special: "Glowing",
      mood: "Calm",
      weather: "Starry",
    },
    {
      background: "Purple",
      skin: "Golden",
      eyes: "Cat",
      mouth: "Smirk",
      headwear: "None",
      clothes: "Cyber",
      accessory: "Ring",
      special: "Shadow",
      mood: "Mysterious",
      weather: "Foggy",
    },
  ];

  return traitSets[tokenId % traitSets.length];
}

function StatBar({
  value,
  maxValue,
  color,
}: {
  value: number;
  maxValue: number;
  color: string;
}) {
  const percentage = (value / maxValue) * 100;
  return (
    <div className="w-full bg-gray-700 rounded-full h-2">
      <div
        className={`${color} h-2 rounded-full transition-all duration-500`}
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
}

function MoveCard({ moveName }: { moveName: string }) {
  console.log("Rendering MoveCard for move:", moveName);
  const move = SPECIAL_MOVES[moveName];
  console.log("Found move details:", move);

  if (!move) {
    console.warn(`Move "${moveName}" not found in SPECIAL_MOVES!`);
    return (
      <div className="bg-red-900/20 p-4 rounded-lg">
        <p className="text-red-400">Error: Move "{moveName}" not found</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-lg overflow-hidden">
      <div
        className={`bg-gradient-to-r ${
          MOVE_TYPE_COLORS[move.type as keyof typeof MOVE_TYPE_COLORS]
        } p-3`}
      >
        <div className="flex justify-between items-center">
          <span className="font-bold text-white">{move.name}</span>
          <span className="text-sm text-white/80">
            {move.type} • CD: {move.cooldown}t
          </span>
        </div>
      </div>
      <div className="p-3 space-y-2">
        <div className="text-sm text-gray-300">{move.description}</div>
        <div className="text-xs text-gray-400">
          <span className="font-semibold">Effect:</span> {move.effect}
        </div>
        {move.basePower > 0 && (
          <div className="flex justify-between text-xs text-gray-400">
            <span>Power: {move.basePower}</span>
            <span>Accuracy: {move.accuracy}%</span>
          </div>
        )}
        <div className="text-xs text-gray-400">
          <span className="font-semibold">Requirements:</span>
          {Object.entries(move.requirements).map(([stat, value], i) => (
            <span key={stat}>
              {i > 0 && " • "}
              {stat}: {value}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

export function AgentTest() {
  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient();
  const [selectedTokenId, setSelectedTokenId] = useState<number | null>(null);
  const [selectedOpponentId, setSelectedOpponentId] = useState<number | null>(
    null
  );
  const [showBattle, setShowBattle] = useState(false);
  const [apiKey, setApiKey] = useState<string>(OPENAI_API_KEY || "");
  const [showApiKeyInput, setShowApiKeyInput] = useState(!OPENAI_API_KEY);
  const [ownedTokenIds, setOwnedTokenIds] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get user's NFT balance
  const { data: balance, isError: balanceError } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: nftAbi,
    functionName: "balanceOf",
    args: [address!],
    query: {
      enabled: !!address,
    },
  });

  // Fetch all owned token IDs when balance changes
  useEffect(() => {
    const fetchOwnedTokenIds = async () => {
      if (!balance || !address || !publicClient) {
        console.log("Missing requirements:", {
          balance,
          address,
          publicClient,
        });
        setIsLoading(false);
        return;
      }

      console.log("Fetching token IDs for address:", address);
      console.log("NFT Balance:", balance.toString());

      try {
        setIsLoading(true);
        const tokenIds: number[] = [];

        for (let i = 0; i < Number(balance); i++) {
          const result = await publicClient.readContract({
            address: CONTRACT_ADDRESS,
            abi: nftAbi,
            functionName: "tokenOfOwnerByIndex",
            args: [address, BigInt(i)],
          });

          console.log(`Token ID at index ${i}:`, result);
          tokenIds.push(Number(result));
        }

        console.log("All fetched token IDs:", tokenIds);
        setOwnedTokenIds(tokenIds);
      } catch (err) {
        console.error("Error fetching token IDs:", err);
        setError("Failed to load your NFTs. Please try refreshing the page.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchOwnedTokenIds();
  }, [balance, address, publicClient]);

  // Get NFT traits from the contract
  const { data: nftTraits } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: nftAbi,
    functionName: "getNFTTraits",
    args: [BigInt(selectedTokenId || 0)],
    query: {
      enabled: selectedTokenId !== null,
    },
  });

  // Create agent from actual NFT traits
  const agent1: Agent | null =
    nftTraits && selectedTokenId !== null
      ? createAgent(selectedTokenId, nftTraits)
      : null;

  const { data: opponentTraits } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: nftAbi,
    functionName: "getNFTTraits",
    args: [BigInt(selectedOpponentId || 0)],
    query: {
      enabled: selectedOpponentId !== null,
    },
  });

  const agent2: Agent | null =
    opponentTraits && selectedOpponentId !== null
      ? createAgent(selectedOpponentId, opponentTraits)
      : null;

  // Debug logging
  console.log("Selected Token:", selectedTokenId);
  console.log("NFT Traits from contract:", nftTraits);
  console.log("Created Agent:", agent1);
  if (agent1) {
    console.log("Agent Traits:", agent1.traits);
    console.log("Agent Stats:", agent1.stats);
    console.log("Agent Special Moves:", agent1.specialMoves);
    console.log("All Special Moves:", Object.keys(SPECIAL_MOVES));
  }

  const startBattle = () => {
    if (!apiKey) {
      setShowApiKeyInput(true);
      return;
    }
    setShowBattle(true);
  };

  if (!isConnected) {
    return (
      <div className="text-center py-8">
        <p className="text-xl">
          Please connect your wallet to view your NFT agents.
        </p>
      </div>
    );
  }

  if (balanceError) {
    return (
      <div className="text-center py-8">
        <h2 className="text-2xl font-bold text-red-500">Error Loading NFTs</h2>
        <p className="mt-4 text-gray-400">
          There was an error loading your NFTs. Please check your wallet
          connection and try again.
        </p>
      </div>
    );
  }

  if (showBattle && agent1 && agent2) {
    return <BattleArena agent1={agent1} agent2={agent2} apiKey={apiKey} />;
  }

  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold mb-6">Your NFT Agents</h2>

      {error && (
        <div className="bg-red-900/50 text-red-200 p-4 rounded-lg mb-6">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto"></div>
          <p className="mt-4 text-gray-400">Loading your NFTs...</p>
        </div>
      ) : (
        <>
          {/* Token Selection */}
          {ownedTokenIds.length > 0 ? (
            <div className="flex gap-4 mb-8 overflow-x-auto pb-4">
              {ownedTokenIds.map((tokenId) => (
                <button
                  key={tokenId}
                  onClick={() => setSelectedTokenId(tokenId)}
                  className={`px-4 py-2 rounded-lg transition-all ${
                    selectedTokenId === tokenId
                      ? "bg-purple-600 text-white"
                      : "bg-purple-200 text-purple-800 hover:bg-purple-300"
                  }`}
                >
                  NFT #{tokenId}
                </button>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-400">No NFTs found in your wallet.</p>
            </div>
          )}

          {/* Agent Display */}
          {agent1 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Left Column: Traits and Stats */}
              <div className="space-y-6">
                {/* Traits Section */}
                <div className="bg-purple-900/20 p-4 rounded-lg">
                  <h3 className="text-xl font-semibold mb-4">Traits</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {Object.entries(agent1.traits).map(([trait, value]) => (
                      <div key={trait} className="flex justify-between">
                        <span className="capitalize text-purple-200">
                          {trait}:
                        </span>
                        <span className="text-white">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Base Stats Section */}
                <div className="bg-blue-900/20 p-4 rounded-lg">
                  <h3 className="text-xl font-semibold mb-4">Base Stats</h3>
                  <div className="space-y-3">
                    {Object.entries(agent1.stats).map(([stat, value]) => (
                      <div key={stat} className="space-y-1">
                        <div className="flex justify-between">
                          <span className="capitalize text-blue-200">
                            {stat}:
                          </span>
                          <span className="text-white">{value}/30</span>
                        </div>
                        <StatBar
                          value={value}
                          maxValue={30}
                          color="bg-blue-500"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Column: Skills and Special Moves */}
              <div className="space-y-6">
                {/* Combat Skills Section */}
                <div className="bg-green-900/20 p-4 rounded-lg">
                  <h3 className="text-xl font-semibold mb-4">Combat Skills</h3>
                  <div className="space-y-3">
                    {Object.entries(agent1.skills).map(([skill, value]) => (
                      <div key={skill} className="space-y-1">
                        <div className="flex justify-between">
                          <span className="capitalize text-green-200">
                            {skill}:
                          </span>
                          <span className="text-white">{value}/25</span>
                        </div>
                        <StatBar
                          value={value}
                          maxValue={25}
                          color="bg-green-500"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Enhanced Special Moves Section */}
                <div className="bg-gray-900/50 p-4 rounded-lg">
                  <h3 className="text-xl font-semibold mb-4">Special Moves</h3>
                  {agent1.specialMoves && agent1.specialMoves.length > 0 ? (
                    <div className="grid gap-4">
                      {agent1.specialMoves.map((moveName) => {
                        console.log("Rendering move:", moveName);
                        return <MoveCard key={moveName} moveName={moveName} />;
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-8 bg-gray-800/50 rounded-lg">
                      <p className="text-gray-400 mb-2">
                        No special moves unlocked yet
                      </p>
                      <p className="text-sm text-gray-500">
                        Your NFT traits determine which moves you can unlock!
                      </p>
                      <p className="text-sm text-gray-500 mt-2">
                        Current traits:{" "}
                        {Object.entries(agent1.traits)
                          .map(([key, value]) => `${key}: ${value}`)
                          .join(", ")}
                      </p>
                    </div>
                  )}
                </div>

                {/* Battle Section */}
                <div className="bg-gray-900/50 p-4 rounded-lg">
                  <h3 className="text-xl font-bold mb-4">Battle</h3>

                  {/* Opponent Selection */}
                  <div className="mb-4">
                    <h4 className="text-lg mb-2">Select Opponent</h4>
                    <div className="flex gap-2 overflow-x-auto pb-2">
                      {ownedTokenIds
                        .filter((id) => id !== selectedTokenId)
                        .map((tokenId) => (
                          <button
                            key={tokenId}
                            onClick={() => setSelectedOpponentId(tokenId)}
                            className={`px-3 py-1 rounded-lg transition-all ${
                              selectedOpponentId === tokenId
                                ? "bg-red-600 text-white"
                                : "bg-red-200 text-red-800 hover:bg-red-300"
                            }`}
                          >
                            NFT #{tokenId}
                          </button>
                        ))}
                    </div>
                  </div>

                  {/* Battle Button */}
                  {selectedOpponentId !== null && (
                    <button
                      onClick={startBattle}
                      className="w-full py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-all"
                    >
                      Start Battle
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* API Key Modal */}
      {showApiKeyInput && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
          <div className="bg-gray-800 p-6 rounded-lg w-96">
            <h3 className="text-xl font-bold mb-4">Enter OpenAI API Key</h3>
            <p className="text-sm text-gray-400 mb-4">
              Your API key is required for the AI battle system. It will only be
              used locally and never stored.
            </p>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="sk-..."
              className="w-full p-2 mb-4 bg-gray-700 rounded-lg"
            />
            <div className="flex gap-4">
              <button
                onClick={() => setShowApiKeyInput(false)}
                className="flex-1 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowApiKeyInput(false);
                  setShowBattle(true);
                }}
                disabled={!apiKey.startsWith("sk-")}
                className="flex-1 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg disabled:bg-gray-600 disabled:cursor-not-allowed"
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
