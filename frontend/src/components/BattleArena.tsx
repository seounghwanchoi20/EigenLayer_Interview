import { useState, useEffect } from "react";
import { BattleAgent } from "../systems/agent/BattleAgent";
import type { Agent } from "../systems/agent/types";
import { motion, AnimatePresence } from "framer-motion";
import { SPECIAL_MOVES } from "../systems/agent/specialMoves";
import "../styles/battle.css";

// Animation components
interface AttackEffectProps {
  type: "Physical" | "Magical" | "Support" | "Ultimate";
  isVisible: boolean;
  position: "left" | "right";
}

const AttackEffect = ({ type, isVisible, position }: AttackEffectProps) => {
  const variants = {
    hidden: {
      opacity: 0,
      scale: 0,
      x: position === "left" ? -100 : 100,
    },
    visible: {
      opacity: 1,
      scale: 1,
      x: 0,
      transition: { duration: 0.3 },
    },
    exit: {
      opacity: 0,
      scale: 2,
      transition: { duration: 0.2 },
    },
  };

  const getEffectStyle = () => {
    switch (type) {
      case "Physical":
        return "bg-red-500/30 border-red-500";
      case "Magical":
        return "bg-blue-500/30 border-blue-500";
      case "Support":
        return "bg-green-500/30 border-green-500";
      case "Ultimate":
        return "bg-purple-500/30 border-purple-500";
      default:
        return "bg-white/30 border-white";
    }
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          variants={variants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className={`absolute top-1/2 -translate-y-1/2 ${
            position === "left" ? "left-1/4" : "right-1/4"
          } 
                     w-24 h-24 border-2 rounded-full ${getEffectStyle()} 
                     flex items-center justify-center`}
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className={`w-16 h-16 border-2 ${getEffectStyle()} rounded-full`}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
};

interface DamageNumberProps {
  damage: number;
  position: "left" | "right";
  onComplete: () => void;
}

const DamageNumber = ({ damage, position, onComplete }: DamageNumberProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 0, x: position === "left" ? -50 : 50 }}
      animate={{ opacity: 1, y: -50 }}
      exit={{ opacity: 0 }}
      onAnimationComplete={onComplete}
      className="absolute top-1/2 text-2xl font-bold text-red-400"
      style={{
        left: position === "left" ? "25%" : "75%",
        textShadow: "0 0 10px rgba(255, 0, 0, 0.5)",
      }}
    >
      -{damage}
    </motion.div>
  );
};

interface StatusEffectAnimationProps {
  effect: string;
  position: "left" | "right";
  onComplete: () => void;
}

const StatusEffectAnimation = ({
  effect,
  position,
  onComplete,
}: StatusEffectAnimationProps) => {
  const getEffectStyle = () => {
    switch (effect) {
      case "Burned":
        return "text-red-400";
      case "Stunned":
        return "text-yellow-400";
      default:
        return "text-purple-400";
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 0, x: position === "left" ? -50 : 50 }}
      animate={{
        opacity: [0, 1, 1, 0],
        y: -30,
        transition: { duration: 1.5 },
      }}
      onAnimationComplete={onComplete}
      className={`absolute top-1/3 ${getEffectStyle()} font-bold text-lg`}
      style={{ left: position === "left" ? "25%" : "75%" }}
    >
      {effect}!
    </motion.div>
  );
};

interface HealthBarProps {
  currentHealth: number;
  maxHealth: number;
  position: "left" | "right";
}

const HealthBar = ({ currentHealth, maxHealth, position }: HealthBarProps) => {
  const percentage = Math.max(
    0,
    Math.min(100, (currentHealth / maxHealth) * 100)
  );
  const getHealthColor = () => {
    if (percentage > 50) return "bg-green-500";
    if (percentage > 25) return "bg-yellow-500";
    return "bg-red-500";
  };

  return (
    <div
      className={`w-full h-4 bg-gray-300 rounded-full overflow-hidden ${
        position === "left" ? "mr-auto" : "ml-auto"
      }`}
    >
      <motion.div
        initial={{ width: "100%" }}
        animate={{ width: `${percentage}%` }}
        transition={{ type: "spring", damping: 15 }}
        className={`h-full ${getHealthColor()} relative`}
      >
        <div className="absolute inset-0 bg-white/20 rounded-full" />
      </motion.div>
    </div>
  );
};

interface AgentCardProps {
  agent: BattleAgent;
  position: "left" | "right";
  isActive: boolean;
}

const AgentCard = ({ agent, position, isActive }: AgentCardProps) => {
  const battleState = agent.getBattleState();
  const statusEffects = battleState.statusEffects;

  return (
    <motion.div
      animate={{
        scale: isActive ? 1.05 : 1,
        boxShadow: isActive ? "0 0 20px rgba(59, 130, 246, 0.5)" : "none",
      }}
      className={`p-6 rounded-lg bg-gray-800 border-2 ${
        isActive ? "border-blue-500" : "border-gray-700"
      }`}
    >
      <div
        className={`flex flex-col ${
          position === "right" ? "items-end" : "items-start"
        }`}
      >
        <h3 className="text-xl font-bold mb-2 text-white">
          Agent #{(agent as any).agent.id}
        </h3>
        <div className="w-full mb-4">
          <HealthBar
            currentHealth={battleState.currentHealth}
            maxHealth={battleState.maxHealth}
            position={position}
          />
          <div className="text-sm text-gray-300 mt-1">
            {battleState.currentHealth}/{battleState.maxHealth} HP
          </div>
        </div>

        {/* Status Effects */}
        {statusEffects.length > 0 && (
          <div
            className={`flex gap-2 ${
              position === "right" ? "justify-end" : "justify-start"
            }`}
          >
            {statusEffects.map((effect, index) => (
              <motion.div
                key={`${effect.name}-${index}`}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className={`px-2 py-1 rounded text-sm ${
                  effect.name === "Burned"
                    ? "bg-red-500/20 text-red-400"
                    : effect.name === "Stunned"
                    ? "bg-yellow-500/20 text-yellow-400"
                    : "bg-purple-500/20 text-purple-400"
                }`}
              >
                {effect.name}
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
};

// Character sprite component
interface CharacterSpriteProps {
  agent: BattleAgent;
  position: "left" | "right";
  isAttacking: boolean;
  isHit: boolean;
}

const CharacterSprite = ({
  agent,
  position,
  isAttacking,
  isHit,
}: CharacterSpriteProps) => {
  // Get traits from agent to determine appearance
  const traits = (agent as any).agent;

  return (
    <motion.div
      animate={{
        x: isAttacking ? (position === "left" ? 50 : -50) : 0,
        scale: isHit ? 0.9 : 1,
        opacity: isHit ? 0.7 : 1,
      }}
      transition={{
        duration: isAttacking ? 0.2 : 0.3,
        type: "spring",
        bounce: isAttacking ? 0 : 0.3,
      }}
      className={`relative ${
        position === "left" ? "justify-self-end" : "justify-self-start"
      }`}
    >
      {/* Character Base */}
      <div className={`w-48 h-48 relative ${isHit ? "animate-shake" : ""}`}>
        {/* Background trait as aura */}
        <div
          className={`absolute inset-0 rounded-full blur-xl opacity-30 ${
            traits.background === "Red"
              ? "bg-red-500"
              : traits.background === "Blue"
              ? "bg-blue-500"
              : traits.background === "Green"
              ? "bg-green-500"
              : "bg-purple-500"
          }`}
        />

        {/* Character Body */}
        <div
          className={`absolute inset-0 rounded-2xl ${
            traits.skin === "Dark"
              ? "bg-gray-800"
              : traits.skin === "Light"
              ? "bg-amber-200"
              : "bg-gray-400"
          }`}
        >
          {/* Face Features */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            {/* Eyes */}
            <div
              className={`w-16 h-4 mb-2 flex justify-around ${
                traits.eyes === "Angry"
                  ? "-rotate-3"
                  : traits.eyes === "Happy"
                  ? "rotate-3"
                  : ""
              }`}
            >
              <div className="w-4 h-4 rounded-full bg-white">
                <div className="w-2 h-2 rounded-full bg-black m-1" />
              </div>
              <div className="w-4 h-4 rounded-full bg-white">
                <div className="w-2 h-2 rounded-full bg-black m-1" />
              </div>
            </div>

            {/* Mouth */}
            <div
              className={`w-8 h-2 rounded-full ${
                traits.mouth === "Grin"
                  ? "bg-red-400 h-3"
                  : traits.mouth === "Sad"
                  ? "bg-gray-400 -mt-1"
                  : "bg-gray-600"
              }`}
            />
          </div>

          {/* Headwear */}
          {traits.headwear && (
            <div
              className={`absolute -top-4 left-1/2 -translate-x-1/2 w-32 h-16 ${
                traits.headwear === "Horns"
                  ? "bg-red-600 clip-horns"
                  : traits.headwear === "Crown"
                  ? "bg-yellow-400 clip-crown"
                  : "bg-gray-400 rounded-full"
              }`}
            />
          )}

          {/* Clothes */}
          <div
            className={`absolute bottom-0 inset-x-0 h-1/2 rounded-b-2xl ${
              traits.clothes === "Armor"
                ? "bg-gray-600 border-t-4 border-gray-400"
                : traits.clothes === "Robe"
                ? "bg-purple-600"
                : "bg-blue-600"
            }`}
          />

          {/* Special Effects */}
          {traits.special === "Tattoo" && (
            <div className="absolute inset-0 opacity-30 bg-gradient-to-br from-purple-500 to-transparent" />
          )}
        </div>
      </div>

      {/* Status Effects Visual */}
      <AnimatePresence>
        {agent.getBattleState().statusEffects.map((effect, index) => (
          <motion.div
            key={effect.name}
            initial={{ opacity: 0, y: 0 }}
            animate={{ opacity: 1, y: -20 }}
            exit={{ opacity: 0 }}
            className={`absolute -top-8 left-1/2 -translate-x-1/2 ${
              effect.name === "Burned"
                ? "text-red-400"
                : effect.name === "Stunned"
                ? "text-yellow-400"
                : "text-purple-400"
            }`}
            style={{ top: `${-20 - index * 20}px` }}
          >
            {effect.name}
          </motion.div>
        ))}
      </AnimatePresence>
    </motion.div>
  );
};

interface BattleArenaProps {
  agent1: Agent;
  agent2: Agent;
  apiKey: string;
}

const PokemonStyleHealthBar = ({
  currentHealth,
  maxHealth,
  name,
  position,
}: {
  currentHealth: number;
  maxHealth: number;
  name: string;
  position: "left" | "right";
}) => {
  const percentage = Math.max(
    0,
    Math.min(100, (currentHealth / maxHealth) * 100)
  );
  const getHealthColor = () => {
    if (percentage > 50) return "bg-green-500";
    if (percentage > 20) return "bg-yellow-500";
    return "bg-red-500";
  };

  return (
    <div
      className={`pokemon-status-box ${
        position === "right" ? "self-start" : "self-end"
      }`}
    >
      <div className="flex items-center gap-2 mb-1">
        <span className="font-pokemon text-black text-sm">{name}</span>
        <span className="font-pokemon text-black text-sm">Lv.42</span>
      </div>
      <div className="bg-black rounded p-1">
        <div className="bg-[#1c1c1c] p-1 rounded-sm">
          <div className="h-2 bg-[#98d8d8] rounded-sm">
            <motion.div
              initial={{ width: "100%" }}
              animate={{ width: `${percentage}%` }}
              transition={{ type: "spring", damping: 15 }}
              className={`h-full ${getHealthColor()}`}
            />
          </div>
        </div>
        <div className="flex justify-end mt-1">
          <span className="font-pokemon text-white text-xs">
            {currentHealth}/{maxHealth}
          </span>
        </div>
      </div>
    </div>
  );
};

export function BattleArena({ agent1, agent2, apiKey }: BattleArenaProps) {
  const [battleAgent1, setBattleAgent1] = useState<BattleAgent | null>(null);
  const [battleAgent2, setBattleAgent2] = useState<BattleAgent | null>(null);
  const [battleLog, setBattleLog] = useState<string[]>([]);
  const [isSimulating, setIsSimulating] = useState(false);
  const [winner, setWinner] = useState<number | null>(null);
  const [currentAttack, setCurrentAttack] = useState<{
    type: "Physical" | "Magical" | "Support" | "Ultimate";
    position: "left" | "right";
  } | null>(null);
  const [damageNumber, setDamageNumber] = useState<{
    damage: number;
    position: "left" | "right";
  } | null>(null);
  const [statusEffect, setStatusEffect] = useState<{
    effect: string;
    position: "left" | "right";
  } | null>(null);
  const [currentTurn, setCurrentTurn] = useState<1 | 2>(1);
  const [attackingAgent, setAttackingAgent] = useState<1 | 2 | null>(null);
  const [hitAgent, setHitAgent] = useState<1 | 2 | null>(null);
  const [selectedAction, setSelectedAction] = useState<
    "FIGHT" | "BAG" | "POKEMON" | "RUN" | null
  >(null);

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
      setCurrentTurn(1);
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
        // Start attack animation
        setAttackingAgent(1);
        await new Promise((resolve) => setTimeout(resolve, 200));

        // Show attack effect
        const moveType = SPECIAL_MOVES[agent1Decision]?.type || "Physical";
        setCurrentAttack({ type: moveType, position: "left" });
        await new Promise((resolve) => setTimeout(resolve, 300));

        // Show hit animation
        setHitAgent(2);
        setCurrentAttack(null);
        await new Promise((resolve) => setTimeout(resolve, 200));

        const isDefeated = battleAgent2.takeDamage(agent1MoveResult.damage);

        // Show damage number
        setDamageNumber({ damage: agent1MoveResult.damage, position: "right" });
        await new Promise((resolve) => setTimeout(resolve, 800));
        setDamageNumber(null);

        // Reset animations
        setAttackingAgent(null);
        setHitAgent(null);

        let battleMessage = `Agent #${
          (battleAgent1 as any).agent.id
        } used ${agent1Decision}! Dealt ${agent1MoveResult.damage} damage.`;

        // Apply and show status effects
        if (agent1MoveResult.effects && agent1MoveResult.effects.length > 0) {
          for (const effect of agent1MoveResult.effects) {
            battleAgent2.addStatusEffect(effect);
            setStatusEffect({ effect: effect.name, position: "right" });
            await new Promise((resolve) => setTimeout(resolve, 800));
            setStatusEffect(null);
            battleMessage += ` (${effect.name} applied)`;
          }
        }

        setBattleLog((prev) => [...prev, battleMessage]);

        if (isDefeated || battleAgent2.getBattleState().currentHealth <= 0) {
          setWinner((battleAgent1 as any).agent.id);
          setBattleLog((prev) => [
            ...prev,
            `Agent #${(battleAgent1 as any).agent.id} wins the battle!`,
          ]);
          setIsSimulating(false);
          return;
        }
      }

      // Add a small delay between turns
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Agent 2's turn
      setCurrentTurn(2);
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
        // Start attack animation
        setAttackingAgent(2);
        await new Promise((resolve) => setTimeout(resolve, 200));

        // Show attack effect
        const moveType = SPECIAL_MOVES[agent2Decision]?.type || "Physical";
        setCurrentAttack({ type: moveType, position: "right" });
        await new Promise((resolve) => setTimeout(resolve, 300));

        // Show hit animation
        setHitAgent(1);
        setCurrentAttack(null);
        await new Promise((resolve) => setTimeout(resolve, 200));

        const isDefeated = battleAgent1.takeDamage(agent2MoveResult.damage);

        // Show damage number
        setDamageNumber({ damage: agent2MoveResult.damage, position: "left" });
        await new Promise((resolve) => setTimeout(resolve, 800));
        setDamageNumber(null);

        // Reset animations
        setAttackingAgent(null);
        setHitAgent(null);

        let battleMessage = `Agent #${
          (battleAgent2 as any).agent.id
        } used ${agent2Decision}! Dealt ${agent2MoveResult.damage} damage.`;

        // Apply and show status effects
        if (agent2MoveResult.effects && agent2MoveResult.effects.length > 0) {
          for (const effect of agent2MoveResult.effects) {
            battleAgent1.addStatusEffect(effect);
            setStatusEffect({ effect: effect.name, position: "left" });
            await new Promise((resolve) => setTimeout(resolve, 800));
            setStatusEffect(null);
            battleMessage += ` (${effect.name} applied)`;
          }
        }

        setBattleLog((prev) => [...prev, battleMessage]);

        if (isDefeated || battleAgent1.getBattleState().currentHealth <= 0) {
          setWinner((battleAgent2 as any).agent.id);
          setBattleLog((prev) => [
            ...prev,
            `Agent #${(battleAgent2 as any).agent.id} wins the battle!`,
          ]);
          setIsSimulating(false);
          return;
        }
      }

      // Update status effects and cooldowns
      battleAgent1.updateState();
      battleAgent2.updateState();

      // Continue battle
      setTimeout(() => simulateTurn(), 1000);
    } catch (error) {
      console.error("Error during battle simulation:", error);
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
    <div className="fixed inset-0 flex items-center justify-center bg-gray-900">
      <div className="w-full h-full max-h-screen relative bg-gradient-to-b from-sky-400 to-sky-200 overflow-hidden">
        {/* Battle Scene */}
        <div className="relative h-[70vh] mb-4">
          {/* Battle Platforms */}
          <div className="absolute bottom-[15%] left-[15%] w-[20%] h-[10%] bg-[#7b9b97] rounded-full transform -skew-x-12" />
          <div className="absolute bottom-[35%] right-[15%] w-[20%] h-[10%] bg-[#7b9b97] rounded-full transform -skew-x-12" />

          {/* Characters */}
          <div className="absolute bottom-[20%] left-[12%]">
            {battleAgent2 && (
              <div className="relative scale-150">
                <CharacterSprite
                  agent={battleAgent2}
                  position="right"
                  isAttacking={attackingAgent === 2}
                  isHit={hitAgent === 2}
                />
              </div>
            )}
          </div>
          <div className="absolute bottom-[40%] right-[12%]">
            {battleAgent1 && (
              <div className="relative scale-150">
                <CharacterSprite
                  agent={battleAgent1}
                  position="left"
                  isAttacking={attackingAgent === 1}
                  isHit={hitAgent === 1}
                />
              </div>
            )}
          </div>

          {/* Health Bars */}
          <div className="absolute top-8 right-8 w-[30%]">
            {battleAgent1 && (
              <PokemonStyleHealthBar
                currentHealth={battleAgent1.getBattleState().currentHealth}
                maxHealth={battleAgent1.getBattleState().maxHealth}
                name={`Agent #${(battleAgent1 as any).agent.id}`}
                position="right"
              />
            )}
          </div>
          <div className="absolute top-8 left-8 w-[30%]">
            {battleAgent2 && (
              <PokemonStyleHealthBar
                currentHealth={battleAgent2.getBattleState().currentHealth}
                maxHealth={battleAgent2.getBattleState().maxHealth}
                name={`Agent #${(battleAgent2 as any).agent.id}`}
                position="left"
              />
            )}
          </div>

          {/* Attack Effects */}
          <AttackEffect
            type={currentAttack?.type || "Physical"}
            isVisible={currentAttack !== null}
            position={currentAttack?.position || "left"}
          />

          {/* Damage Numbers */}
          <AnimatePresence>
            {damageNumber && (
              <DamageNumber
                damage={damageNumber.damage}
                position={damageNumber.position}
                onComplete={() => setDamageNumber(null)}
              />
            )}
          </AnimatePresence>

          {/* Status Effects */}
          <AnimatePresence>
            {statusEffect && (
              <StatusEffectAnimation
                effect={statusEffect.effect}
                position={statusEffect.position}
                onComplete={() => setStatusEffect(null)}
              />
            )}
          </AnimatePresence>
        </div>

        {/* Battle Interface */}
        <div className="absolute bottom-0 left-0 right-0 h-[30vh] bg-white border-t-4 border-gray-300">
          {/* Battle Log */}
          <div className="h-full flex flex-col items-center justify-between p-6">
            <div className="w-full bg-white rounded-lg border-2 border-gray-300 p-4">
              <div className="font-pokemon text-black text-2xl text-center">
                {battleLog[battleLog.length - 1] || "Ready to start battle!"}
              </div>
            </div>

            {!isSimulating && winner === null && (
              <button
                onClick={startBattle}
                className="font-pokemon text-2xl px-12 py-4 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                Start Battle
              </button>
            )}
          </div>
        </div>

        {/* Winner Announcement */}
        <AnimatePresence>
          {winner !== null && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex items-center justify-center bg-black/50"
            >
              <div className="bg-white p-8 rounded-lg border-4 border-gray-800">
                <h2 className="font-pokemon text-4xl text-black mb-4">
                  Agent #{winner} Wins!
                </h2>
                <button
                  onClick={() => window.location.reload()}
                  className="font-pokemon text-2xl px-8 py-4 bg-red-500 text-white rounded hover:bg-red-600"
                >
                  New Battle
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
