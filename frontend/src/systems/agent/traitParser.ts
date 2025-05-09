import type { Trait, Stats, Skills } from "./types";
import {
  getAvailableMoves,
  SPECIAL_MOVES,
  type SpecialMoveDetails,
} from "./specialMoves";

// Enhanced trait influence weights for stats
const TRAIT_STAT_WEIGHTS = {
  background: {
    Red: { strength: 3, vitality: -1 },
    Blue: { intelligence: 3, strength: -1 },
    Green: { vitality: 3, intelligence: -1 },
    Purple: { magic: 3, vitality: -1 },
    Gold: { charisma: 3, strength: -1 },
    Silver: { agility: 3, charisma: -1 },
    Rainbow: { magic: 2, charisma: 2 },
    Cosmic: { intelligence: 2, magic: 2 },
    Sunset: { charisma: 2, vitality: 2 },
    Dawn: { vitality: 2, magic: 2 },
  },
  skin: {
    Fair: { intelligence: 2, vitality: 1 },
    Tan: { vitality: 2, strength: 1 },
    Dark: { strength: 2, agility: 1 },
    Pale: { magic: 2, intelligence: 1 },
    Golden: { charisma: 2, magic: 1 },
    Bronze: { strength: 2, vitality: 1 },
    Olive: { agility: 2, intelligence: 1 },
    Porcelain: { magic: 2, charisma: 1 },
    Rosy: { charisma: 2, vitality: 1 },
    Metallic: { defense: 2, magic: 1 },
  },
  eyes: {
    Round: { intelligence: 2 },
    Almond: { agility: 2 },
    Cat: { agility: 3, intelligence: -1 },
    Star: { magic: 3, strength: -1 },
    Heart: { charisma: 3, strength: -1 },
    Diamond: { intelligence: 2, magic: 1 },
    Sleepy: { magic: 2, agility: -1 },
    Angry: { strength: 3, charisma: -1 },
    Cute: { charisma: 3, strength: -1 },
    Mysterious: { magic: 2, intelligence: 1 },
  },
  mouth: {
    Smile: { charisma: 2, vitality: 1 },
    Grin: { strength: 2, intelligence: -1 },
    Pout: { magic: 2, strength: -1 },
    Open: { vitality: 2 },
    Smirk: { intelligence: 2, vitality: -1 },
    Laugh: { charisma: 3, magic: -1 },
    Serious: { intelligence: 2, charisma: -1 },
    Surprised: { agility: 2, intelligence: -1 },
    Peaceful: { magic: 2, strength: -1 },
    Playful: { agility: 2, intelligence: 1 },
  },
  headwear: {
    Crown: { charisma: 3, magic: 1 },
    Beanie: { intelligence: 2 },
    Cap: { agility: 2 },
    Bow: { charisma: 2 },
    Halo: { magic: 3, strength: -1 },
    Horns: { strength: 3, charisma: -1 },
    Flower: { charisma: 2, magic: 1 },
    Bandana: { agility: 2, strength: 1 },
    None: { vitality: 1 },
    Helmet: { defense: 3, agility: -1 },
  },
  clothes: {
    Hoodie: { agility: 2, comfort: 1 },
    Suit: { charisma: 3, agility: -1 },
    Dress: { charisma: 2, magic: 1 },
    Robe: { magic: 3, strength: -1 },
    Armor: { defense: 3, agility: -1 },
    Casual: { agility: 2, comfort: 1 },
    Royal: { charisma: 3, strength: -1 },
    Punk: { strength: 2, charisma: -1 },
    Cyber: { intelligence: 2, magic: 1 },
    Magical: { magic: 3, defense: -1 },
  },
  accessory: {
    Necklace: { charisma: 2 },
    Earrings: { magic: 2 },
    Glasses: { intelligence: 2 },
    Scarf: { comfort: 2 },
    Ring: { magic: 2 },
    Watch: { intelligence: 2 },
    Bracelet: { agility: 2 },
    Pendant: { magic: 2 },
    None: { vitality: 1 },
    Amulet: { magic: 3, vitality: -1 },
  },
  special: {
    Glowing: { magic: 3, vitality: -1 },
    Sparkles: { charisma: 2, magic: 1 },
    Aura: { magic: 3, strength: -1 },
    Wings: { agility: 3, defense: -1 },
    Tattoo: { strength: 2, magic: 1 },
    Scar: { strength: 3, charisma: -1 },
    Mark: { magic: 2, vitality: 1 },
    Gem: { magic: 2, charisma: 1 },
    Pattern: { agility: 2, intelligence: 1 },
    Shadow: { stealth: 3, charisma: -1 },
  },
  mood: {
    Happy: { charisma: 2, vitality: 1 },
    Sad: { magic: 2, charisma: -1 },
    Excited: { agility: 2, intelligence: -1 },
    Calm: { intelligence: 2, strength: -1 },
    Fierce: { strength: 3, charisma: -1 },
    Shy: { stealth: 2, charisma: -1 },
    Bold: { strength: 2, intelligence: 1 },
    Mysterious: { magic: 2, charisma: 1 },
    Friendly: { charisma: 3, strength: -1 },
    Wild: { agility: 3, intelligence: -1 },
  },
  weather: {
    Sunny: { vitality: 2, charisma: 1 },
    Rainy: { magic: 2, charisma: -1 },
    Stormy: { strength: 2, intelligence: 1 },
    Snowy: { magic: 2, agility: -1 },
    Windy: { agility: 3, defense: -1 },
    Foggy: { stealth: 2, intelligence: 1 },
    Clear: { intelligence: 2, vitality: 1 },
    Starry: { magic: 2, charisma: 1 },
    Aurora: { magic: 3, strength: -1 },
    Thunder: { strength: 3, intelligence: -1 },
  },
};

// Base stats for all agents
const BASE_STATS: Stats = {
  strength: 20,
  agility: 20,
  intelligence: 20,
  charisma: 20,
  vitality: 20,
  magic: 20,
  stealth: 20,
  defense: 20,
  speed: 20,
};

// Base skills for all agents
const BASE_SKILLS: Skills = {
  attack: 10,
  defense: 10,
  magic: 10,
  speed: 10,
};

// Skill specialization thresholds
const SKILL_THRESHOLDS = {
  BASIC: 15,
  ADVANCED: 20,
  MASTER: 25,
};

// Special moves based on stat combinations
const SPECIAL_MOVES_OBJ = {
  WARRIOR: {
    name: "Berserker Rage",
    requirements: {
      strength: SKILL_THRESHOLDS.ADVANCED,
      vitality: SKILL_THRESHOLDS.BASIC,
    },
  },
  MAGE: {
    name: "Arcane Burst",
    requirements: {
      intelligence: SKILL_THRESHOLDS.ADVANCED,
      magic: SKILL_THRESHOLDS.BASIC,
    },
  },
  ROGUE: {
    name: "Shadow Strike",
    requirements: {
      agility: SKILL_THRESHOLDS.ADVANCED,
      stealth: SKILL_THRESHOLDS.BASIC,
    },
  },
  PALADIN: {
    name: "Divine Shield",
    requirements: {
      vitality: SKILL_THRESHOLDS.ADVANCED,
      charisma: SKILL_THRESHOLDS.BASIC,
    },
  },
};

// Define which traits unlock which special moves
const TRAIT_MOVE_MAPPING: Record<string, Record<string, string[]>> = {
  background: {
    Red: ["Flame Vortex", "Berserker Rage"],
    Blue: ["Thunder Strike", "Mystic Barrier"],
    Purple: ["Shadow Assassin", "Stealth Crawl"],
    Gold: ["Holy Strike", "Divine Shield"],
    Silver: ["Lightning Dash", "Wall Runner"],
    Rainbow: ["Elemental Storm"],
    Cosmic: ["Dragon Cyclone"],
    Sunset: ["Ground Pound"],
    Dawn: ["Celestial Nova"],
  },
  special: {
    Glowing: ["Thunder Strike", "Arcane Burst"],
    Sparkles: ["Elemental Storm"],
    Aura: ["Mystic Barrier"],
    Wings: ["Dragon Cyclone", "Wall Runner"],
    Tattoo: ["Berserker Rage"],
    Scar: ["Ground Pound"],
    Mark: ["Holy Strike"],
    Shadow: ["Shadow Assassin", "Stealth Crawl"],
    Pattern: ["Tornado Spin"],
  },
  clothes: {
    Armor: ["Ground Pound", "Divine Shield"],
    Robe: ["Arcane Burst", "Mystic Barrier"],
    Hoodie: ["Lightning Dash", "Wall Runner"],
    Punk: ["Tornado Spin", "Berserker Rage"],
    Cyber: ["Thunder Strike"],
    Magical: ["Elemental Storm"],
    Royal: ["Holy Strike"],
  },
  mood: {
    Fierce: ["Berserker Rage", "Ground Pound"],
    Mysterious: ["Shadow Assassin", "Stealth Crawl"],
    Wild: ["Tornado Spin", "Lightning Dash"],
    Calm: ["Mystic Barrier"],
    Bold: ["Dragon Cyclone"],
  },
  weather: {
    Stormy: ["Thunder Strike", "Lightning Dash"],
    Windy: ["Tornado Spin", "Wall Runner"],
    Foggy: ["Stealth Crawl", "Shadow Assassin"],
    Aurora: ["Elemental Storm"],
    Thunder: ["Dragon Cyclone"],
  },
} as const;

export function calculateStats(traits: Trait): Stats {
  const stats = { ...BASE_STATS };
  let totalModifiers = 0;

  // Calculate stat modifiers based on traits
  Object.entries(traits).forEach(([traitType, traitValue]) => {
    const traitCategory =
      TRAIT_STAT_WEIGHTS[traitType as keyof typeof TRAIT_STAT_WEIGHTS];
    if (traitCategory) {
      const traitModifiers =
        traitCategory[traitValue as keyof typeof traitCategory];
      if (traitModifiers) {
        Object.entries(traitModifiers).forEach(([stat, value]) => {
          if (!(stat in stats)) {
            stats[stat as keyof Stats] = BASE_STATS[stat as keyof Stats] || 15;
          }
          stats[stat as keyof Stats]! += value as number;
          totalModifiers += Math.abs(value as number);
        });
      }
    }
  });

  // Apply balancing factor - increased to allow for higher stats
  const balancingFactor = Math.min(1.5, 60 / totalModifiers);
  Object.keys(stats).forEach((stat) => {
    const value = stats[stat as keyof Stats]!;
    const baseValue = BASE_STATS[stat as keyof typeof BASE_STATS] || 15;
    const balanced = baseValue + (value - baseValue) * balancingFactor;
    stats[stat as keyof Stats] = Math.max(
      10,
      Math.min(30, Math.round(balanced))
    );
  });

  return stats;
}

export function calculateSkills(stats: Stats): Skills {
  const skills = { ...BASE_SKILLS };

  // Enhanced skill calculations with weighted stat influences
  skills.attack = Math.round(
    (stats.strength * 0.5 + stats.agility * 0.3 + stats.vitality * 0.2) / 2
  );

  skills.defense = Math.round(
    (stats.vitality * 0.4 + stats.strength * 0.3 + stats.agility * 0.3) / 2
  );

  skills.magic = Math.round(
    (stats.intelligence * 0.5 + stats.charisma * 0.3 + stats.vitality * 0.2) / 2
  );

  skills.speed = Math.round(
    (stats.agility * 0.6 + stats.vitality * 0.2 + stats.intelligence * 0.2) / 2
  );

  // Ensure skills stay within reasonable bounds
  Object.keys(skills).forEach((skill) => {
    skills[skill as keyof Skills] = Math.max(
      5,
      Math.min(25, skills[skill as keyof Skills])
    );
  });

  return skills;
}

export function determineSpecialMoves(stats: Stats): string[] {
  const specialMoves: string[] = [];

  Object.entries(SPECIAL_MOVES).forEach(([_, move]) => {
    let meetsRequirements = true;
    Object.entries(move.requirements).forEach(([stat, threshold]) => {
      const statValue = stats[stat as keyof Stats];
      if (typeof statValue === "number" && statValue < threshold) {
        meetsRequirements = false;
      }
    });
    if (meetsRequirements) {
      specialMoves.push(move.name);
    }
  });

  return specialMoves;
}

function getTraitBasedMoves(traits: Trait): string[] {
  const moveSet = new Set<string>();

  // Check each trait category for moves
  Object.entries(TRAIT_MOVE_MAPPING).forEach(([category, moveMapping]) => {
    const traitValue = traits[category as keyof Trait];
    const moves = moveMapping[traitValue as keyof typeof moveMapping];
    if (moves && Array.isArray(moves)) {
      moves.forEach((move: string) => moveSet.add(move));
    }
  });

  return Array.from(moveSet);
}

export function createAgent(id: number, traits: Trait, address?: string) {
  const stats = calculateStats(traits);
  const skills = calculateSkills(stats);

  // Get moves based on traits
  const traitMoves = getTraitBasedMoves(traits);
  console.log("Traits:", traits);
  console.log("Stats:", stats);
  console.log("Possible moves from traits:", traitMoves);

  // Get moves that meet stat requirements
  const availableMoves = traitMoves.filter((moveName) => {
    const move = SPECIAL_MOVES[moveName];
    if (!move) {
      console.log(`Move ${moveName} not found in SPECIAL_MOVES`);
      return false;
    }
    const canUse = canUseMove(stats, move);
    console.log(`Move ${moveName} - Can use: ${canUse}`);
    return canUse;
  });

  console.log("Final available moves:", availableMoves);

  return {
    id,
    traits,
    stats,
    skills,
    specialMoves: availableMoves,
    level: 1,
    experience: 0,
    address: address || "",
  };
}

// Helper function to check if a move can be used based on stats
function canUseMove(stats: Stats, move: SpecialMoveDetails): boolean {
  return Object.entries(move.requirements).every(
    ([stat, required]) => (stats[stat as keyof Stats] || 0) >= required
  );
}
