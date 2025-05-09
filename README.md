# Eigen Arena

## Project Overview

Eigen Arena is a battle game based on NFTs where:

1. Users can enroll their NFTs into the game
2. The system parses traits from each NFT to determine AI agent skills and abilities
3. These AI agents can battle against each other in real-time multiplayer combat

## Key Components

- **NFT Enrollment**: Connect your wallet and use your NFTs to create battle agents
- **Trait Parsing**: NFT traits are analyzed to generate unique combat abilities
- **AI Battle System**: Agents battle using skills and moves determined by their NFT traits

## Technology Used

- **Frontend**: React, Tailwind CSS, Framer Motion
- **Backend**: Node.js WebSocket server for multiplayer
- **AI Integration**: OpenAI API for battle decision making
- **Blockchain**: Base Sepolia for NFT contracts
- **Wallet Connection**: RainbowKit/Wagmi

## Setup

### Backend

```
cd backend
npm install
npm run build && npm run start
```

### Frontend

```
cd frontend
npm install
```

Create a `.env` file with your OpenAI API key:

```
VITE_OPENAI_API_KEY=your_api_key_here
```

Start the frontend:

```
npm run dev
```

## License

[MIT License](LICENSE)
