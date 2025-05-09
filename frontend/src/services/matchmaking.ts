import { EventEmitter } from "events";
import type { Agent } from "../systems/agent/types";
import { WS_URL } from "../config/websocket";

export interface Player {
  address: string;
  agent: Agent;
  status: "waiting" | "in_battle";
  timestamp: number;
}

class MatchmakingService extends EventEmitter {
  private ws: WebSocket | null = null;
  private playerId: string | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectTimeout: number = 1000;
  private isConnected: boolean = false;
  private connectionPromise: Promise<void> | null = null;
  private currentBattleId: string | null = null;

  constructor() {
    super();
    this.connect();
  }

  private connect(): Promise<void> {
    if (this.ws?.readyState === WebSocket.OPEN) {
      return Promise.resolve<void>(undefined);
    }

    if (this.connectionPromise) {
      return this.connectionPromise;
    }

    this.connectionPromise = new Promise<void>((resolve, reject) => {
      try {
        console.log("Connecting to WebSocket server at:", WS_URL);
        this.ws = new WebSocket(WS_URL);

        this.ws.onopen = () => {
          console.log("WebSocket connection established");
          this.reconnectAttempts = 0;
          this.reconnectTimeout = 1000;
          this.isConnected = true;
          this.emit("connected");
          resolve();
        };

        this.ws.onclose = () => {
          console.log("WebSocket connection closed");
          this.handleDisconnect();
          reject(new Error("WebSocket connection closed"));
        };

        this.ws.onerror = (error) => {
          console.error("WebSocket error:", error);
          this.handleDisconnect();
          reject(error);
        };

        this.setupMessageHandler();
      } catch (error) {
        console.error("Failed to connect to matchmaking server:", error);
        this.handleDisconnect();
        reject(error);
      }
    }).finally(() => {
      this.connectionPromise = null;
    });

    return this.connectionPromise;
  }

  private setupMessageHandler() {
    if (!this.ws) return;

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        this.handleMessage(data);
      } catch (error) {
        console.error("Error parsing message:", error);
      }
    };
  }

  private handleDisconnect() {
    this.isConnected = false;
    this.emit("disconnected");

    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      console.log(
        `Attempting to reconnect (${this.reconnectAttempts + 1}/${
          this.maxReconnectAttempts
        })...`
      );
      setTimeout(() => {
        this.reconnectAttempts++;
        this.reconnectTimeout *= 2; // Exponential backoff
        this.connect();
      }, this.reconnectTimeout);
    } else {
      this.emit("connection_failed");
    }
  }

  private handleMessage(data: any) {
    console.log("Received WebSocket message:", {
      type: data.type,
      battleId: data.battleId,
      currentBattleId: this.currentBattleId,
      wsState: this.ws?.readyState,
      isConnected: this.isConnected,
    });

    switch (data.type) {
      case "connected":
        this.playerId = data.playerId;
        console.log("Connected with playerId:", this.playerId);
        break;
      case "waiting_room_update":
        console.log("Waiting room update:", data.players);
        this.emit("player_list", data.players);
        break;
      case "challenge_received":
        console.log("Challenge received from:", data.challenger);
        this.emit("challenge_received", data.challenger);
        break;
      case "challenge_declined":
        console.log("Challenge declined by:", data.opponentAddress);
        this.emit("challenge_declined", data.opponentAddress);
        break;
      case "battle_created":
        console.log("Battle created - full state:", {
          battleId: data.battleId,
          opponent: data.opponent,
          currentBattleId: this.currentBattleId,
          wsState: this.ws?.readyState,
          isConnected: this.isConnected,
        });
        this.currentBattleId = data.battleId;
        console.log(
          "Updated battle ID in battle_created:",
          this.currentBattleId
        );
        this.emit("battle_created", {
          opponent: data.opponent,
          battleId: data.battleId,
        });
        break;
      case "battle_start":
        console.log("Battle starting - full state:", {
          battleId: data.battleId,
          opponent: data.opponent,
          isFirstTurn: data.isFirstTurn,
          currentBattleId: this.currentBattleId,
          wsState: this.ws?.readyState,
          isConnected: this.isConnected,
        });
        this.currentBattleId = data.battleId;
        console.log("Updated battle ID in battle_start:", this.currentBattleId);

        this.emit("battle_start", {
          opponent: data.opponent,
          isFirstTurn: data.isFirstTurn,
          battleId: data.battleId,
        });
        break;
      case "opponent_ready":
        console.log("Opponent ready signal received - full state:", {
          receivedBattleId: data.battleId,
          currentBattleId: this.currentBattleId,
          wsState: this.ws?.readyState,
          isConnected: this.isConnected,
        });
        console.log("Emitting opponent_ready event");
        this.emit("opponent_ready");
        break;
      case "opponent_action":
        console.log("Opponent action received (raw):", data);
        if (data.battleId === this.currentBattleId) {
          // Extract health values from the message
          const { myHealth, opponentHealth } = data;
          console.log("Extracted health values:", { myHealth, opponentHealth });

          // Forward the action with health values
          const actionWithHealth = {
            ...data.action,
            myHealth,
            opponentHealth,
          };
          console.log("Forwarding action with health:", actionWithHealth);
          this.emit("opponent_action", actionWithHealth);
        }
        break;
      case "action_confirmed":
        console.log("Action confirmed for battle:", data.battleId);
        if (data.battleId === this.currentBattleId) {
          this.emit("action_confirmed", {
            myHealth: data.myHealth,
            opponentHealth: data.opponentHealth,
            battleId: data.battleId,
          });
        }
        break;
      case "opponent_disconnected":
        console.log("Opponent disconnected from battle:", data.battleId);
        if (data.battleId === this.currentBattleId) {
          this.currentBattleId = null;
          this.emit("opponent_disconnected");
        }
        break;
      default:
        console.warn("Unknown message type:", data.type);
    }
  }

  public async joinWaitingRoom(player: Player) {
    console.log("Attempting to join waiting room with player:", player);

    if (!this.isConnected) {
      console.log("Not connected, attempting to connect...");
      try {
        await this.connect();
      } catch (error) {
        console.error("Failed to connect to server:", error);
        throw new Error("Failed to connect to matchmaking server");
      }
    }

    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error("WebSocket connection not ready");
    }

    console.log("Sending join_waiting_room message");
    this.ws.send(
      JSON.stringify({
        type: "join_waiting_room",
        address: player.address,
        agent: player.agent,
      })
    );
  }

  public leaveWaitingRoom() {
    if (!this.isConnected) {
      console.warn("Not connected to matchmaking server");
      return;
    }

    this.ws?.send(
      JSON.stringify({
        type: "leave_waiting_room",
      })
    );
  }

  public challengePlayer(opponentAddress: string) {
    if (!this.isConnected) {
      console.warn("Not connected to matchmaking server");
      return;
    }

    this.ws?.send(
      JSON.stringify({
        type: "send_challenge",
        opponentAddress,
      })
    );
  }

  public acceptChallenge(challengerAddress: string) {
    if (!this.isConnected) {
      console.warn("Not connected to matchmaking server");
      return;
    }

    this.ws?.send(
      JSON.stringify({
        type: "accept_challenge",
        challengerAddress,
      })
    );
  }

  public declineChallenge(challengerAddress: string) {
    if (!this.isConnected) {
      console.warn("Not connected to matchmaking server");
      return;
    }

    this.ws?.send(
      JSON.stringify({
        type: "decline_challenge",
        challengerAddress,
      })
    );
  }

  public sendBattleAction(action: any) {
    if (!this.isConnected || !this.currentBattleId) {
      console.warn("Not connected to battle");
      return;
    }

    this.ws?.send(
      JSON.stringify({
        type: "battle_action",
        action,
        battleId: this.currentBattleId,
      })
    );
  }

  public async initializeBattle(data: { agent1: any; agent2: any }) {
    if (!this.isConnected) {
      console.warn("Not connected to matchmaking server");
      return;
    }

    console.log("Initializing battle with agents:", data);

    this.ws?.send(
      JSON.stringify({
        type: "initialize_battle",
        agent1: data.agent1,
        agent2: data.agent2,
        timestamp: Date.now(),
      })
    );
  }

  public sendBattleReady() {
    if (!this.isConnected || !this.currentBattleId) {
      console.warn("Cannot send battle ready signal - preconditions not met:", {
        isConnected: this.isConnected,
        currentBattleId: this.currentBattleId,
        wsState: this.ws?.readyState,
      });
      return;
    }

    console.log("Sending battle ready signal for battle:", {
      battleId: this.currentBattleId,
      wsState: this.ws?.readyState,
      isConnected: this.isConnected,
    });

    this.ws?.send(
      JSON.stringify({
        type: "battle_ready",
        battleId: this.currentBattleId,
        timestamp: Date.now(),
      })
    );
  }

  public setBattleId(battleId: string) {
    console.log("Setting battle ID:", battleId);
    this.currentBattleId = battleId;
  }

  public getBattleId(): string | null {
    return this.currentBattleId;
  }
}

export const matchmaking = new MatchmakingService();
