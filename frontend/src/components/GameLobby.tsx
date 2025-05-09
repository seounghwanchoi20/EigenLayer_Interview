import { useState, useEffect } from "react";
import { useAccount, useContractRead, usePublicClient } from "wagmi";
import { motion } from "framer-motion";
import { matchmaking } from "../services/matchmaking";
import type { Player } from "../services/matchmaking";
import { createAgent } from "../systems/agent/traitParser";
import { ARENA_FIGHTER_ADDRESS } from "../config/contracts";
import { BattleArena } from "../components/BattleArena";
import type { Agent } from "../systems/agent/types";

const abi = [
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
    inputs: [{ name: "owner", type: "address" }],
    name: "balanceOf",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "tokenId", type: "uint256" }],
    name: "ownerOf",
    outputs: [{ name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

export function GameLobby() {
  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient();
  const [selectedNFT, setSelectedNFT] = useState<number | null>(null);
  const [waitingRoomPlayers, setWaitingRoomPlayers] = useState<Player[]>([]);
  const [isInWaitingRoom, setIsInWaitingRoom] = useState(false);
  const [isEntering, setIsEntering] = useState(false);
  const [ownedTokenIds, setOwnedTokenIds] = useState<number[]>([]);
  const [challengedBy, setChallengedBy] = useState<{
    address: string;
    agent: any;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [battleState, setBattleState] = useState<{
    opponent: any;
    myAgent: any;
    battleId: string;
  } | null>(null);

  // Get user's NFT balance
  const { data: balance, isError: balanceError } = useContractRead({
    address: ARENA_FIGHTER_ADDRESS,
    abi,
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

      try {
        setIsLoading(true);
        console.log("Fetching NFTs for address:", address);
        console.log("NFT Balance:", balance.toString());

        const tokenIds: number[] = [];
        const totalSupply = 1000; // From MAX_SUPPLY in contract

        // Check ownership of each token ID
        for (let i = 0; i < totalSupply; i++) {
          try {
            const owner = await publicClient.readContract({
              address: ARENA_FIGHTER_ADDRESS,
              abi,
              functionName: "ownerOf",
              args: [BigInt(i)],
            });

            if (owner.toLowerCase() === address.toLowerCase()) {
              console.log(`Found owned NFT #${i}`);
              tokenIds.push(i);

              // Break if we've found all NFTs for this address
              if (tokenIds.length >= Number(balance)) {
                break;
              }
            }
          } catch (err) {
            // Skip non-existent tokens
            continue;
          }
        }

        console.log("Found token IDs:", tokenIds);
        setOwnedTokenIds(tokenIds);
        setError(null);
      } catch (err) {
        console.error("Error fetching NFTs:", err);
        setError("Failed to load your NFTs. Please try refreshing the page.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchOwnedTokenIds();
  }, [balance, address, publicClient]);

  // Get NFT traits when one is selected
  const { data: traits } = useContractRead({
    address: ARENA_FIGHTER_ADDRESS,
    abi,
    functionName: "getNFTTraits",
    args: selectedNFT !== null ? [BigInt(selectedNFT)] : undefined,
    query: {
      enabled: selectedNFT !== null,
    },
  });

  useEffect(() => {
    if (!isConnected) return;

    matchmaking.on("connected", () => {
      console.log("Connected to matchmaking server");
      setError(null);
    });

    matchmaking.on("disconnected", () => {
      setError("Disconnected from server. Attempting to reconnect...");
      setIsInWaitingRoom(false);
    });

    matchmaking.on("player_list", (players: Player[]) => {
      console.log("Received player list:", players);
      setWaitingRoomPlayers(players);
    });

    matchmaking.on("challenge_received", (challenger: any) => {
      console.log("Received challenge from:", challenger);
      setChallengedBy(challenger);
    });

    matchmaking.on("battle_created", (data: any) => {
      console.log("Battle created with data:", data);
      if (!selectedNFT || !traits || !address) {
        console.error("Missing required data for battle", {
          selectedNFT,
          traits,
          address,
        });
        return;
      }

      // Only transition if we're not already in a battle
      if (!battleState) {
        // Create agent with address
        const myAgent = createAgent(selectedNFT, traits, address);
        console.log("Created my agent:", myAgent);
        setBattleState({
          opponent: data.opponent,
          myAgent,
          battleId: data.battleId,
        });
        setIsInWaitingRoom(false);
      }
    });

    matchmaking.on("battle_start", (data: any) => {
      console.log("Battle starting with data:", data);
      if (!selectedNFT || !traits || !address) {
        console.error("Missing required data for battle", {
          selectedNFT,
          traits,
          address,
        });
        return;
      }

      // Only transition if we're not already in a battle
      if (!battleState) {
        // Create agent with address
        const myAgent = createAgent(selectedNFT, traits, address);
        console.log("Created my agent:", myAgent);
        setBattleState({
          opponent: data.opponent,
          myAgent,
          battleId: data.battleId,
        });
        setIsInWaitingRoom(false);
      }
    });

    return () => {
      matchmaking.removeListener("connected", () => {});
      matchmaking.removeListener("disconnected", () => {});
      matchmaking.removeListener("player_list", () => {});
      matchmaking.removeListener("challenge_received", () => {});
      matchmaking.removeListener("battle_created", () => {});
      matchmaking.removeListener("battle_start", () => {});
      if (isInWaitingRoom) {
        matchmaking.leaveWaitingRoom();
      }
    };
  }, [isConnected, selectedNFT, traits]);

  const enterWaitingRoom = async () => {
    try {
      setIsEntering(true);
      console.log("Attempting to enter waiting room...");
      console.log("Selected NFT:", selectedNFT);
      console.log("NFT Traits:", traits);

      if (!selectedNFT) {
        setError("Please select an NFT first");
        return;
      }

      if (!traits) {
        setError("Failed to load NFT traits");
        return;
      }

      if (!address) {
        setError("Wallet not connected");
        return;
      }

      console.log("Creating agent with traits:", traits);
      const agent = createAgent(selectedNFT, traits, address);
      console.log("Created agent:", agent);

      const player: Player = {
        address: address,
        agent,
        status: "waiting",
        timestamp: Date.now(),
      };

      console.log("Joining waiting room with player:", player);
      await matchmaking.joinWaitingRoom(player);
      setIsInWaitingRoom(true);
      setError(null);
    } catch (err) {
      console.error("Error entering waiting room:", err);
      setError("Failed to enter waiting room. Please try again.");
    } finally {
      setIsEntering(false);
    }
  };

  const leaveWaitingRoom = () => {
    matchmaking.leaveWaitingRoom();
    setIsInWaitingRoom(false);
  };

  const challengePlayer = (opponentAddress: string) => {
    matchmaking.challengePlayer(opponentAddress);
  };

  const acceptChallenge = () => {
    if (challengedBy) {
      matchmaking.acceptChallenge(challengedBy.address);
      setChallengedBy(null);
    }
  };

  const declineChallenge = () => {
    if (challengedBy) {
      matchmaking.declineChallenge(challengedBy.address);
      setChallengedBy(null);
    }
  };

  if (battleState) {
    console.log("Transitioning to battle with state:", battleState);
    return (
      <BattleArena
        agent1={battleState.myAgent}
        agent2={battleState.opponent.agent}
        apiKey=""
        battleId={battleState.battleId}
      />
    );
  }

  if (!isConnected) {
    return (
      <div className="text-center py-8">
        <h2 className="text-2xl font-bold">Connect Your Wallet</h2>
        <p className="mt-4 text-gray-400">
          Please connect your wallet to access the game.
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

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {error && (
          <div className="bg-red-900/50 text-red-200 p-4 rounded-lg mb-6">
            {error}
          </div>
        )}

        {!isInWaitingRoom ? (
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-2xl font-bold mb-6">Select Your Fighter</h2>

            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto"></div>
                <p className="mt-4 text-gray-400">Loading your NFTs...</p>
              </div>
            ) : ownedTokenIds.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                {ownedTokenIds.map((tokenId) => (
                  <motion.button
                    key={tokenId}
                    whileHover={{ scale: 1.05 }}
                    onClick={() => setSelectedNFT(tokenId)}
                    className={`p-4 rounded-lg transition-all ${
                      selectedNFT === tokenId
                        ? "bg-purple-600"
                        : "bg-gray-700 hover:bg-gray-600"
                    }`}
                  >
                    <h3 className="font-bold">Arena Fighter #{tokenId}</h3>
                  </motion.button>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-400">No NFTs found in your wallet.</p>
              </div>
            )}

            {selectedNFT !== null && traits && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                onClick={enterWaitingRoom}
                disabled={isEntering}
                className={`w-full py-3 rounded-lg font-bold transition-all ${
                  isEntering
                    ? "bg-purple-600/50 cursor-not-allowed"
                    : "bg-purple-600 hover:bg-purple-700"
                }`}
              >
                {isEntering ? (
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
                    Entering...
                  </div>
                ) : (
                  "Enter Waiting Room"
                )}
              </motion.button>
            )}
          </div>
        ) : (
          <div className="bg-gray-800 rounded-lg p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Waiting Room</h2>
              <motion.button
                whileHover={{ scale: 1.05 }}
                onClick={leaveWaitingRoom}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg"
              >
                Leave Room
              </motion.button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {waitingRoomPlayers
                .filter((player) => player.address !== address)
                .map((player) => (
                  <motion.div
                    key={player.address}
                    whileHover={{ scale: 1.02 }}
                    className="bg-gray-700 p-4 rounded-lg"
                  >
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-mono">
                        {player.address.substring(0, 6)}...
                        {player.address.substring(player.address.length - 4)}
                      </span>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        onClick={() => challengePlayer(player.address)}
                        className="px-3 py-1 bg-purple-600 hover:bg-purple-700 rounded-lg text-sm"
                      >
                        Challenge
                      </motion.button>
                    </div>
                    <div className="text-sm text-gray-400">
                      Fighter #{player.agent.id}
                    </div>
                  </motion.div>
                ))}
            </div>

            {challengedBy && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4">
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="bg-gray-800 p-6 rounded-lg max-w-md w-full"
                >
                  <h3 className="text-xl font-bold mb-4">
                    Challenge Received!
                  </h3>
                  <p className="mb-6">
                    {challengedBy.address.substring(0, 6)}...
                    {challengedBy.address.substring(
                      challengedBy.address.length - 4
                    )}{" "}
                    wants to battle with Fighter #{challengedBy.agent.tokenId}
                  </p>
                  <div className="flex gap-4">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      onClick={acceptChallenge}
                      className="flex-1 py-2 bg-green-600 hover:bg-green-700 rounded-lg"
                    >
                      Accept
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      onClick={declineChallenge}
                      className="flex-1 py-2 bg-red-600 hover:bg-red-700 rounded-lg"
                    >
                      Decline
                    </motion.button>
                  </div>
                </motion.div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
