export interface Trait {
  background: string;
  skin: string;
  eyes: string;
  mouth: string;
  headwear: string;
  clothes: string;
  accessory: string;
  special: string;
  mood: string;
  weather: string;
}

export interface Stats {
  strength: number;
  agility: number;
  intelligence: number;
  charisma: number;
  vitality: number;
  stealth?: number;
  defense?: number;
  magic?: number;
  comfort?: number;
  speed?: number;
}

export interface Skills {
  attack: number;
  defense: number;
  magic: number;
  speed: number;
}

export interface Agent {
  id: number;
  traits: Trait;
  stats: Stats;
  skills: Skills;
  specialMoves: string[];
  level: number;
  experience: number;
  address: string;
}

export type TraitCategory = keyof Trait;
export type StatCategory = keyof Stats;
export type SkillCategory = keyof Skills;

export interface SpecialMove {
  name: string;
  requirements: Partial<Stats>;
  effect?: string;
  cooldown?: number;
}
