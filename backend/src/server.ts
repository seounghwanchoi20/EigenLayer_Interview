import WebSocket from "ws";
import { randomUUID } from "crypto";

interface Player {
  id: string;
  address: string;
  agent: any;
  status: "waiting" | "in_battle";
  ws: WebSocket;
  battleId?: string;
}

interface Challenge {
  from: string;
  to: string;
  timestamp: number;
}

interface Battle {
  id: string;
  player1: string;
  player2: string;
  currentTurn: string;
  lastAction?: any;
  readyPlayers: Set<string>; // Track which players are ready
  player1Health: number;
  player2Health: number;
}

class GameServer {
  private players: Map<string, Player> = new Map();
  private challenges: Map<string, Challenge> = new Map();
  private battles: Map<string, Battle> = new Map();
  private wss: WebSocket.Server;

  constructor(port: number) {
    this.wss = new WebSocket.Server({ port });
    console.log(`Game server started on port ${port}`);
    this.init();
  }

  private init() {
    this.wss.on("connection", (ws: WebSocket) => {
      const playerId = randomUUID();
      console.log(`New connection: ${playerId}`);

      ws.on("message", (message: string) => {
        try {
          const data = JSON.parse(message.toString());
          this.handleMessage(playerId, ws, data);
        } catch (error) {
          console.error("Failed to parse message:", error);
        }
      });

      ws.on("close", () => {
        this.handleDisconnect(playerId);
      });

      ws.send(
        JSON.stringify({
          type: "connected",
          playerId,
        })
      );
    });
  }

  private handleMessage(playerId: string, ws: WebSocket, data: any) {
    console.log(`Received message from ${playerId}:`, data);

    switch (data.type) {
      case "join_waiting_room":
        this.handleJoinWaitingRoom(playerId, ws, data);
        break;
      case "leave_waiting_room":
        this.handleLeaveWaitingRoom(playerId);
        break;
      case "send_challenge":
        this.handleSendChallenge(playerId, data);
        break;
      case "accept_challenge":
        this.handleAcceptChallenge(playerId, data);
        break;
      case "decline_challenge":
        this.handleDeclineChallenge(playerId, data);
        break;
      case "battle_action":
        this.handleBattleAction(playerId, data);
        break;
      case "battle_ready":
        this.handleBattleReady(playerId, data.battleId);
        break;
      default:
        console.warn("Unknown message type:", data.type);
    }
  }

  private handleJoinWaitingRoom(playerId: string, ws: WebSocket, data: any) {
    const player: Player = {
      id: playerId,
      address: data.address,
      agent: data.agent,
      status: "waiting",
      ws,
    };

    this.players.set(playerId, player);
    console.log(`Player ${data.address} joined waiting room`);

    this.broadcastWaitingRoomUpdate();
  }

  private handleLeaveWaitingRoom(playerId: string) {
    const player = this.players.get(playerId);
    if (player) {
      this.players.delete(playerId);
      console.log(`Player ${player.address} left waiting room`);
      this.broadcastWaitingRoomUpdate();
    }
  }

  private handleSendChallenge(playerId: string, data: any) {
    const challenger = this.players.get(playerId);
    if (!challenger) return;

    const opponent = Array.from(this.players.values()).find(
      (p) => p.address === data.opponentAddress
    );

    if (!opponent) {
      console.warn("Opponent not found");
      return;
    }

    const challengeId = `${challenger.address}-${opponent.address}`;
    this.challenges.set(challengeId, {
      from: challenger.address,
      to: opponent.address,
      timestamp: Date.now(),
    });

    opponent.ws.send(
      JSON.stringify({
        type: "challenge_received",
        challenger: {
          address: challenger.address,
          agent: challenger.agent,
        },
      })
    );

    console.log(`Challenge sent: ${challenger.address} → ${opponent.address}`);
  }

  private handleAcceptChallenge(playerId: string, data: any) {
    const player = this.players.get(playerId);
    if (!player) return;

    const challengeId = `${data.challengerAddress}-${player.address}`;
    const challenge = this.challenges.get(challengeId);

    if (!challenge) {
      console.warn("Challenge not found");
      return;
    }

    const challenger = Array.from(this.players.values()).find(
      (p) => p.address === challenge.from
    );

    if (!challenger) {
      console.warn("Challenger not found");
      return;
    }

    // Create a new battle with initial health
    const battleId = randomUUID();
    const battle: Battle = {
      id: battleId,
      player1: challenger.id,
      player2: player.id,
      currentTurn: challenger.id,
      readyPlayers: new Set(),
      player1Health: 100,
      player2Health: 100,
    };

    this.battles.set(battleId, battle);

    // Update player states
    challenger.status = "in_battle";
    challenger.battleId = battleId;
    player.status = "in_battle";
    player.battleId = battleId;

    // Notify both players about the battle creation
    challenger.ws.send(
      JSON.stringify({
        type: "battle_created",
        battleId,
        opponent: {
          address: player.address,
          agent: player.agent,
        },
      })
    );

    player.ws.send(
      JSON.stringify({
        type: "battle_created",
        battleId,
        opponent: {
          address: challenger.address,
          agent: challenger.agent,
        },
      })
    );

    this.challenges.delete(challengeId);
    this.broadcastWaitingRoomUpdate();

    console.log(`Battle created: ${challenger.address} vs ${player.address}`);
  }

  private handleDeclineChallenge(playerId: string, data: any) {
    const player = this.players.get(playerId);
    if (!player) return;

    const challengeId = `${data.challengerAddress}-${player.address}`;
    const challenge = this.challenges.get(challengeId);

    if (!challenge) {
      console.warn("Challenge not found");
      return;
    }

    const challenger = Array.from(this.players.values()).find(
      (p) => p.address === challenge.from
    );

    if (challenger) {
      challenger.ws.send(
        JSON.stringify({
          type: "challenge_declined",
          opponentAddress: player.address,
        })
      );
    }

    this.challenges.delete(challengeId);
    console.log(`Challenge declined: ${challenge.from} → ${challenge.to}`);
  }

  private handleBattleAction(playerId: string, data: any) {
    console.log(
      `[Battle Action] Starting battle action for player ${playerId}`
    );
    console.log(`[Battle Action] Current action data:`, data);

    const player = this.players.get(playerId);
    if (!player || !player.battleId) {
      console.warn("[Battle Action] Player not in battle");
      return;
    }

    const battle = this.battles.get(player.battleId);
    if (!battle) {
      console.warn("[Battle Action] Battle not found");
      return;
    }

    // Store old health values
    const oldPlayer1Health = battle.player1Health;
    const oldPlayer2Health = battle.player2Health;

    // Calculate new health values
    const damage = data.action.damage || 0;
    console.log(`[Battle Action] Processing damage: ${damage}`);

    // Initialize health variables
    let myNewHealth: number;
    let opponentNewHealth: number;

    // Update health based on who is attacking
    if (player.id === battle.player1) {
      // Player 1 attacking Player 2
      battle.player2Health = Math.max(0, battle.player2Health - damage);
      myNewHealth = oldPlayer1Health; // Attacker's health unchanged
      opponentNewHealth = battle.player2Health; // Defender's new health
    } else {
      // Player 2 attacking Player 1
      battle.player1Health = Math.max(0, battle.player1Health - damage);
      myNewHealth = oldPlayer2Health; // Attacker's health unchanged
      opponentNewHealth = battle.player1Health; // Defender's new health
    }

    // Log health updates
    console.log(`[Battle Action] Updated health values:`, {
      player1Health: battle.player1Health,
      player2Health: battle.player2Health,
      myNewHealth,
      opponentNewHealth,
    });

    // Update battle state
    battle.lastAction = data.action;

    // Only switch turns if both players are still alive
    if (battle.player1Health > 0 && battle.player2Health > 0) {
      battle.currentTurn =
        battle.player1 === player.id ? battle.player2 : battle.player1;
    }

    this.battles.set(battle.id, battle);

    // Get opponent
    const opponentId =
      battle.player1 === player.id ? battle.player2 : battle.player1;
    const opponent = this.players.get(opponentId);
    if (!opponent) {
      console.warn("[Battle Action] Opponent not found");
      return;
    }

    // Send action to opponent with health updates
    const opponentMessage = {
      type: "opponent_action",
      action: {
        ...data.action,
        damage: data.action.damage || 0,
        effects: data.action.effects || [],
      },
      myHealth: opponentNewHealth, // Opponent receives their new health
      opponentHealth: myNewHealth, // And attacker's unchanged health
      battleId: battle.id,
    };

    // Send confirmation to player with health updates
    const playerMessage = {
      type: "action_confirmed",
      battleId: battle.id,
      myHealth: myNewHealth, // Attacker's unchanged health
      opponentHealth: opponentNewHealth, // Defender's new health
    };

    // Ensure messages are properly stringified
    const opponentMessageString = JSON.stringify(opponentMessage);
    const playerMessageString = JSON.stringify(playerMessage);

    console.log(`[Battle Action] Sending messages (stringified):`, {
      opponentMessage: opponentMessageString,
      playerMessage: playerMessageString,
    });

    opponent.ws.send(opponentMessageString);
    player.ws.send(playerMessageString);

    // Log final state
    console.log(`[Battle Action] Final state:`, {
      playerId,
      damage,
      player1Health: battle.player1Health,
      player2Health: battle.player2Health,
      currentTurn: battle.currentTurn,
    });
  }

  private handleBattleReady(playerId: string, battleId: string) {
    console.log(
      `[Battle] Received battle_ready from player ${playerId} for battle ${battleId}`
    );

    const player = this.players.get(playerId);
    if (!player) {
      console.warn("[Battle] Player not found:", playerId);
      return;
    }

    const battle = this.battles.get(battleId);
    if (!battle) {
      console.warn("[Battle] Battle not found:", battleId);
      return;
    }

    // Debug log before adding player
    console.log(`[Battle ${battleId}] Current ready players before adding:`, {
      readyPlayers: Array.from(battle.readyPlayers),
      readyCount: battle.readyPlayers.size,
    });

    // Add this player to ready set if not already ready
    if (!battle.readyPlayers.has(playerId)) {
      battle.readyPlayers.add(playerId);
      console.log(`[Battle ${battleId}] Added player ${playerId} to ready set`);
    } else {
      console.log(`[Battle ${battleId}] Player ${playerId} was already ready`);
    }

    // Debug log after adding player
    console.log(`[Battle ${battleId}] Ready players after adding:`, {
      readyPlayers: Array.from(battle.readyPlayers),
      readyCount: battle.readyPlayers.size,
      player1: battle.player1,
      player2: battle.player2,
      player1Ready: battle.readyPlayers.has(battle.player1),
      player2Ready: battle.readyPlayers.has(battle.player2),
    });

    // If both players are ready, start the battle immediately
    if (
      battle.readyPlayers.has(battle.player1) &&
      battle.readyPlayers.has(battle.player2)
    ) {
      console.log(
        `[Battle ${battleId}] Both players are ready, starting battle!`
      );
      const player1 = this.players.get(battle.player1);
      const player2 = this.players.get(battle.player2);

      if (!player1 || !player2) {
        console.error(
          `[Battle ${battleId}] Cannot start battle - missing players:`,
          {
            player1Present: !!player1,
            player2Present: !!player2,
          }
        );
        return;
      }

      // Send battle_start to both players
      const player1Message = {
        type: "battle_start",
        opponent: {
          address: player2.address,
          agent: player2.agent,
        },
        battleId: battleId,
        isFirstTurn: true,
        myHealth: battle.player1Health,
        opponentHealth: battle.player2Health,
      };

      const player2Message = {
        type: "battle_start",
        opponent: {
          address: player1.address,
          agent: player1.agent,
        },
        battleId: battleId,
        isFirstTurn: false,
        myHealth: battle.player2Health,
        opponentHealth: battle.player1Health,
      };

      console.log(
        `[Battle ${battleId}] Sending battle_start messages with health:`,
        {
          player1Message,
          player2Message,
          currentHealth: {
            player1: battle.player1Health,
            player2: battle.player2Health,
          },
        }
      );

      player1.ws.send(JSON.stringify(player1Message));
      player2.ws.send(JSON.stringify(player2Message));

      // Update battle state
      battle.currentTurn = battle.player1; // Set first player's turn
      this.battles.set(battleId, battle);
    } else {
      // Notify the other player that this player is ready
      const opponentId =
        battle.player1 === playerId ? battle.player2 : battle.player1;
      const opponent = this.players.get(opponentId);

      if (opponent) {
        console.log(
          `[Battle ${battleId}] Notifying opponent ${opponentId} that player ${playerId} is ready`
        );
        opponent.ws.send(
          JSON.stringify({
            type: "opponent_ready",
            battleId: battleId,
          })
        );
      } else {
        console.warn(
          `[Battle ${battleId}] Cannot notify opponent ${opponentId} - not found`
        );
      }
    }
  }

  private handleDisconnect(playerId: string) {
    const player = this.players.get(playerId);
    if (!player) return;

    // If player was in battle, notify opponent
    if (player.battleId) {
      const battle = this.battles.get(player.battleId);
      if (battle) {
        const opponentId =
          battle.player1 === playerId ? battle.player2 : battle.player1;
        const opponent = this.players.get(opponentId);
        if (opponent) {
          opponent.ws.send(
            JSON.stringify({
              type: "opponent_disconnected",
            })
          );
          opponent.status = "waiting";
          opponent.battleId = undefined;
        }
        this.battles.delete(player.battleId);
      }
    }

    this.players.delete(playerId);
    this.broadcastWaitingRoomUpdate();
  }

  private broadcastWaitingRoomUpdate() {
    const waitingPlayers = Array.from(this.players.values())
      .filter((p) => p.status === "waiting")
      .map((p) => ({
        address: p.address,
        agent: p.agent,
      }));

    this.players.forEach((player) => {
      player.ws.send(
        JSON.stringify({
          type: "waiting_room_update",
          players: waitingPlayers,
        })
      );
    });
  }
}

const PORT = 8080;
new GameServer(PORT);
