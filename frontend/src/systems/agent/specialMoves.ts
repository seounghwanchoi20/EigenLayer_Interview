import type { Stats, SpecialMove } from "./types";

// Special move types for visual effects and damage calculations
export type MoveType = "Physical" | "Magical" | "Support" | "Ultimate";
export type MoveTarget = "Enemy" | "Self" | "Both";

export interface SpecialMoveDetails extends SpecialMove {
  type: MoveType;
  target: MoveTarget;
  basePower: number;
  accuracy: number;
  cooldown: number;
  requirements: Partial<Stats>;
  description: string;
  effect?: string;
}

// Define special moves with their requirements and effects
export const SPECIAL_MOVES: Record<string, SpecialMoveDetails> = {
  // Agile Combat Moves
  "Tornado Spin": {
    name: "Tornado Spin",
    type: "Physical",
    target: "Enemy",
    basePower: 25,
    accuracy: 90,
    cooldown: 3,
    requirements: {
      agility: 18,
      strength: 15,
    },
    description: "Spin rapidly like a tornado, hitting all nearby enemies",
    effect: "30% chance to make enemies dizzy, reducing their accuracy",
  },
  "Lightning Dash": {
    name: "Lightning Dash",
    type: "Physical",
    target: "Enemy",
    basePower: 20,
    accuracy: 95,
    cooldown: 2,
    requirements: {
      agility: 20,
      speed: 15,
    },
    description: "Dash at lightning speed to strike the enemy",
    effect: "Always attacks first in combat, can't be dodged",
  },
  "Stealth Crawl": {
    name: "Stealth Crawl",
    type: "Support",
    target: "Self",
    basePower: 0,
    accuracy: 100,
    cooldown: 4,
    requirements: {
      stealth: 18,
      agility: 15,
    },
    description: "Move silently and become nearly invisible",
    effect:
      "Become untargetable for 2 turns, next attack deals 50% bonus damage",
  },

  // Elemental Attacks
  "Thunder Strike": {
    name: "Thunder Strike",
    type: "Magical",
    target: "Enemy",
    basePower: 30,
    accuracy: 85,
    cooldown: 3,
    requirements: {
      magic: 18,
      intelligence: 15,
    },
    description: "Call down a bolt of lightning on the enemy",
    effect: "20% chance to paralyze the enemy for 1 turn",
  },
  "Flame Vortex": {
    name: "Flame Vortex",
    type: "Magical",
    target: "Enemy",
    basePower: 25,
    accuracy: 90,
    cooldown: 4,
    requirements: {
      magic: 20,
      strength: 12,
    },
    description: "Create a spinning vortex of flames",
    effect: "Deals damage over time for 3 turns",
  },

  // Special Movement Abilities
  "Wall Runner": {
    name: "Wall Runner",
    type: "Support",
    target: "Self",
    basePower: 0,
    accuracy: 100,
    cooldown: 3,
    requirements: {
      agility: 15,
      speed: 12,
    },
    description: "Run along walls to dodge attacks",
    effect: "Increases evasion by 50% for 2 turns",
  },
  "Ground Pound": {
    name: "Ground Pound",
    type: "Physical",
    target: "Enemy",
    basePower: 35,
    accuracy: 85,
    cooldown: 4,
    requirements: {
      strength: 20,
      vitality: 15,
    },
    description: "Jump high and slam into the ground",
    effect: "Stuns all nearby enemies for 1 turn",
  },

  // Ultimate Combat Moves
  "Dragon Cyclone": {
    name: "Dragon Cyclone",
    type: "Ultimate",
    target: "Enemy",
    basePower: 45,
    accuracy: 85,
    cooldown: 6,
    requirements: {
      strength: 20,
      agility: 18,
      magic: 15,
    },
    description: "Transform into a dragon and create a devastating cyclone",
    effect: "Hits all enemies and removes all positive effects from them",
  },
  "Shadow Assassin": {
    name: "Shadow Assassin",
    type: "Ultimate",
    target: "Enemy",
    basePower: 40,
    accuracy: 90,
    cooldown: 5,
    requirements: {
      stealth: 20,
      agility: 18,
      speed: 15,
    },
    description: "Merge with shadows and strike from multiple angles",
    effect: "Hits 3 times with increasing damage each hit",
  },
  "Elemental Storm": {
    name: "Elemental Storm",
    type: "Ultimate",
    target: "Enemy",
    basePower: 50,
    accuracy: 80,
    cooldown: 6,
    requirements: {
      magic: 22,
      intelligence: 18,
      vitality: 15,
    },
    description: "Unleash a storm of all elements",
    effect: "Each hit has a random elemental effect: burn, freeze, or shock",
  },

  // Warrior Moves
  "Berserker Rage": {
    name: "Berserker Rage",
    type: "Physical",
    target: "Enemy",
    basePower: 15,
    accuracy: 90,
    cooldown: 3,
    requirements: {
      strength: 20,
      vitality: 15,
    },
    description:
      "A powerful physical attack that increases in power as health decreases",
    effect: "Damage increases by 50% when below 50% HP",
  },
  "Crushing Blow": {
    name: "Crushing Blow",
    type: "Physical",
    target: "Enemy",
    basePower: 30,
    accuracy: 90,
    cooldown: 3,
    requirements: {
      strength: 18,
      agility: 12,
    },
    description: "A powerful strike that can break enemy's defense",
    effect: "25% chance to reduce enemy's defense by 20%",
  },

  // Mage Moves
  "Arcane Burst": {
    name: "Arcane Burst",
    type: "Magical",
    target: "Enemy",
    basePower: 15,
    accuracy: 95,
    cooldown: 2,
    requirements: {
      intelligence: 20,
      magic: 15,
    },
    description: "A burst of magical energy that ignores part of enemy defense",
    effect: "Ignores 30% of enemy magical defense",
  },
  "Mystic Barrier": {
    name: "Mystic Barrier",
    type: "Magical",
    target: "Self",
    basePower: 0,
    accuracy: 100,
    cooldown: 5,
    requirements: {
      intelligence: 15,
      vitality: 15,
    },
    description: "Create a magical barrier that absorbs damage",
    effect: "Creates a shield that absorbs damage equal to 50% of intelligence",
  },

  // Rogue Moves
  "Shadow Strike": {
    name: "Shadow Strike",
    type: "Physical",
    target: "Enemy",
    basePower: 15,
    accuracy: 100,
    cooldown: 2,
    requirements: {
      agility: 20,
      stealth: 15,
    },
    description: "A quick strike from the shadows with high accuracy",
    effect: "Cannot be dodged",
  },
  "Smoke Bomb": {
    name: "Smoke Bomb",
    type: "Support",
    target: "Both",
    basePower: 0,
    accuracy: 100,
    cooldown: 4,
    requirements: {
      agility: 15,
      intelligence: 12,
    },
    description: "Throw a smoke bomb that reduces accuracy",
    effect:
      "Reduces enemy accuracy by 30% and increases own evasion by 30% for 2 turns",
  },

  // Paladin Moves
  "Divine Shield": {
    name: "Divine Shield",
    type: "Support",
    target: "Self",
    basePower: 0,
    accuracy: 100,
    cooldown: 4,
    requirements: {
      vitality: 20,
      defense: 15,
    },
    description: "Creates a protective barrier that absorbs damage",
    effect: "Reduces incoming damage by 50% for 2 turns",
  },
  "Holy Strike": {
    name: "Holy Strike",
    type: "Physical",
    target: "Enemy",
    basePower: 25,
    accuracy: 100,
    cooldown: 3,
    requirements: {
      strength: 15,
      charisma: 15,
    },
    description: "A powerful strike imbued with holy energy",
    effect: "Heals self for 30% of damage dealt",
  },
};

// Helper function to calculate move damage
export function calculateMoveDamage(
  move: SpecialMoveDetails,
  attackerStats: Stats,
  defenderStats: Stats
): number {
  let baseDamage = move.basePower;

  // Apply stat modifiers based on move type with reduced multipliers
  switch (move.type) {
    case "Physical":
      baseDamage *=
        (attackerStats.strength / 400) * (1 - defenderStats.defense! / 800);
      break;
    case "Magical":
      baseDamage *=
        (attackerStats.magic! / 400) * (1 - defenderStats.intelligence / 800);
      break;
    case "Ultimate":
      baseDamage *= (attackerStats.strength + attackerStats.magic!) / 600;
      break;
  }

  // Add smaller random variation (±5%)
  const variation = 0.95 + Math.random() * 0.1;

  // Ensure minimum damage of 1
  return Math.max(1, Math.round(baseDamage * variation));
}

// Function to check if a move can be used based on stats
export function canUseMove(stats: Stats, move: SpecialMoveDetails): boolean {
  return Object.entries(move.requirements).every(
    ([stat, required]) => (stats[stat as keyof Stats] || 0) >= required
  );
}

// Function to get available moves for an agent based on their stats
export function getAvailableMoves(stats: Stats): SpecialMoveDetails[] {
  return Object.values(SPECIAL_MOVES).filter((move) => canUseMove(stats, move));
}
