import { useState, useEffect, useMemo, useCallback } from "react";
import { BattleAgent } from "../systems/agent/BattleAgent";
import type { Agent } from "../systems/agent/types";
import { motion, AnimatePresence } from "framer-motion";
import { SPECIAL_MOVES } from "../systems/agent/specialMoves";
import "../styles/battle.css";
import { matchmaking } from "../services/matchmaking";

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
  setTimeout(onComplete, 0);
  return null;
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
  battleId: string;
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
  // Use useEffect to log health changes
  useEffect(() => {
    console.log(
      `[HealthBar ${name}] Health changed to: ${currentHealth}/${maxHealth}`
    );
  }, [currentHealth, maxHealth, name]);

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
        <span className="font-pokemon text-black text-sm">Lv.1</span>
      </div>
      <div className="bg-black rounded p-1">
        <div className="bg-[#1c1c1c] p-1 rounded-sm">
          <div className="h-2 bg-[#98d8d8] rounded-sm">
            <motion.div
              key={`health-${currentHealth}-${Date.now()}`} // Force re-render on every health change
              initial={{ width: `${percentage}%` }}
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

const WinnerAnnouncement = ({
  winner,
  myAgent,
  opponentAgent,
}: {
  winner: number | null;
  myAgent: Agent;
  opponentAgent: Agent;
}) => {
  if (winner === null) return null;

  const isWinner = winner === myAgent.id;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 flex items-center justify-center bg-black/50"
    >
      <div className="bg-white p-8 rounded-lg border-4 border-gray-800">
        <h2
          className={`font-pokemon text-4xl mb-4 ${
            isWinner ? "text-green-600" : "text-red-600"
          }`}
        >
          {isWinner ? "Victory!" : "Defeat!"}
        </h2>
        <p className="font-pokemon text-2xl text-black mb-4">
          {isWinner
            ? `You defeated Agent #${opponentAgent.id}!`
            : `Agent #${winner} was victorious!`}
        </p>
        <button
          onClick={() => window.location.reload()}
          className="font-pokemon text-2xl px-8 py-4 bg-purple-500 text-white rounded hover:bg-purple-600"
        >
          New Battle
        </button>
      </div>
    </motion.div>
  );
};

export function BattleArena({
  agent1,
  agent2,
  apiKey,
  battleId,
}: BattleArenaProps) {
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
  const [isMyTurn, setIsMyTurn] = useState<boolean>(false);
  const [isReady, setIsReady] = useState<boolean>(false);
  const [opponentReady, setOpponentReady] = useState<boolean>(false);
  const [waitingForOpponent, setWaitingForOpponent] = useState<boolean>(false);
  const [battleInitialized, setBattleInitialized] = useState<boolean>(false);
  const [agent1Health, setAgent1Health] = useState<{
    current: number;
    max: number;
  }>({ current: 100, max: 100 });
  const [agent2Health, setAgent2Health] = useState<{
    current: number;
    max: number;
  }>({ current: 100, max: 100 });

  const updateHealth = (agentNumber: 1 | 2, newHealth: number) => {
    console.log(
      `[Health] Server setting Agent ${agentNumber} health to:`,
      newHealth
    );

    if (agentNumber === 1) {
      setAgent1Health((prev) => {
        const updated = { ...prev, current: newHealth };
        console.log(`[Health] Agent 1 health updated:`, updated);
        return updated;
      });
    } else {
      setAgent2Health((prev) => {
        const updated = { ...prev, current: newHealth };
        console.log(`[Health] Agent 2 health updated:`, updated);
        return updated;
      });
    }
  };

  const handleOpponentDisconnect = () => {
    setBattleLog((prev) => [...prev, "Opponent disconnected from the battle!"]);
    setWinner(agent1.id); // You win if opponent disconnects
  };

  const handleOpponentAction = async (action: any) => {
    if (!battleAgent1 || !battleAgent2) return;

    console.log("[Battle] Received opponent attack:", action);
    setWaitingForOpponent(false);

    try {
      // Play attack animation first
      setAttackingAgent(2);
      await new Promise((resolve) => setTimeout(resolve, 500));

      const moveType = SPECIAL_MOVES[action.moveName]?.type || "Physical";
      setCurrentAttack({ type: moveType, position: "right" });
      await new Promise((resolve) => setTimeout(resolve, 800));

      setHitAgent(1);
      setCurrentAttack(null);

      // Wait for all animations before updating health and showing damage
      await new Promise((resolve) => setTimeout(resolve, 200));

      // Update health values from server
      if (
        action.myHealth !== undefined &&
        action.opponentHealth !== undefined
      ) {
        const oldHealth = agent1Health.current;
        const actualDamage = oldHealth - action.myHealth;

        // Update both healths simultaneously
        updateHealth(1, action.myHealth);
        updateHealth(2, action.opponentHealth);

        // Update battle agents' health
        if (battleAgent1) {
          battleAgent1.getBattleState().currentHealth = action.myHealth;
        }
        if (battleAgent2) {
          battleAgent2.getBattleState().currentHealth = action.opponentHealth;
        }

        // Check for defeat
        if (action.myHealth <= 0) {
          setWinner(agent2.id);
          setBattleLog((prev) => [
            ...prev,
            `You lost the battle! Agent #${agent2.id} is victorious!`,
          ]);
          return;
        }

        // Show damage number and battle message together
        if (actualDamage > 0) {
          setDamageNumber({ damage: actualDamage, position: "left" });
          const battleMessage =
            action.battleMessage ||
            `Opponent used ${action.moveName}! Dealt ${actualDamage} damage.`;
          setBattleLog((prev) => [...prev, battleMessage]);
          await new Promise((resolve) => setTimeout(resolve, 1200));
          setDamageNumber(null);
        }
      }

      setAttackingAgent(null);
      setHitAgent(null);

      // Only set turn if no winner yet
      if (winner === null) {
        setIsMyTurn(true);
      }
    } catch (error) {
      console.error("Error handling opponent action:", error);
    }
  };

  const handleActionConfirmed = (data: any) => {
    console.log("[Battle] Action confirmed by server:", data);

    if (!data) {
      console.error("[Error] Server response is undefined.");
      return;
    }

    // Update both healths simultaneously when server confirms
    if (data.myHealth !== undefined && data.opponentHealth !== undefined) {
      // Update health state
      updateHealth(1, data.myHealth);
      updateHealth(2, data.opponentHealth);

      // Update battle agents' health
      if (battleAgent1) {
        battleAgent1.getBattleState().currentHealth = data.myHealth;
      }
      if (battleAgent2) {
        battleAgent2.getBattleState().currentHealth = data.opponentHealth;
      }

      // Check for defeat after health update
      if (data.opponentHealth <= 0) {
        setWinner(agent1.id);
        setBattleLog((prev) => [
          ...prev,
          `Victory! You defeated Agent #${agent2.id}!`,
        ]);
        return;
      }
    }

    // Update battle message if server provided one
    if (data.battleMessage) {
      setBattleLog((prev) => {
        const newLog = [...prev];
        newLog[newLog.length - 1] = data.battleMessage;
        return newLog;
      });
    }

    // Only set waiting and turn if no winner yet
    if (winner === null) {
      setWaitingForOpponent(true);
      setIsMyTurn(false);
    }
  };

  const simulateTurn = async () => {
    if (
      !battleAgent1 ||
      !battleAgent2 ||
      winner !== null ||
      !isMyTurn ||
      waitingForOpponent
    ) {
      return;
    }

    try {
      // Calculate move and damage
      const moveDecision = await battleAgent1.decideMoveAction(
        battleAgent2.getBattleState()
      );
      const moveResult = battleAgent1.executeMove(moveDecision, battleAgent2);

      if (!moveResult.success) {
        setBattleLog((prev) => [
          ...prev,
          `Failed to execute ${moveDecision}: ${moveResult.message}`,
        ]);
        return;
      }

      // Create battle message that will be synchronized
      const battleMessage = `Agent #${agent1.id} used ${moveDecision}! Dealt ${moveResult.damage} damage.`;

      // Send move to server first with the battle message
      const battleAction = {
        moveName: moveDecision,
        damage: moveResult.damage || 0,
        effects: moveResult.effects || [],
        battleMessage: battleMessage,
      };

      console.log("[Battle] Sending attack:", battleAction);
      matchmaking.sendBattleAction(battleAction);

      // Play attack animation
      setAttackingAgent(1);
      await new Promise((resolve) => setTimeout(resolve, 500));

      const moveType = SPECIAL_MOVES[moveDecision]?.type || "Physical";
      setCurrentAttack({ type: moveType, position: "left" });
      await new Promise((resolve) => setTimeout(resolve, 800));

      setHitAgent(2);
      setCurrentAttack(null);

      // Wait for all animations before showing damage
      await new Promise((resolve) => setTimeout(resolve, 200));

      // Show damage number animation (actual health update will come from server)
      if (moveResult.damage) {
        setDamageNumber({ damage: moveResult.damage, position: "right" });
        setBattleLog((prev) => [...prev, battleMessage]);
        await new Promise((resolve) => setTimeout(resolve, 1200));
        setDamageNumber(null);
      }

      setAttackingAgent(null);
      setHitAgent(null);

      // Wait for server confirmation
      setWaitingForOpponent(true);
      setIsMyTurn(false);
    } catch (error) {
      console.error("Error during battle simulation:", error);
    }
  };

  const handleBattleStart = useCallback(
    (data: any) => {
      console.log("Battle start received:", data);
      const { opponent, isFirstTurn, myHealth, opponentHealth } = data;

      // Initialize health values from server
      setAgent1Health({
        current: isFirstTurn ? myHealth : opponentHealth,
        max: 100,
      });
      setAgent2Health({
        current: isFirstTurn ? opponentHealth : myHealth,
        max: 100,
      });

      // Initialize battle agents
      const myAgent = new BattleAgent(agent1);
      const opponentAgent = new BattleAgent(agent2);

      // Update their health from server values
      if (myHealth !== undefined && opponentHealth !== undefined) {
        const myState = myAgent.getBattleState();
        const opponentState = opponentAgent.getBattleState();
        myState.currentHealth = isFirstTurn ? myHealth : opponentHealth;
        opponentState.currentHealth = isFirstTurn ? opponentHealth : myHealth;
      }

      setBattleAgent1(myAgent);
      setBattleAgent2(opponentAgent);
      setIsMyTurn(isFirstTurn);
      setOpponentReady(true);
      setIsReady(true);

      // Reset health to initial values
      if (myAgent && opponentAgent) {
        setAgent1Health({
          current: myAgent.getBattleState().currentHealth,
          max: myAgent.getBattleState().maxHealth,
        });
        setAgent2Health({
          current: opponentAgent.getBattleState().currentHealth,
          max: opponentAgent.getBattleState().maxHealth,
        });
      }

      setBattleLog((prev) => [
        ...prev,
        `Battle started! ${
          isFirstTurn ? "You go first!" : "Opponent goes first!"
        }`,
      ]);
    },
    [agent1, agent2]
  );

  useEffect(() => {
    let mounted = true;
    console.log("Battle effect mounted with battleId:", battleId);

    const initializeBattle = async () => {
      if (!mounted) return;

      console.log("Starting battle initialization with agents:", {
        agent1: { id: agent1.id, traits: agent1.traits },
        agent2: { id: agent2.id, traits: agent2.traits },
      });

      const ba1 = new BattleAgent(agent1);
      const ba2 = new BattleAgent(agent2);

      try {
        console.log("Initializing Agent 1...");
        await ba1.initialize(apiKey);
        if (!mounted) return;
        console.log("Agent 1 initialized successfully:", ba1.getBattleState());

        console.log("Initializing Agent 2...");
        await ba2.initialize(apiKey);
        if (!mounted) return;
        console.log("Agent 2 initialized successfully:", ba2.getBattleState());

        // Initialize health states with battle agent values
        const agent1State = ba1.getBattleState();
        const agent2State = ba2.getBattleState();

        setAgent1Health({
          current: agent1State.currentHealth,
          max: agent1State.maxHealth,
        });
        setAgent2Health({
          current: agent2State.currentHealth,
          max: agent2State.maxHealth,
        });

        setBattleAgent1(ba1);
        setBattleAgent2(ba2);
        setBattleLog((prev) => [...prev, "Both agents ready for battle!"]);

        // Set battle as initialized since we have a valid battleId from props
        if (battleId) {
          console.log("Setting up battle with ID:", battleId);
          matchmaking.setBattleId(battleId);
          setBattleInitialized(true);
          setBattleLog((prev) => [...prev, "Battle connection established!"]);
        }
      } catch (error) {
        if (!mounted) return;
        console.error("Error during battle initialization:", error);
        setBattleLog((prev) => [
          ...prev,
          "Error initializing agents: " + (error as Error).message,
        ]);
      }
    };

    // Set up battle synchronization listeners first
    console.log("Setting up battle event listeners...");

    const handleBattleCreated = (data: any) => {
      if (!mounted) return;
      console.log("[Battle] Received battle_created event:", data);
      matchmaking.setBattleId(data.battleId);
      setBattleInitialized(true);
      setBattleLog((prev) => [...prev, "Battle connection established!"]);
    };

    const handleBattleStart = (data: any) => {
      if (!mounted) return;
      console.log("[Battle] Received battle_start event:", {
        data,
        currentState: {
          isReady,
          opponentReady,
          battleInitialized,
          isSimulating,
        },
      });

      // Set all necessary state for battle to begin
      setIsMyTurn(data.isFirstTurn);
      setBattleInitialized(true);
      setIsSimulating(true);
      setOpponentReady(true);
      setIsReady(true);

      // Reset health to initial values
      if (battleAgent1 && battleAgent2) {
        setAgent1Health({
          current: battleAgent1.getBattleState().currentHealth,
          max: battleAgent1.getBattleState().maxHealth,
        });
        setAgent2Health({
          current: battleAgent2.getBattleState().currentHealth,
          max: battleAgent2.getBattleState().maxHealth,
        });
      }

      setBattleLog((prev) => [
        ...prev,
        `Battle started! ${
          data.isFirstTurn ? "You go first!" : "Opponent goes first!"
        }`,
      ]);
    };

    const handleOpponentReadyEvent = () => {
      if (!mounted) return;
      console.log("[Battle] Received opponent_ready event, current state:", {
        isReady,
        opponentReady,
        battleInitialized,
        isSimulating,
      });
      setOpponentReady(true);
      setBattleLog((prev) => [...prev, "Opponent is ready!"]);
    };

    // Set up all event listeners
    matchmaking.on("battle_created", handleBattleCreated);
    matchmaking.on("battle_start", handleBattleStart);
    matchmaking.on("opponent_ready", handleOpponentReadyEvent);
    matchmaking.on("opponent_action", (action) => {
      if (!mounted) return;
      console.log("Received opponent action:", action);
      handleOpponentAction(action);
    });
    matchmaking.on("action_confirmed", (data) => {
      if (!mounted) return;
      console.log("Action confirmed by server");
      handleActionConfirmed(data);
    });
    matchmaking.on("opponent_disconnected", () => {
      if (!mounted) return;
      console.log("Opponent disconnected");
      handleOpponentDisconnect();
    });

    // Initialize battle after setting up listeners
    initializeBattle();

    return () => {
      console.log("Battle effect cleanup - removing listeners");
      mounted = false;
      matchmaking.removeListener("battle_created", handleBattleCreated);
      matchmaking.removeListener("battle_start", handleBattleStart);
      matchmaking.removeListener("opponent_ready", handleOpponentReadyEvent);
      matchmaking.removeListener("opponent_action", handleOpponentAction);
      matchmaking.removeListener("action_confirmed", handleActionConfirmed);
      matchmaking.removeListener(
        "opponent_disconnected",
        handleOpponentDisconnect
      );
    };
  }, [agent1, agent2, apiKey, battleId, isReady, opponentReady]);

  const startBattle = async () => {
    if (!battleAgent1 || !battleAgent2) {
      setBattleLog((prev) => [...prev, "Waiting for agents to initialize..."]);
      return;
    }

    console.log("[Battle] Starting battle, current state:", {
      isReady,
      opponentReady,
      battleInitialized,
      isSimulating,
      battleId: matchmaking.getBattleId(),
    });

    // Send ready signal and update local state
    matchmaking.sendBattleReady();
    setIsReady(true);
    setBattleLog((prev) => [...prev, "Waiting for opponent..."]);
  };

  // Remove the state monitoring effect since we'll let battle_start handle everything
  useEffect(() => {
    if (isSimulating && isMyTurn && !waitingForOpponent) {
      console.log("Starting turn simulation");
      simulateTurn();
    }
  }, [isSimulating, isMyTurn, waitingForOpponent]);

  // Helper function to get health percentage safely
  const getHealthPercentage = (agent: BattleAgent) => {
    const health = agent.getBattleState().currentHealth;
    return Math.max(0, Math.min(100, health));
  };

  if (!battleAgent1 || !battleAgent2) {
    return <div className="text-center py-8">Initializing battle...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {!battleInitialized ? (
          <div className="text-center mb-6">
            <div className="animate-pulse text-purple-400">
              Initializing battle connection...
            </div>
          </div>
        ) : !isSimulating ? (
          <div className="text-center mb-6">
            {!isReady ? (
              <button
                onClick={startBattle}
                className="px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg font-bold"
              >
                Start Battle
              </button>
            ) : (
              <div className="animate-pulse text-purple-400">
                Waiting for opponent to be ready...
              </div>
            )}
          </div>
        ) : (
          <div className="text-center mb-6">
            <div className="text-purple-400">Battle in progress...</div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Battle Scene */}
          <div
            className={`fixed inset-0 flex items-center justify-center bg-gray-900 ${
              isSimulating ? "opacity-100" : "opacity-0 pointer-events-none"
            } transition-opacity duration-500`}
          >
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
                  <PokemonStyleHealthBar
                    currentHealth={agent1Health.current}
                    maxHealth={agent1Health.max}
                    name={`Agent #${agent1.id}`}
                    position="right"
                  />
                </div>
                <div className="absolute top-8 left-8 w-[30%]">
                  <PokemonStyleHealthBar
                    currentHealth={agent2Health.current}
                    maxHealth={agent2Health.max}
                    name={`Agent #${agent2.id}`}
                    position="left"
                  />
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
                      {battleLog[battleLog.length - 1] ||
                        "Ready to start battle!"}
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
                  <WinnerAnnouncement
                    winner={winner}
                    myAgent={agent1}
                    opponentAgent={agent2}
                  />
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
