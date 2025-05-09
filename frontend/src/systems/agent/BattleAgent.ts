import type { Agent } from "./types";
import { SPECIAL_MOVES, type SpecialMoveDetails } from "./specialMoves";

interface StatusEffect {
  name: string;
  duration: number;
  effect: {
    damage?: number;
    damageReduction?: number;
    accuracyReduction?: number;
    stunned?: boolean;
  };
}

interface BattleState {
  currentHealth: number;
  maxHealth: number;
  currentMana: number;
  maxMana: number;
  cooldowns: Record<string, number>;
  statusEffects: StatusEffect[];
  defense: number;
  accuracy: number;
}

export class BattleAgent {
  private agent: Agent;
  private battleState: BattleState;
  private aiClient: any; // We'll type this properly once we know the AI client structure

  constructor(agent: Agent) {
    this.agent = agent;
    this.battleState = {
      currentHealth: 100,
      maxHealth: 100,
      currentMana: 100,
      maxMana: 100,
      cooldowns: {},
      statusEffects: [],
      defense: 50,
      accuracy: 100,
    };
  }

  async initialize(apiKey: string) {
    try {
      // Initialize AI client here
      console.log("Initializing AI client for agent", this.agent.id);
      // For now, we'll just log success
      return true;
    } catch (error) {
      console.error("Failed to initialize AI client:", error);
      throw error;
    }
  }

  getBattleState(): BattleState {
    return { ...this.battleState };
  }

  private calculateMoveScore(
    move: SpecialMoveDetails,
    opponentState: BattleState
  ): number {
    let score = 0;

    // Base score from move power
    score += move.basePower;

    // Consider health situation
    const healthPercentage =
      this.battleState.currentHealth / this.battleState.maxHealth;
    if (healthPercentage < 0.3) {
      // Prioritize healing or defensive moves when low on health
      if (move.type === "Support" && move.effect?.includes("heal")) {
        score += 50;
      }
      if (move.effect?.includes("defense")) {
        score += 30;
      }
    }

    // Consider mana efficiency
    if (this.battleState.currentMana < 20) {
      score -= 20; // Penalize mana-consuming moves when low
    }

    // Consider opponent's state
    if (opponentState.currentHealth < move.basePower) {
      score += 40; // Prioritize finishing moves
    }

    // Consider status effects
    if (
      move.effect?.includes("stun") &&
      !opponentState.statusEffects.some((s) => s.name === "Stunned")
    ) {
      score += 25;
    }

    return score;
  }

  async decideMoveAction(opponentState: BattleState): Promise<string> {
    const availableMoves = this.agent.specialMoves.filter((moveName) => {
      const move = SPECIAL_MOVES[moveName];
      return (
        (!this.battleState.cooldowns[moveName] ||
          this.battleState.cooldowns[moveName] <= 0) &&
        this.battleState.currentMana >= 10
      );
    });

    if (availableMoves.length === 0) return "Basic Attack";

    // Score each available move
    const scoredMoves = availableMoves.map((moveName) => ({
      name: moveName,
      score: this.calculateMoveScore(SPECIAL_MOVES[moveName], opponentState),
    }));

    // Sort by score and add some randomness for non-deterministic behavior
    scoredMoves.sort((a, b) => b.score - a.score);
    const topMoves = scoredMoves.slice(0, 2); // Get top 2 moves
    return topMoves[Math.floor(Math.random() * topMoves.length)].name;
  }

  executeMove(
    moveName: string,
    target: BattleAgent
  ): {
    success: boolean;
    damage?: number;
    message?: string;
    effects?: StatusEffect[];
  } {
    if (this.isStunned()) {
      return {
        success: false,
        message: "Stunned and cannot move",
      };
    }

    if (this.battleState.cooldowns[moveName] > 0) {
      return {
        success: false,
        message: "Move is on cooldown",
      };
    }

    const move = SPECIAL_MOVES[moveName];
    if (!move) {
      // Increase basic attack damage (was 0.15)
      const damage = Math.floor(1 + this.agent.skills.attack * 0.25);
      return { success: true, damage };
    }

    if (this.battleState.currentMana < 10) {
      return {
        success: false,
        message: "Not enough mana",
      };
    }

    this.battleState.currentMana -= 10;
    this.battleState.cooldowns[moveName] = move.cooldown || 3;

    const effects: StatusEffect[] = [];
    // Increase special move damage (was 0.025)
    let damage = Math.floor(
      move.basePower * (0.4 + this.agent.skills.attack * 0.05)
    );

    // Apply move effects
    if (move.effect) {
      if (move.effect.includes("burn")) {
        effects.push({
          name: "Burned",
          duration: 3,
          effect: { damage: Math.floor(move.basePower * 0.02) },
        });
      }
      if (move.effect.includes("stun")) {
        effects.push({
          name: "Stunned",
          duration: 1,
          effect: { stunned: true },
        });
      }
      if (move.effect.includes("defense")) {
        this.battleState.defense += 20;
      }
    }

    // Apply target's defense
    damage = Math.floor(damage * (1 - target.getBattleState().defense / 200));

    return {
      success: true,
      damage,
      effects,
    };
  }

  takeDamage(amount: number): boolean {
    const damage = Math.max(0, amount);
    this.battleState.currentHealth = Math.max(
      0,
      this.battleState.currentHealth - damage
    );
    return this.battleState.currentHealth <= 0;
  }

  addStatusEffect(effect: StatusEffect) {
    this.battleState.statusEffects.push(effect);
  }

  private isStunned(): boolean {
    return this.battleState.statusEffects.some(
      (effect) => effect.effect.stunned
    );
  }

  updateState() {
    // Regenerate mana
    this.battleState.currentMana = Math.min(
      this.battleState.maxMana,
      this.battleState.currentMana + 5
    );

    // Process status effects
    for (const effect of this.battleState.statusEffects) {
      if (effect.effect.damage) {
        this.takeDamage(effect.effect.damage);
      }
      effect.duration--;
    }

    // Remove expired effects
    this.battleState.statusEffects = this.battleState.statusEffects.filter(
      (effect) => effect.duration > 0
    );

    // Reduce cooldowns
    Object.keys(this.battleState.cooldowns).forEach((move) => {
      if (this.battleState.cooldowns[move] > 0) {
        this.battleState.cooldowns[move]--;
      }
    });

    // Reset defense
    this.battleState.defense = 0;
  }
}
