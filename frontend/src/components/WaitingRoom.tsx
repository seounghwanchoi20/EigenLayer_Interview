import { useEffect, useState, useRef } from "react";
import { matchmaking, type Player } from "../services/matchmaking";
import { motion, AnimatePresence } from "framer-motion";

interface WaitingRoomProps {
  currentPlayer: Player;
  onMatchFound: (opponent: Player) => void;
}

export function WaitingRoom({ currentPlayer, onMatchFound }: WaitingRoomProps) {
  const [players, setPlayers] = useState<Player[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [challengedBy, setChallengedBy] = useState<{
    address: string;
    agent: any;
  } | null>(null);
  const [challengingSent, setChallengingSent] = useState<string | null>(null);
  const isUnmounting = useRef(false);

  useEffect(() => {
    // Set up event listeners
    matchmaking.on("connected", () => {
      console.log("Connected to matchmaking server");
      setIsConnected(true);
      setError(null);
      // Join the waiting room when connected
      matchmaking.joinWaitingRoom(currentPlayer);
    });

    matchmaking.on("disconnected", () => {
      console.log("Disconnected from matchmaking server");
      setIsConnected(false);
      setError("Disconnected from server. Attempting to reconnect...");
    });

    matchmaking.on("connection_failed", () => {
      setError("Failed to connect to server after multiple attempts.");
    });

    matchmaking.on("player_list", (playerList: Player[]) => {
      console.log("Received player list:", playerList);
      setPlayers(playerList);
    });

    matchmaking.on(
      "challenge_received",
      (challenger: { address: string; agent: any }) => {
        console.log("Received challenge from:", challenger);
        setChallengedBy(challenger);
      }
    );

    matchmaking.on("challenge_declined", (opponentAddress: string) => {
      console.log("Challenge declined by:", opponentAddress);
      setChallengingSent(null);
      setError(`Challenge declined by ${opponentAddress.substring(0, 6)}...`);
      setTimeout(() => setError(null), 3000);
    });

    matchmaking.on("battle_start", (opponent: Player) => {
      console.log("Battle starting with opponent:", opponent);
      onMatchFound(opponent);
    });

    // Clean up
    return () => {
      isUnmounting.current = true;
      matchmaking.removeAllListeners();
      if (isConnected) {
        matchmaking.leaveWaitingRoom();
      }
    };
  }, [currentPlayer, onMatchFound, isConnected]);

  const handleChallengePlayer = (opponentAddress: string) => {
    matchmaking.challengePlayer(opponentAddress);
    setChallengingSent(opponentAddress);
  };

  const handleAcceptChallenge = () => {
    if (challengedBy) {
      matchmaking.acceptChallenge(challengedBy.address, currentPlayer.address);
      setChallengedBy(null);
    }
  };

  const handleDeclineChallenge = () => {
    if (challengedBy) {
      matchmaking.declineChallenge(challengedBy.address, currentPlayer.address);
      setChallengedBy(null);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-gray-800 rounded-lg shadow-xl p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Waiting Room</h2>
          <div className="flex items-center">
            <div
              className={`w-3 h-3 rounded-full mr-2 ${
                isConnected ? "bg-green-500" : "bg-red-500"
              }`}
            />
            <span className="text-sm">
              {isConnected ? "Connected" : "Disconnected"}
            </span>
          </div>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500 rounded-lg p-4 mb-6">
            <p className="text-red-500">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {players
            .filter((player) => player.status === "waiting")
            .map((player) => (
              <motion.div
                key={player.address}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-gray-700 rounded-lg p-4"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-medium">
                      {player.address.substring(0, 6)}...
                      {player.address.substring(player.address.length - 4)}
                    </h3>
                    <p className="text-sm text-gray-400">
                      Agent #{player.agent.id}
                    </p>
                  </div>
                  <span
                    className={`px-2 py-1 rounded text-xs ${
                      player.status === "waiting"
                        ? "bg-yellow-500/20 text-yellow-500"
                        : player.status === "ready"
                        ? "bg-green-500/20 text-green-500"
                        : "bg-blue-500/20 text-blue-500"
                    }`}
                  >
                    {player.status}
                  </span>
                </div>

                {player.address !== currentPlayer.address && (
                  <button
                    onClick={() => handleChallengePlayer(player.address)}
                    disabled={challengingSent !== null}
                    className={`w-full py-2 rounded ${
                      challengingSent === player.address
                        ? "bg-purple-500/50 cursor-not-allowed"
                        : "bg-purple-500 hover:bg-purple-600"
                    } transition-colors`}
                  >
                    {challengingSent === player.address
                      ? "Challenge Sent"
                      : "Challenge"}
                  </button>
                )}
              </motion.div>
            ))}
        </div>

        {/* Challenge Modal */}
        <AnimatePresence>
          {challengedBy && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 flex items-center justify-center"
            >
              <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
                <h3 className="text-xl font-bold mb-4">Challenge Received!</h3>
                <p className="mb-4">
                  {challengedBy.address.substring(0, 6)}...
                  {challengedBy.address.substring(
                    challengedBy.address.length - 4
                  )}{" "}
                  wants to battle with you!
                </p>
                <div className="flex gap-4">
                  <button
                    onClick={handleAcceptChallenge}
                    className="flex-1 py-2 bg-green-500 hover:bg-green-600 rounded"
                  >
                    Accept
                  </button>
                  <button
                    onClick={handleDeclineChallenge}
                    className="flex-1 py-2 bg-red-500 hover:bg-red-600 rounded"
                  >
                    Decline
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
