"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ws_1 = __importDefault(require("ws"));
const crypto_1 = require("crypto");
class GameServer {
    constructor(port) {
        this.players = new Map();
        this.challenges = new Map();
        this.wss = new ws_1.default.Server({ port });
        console.log(`Game server started on port ${port}`);
        this.init();
    }
    init() {
        this.wss.on("connection", (ws) => {
            const playerId = (0, crypto_1.randomUUID)();
            console.log(`New connection: ${playerId}`);
            ws.on("message", (message) => {
                try {
                    const data = JSON.parse(message.toString());
                    this.handleMessage(playerId, ws, data);
                }
                catch (error) {
                    console.error("Failed to parse message:", error);
                }
            });
            ws.on("close", () => {
                this.handleDisconnect(playerId);
            });
            ws.send(JSON.stringify({
                type: "connected",
                playerId,
            }));
        });
    }
    handleMessage(playerId, ws, data) {
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
    handleJoinWaitingRoom(playerId, ws, data) {
        const player = {
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
    handleLeaveWaitingRoom(playerId) {
        const player = this.players.get(playerId);
        if (player) {
            this.players.delete(playerId);
            console.log(`Player ${player.address} left waiting room`);
            this.broadcastWaitingRoomUpdate();
        }
    }
    handleSendChallenge(playerId, data) {
        const challenger = this.players.get(playerId);
        if (!challenger)
            return;
        const opponent = Array.from(this.players.values()).find((p) => p.address === data.opponentAddress);
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
        opponent.ws.send(JSON.stringify({
            type: "challenge_received",
            challenger: {
                address: challenger.address,
                agent: challenger.agent,
            },
        }));
        console.log(`Challenge sent: ${challenger.address} → ${opponent.address}`);
    }
    handleAcceptChallenge(playerId, data) {
        const player = this.players.get(playerId);
        if (!player)
            return;
        const challengeId = `${data.challengerAddress}-${player.address}`;
        const challenge = this.challenges.get(challengeId);
        if (!challenge) {
            console.warn("Challenge not found");
            return;
        }
        const challenger = Array.from(this.players.values()).find((p) => p.address === challenge.from);
        if (!challenger) {
            console.warn("Challenger not found");
            return;
        }
        challenger.status = "in_battle";
        player.status = "in_battle";
        challenger.ws.send(JSON.stringify({
            type: "battle_start",
            opponent: {
                address: player.address,
                agent: player.agent,
            },
        }));
        player.ws.send(JSON.stringify({
            type: "battle_start",
            opponent: {
                address: challenger.address,
                agent: challenger.agent,
            },
        }));
        this.challenges.delete(challengeId);
        this.broadcastWaitingRoomUpdate();
        console.log(`Battle started: ${challenger.address} vs ${player.address}`);
    }
    handleDeclineChallenge(playerId, data) {
        const player = this.players.get(playerId);
        if (!player)
            return;
        const challengeId = `${data.challengerAddress}-${player.address}`;
        const challenge = this.challenges.get(challengeId);
        if (!challenge) {
            console.warn("Challenge not found");
            return;
        }
        const challenger = Array.from(this.players.values()).find((p) => p.address === challenge.from);
        if (challenger) {
            challenger.ws.send(JSON.stringify({
                type: "challenge_declined",
                opponentAddress: player.address,
            }));
        }
        this.challenges.delete(challengeId);
        console.log(`Challenge declined: ${challenge.from} → ${challenge.to}`);
    }
    handleDisconnect(playerId) {
        this.handleLeaveWaitingRoom(playerId);
    }
    broadcastWaitingRoomUpdate() {
        const waitingPlayers = Array.from(this.players.values())
            .filter((p) => p.status === "waiting")
            .map((p) => ({
            address: p.address,
            agent: p.agent,
        }));
        this.players.forEach((player) => {
            player.ws.send(JSON.stringify({
                type: "waiting_room_update",
                players: waitingPlayers,
            }));
        });
    }
}
const PORT = 8080;
new GameServer(PORT);
