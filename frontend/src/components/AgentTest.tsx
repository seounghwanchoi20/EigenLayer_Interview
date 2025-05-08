import { useAccount, useReadContract } from "wagmi";
import { useState } from "react";

const CONTRACT_ADDRESS = "0xE835d7E3674fF39699C0843cc0A68cdB873D8529";

const nftAbi = [
  {
    inputs: [{ name: "owner", type: "address" }],
    name: "balanceOf",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "tokenId", type: "uint256" }],
    name: "getNFTTraits",
    outputs: [
      {
        components: [
          { name: "background", type: "string" },
          { name: "skin", type: "string" },
          { name: "eyes", type: "string" },
          { name: "mouth", type: "string" },
          { name: "outfit", type: "string" },
          { name: "accessory", type: "string" },
          { name: "hat", type: "string" },
        ],
        name: "traits",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
] as const;

export function AgentTest() {
  const { address, isConnected } = useAccount();
  const [selectedTokenId, setSelectedTokenId] = useState<number | null>(null);

  // Get user's NFT balance
  const { data: balance } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: nftAbi,
    functionName: "balanceOf",
    args: [address!],
    query: {
      enabled: !!address,
    },
  });

  // For testing, we'll create an array of token IDs based on the balance
  const tokenIds = balance
    ? Array.from({ length: Number(balance) }, (_, i) => i)
    : [];

  console.log(
    "Balance:",
    balance?.toString() || "Loading...",
    "Address:",
    address
  );
  console.log("Token IDs:", tokenIds);

  if (!isConnected) {
    return (
      <div className="text-center py-8">
        <p className="text-xl">
          Please connect your wallet to view your NFT agents.
        </p>
      </div>
    );
  }

  if (tokenIds.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-xl">No NFTs found in your wallet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tokenIds.map((tokenId) => (
          <div
            key={tokenId}
            className={`p-4 border border-gray-700 rounded-lg ${
              selectedTokenId === tokenId ? "ring-2 ring-blue-500" : ""
            }`}
            onClick={() => setSelectedTokenId(tokenId)}
          >
            <h3 className="text-lg font-semibold mb-2">NFT #{tokenId}</h3>
            <TraitDisplay tokenId={tokenId} />
          </div>
        ))}
      </div>
    </div>
  );
}

function TraitDisplay({ tokenId }: { tokenId: number }) {
  const { data: traits } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: nftAbi,
    functionName: "getNFTTraits",
    args: [BigInt(tokenId)],
  });

  if (!traits) {
    return <div>Loading traits...</div>;
  }

  return (
    <div className="space-y-2">
      <div>Background: {traits.background}</div>
      <div>Skin: {traits.skin}</div>
      <div>Eyes: {traits.eyes}</div>
      <div>Mouth: {traits.mouth}</div>
      <div>Outfit: {traits.outfit}</div>
      <div>Accessory: {traits.accessory}</div>
      <div>Hat: {traits.hat}</div>
    </div>
  );
}
