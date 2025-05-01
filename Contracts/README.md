# Capture The Flag dApp

A web3 game built on Base Sepolia testnet that allows users to capture and release a virtual flag on the blockchain.

## Overview

This decentralized application (dApp) demonstrates a simple blockchain game where users can:

1. Connect their Ethereum wallet (MetaMask or similar)
2. View the current status of the flag (who owns it and when it was captured)
3. Capture the flag if it's available or owned by someone else
4. Release the flag if you're the current owner

The dApp runs on Base Sepolia testnet, a Layer 2 scaling solution for Ethereum.

## Technologies Used

- **Frontend**: React with TypeScript
- **Blockchain Connectivity**: ethers.js v6
- **Styling**: Custom CSS (no Tailwind or other frameworks)
- **Smart Contract**: Solidity 0.8.20
- **Network**: Base Sepolia testnet

## Prerequisites

- MetaMask or another web3-compatible wallet
- Base Sepolia testnet configured in your wallet
- Some Base Sepolia ETH for gas fees (available from faucets)

## Smart Contract

The application interacts with the `CaptureTheFlag` smart contract deployed on Base Sepolia. The contract has the following main functions:

- `captureFlag()`: Allows a user to capture the flag
- `releaseFlag()`: Allows the current owner to release the flag
- `getFlagStatus()`: Returns information about the current flag status

## Installation and Setup

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/capture-the-flag-dapp.git
   cd capture-the-flag-dapp
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Update the contract address in `constants.ts` file to match your deployed contract:
   ```typescript
   export const Contract_Address = "YOUR_DEPLOYED_CONTRACT_ADDRESS";
   ```

4. Start the development server:
   ```
   npm start
   ```

5. Open your browser and navigate to `http://localhost:3000`

## Contract Deployment

The smart contract can be deployed to Base Sepolia using tools like Hardhat or Remix IDE. If you need to deploy your own instance:

1. Connect your wallet to Base Sepolia network
2. Deploy the `CaptureTheFlag.sol` contract
3. Update the `Contract_Address` in `constants.ts` with your new contract address

## Project Structure

```
src/
├── components/
│   ├── FlagGame.tsx     # Main game component
│   ├── FlagGame.css     # Custom styling for the game
│   └── WalletConnect.tsx # Wallet connection component
├── App.tsx              # Main application component
├── App.css              # Application-wide styles
├── constants.ts         # Contract address and ABI
└── index.tsx            # Entry point
```

## Features

- **Wallet Connection**: Seamlessly connect your web3 wallet
- **Network Detection**: Automatically detects and prompts for Base Sepolia network
- **Live Status Updates**: See who owns the flag in real-time
- **Interactive UI**: Visual representation of flag status
- **Transaction Feedback**: Clear notifications for transaction status
- **Responsive Design**: Works on desktop and mobile devices

## License

MIT