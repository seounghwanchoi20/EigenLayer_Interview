import { useState, useEffect } from "react";
import {
  useWriteContract,
  useWatchContractEvent,
  useTransaction,
  useContractRead,
} from "wagmi";
import { ARENA_FIGHTER_ADDRESS } from "../config/contracts";
import { motion } from "framer-motion";
import { createAgent } from "../systems/agent/traitParser";
import type { Agent, Trait } from "../systems/agent/types";

const abi = [
  {
    inputs: [],
    name: "mintNFT",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "tokenId", type: "uint256" }],
    name: "getNFTTraits",
    outputs: [
      {
        components: [
          { internalType: "string", name: "background", type: "string" },
          { internalType: "string", name: "skin", type: "string" },
          { internalType: "string", name: "eyes", type: "string" },
          { internalType: "string", name: "mouth", type: "string" },
          { internalType: "string", name: "headwear", type: "string" },
          { internalType: "string", name: "clothes", type: "string" },
          { internalType: "string", name: "accessory", type: "string" },
          { internalType: "string", name: "special", type: "string" },
          { internalType: "string", name: "mood", type: "string" },
          { internalType: "string", name: "weather", type: "string" },
        ],
        internalType: "struct ArenaFighter.NFTTraits",
        name: "",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "uint256",
        name: "tokenId",
        type: "uint256",
      },
      {
        indexed: true,
        internalType: "address",
        name: "owner",
        type: "address",
      },
    ],
    name: "NFTMinted",
    type: "event",
  },
] as const;

interface MintNFTProps {
  onMintSuccess?: () => void;
}

const StatBar = ({
  value,
  maxValue,
  color,
}: {
  value: number;
  maxValue: number;
  color: string;
}) => (
  <div className="w-full bg-gray-700 rounded-full h-2">
    <div
      className={`${color} h-2 rounded-full transition-all duration-500`}
      style={{ width: `${(value / maxValue) * 100}%` }}
    />
  </div>
);

export function MintNFT({ onMintSuccess }: MintNFTProps) {
  const [isMinting, setIsMinting] = useState(false);
  const [mintedTokenId, setMintedTokenId] = useState<number | null>(null);
  const [agent, setAgent] = useState<Agent | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { writeContract, data: hash } = useWriteContract();

  const {
    isLoading: isConfirming,
    isSuccess,
    isError: txError,
  } = useTransaction({
    hash: hash,
  });

  // Get NFT traits after minting
  const {
    data: traits,
    isError: traitError,
    error: traitErrorDetails,
  } = useContractRead({
    address: ARENA_FIGHTER_ADDRESS,
    abi,
    functionName: "getNFTTraits",
    args: mintedTokenId !== null ? [BigInt(mintedTokenId)] : undefined,
    query: {
      enabled: mintedTokenId !== null,
    },
  });

  // Reset error when transaction succeeds
  useEffect(() => {
    if (isSuccess) {
      setError(null);
    }
  }, [isSuccess]);

  // Create agent when traits are available
  useEffect(() => {
    console.log("Effect triggered with:", {
      mintedTokenId,
      traits,
      isSuccess,
      txError,
    });
    if (traitError) {
      console.error("Error fetching traits:", traitErrorDetails);
      setError("Failed to fetch NFT traits. Please try again.");
    }
    if (mintedTokenId !== null && traits) {
      console.log("Creating agent with traits:", traits);
      try {
        // Convert traits to the expected format
        const traitsArray = Object.values(traits);
        console.log("Traits array:", traitsArray);
        const formattedTraits: Trait = {
          background: String(traitsArray[0] || ""),
          skin: String(traitsArray[1] || ""),
          eyes: String(traitsArray[2] || ""),
          mouth: String(traitsArray[3] || ""),
          headwear: String(traitsArray[4] || ""),
          clothes: String(traitsArray[5] || ""),
          accessory: String(traitsArray[6] || ""),
          special: String(traitsArray[7] || ""),
          mood: String(traitsArray[8] || ""),
          weather: String(traitsArray[9] || ""),
        };
        console.log("Formatted traits:", formattedTraits);
        const newAgent = createAgent(mintedTokenId, formattedTraits);
        console.log("Created agent:", newAgent);
        setAgent(newAgent);
        onMintSuccess?.();
      } catch (error) {
        console.error("Error creating agent:", error);
        setError("Failed to create agent. Please try again.");
      }
    }
  }, [
    mintedTokenId,
    traits,
    onMintSuccess,
    traitError,
    traitErrorDetails,
    isSuccess,
    txError,
  ]);

  // Watch for the NFTMinted event
  useWatchContractEvent({
    address: ARENA_FIGHTER_ADDRESS,
    abi,
    eventName: "NFTMinted",
    onLogs(logs) {
      console.log("NFTMinted event logs:", logs);
      if (logs && logs[0] && logs[0].args) {
        const tokenId = Number(logs[0].args.tokenId);
        console.log("NFT Minted event received. Token ID:", tokenId);
        setMintedTokenId(tokenId);
      } else {
        console.error("Invalid NFTMinted event logs:", logs);
        setError(
          "Failed to process minting event. Please check your transaction on the explorer."
        );
      }
    },
  });

  const handleMint = async () => {
    setIsMinting(true);
    setError(null);
    try {
      console.log("Starting mint process...");
      const result = await writeContract({
        address: ARENA_FIGHTER_ADDRESS,
        abi,
        functionName: "mintNFT",
      });
      console.log("Mint transaction submitted:", result);
    } catch (error) {
      console.error("Error minting NFT:", error);
      setError("Failed to mint NFT. Please try again.");
    }
    setIsMinting(false);
  };

  return (
    <div className="text-center py-10">
      <h2 className="text-3xl font-bold mb-6">Welcome to Arena Fighter</h2>
      <p className="text-lg text-gray-300 mb-8">
        Mint your unique fighter NFT to enter the arena and battle other
        players!
      </p>

      {error && (
        <div className="max-w-md mx-auto mb-6 bg-red-900/50 text-red-200 p-4 rounded-lg">
          {error}
        </div>
      )}

      {!isSuccess ? (
        <div className="max-w-md mx-auto bg-gray-800 rounded-lg p-6 shadow-lg">
          <h3 className="text-xl font-semibold mb-4">Mint Your Fighter</h3>
          <p className="text-gray-400 mb-6">
            Each fighter is unique with randomly generated traits, stats, and
            special abilities.
          </p>

          {isConfirming && (
            <div className="mb-4 text-yellow-400">
              Confirming transaction... Please wait.
            </div>
          )}

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleMint}
            disabled={isMinting || isConfirming}
            className={`w-full py-3 px-6 rounded-lg font-bold text-lg transition-all
              ${
                isMinting || isConfirming
                  ? "bg-purple-500/50 cursor-not-allowed"
                  : "bg-purple-600 hover:bg-purple-700"
              }`}
          >
            {isMinting || isConfirming ? (
              <div className="flex items-center justify-center">
                <svg
                  className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                {isConfirming ? "Confirming..." : "Minting..."}
              </div>
            ) : (
              "Mint NFT"
            )}
          </motion.button>
        </div>
      ) : agent && traits ? (
        <div className="max-w-4xl mx-auto">
          <div className="bg-gray-800 rounded-lg p-6 shadow-lg">
            <h3 className="text-2xl font-bold mb-6">
              Your Fighter #{mintedTokenId}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Traits Section */}
              <div>
                <h4 className="text-xl font-semibold mb-4 text-purple-400">
                  Traits
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  {Object.entries(traits).map(([trait, value]) => (
                    <div
                      key={trait}
                      className="bg-gray-700/50 p-3 rounded-lg flex justify-between items-center"
                    >
                      <span className="capitalize text-gray-300">{trait}:</span>
                      <span className="text-purple-300">{value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Stats Section */}
              <div>
                <h4 className="text-xl font-semibold mb-4 text-purple-400">
                  Stats
                </h4>
                <div className="space-y-4">
                  {Object.entries(agent.stats).map(([stat, value]) => (
                    <div key={stat}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="capitalize text-gray-300">{stat}</span>
                        <span className="text-purple-300">{value}/30</span>
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

            {/* Skills Section */}
            <div className="mt-8">
              <h4 className="text-xl font-semibold mb-4 text-purple-400">
                Skills
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Object.entries(agent.skills).map(([skill, value]) => (
                  <div key={skill} className="bg-gray-700/50 p-4 rounded-lg">
                    <div className="text-center mb-2">
                      <span className="capitalize text-gray-300">{skill}</span>
                      <div className="text-lg font-bold text-purple-300">
                        {value}/25
                      </div>
                    </div>
                    <StatBar value={value} maxValue={25} color="bg-green-500" />
                  </div>
                ))}
              </div>
            </div>

            {/* Special Moves Section */}
            <div className="mt-8">
              <h4 className="text-xl font-semibold mb-4 text-purple-400">
                Special Moves
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {agent.specialMoves.map((move, index) => (
                  <div
                    key={index}
                    className="bg-gray-700/50 p-4 rounded-lg text-center"
                  >
                    <span className="text-yellow-400">{move}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-8 text-center">
              <motion.button
                whileHover={{ scale: 1.05 }}
                onClick={() => onMintSuccess?.()}
                className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-8 rounded-lg transition-all"
              >
                Enter Arena →
              </motion.button>
            </div>
          </div>
        </div>
      ) : null}

      {!isSuccess && (
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
          <div className="p-4 bg-gray-800 rounded-lg">
            <h4 className="font-semibold mb-2">Unique Traits</h4>
            <p className="text-gray-400">
              Each fighter has 10 unique visual traits
            </p>
          </div>
          <div className="p-4 bg-gray-800 rounded-lg">
            <h4 className="font-semibold mb-2">Battle Stats</h4>
            <p className="text-gray-400">
              Random stats determine your fighting style
            </p>
          </div>
          <div className="p-4 bg-gray-800 rounded-lg">
            <h4 className="font-semibold mb-2">Special Abilities</h4>
            <p className="text-gray-400">
              Discover unique special moves in battle
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
