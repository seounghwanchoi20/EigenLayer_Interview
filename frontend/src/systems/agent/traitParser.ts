import type { Trait, Stats, Skills } from "./types";

// Trait influence weights for stats
const TRAIT_STAT_WEIGHTS = {
  background: {
    dungeon: { strength: 2, vitality: 1 },
    castle: { charisma: 2, intelligence: 1 },
    forest: { agility: 2, vitality: 1 },
    city: { intelligence: 2, charisma: 1 },
  },
  skin: {
    normal: { vitality: 1 },
    pale: { intelligence: 1 },
    dark: { strength: 1 },
    golden: { charisma: 1 },
  },
  eyes: {
    normal: { intelligence: 1 },
    glowing: { magic: 2 },
    fierce: { strength: 1 },
    cute: { charisma: 1 },
  },
  // Add more trait mappings as needed
};

// Base stats for all agents
const BASE_STATS: Stats = {
  strength: 10,
  agility: 10,
  intelligence: 10,
  charisma: 10,
  vitality: 10,
};

// Base skills for all agents
const BASE_SKILLS: Skills = {
  attack: 5,
  defense: 5,
  magic: 5,
  speed: 5,
};

export function calculateStats(traits: Trait): Stats {
  const stats = { ...BASE_STATS };

  // Calculate stat modifiers based on traits
  Object.entries(traits).forEach(([traitType, traitValue]) => {
    const traitCategory =
      TRAIT_STAT_WEIGHTS[traitType as keyof typeof TRAIT_STAT_WEIGHTS];
    if (traitCategory) {
      const traitModifiers =
        traitCategory[traitValue as keyof typeof traitCategory];
      if (traitModifiers) {
        Object.entries(traitModifiers).forEach(([stat, value]) => {
          stats[stat as keyof Stats] += value as number;
        });
      }
    }
  });

  return stats;
}

export function calculateSkills(stats: Stats): Skills {
  const skills = { ...BASE_SKILLS };

  // Calculate skills based on stats
  skills.attack = Math.floor((stats.strength * 0.7 + stats.agility * 0.3) / 2);
  skills.defense = Math.floor(
    (stats.vitality * 0.7 + stats.strength * 0.3) / 2
  );
  skills.magic = Math.floor(
    (stats.intelligence * 0.7 + stats.charisma * 0.3) / 2
  );
  skills.speed = Math.floor((stats.agility * 0.7 + stats.vitality * 0.3) / 2);

  return skills;
}

export function createAgent(id: number, traits: Trait) {
  const stats = calculateStats(traits);
  const skills = calculateSkills(stats);

  return {
    id,
    traits,
    stats,
    skills,
    level: 1,
    experience: 0,
  };
}
