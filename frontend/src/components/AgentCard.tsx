import type { Agent } from "../systems/agent/types";
import { motion } from "framer-motion";

interface AgentCardProps {
  agent: Agent;
  onClick?: () => void;
  selected?: boolean;
}

export function AgentCard({
  agent,
  onClick,
  selected = false,
}: AgentCardProps) {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`
        p-6 rounded-lg shadow-lg cursor-pointer
        ${selected ? "bg-purple-700 ring-2 ring-purple-400" : "bg-gray-800"}
        transition-colors duration-200
      `}
    >
      <div className="flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-bold">Agent #{agent.id}</h3>
          <span className="text-sm bg-purple-600 px-2 py-1 rounded">
            Level {agent.level}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <h4 className="text-purple-400 font-semibold mb-2">Stats</h4>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span>Strength:</span>
                <span>{agent.stats.strength}</span>
              </div>
              <div className="flex justify-between">
                <span>Agility:</span>
                <span>{agent.stats.agility}</span>
              </div>
              <div className="flex justify-between">
                <span>Intelligence:</span>
                <span>{agent.stats.intelligence}</span>
              </div>
              <div className="flex justify-between">
                <span>Charisma:</span>
                <span>{agent.stats.charisma}</span>
              </div>
              <div className="flex justify-between">
                <span>Vitality:</span>
                <span>{agent.stats.vitality}</span>
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-purple-400 font-semibold mb-2">Skills</h4>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span>Attack:</span>
                <span>{agent.skills.attack}</span>
              </div>
              <div className="flex justify-between">
                <span>Defense:</span>
                <span>{agent.skills.defense}</span>
              </div>
              <div className="flex justify-between">
                <span>Magic:</span>
                <span>{agent.skills.magic}</span>
              </div>
              <div className="flex justify-between">
                <span>Speed:</span>
                <span>{agent.skills.speed}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4">
          <h4 className="text-purple-400 font-semibold mb-2">Traits</h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            {Object.entries(agent.traits).map(([trait, value]) => (
              <div key={trait} className="flex justify-between">
                <span className="capitalize">{trait}:</span>
                <span className="text-purple-300">{value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-4 bg-purple-900/30 rounded p-2">
          <div className="flex justify-between items-center">
            <span className="text-sm">Experience</span>
            <span className="text-sm">{agent.experience} / 100</span>
          </div>
          <div className="w-full bg-purple-900 rounded-full h-2 mt-1">
            <div
              className="bg-purple-400 h-2 rounded-full"
              style={{ width: `${agent.experience}%` }}
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
}
