import { useState, useEffect } from "react";
import type { Agent } from "../systems/agent/types";
import type { BattleState, BattleAction } from "../systems/battle/battleEngine";
import { BattleEngine } from "../systems/battle/battleEngine";
import { motion, AnimatePresence } from "framer-motion";

interface BattleArenaProps {
  playerAgent: Agent;
  opponentAgent: Agent;
  onBattleEnd?: (winner: Agent) => void;
}

export function BattleArena({
  playerAgent,
  opponentAgent,
  onBattleEnd,
}: BattleArenaProps) {
  const [battleEngine] = useState(
    () => new BattleEngine(playerAgent, opponentAgent)
  );
  const [battleState, setBattleState] = useState<BattleState>(
    battleEngine.getCurrentState()
  );
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedMove, setSelectedMove] = useState<string>("");

  useEffect(() => {
    if (!battleState.isPlayerTurn && !battleEngine.isBattleOver()) {
      handleAITurn();
    }
  }, [battleState.isPlayerTurn]);

  useEffect(() => {
    if (battleEngine.isBattleOver() && onBattleEnd) {
      const winner = battleEngine.getWinner();
      if (winner) {
        onBattleEnd(winner);
      }
    }
  }, [battleState]);

  const handleAITurn = async () => {
    setIsProcessing(true);
    try {
      const aiAction = await battleEngine.getAIDecision();
      const newState = battleEngine.executeAction(aiAction);
      setBattleState(newState);
    } catch (error) {
      console.error("AI turn error:", error);
    }
    setIsProcessing(false);
  };

  const handlePlayerMove = (moveName: string) => {
    if (
      isProcessing ||
      !battleState.isPlayerTurn ||
      battleEngine.isBattleOver()
    )
      return;

    const action: BattleAction = {
      type: moveName === "Basic Attack" ? "attack" : "special",
      moveName,
      damage: 0, // Will be calculated by battle engine
      description: "Player chosen move",
    };

    const newState = battleEngine.executeAction(action);
    setBattleState(newState);
    setSelectedMove("");
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-6">
      <div className="grid grid-cols-2 gap-8 mb-8">
        {/* Player Stats */}
        <div className="bg-purple-900/30 p-4 rounded-lg">
          <h3 className="text-lg font-bold mb-2">Agent #{playerAgent.id}</h3>
          <div className="mb-4">
            <div className="flex justify-between mb-1">
              <span>Health</span>
              <span>{battleState.playerHealth}/100</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div
                className="bg-green-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${Math.max(0, battleState.playerHealth)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Opponent Stats */}
        <div className="bg-red-900/30 p-4 rounded-lg">
          <h3 className="text-lg font-bold mb-2">Agent #{opponentAgent.id}</h3>
          <div className="mb-4">
            <div className="flex justify-between mb-1">
              <span>Health</span>
              <span>{battleState.opponentHealth}/100</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div
                className="bg-red-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${Math.max(0, battleState.opponentHealth)}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Battle Log */}
      <div className="bg-gray-800/50 p-4 rounded-lg mb-8 h-48 overflow-y-auto">
        <h3 className="text-lg font-bold mb-2">Battle Log</h3>
        <div className="space-y-2">
          {battleState.battleLog.map((log, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-sm"
            >
              {log}
            </motion.div>
          ))}
        </div>
      </div>

      {/* Move Selection */}
      {battleState.isPlayerTurn && !battleEngine.isBattleOver() && (
        <div className="bg-gray-800/50 p-4 rounded-lg">
          <h3 className="text-lg font-bold mb-4">Choose Your Move</h3>
          <div className="grid grid-cols-2 gap-4">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handlePlayerMove("Basic Attack")}
              className={`p-3 rounded-lg ${
                selectedMove === "Basic Attack"
                  ? "bg-purple-600"
                  : "bg-purple-900/50 hover:bg-purple-900/70"
              }`}
              disabled={isProcessing}
            >
              Basic Attack
            </motion.button>
            {playerAgent.skills.specialMoves.map((move) => (
              <motion.button
                key={move}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handlePlayerMove(move)}
                disabled={isProcessing || battleState.skillCooldowns[move] > 0}
                className={`p-3 rounded-lg ${
                  battleState.skillCooldowns[move] > 0
                    ? "bg-gray-700 cursor-not-allowed"
                    : selectedMove === move
                    ? "bg-purple-600"
                    : "bg-purple-900/50 hover:bg-purple-900/70"
                }`}
              >
                {move}
                {battleState.skillCooldowns[move] > 0 && (
                  <span className="ml-2 text-sm">
                    ({battleState.skillCooldowns[move]} turns)
                  </span>
                )}
              </motion.button>
            ))}
          </div>
        </div>
      )}

      {/* Battle Over State */}
      <AnimatePresence>
        {battleEngine.isBattleOver() && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed inset-0 flex items-center justify-center bg-black/50"
          >
            <div className="bg-gray-800 p-8 rounded-lg text-center">
              <h2 className="text-2xl font-bold mb-4">Battle Over!</h2>
              <p className="text-xl mb-4">
                Winner: Agent #{battleEngine.getWinner()?.id}
              </p>
              {onBattleEnd && (
                <button
                  onClick={() => onBattleEnd(battleEngine.getWinner()!)}
                  className="bg-purple-600 px-6 py-2 rounded-lg hover:bg-purple-700"
                >
                  Continue
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
