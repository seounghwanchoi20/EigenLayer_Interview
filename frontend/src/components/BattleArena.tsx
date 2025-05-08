import { useState, useEffect } from "react";
import { BattleAgent } from "../systems/agent/BattleAgent";
import type { Agent } from "../systems/agent/types";
import { motion } from "framer-motion";

interface BattleArenaProps {
  agent1: Agent;
  agent2: Agent;
  apiKey: string;
}

export function BattleArena({ agent1, agent2, apiKey }: BattleArenaProps) {
  const [battleAgent1, setBattleAgent1] = useState<BattleAgent | null>(null);
  const [battleAgent2, setBattleAgent2] = useState<BattleAgent | null>(null);
  const [battleLog, setBattleLog] = useState<string[]>([]);
  const [isSimulating, setIsSimulating] = useState(false);
  const [winner, setWinner] = useState<number | null>(null);

  useEffect(() => {
    const initializeBattle = async () => {
      console.log("Initializing battle with agents:", { agent1, agent2 });
      console.log("Using API key:", apiKey.substring(0, 10) + "...");

      const ba1 = new BattleAgent(agent1);
      const ba2 = new BattleAgent(agent2);

      try {
        console.log("Initializing Agent 1...");
        await ba1.initialize(apiKey);
        console.log("Agent 1 initialized successfully");

        console.log("Initializing Agent 2...");
        await ba2.initialize(apiKey);
        console.log("Agent 2 initialized successfully");

        setBattleAgent1(ba1);
        setBattleAgent2(ba2);
        setBattleLog((prev) => [...prev, "Both agents ready for battle!"]);
      } catch (error) {
        console.error("Error initializing agents:", error);
        setBattleLog((prev) => [
          ...prev,
          "Error initializing agents: " + (error as Error).message,
        ]);
      }
    };

    initializeBattle();
  }, [agent1, agent2, apiKey]);

  const simulateTurn = async () => {
    if (!battleAgent1 || !battleAgent2 || winner !== null) {
      setIsSimulating(false);
      return;
    }

    try {
      // Agent 1's turn
      console.log("Agent 1's turn...");
      const agent1Decision = await battleAgent1.decideMoveAction(
        battleAgent2.getBattleState()
      );
      console.log("Agent 1 decided to use:", agent1Decision);

      const agent1MoveResult = battleAgent1.executeMove(
        agent1Decision,
        battleAgent2
      );
      console.log("Agent 1's move result:", agent1MoveResult);

      if (agent1MoveResult.success && agent1MoveResult.damage) {
        const isDefeated = battleAgent2.takeDamage(agent1MoveResult.damage);
        let battleMessage = `${agent1.id} used ${agent1Decision}! Dealt ${agent1MoveResult.damage} damage.`;

        // Apply and show status effects
        if (agent1MoveResult.effects && agent1MoveResult.effects.length > 0) {
          agent1MoveResult.effects.forEach((effect) => {
            battleAgent2.addStatusEffect(effect);
            battleMessage += ` (${effect.name} applied)`;
          });
        }

        setBattleLog((prev) => [...prev, battleMessage]);

        if (isDefeated || battleAgent2.getBattleState().currentHealth <= 0) {
          setWinner(agent1.id);
          setBattleLog((prev) => [
            ...prev,
            `Agent #${agent1.id} wins the battle!`,
          ]);
          setIsSimulating(false);
          return;
        }
      } else {
        setBattleLog((prev) => [
          ...prev,
          `${agent1.id}'s ${agent1Decision} failed: ${agent1MoveResult.message}`,
        ]);
      }

      // Only proceed with Agent 2's turn if Agent 1 didn't win
      if (!winner) {
        // Agent 2's turn
        console.log("Agent 2's turn...");
        const agent2Decision = await battleAgent2.decideMoveAction(
          battleAgent1.getBattleState()
        );
        console.log("Agent 2 decided to use:", agent2Decision);

        const agent2MoveResult = battleAgent2.executeMove(
          agent2Decision,
          battleAgent1
        );
        console.log("Agent 2's move result:", agent2MoveResult);

        if (agent2MoveResult.success && agent2MoveResult.damage) {
          const isDefeated = battleAgent1.takeDamage(agent2MoveResult.damage);
          let battleMessage = `${agent2.id} used ${agent2Decision}! Dealt ${agent2MoveResult.damage} damage.`;

          // Apply and show status effects
          if (agent2MoveResult.effects && agent2MoveResult.effects.length > 0) {
            agent2MoveResult.effects.forEach((effect) => {
              battleAgent1.addStatusEffect(effect);
              battleMessage += ` (${effect.name} applied)`;
            });
          }

          setBattleLog((prev) => [...prev, battleMessage]);

          if (isDefeated || battleAgent1.getBattleState().currentHealth <= 0) {
            setWinner(agent2.id);
            setBattleLog((prev) => [
              ...prev,
              `Agent #${agent2.id} wins the battle!`,
            ]);
            setIsSimulating(false);
            return;
          }
        } else {
          setBattleLog((prev) => [
            ...prev,
            `${agent2.id}'s ${agent2Decision} failed: ${agent2MoveResult.message}`,
          ]);
        }
      }

      // Update states after turn
      battleAgent1.updateState();
      battleAgent2.updateState();
      console.log("Turn completed. Updated states:", {
        agent1: battleAgent1.getBattleState(),
        agent2: battleAgent2.getBattleState(),
      });
    } catch (error) {
      console.error("Error during battle turn:", error);
      setBattleLog((prev) => [
        ...prev,
        "Error during battle: " + (error as Error).message,
      ]);
      setIsSimulating(false);
    }
  };

  const startBattle = async () => {
    setIsSimulating(true);
    while (!winner && battleAgent1 && battleAgent2) {
      await simulateTurn();
      // Check if either agent's health is at or below 0
      const agent1Health = battleAgent1.getBattleState().currentHealth;
      const agent2Health = battleAgent2.getBattleState().currentHealth;

      if (agent1Health <= 0 || agent2Health <= 0) {
        if (agent1Health <= 0) setWinner(agent2.id);
        if (agent2Health <= 0) setWinner(agent1.id);
        break; // Exit the loop if either agent is defeated
      }

      await new Promise((resolve) => setTimeout(resolve, 2000)); // 2-second delay between turns
    }
    setIsSimulating(false);
  };

  // Helper function to get health percentage safely
  const getHealthPercentage = (agent: BattleAgent) => {
    const health = agent.getBattleState().currentHealth;
    return Math.max(0, Math.min(100, health));
  };

  if (!battleAgent1 || !battleAgent2) {
    return <div className="text-center py-8">Initializing battle...</div>;
  }

  return (
    <div className="container mx-auto p-8">
      <div className="grid grid-cols-2 gap-8 mb-8">
        {/* Agent 1 Stats */}
        <div className="bg-purple-900/20 p-4 rounded-lg">
          <h3 className="text-xl font-bold mb-4">Agent #{agent1.id}</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Health:</span>
              <span>
                {Math.max(0, battleAgent1.getBattleState().currentHealth)}/100
              </span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <motion.div
                className="bg-green-500 h-2 rounded-full"
                initial={{ width: "100%" }}
                animate={{
                  width: `${getHealthPercentage(battleAgent1)}%`,
                }}
              />
            </div>
            <div className="flex justify-between">
              <span>Mana:</span>
              <span>{battleAgent1.getBattleState().currentMana}/50</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <motion.div
                className="bg-blue-500 h-2 rounded-full"
                initial={{ width: "100%" }}
                animate={{
                  width: `${
                    (battleAgent1.getBattleState().currentMana / 50) * 100
                  }%`,
                }}
              />
            </div>
            {/* Status Effects */}
            {battleAgent1.getBattleState().statusEffects.length > 0 && (
              <div className="mt-2">
                <h4 className="text-sm font-semibold mb-1">Status Effects:</h4>
                <div className="flex gap-2">
                  {battleAgent1
                    .getBattleState()
                    .statusEffects.map((effect, index) => (
                      <span
                        key={index}
                        className={`px-2 py-1 rounded text-xs ${
                          effect.name === "Burned"
                            ? "bg-red-500/20 text-red-300"
                            : effect.name === "Stunned"
                            ? "bg-yellow-500/20 text-yellow-300"
                            : "bg-purple-500/20 text-purple-300"
                        }`}
                      >
                        {effect.name} ({effect.duration})
                      </span>
                    ))}
                </div>
              </div>
            )}
            {/* Defense */}
            {battleAgent1.getBattleState().defense > 0 && (
              <div className="mt-2">
                <span className="text-sm text-blue-300">
                  Defense Boost: {battleAgent1.getBattleState().defense}%
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Agent 2 Stats */}
        <div className="bg-purple-900/20 p-4 rounded-lg">
          <h3 className="text-xl font-bold mb-4">Agent #{agent2.id}</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Health:</span>
              <span>
                {Math.max(0, battleAgent2.getBattleState().currentHealth)}/100
              </span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <motion.div
                className="bg-green-500 h-2 rounded-full"
                initial={{ width: "100%" }}
                animate={{
                  width: `${getHealthPercentage(battleAgent2)}%`,
                }}
              />
            </div>
            <div className="flex justify-between">
              <span>Mana:</span>
              <span>{battleAgent2.getBattleState().currentMana}/50</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <motion.div
                className="bg-blue-500 h-2 rounded-full"
                initial={{ width: "100%" }}
                animate={{
                  width: `${
                    (battleAgent2.getBattleState().currentMana / 50) * 100
                  }%`,
                }}
              />
            </div>
            {/* Status Effects */}
            {battleAgent2.getBattleState().statusEffects.length > 0 && (
              <div className="mt-2">
                <h4 className="text-sm font-semibold mb-1">Status Effects:</h4>
                <div className="flex gap-2">
                  {battleAgent2
                    .getBattleState()
                    .statusEffects.map((effect, index) => (
                      <span
                        key={index}
                        className={`px-2 py-1 rounded text-xs ${
                          effect.name === "Burned"
                            ? "bg-red-500/20 text-red-300"
                            : effect.name === "Stunned"
                            ? "bg-yellow-500/20 text-yellow-300"
                            : "bg-purple-500/20 text-purple-300"
                        }`}
                      >
                        {effect.name} ({effect.duration})
                      </span>
                    ))}
                </div>
              </div>
            )}
            {/* Defense */}
            {battleAgent2.getBattleState().defense > 0 && (
              <div className="mt-2">
                <span className="text-sm text-blue-300">
                  Defense Boost: {battleAgent2.getBattleState().defense}%
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Battle Controls */}
      <div className="text-center mb-8">
        {winner === null ? (
          <button
            onClick={startBattle}
            disabled={isSimulating}
            className={`px-6 py-3 rounded-lg ${
              isSimulating
                ? "bg-gray-600 cursor-not-allowed"
                : "bg-purple-600 hover:bg-purple-700"
            }`}
          >
            {isSimulating ? "Battle in Progress..." : "Start Battle"}
          </button>
        ) : (
          <div className="space-y-4">
            <div className="text-2xl font-bold text-purple-400">
              Agent #{winner} Wins!
            </div>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 rounded-lg bg-purple-600 hover:bg-purple-700"
            >
              Start New Battle
            </button>
          </div>
        )}
      </div>

      {/* Battle Log */}
      <div className="bg-gray-900/50 p-4 rounded-lg max-h-96 overflow-y-auto">
        <h3 className="text-xl font-bold mb-4">Battle Log</h3>
        <div className="space-y-2">
          {battleLog.map((log, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`text-gray-300 ${
                log.includes("wins") ? "text-purple-400 font-bold" : ""
              }`}
            >
              {log}
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
