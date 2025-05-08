import { useAccount, useContractRead } from "wagmi";
import { useState } from "react";
import { motion } from "framer-motion";

const CONTRACT_ADDRESS = "0xE835d7E3674fF39699C0843cc0A68cdB873D8529";

const NFTGallery = () => {
  const { address, isConnected } = useAccount();
  const [selectedNFT, setSelectedNFT] = useState<number | null>(null);

  // ABI for just the functions we need
  const abi = [
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
  ];

  const { data: traits, isLoading } = useContractRead({
    address: CONTRACT_ADDRESS,
    abi,
    functionName: "getNFTTraits",
    args: [selectedNFT || 0],
    enabled: selectedNFT !== null,
  });

  if (!isConnected) {
    return (
      <div className="text-center py-10">
        <h2 className="text-xl">
          Please connect your wallet to view your NFTs
        </h2>
      </div>
    );
  }

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[0, 1, 2].map((tokenId) => (
          <motion.div
            key={tokenId}
            whileHover={{ scale: 1.05 }}
            className={`p-4 rounded-lg ${
              selectedNFT === tokenId ? "bg-purple-700" : "bg-gray-800"
            } cursor-pointer`}
            onClick={() => setSelectedNFT(tokenId)}
          >
            <h3 className="text-xl font-bold mb-2">Arena Fighter #{tokenId}</h3>
            {selectedNFT === tokenId && traits && (
              <div className="space-y-1 text-sm">
                <p>Background: {traits.background}</p>
                <p>Skin: {traits.skin}</p>
                <p>Eyes: {traits.eyes}</p>
                <p>Mouth: {traits.mouth}</p>
                <p>Headwear: {traits.headwear}</p>
                <p>Clothes: {traits.clothes}</p>
                <p>Accessory: {traits.accessory}</p>
                <p>Special: {traits.special}</p>
                <p>Mood: {traits.mood}</p>
                <p>Weather: {traits.weather}</p>
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default NFTGallery;
