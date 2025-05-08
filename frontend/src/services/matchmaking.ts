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
    console.log("Received message:", data);

    switch (data.type) {
      case "connected":
        this.playerId = data.playerId;
        break;
      case "waiting_room_update":
        this.emit("player_list", data.players);
        break;
      case "challenge_received":
        this.emit("challenge_received", data.challenger);
        break;
      case "challenge_declined":
        this.emit("challenge_declined", data.opponentAddress);
        break;
      case "battle_start":
        this.emit("battle_start", data.opponent);
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
}

export const matchmaking = new MatchmakingService();
