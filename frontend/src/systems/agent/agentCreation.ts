import { useReadContract } from "wagmi";
import type { Trait } from "./types";
import { createAgent } from "./traitParser";

// Function to validate traits match our expected format
export function validateTraits(traits: unknown): traits is Trait {
  if (!traits || typeof traits !== "object") return false;

  const requiredKeys: (keyof Trait)[] = [
    "background",
    "skin",
    "eyes",
    "mouth",
    "headwear",
    "clothes",
    "accessory",
    "special",
    "mood",
    "weather",
  ];

  return requiredKeys.every(
    (key) =>
      key in traits &&
      typeof (traits as Record<string, unknown>)[key] === "string"
  );
}

// Contract ABI for getNFTTraits function
const NFT_ABI = [
  {
    inputs: [{ internalType: "uint256", name: "tokenId", type: "uint256" }],
    name: "getNFTTraits",
    outputs: [
      {
        components: [
          { internalType: "string", name: "background", type: "string" },
          { internalType: "string", name: "skin", type: "string" },
          { internalType: "string", name: "eyes", type: "string" },
          { internalType: "string", name: "mouth", type: "string" },
          { internalType: "string", name: "headwear", type: "string" },
          { internalType: "string", name: "clothes", type: "string" },
          { internalType: "string", name: "accessory", type: "string" },
          { internalType: "string", name: "special", type: "string" },
          { internalType: "string", name: "mood", type: "string" },
          { internalType: "string", name: "weather", type: "string" },
        ],
        internalType: "struct ArenaFighter.NFTTraits",
        name: "",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
] as const;

// Contract address from your deployment
const CONTRACT_ADDRESS = "0xE835d7E3674fF39699C0843cc0A68cdB873D8529";

export function useCreateAgent(tokenId: number) {
  const {
    data: traits,
    isError,
    isLoading,
  } = useReadContract({
    address: CONTRACT_ADDRESS as `0x${string}`,
    abi: NFT_ABI,
    functionName: "getNFTTraits",
    args: [BigInt(tokenId)],
  });

  if (isLoading) {
    return { agent: null, isLoading: true, error: null };
  }

  if (isError || !traits) {
    return {
      agent: null,
      isLoading: false,
      error: "Failed to fetch NFT traits",
    };
  }

  if (!validateTraits(traits)) {
    return {
      agent: null,
      isLoading: false,
      error: "Invalid traits format received from contract",
    };
  }

  // Create agent using the NFT traits
  const agent = createAgent(tokenId, traits);
  return { agent, isLoading: false, error: null };
}
