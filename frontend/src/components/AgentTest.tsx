import { useAccount, useReadContract } from "wagmi";
import { useState } from "react";
import { createAgent } from "../systems/agent/traitParser";
import { SPECIAL_MOVES, type MoveType } from "../systems/agent/specialMoves";
import type { Agent } from "../systems/agent/types";

const CONTRACT_ADDRESS = "0xE835d7E3674fF39699C0843cc0A68cdB873D8529";

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
  const [selectedTokenId, setSelectedTokenId] = useState<number | null>(null);

  // Get user's NFT balance
  const { data: balance } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: nftAbi,
    functionName: "balanceOf",
    args: [address!],
    query: {
      enabled: !!address,
    },
  });

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
  const agent: Agent | null =
    nftTraits && selectedTokenId !== null
      ? createAgent(selectedTokenId, nftTraits)
      : null;

  // Debug logging
  console.log("Selected Token:", selectedTokenId);
  console.log("NFT Traits from contract:", nftTraits);
  console.log("Created Agent:", agent);
  if (agent) {
    console.log("Agent Traits:", agent.traits);
    console.log("Agent Stats:", agent.stats);
    console.log("Agent Special Moves:", agent.specialMoves);
    console.log("All Special Moves:", Object.keys(SPECIAL_MOVES));
  }

  if (!isConnected) {
    return (
      <div className="text-center py-8">
        <p className="text-xl">
          Please connect your wallet to view your NFT agents.
        </p>
      </div>
    );
  }

  // For testing, create an array of token IDs based on the balance
  const tokenIds = balance
    ? Array.from({ length: Number(balance) }, (_, i) => i)
    : [];

  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold mb-6">Your NFT Agents</h2>

      {/* Token Selection */}
      <div className="flex gap-4 mb-8 overflow-x-auto pb-4">
        {tokenIds.map((tokenId) => (
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

      {/* Agent Display */}
      {agent && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Left Column: Traits and Stats */}
          <div className="space-y-6">
            {/* Traits Section */}
            <div className="bg-purple-900/20 p-4 rounded-lg">
              <h3 className="text-xl font-semibold mb-4">Traits</h3>
              <div className="grid grid-cols-2 gap-4">
                {Object.entries(agent.traits).map(([trait, value]) => (
                  <div key={trait} className="flex justify-between">
                    <span className="capitalize text-purple-200">{trait}:</span>
                    <span className="text-white">{value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Base Stats Section */}
            <div className="bg-blue-900/20 p-4 rounded-lg">
              <h3 className="text-xl font-semibold mb-4">Base Stats</h3>
              <div className="space-y-3">
                {Object.entries(agent.stats).map(([stat, value]) => (
                  <div key={stat} className="space-y-1">
                    <div className="flex justify-between">
                      <span className="capitalize text-blue-200">{stat}:</span>
                      <span className="text-white">{value}/30</span>
                    </div>
                    <StatBar value={value} maxValue={30} color="bg-blue-500" />
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
                {Object.entries(agent.skills).map(([skill, value]) => (
                  <div key={skill} className="space-y-1">
                    <div className="flex justify-between">
                      <span className="capitalize text-green-200">
                        {skill}:
                      </span>
                      <span className="text-white">{value}/25</span>
                    </div>
                    <StatBar value={value} maxValue={25} color="bg-green-500" />
                  </div>
                ))}
              </div>
            </div>

            {/* Enhanced Special Moves Section */}
            <div className="bg-gray-900/50 p-4 rounded-lg">
              <h3 className="text-xl font-semibold mb-4">Special Moves</h3>
              {agent.specialMoves && agent.specialMoves.length > 0 ? (
                <div className="grid gap-4">
                  {agent.specialMoves.map((moveName) => {
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
                    {Object.entries(agent.traits)
                      .map(([key, value]) => `${key}: ${value}`)
                      .join(", ")}
                  </p>
                </div>
              )}
            </div>

            {/* Level and Experience */}
            <div className="bg-purple-900/20 p-4 rounded-lg">
              <h3 className="text-xl font-semibold mb-4">Progress</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-purple-200">Level {agent.level}</span>
                  <span className="text-white">{agent.experience}/100 XP</span>
                </div>
                <StatBar
                  value={agent.experience}
                  maxValue={100}
                  color="bg-purple-500"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
