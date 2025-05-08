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
  level: number;
  experience: number;
}

export type TraitCategory = keyof Trait;
export type StatCategory = keyof Stats;
export type SkillCategory = keyof Skills;
