import { useAccount, useContractRead } from "wagmi";
import { useState } from "react";
import { motion } from "framer-motion";
import { createAgent } from "../systems/agent/traitParser";
import type { Agent, Trait } from "../systems/agent/types";

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
  ] as const;

  const { data: traits, isLoading } = useContractRead({
    address: CONTRACT_ADDRESS,
    abi,
    functionName: "getNFTTraits",
    args: selectedNFT !== null ? [BigInt(selectedNFT)] : undefined,
    query: {
      enabled: selectedNFT !== null,
    },
  });

  // Create agent from traits
  const agent: Agent | null = traits
    ? createAgent(selectedNFT || 0, traits as unknown as Trait)
    : null;

  if (!isConnected) {
    return (
      <div className="text-center py-10">
        <h2 className="text-xl">
          Please connect your wallet to view your NFTs
        </h2>
      </div>
    );
  }

  const StatBar = ({
    value,
    maxValue,
    color,
  }: {
    value: number;
    maxValue: number;
    color: string;
  }) => (
    <div className="w-full bg-gray-700 rounded-full h-2">
      <div
        className={`${color} h-2 rounded-full transition-all duration-500`}
        style={{ width: `${(value / maxValue) * 100}%` }}
      />
    </div>
  );

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
            {selectedNFT === tokenId && traits && agent && (
              <div className="space-y-4">
                {/* Traits Section */}
                <div className="space-y-1 text-sm">
                  <h4 className="text-purple-400 font-semibold mb-2">Traits</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {(Object.entries(traits) as [string, string][]).map(
                      ([trait, value]) => (
                        <div key={trait} className="flex justify-between">
                          <span className="capitalize">{trait}:</span>
                          <span className="text-purple-300">{value}</span>
                        </div>
                      )
                    )}
                  </div>
                </div>

                {/* Stats Section */}
                <div>
                  <h4 className="text-purple-400 font-semibold mb-2">Stats</h4>
                  <div className="space-y-2">
                    {Object.entries(agent.stats).map(([stat, value]) => (
                      <div key={stat} className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="capitalize">{stat}</span>
                          <span>{value}/30</span>
                        </div>
                        <StatBar
                          value={value}
                          maxValue={30}
                          color="bg-blue-500"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Skills Section */}
                <div>
                  <h4 className="text-purple-400 font-semibold mb-2">Skills</h4>
                  <div className="space-y-2">
                    {Object.entries(agent.skills).map(([skill, value]) => (
                      <div key={skill} className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="capitalize">{skill}</span>
                          <span>{value}/25</span>
                        </div>
                        <StatBar
                          value={value}
                          maxValue={25}
                          color="bg-green-500"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Level and Experience */}
                <div>
                  <h4 className="text-purple-400 font-semibold mb-2">
                    Progress
                  </h4>
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>Level {agent.level}</span>
                      <span>{agent.experience}/100 XP</span>
                    </div>
                    <StatBar
                      value={agent.experience}
                      maxValue={100}
                      color="bg-yellow-500"
                    />
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default NFTGallery;
