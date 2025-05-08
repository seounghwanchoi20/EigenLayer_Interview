import WebSocket from "ws";
import { randomUUID } from "crypto";

interface Player {
  id: string;
  address: string;
  agent: any;
  status: "waiting" | "in_battle";
  ws: WebSocket;
}

interface Challenge {
  from: string;
  to: string;
  timestamp: number;
}

class GameServer {
  private players: Map<string, Player> = new Map();
  private challenges: Map<string, Challenge> = new Map();
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
    console.log(`Received message from ${playerId}:`, data.type);

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

    challenger.status = "in_battle";
    player.status = "in_battle";

    challenger.ws.send(
      JSON.stringify({
        type: "battle_start",
        opponent: {
          address: player.address,
          agent: player.agent,
        },
      })
    );

    player.ws.send(
      JSON.stringify({
        type: "battle_start",
        opponent: {
          address: challenger.address,
          agent: challenger.agent,
        },
      })
    );

    this.challenges.delete(challengeId);
    this.broadcastWaitingRoomUpdate();

    console.log(`Battle started: ${challenger.address} vs ${player.address}`);
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

  private handleDisconnect(playerId: string) {
    this.handleLeaveWaitingRoom(playerId);
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
