# Capture the Flag DApp - Backend

This is the backend service for the Capture the Flag decentralized application. It provides an API to query past flag capture/release events and track capture counts per address.

## Features

- Query current flag status
- Get historical flag events (capture and release)
- Track capture counts per address (leaderboard)
- Filter events by address and timestamp
- Real-time event tracking using contract event listeners

## Tech Stack

- **Node.js**: Runtime environment
- **Express.js**: Web framework
- **TypeScript**: Programming language
- **Ethers.js**: Ethereum interaction library
- **Jest**: Testing framework

## Project Structure

```
backend/
├── src/
│   ├── app.ts              // Main Express application
│   ├── server.ts           // Server entry point
│   ├── config/
│   │   └── index.ts        // Configuration settings
│   ├── controllers/
│   │   └── flagController.ts // Endpoints for flag events
│   ├── services/
│   │   └── ethService.ts   // Ethereum interaction service
│   ├── models/
│   │   └── types.ts        // Type definitions
│   ├── utils/
│   │   └── logger.ts       // Logging utility
│   └── middleware/
│       └── errorHandler.ts // Error handling middleware
└── tests/
    └── flag.test.ts        // Tests for flag endpoints
```

## API Endpoints

- `GET /api/flag/status` - Get current flag status
- `GET /api/flag/events` - Get historical flag events
  - Query parameters:
    - `limit` (optional): Maximum number of events to return
    - `from` (optional): Timestamp to filter events from
- `GET /api/flag/leaderboard` - Get leaderboard of flag captures
  - Query parameters:
    - `limit` (optional): Maximum number of entries to return
- `GET /api/flag/address/:address/events` - Get events for a specific address
- `GET /api/health` - Health check endpoint

## Setup Instructions

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Access to an Ethereum node (local or testnet)
- Deployed CaptureTheFlag contract

### Installation

1. Clone the repository
2. Navigate to the backend directory:
   ```
   cd capture-the-flag-dapp/backend
   ```
3. Install dependencies:
   ```
   npm install
   ```
   or
   ```
   yarn
   ```
4. Copy the example environment file and configure it:
   ```
   cp .env.example .env
   ```
5. Edit the `.env` file with your specific configuration:
   - Set `CONTRACT_ADDRESS` to your deployed contract address
   - Set `RPC_URL` to your Ethereum node URL
   - Configure other settings as needed

### Running the Server

For development:
```
npm run dev
```
or
```
yarn dev
```

For production:
1. Build the project:
   ```
   npm run build
   ```
   or
   ```
   yarn build
   ```
2. Start the server:
   ```
   npm start
   ```
   or
   ```
   yarn start
   ```

### Running Tests

Run the test suite:
```
npm test
```
or
```
yarn test
```

## Integration with Contract

This backend service interacts with the CaptureTheFlag smart contract deployed on an Ethereum network. The contract should have the following interface:

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title CaptureTheFlag
 * @dev A simple contract that allows users to capture and release a flag
 */
contract CaptureTheFlag {
    // Custom errors
    error AlreadyFlagOwner();
    error NotFlagOwner();
    
    // State variables
    address private currentOwner;
    uint256 private lastCaptureTime;
    
    // Events
    event FlagCaptured(address indexed capturer, uint256 timestamp);
    event FlagReleased(address indexed releaser, uint256 timestamp);
    
    /**
     * @notice Allows an address to capture the flag if they don't already own it
     * @dev Emits a FlagCaptured event upon successful capture
     */
    function captureFlag() external {
        // Check if sender already owns the flag
        if (msg.sender == currentOwner) {
            revert AlreadyFlagOwner();
        }
```

The backend connects to this contract via ethers.js and listens for `FlagCaptured` and `FlagReleased` events to maintain a record of flag captures and releases.

## Deployment Instructions

### Local Development

1. Start your local Ethereum node (e.g., Hardhat Network, Ganache)
2. Deploy the CaptureTheFlag contract
3. Update the `.env` file with the contract address
4. Start the backend server

### Testnet Deployment

1. Deploy the CaptureTheFlag contract to your preferred testnet (e.g., Sepolia)
2. Update the `.env` file with:
   - Contract address
   - RPC URL for the testnet
3. Deploy the backend to your preferred hosting service (e.g., Heroku, AWS, DigitalOcean)
4. Set environment variables on your hosting service

## Frontend Integration

To integrate with the frontend, the backend provides RESTful API endpoints that can be consumed by the React application. The frontend should:

1. Connect to the backend API for historical data and leaderboard
2. Connect directly to the smart contract for real-time status and actions

Example frontend integration code:

```typescript
// Example of fetching flag status from the backend
const fetchFlagStatus = async () => {
  try {
    const response = await fetch('http://localhost:3001/api/flag/status');
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching flag status:', error);
    throw error;
  }
};

// Example of fetching leaderboard from the backend
const fetchLeaderboard = async (limit = 10) => {
  try {
    const response = await fetch(`http://localhost:3001/api/flag/leaderboard?limit=${limit}`);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    throw error;
  }
};
```

## Error Handling

The backend implements a global error handler middleware that catches all errors and returns appropriate HTTP status codes and error messages. All API endpoints are wrapped in try-catch blocks to ensure robust error handling.

## Future Improvements

- Add authentication and rate limiting
- Implement WebSocket support for real-time updates
- Add caching layer for improved performance
- Support for multiple contracts or networks
- Extended analytics and statistics

## License

MIT
        
        // Update state variables (Effects)
        currentOwner = msg.sender;
        lastCaptureTime = block.timestamp;
        
        // Emit event
        emit FlagCaptured(msg.sender, block.timestamp);
    }
    
    /**
     * @notice Allows the current flag owner to voluntarily release the flag
     * @dev Emits a FlagReleased event upon successful release
     */
    function releaseFlag() external {
        // Check if sender is the flag owner
        if (msg.sender != currentOwner) {
            revert NotFlagOwner();
        }
        
        // Store the releaser before updating state
        address releaser = currentOwner;
        
        // Update state variables (Effects)
        currentOwner = address(0);
        lastCaptureTime = 0;
        
        // Emit event
        emit FlagReleased(releaser, block.timestamp);
    }
    
    /**
     * @notice Returns the current flag owner and when it was last captured
     * @return owner The address of the current flag owner
     * @return captureTime The timestamp when the flag was last captured
     */
    function getFlagStatus() external view returns (address owner, uint256 captureTime) {
        return (currentOwner, lastCaptureTime);
    }
}