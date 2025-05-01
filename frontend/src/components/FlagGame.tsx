import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import WalletConnect from "./WalletConnect";
import "./FlagGame.css";

// Import contract constants
import { Contract_Address, Contract_Abi } from "./constants";

interface FlagStatus {
  owner: string;
  captureTime: number;
}

const FlagGame: React.FC = () => {
  // Local state
  const [flagStatus, setFlagStatus] = useState<FlagStatus | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [txInProgress, setTxInProgress] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showNotification, setShowNotification] = useState<boolean>(false);

  // Function to fetch flag status
  const fetchFlagStatus = async (contract: ethers.Contract) => {
    if (!contract) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const status = await contract.getFlagStatus();
      setFlagStatus({
        owner: status[0],
        captureTime: Number(status[1])
      });
    } catch (err) {
      console.error("Error fetching flag status:", err);
      setError("Failed to fetch flag status");
      showErrorNotification("Failed to fetch flag status");
    } finally {
      setLoading(false);
    }
  };

  // Improved error handling helper
  const parseContractError = (err: any) => {
    // Check for custom contract errors in various error formats
    if (err.data) {
      // Check for specific error signatures in data
      const errorData = err.data.toString();
      if (errorData.includes("0x6e69a19c")) {
        return "You already own the flag!";
      } else if (errorData.includes("0xc18520ab")) {
        return "You don't own the flag!";
      }
    }
    
    // Handle user rejected transaction
    if (err.code === "ACTION_REJECTED" || (err.message && err.message.includes("user rejected"))) {
      return "Transaction was rejected";
    }

    // Handle gas issues
    if (err.message && err.message.includes("insufficient funds")) {
      return "Insufficient funds for gas";
    }
    
    // Handle RPC errors
    if (err.message && err.message.includes("execution reverted")) {
      // Try to extract the revert reason
      const revertReason = err.message.match(/reason="([^"]+)"/);
      if (revertReason && revertReason[1]) {
        return `Transaction reverted: ${revertReason[1]}`;
      }
      return "Transaction reverted";
    }
    
    // Handle network issues
    if (err.message && (err.message.includes("network") || err.message.includes("connection"))) {
      return "Network connection issue. Please check your connection.";
    }
    
    // Fallback error message
    return err.reason || err.message || String(err);
  };

  // Function to capture the flag
  const captureFlag = async (contract: ethers.Contract) => {
    if (!contract) return;
    
    try {
      setTxInProgress(true);
      setError(null);
      setSuccessMessage(null);
      
      const tx = await contract.captureFlag();
      setSuccessMessage("Transaction submitted. Waiting for confirmation...");
      showSuccessNotification("Transaction submitted!");
      
      await tx.wait();
      setSuccessMessage("Flag captured successfully!");
      showSuccessNotification("Flag captured successfully!");
      
      // Refresh flag status
      await fetchFlagStatus(contract);
    } catch (err: any) {
      console.error("Error capturing flag:", err);
      
      const errorMessage = parseContractError(err);
      // For custom errors, show only the parsed message without the prefix
      if (errorMessage === "You already own the flag!" || errorMessage === "You don't own the flag!") {
        setError(errorMessage);
        showErrorNotification(errorMessage);
      } else {
        setError(`Failed to capture flag: ${errorMessage}`);
        showErrorNotification(`Failed to capture flag: ${errorMessage}`);
      }
    } finally {
      setTxInProgress(false);
    }
  };

  // Function to release the flag
  const releaseFlag = async (contract: ethers.Contract) => {
    if (!contract) return;
    
    try {
      setTxInProgress(true);
      setError(null);
      setSuccessMessage(null);
      
      const tx = await contract.releaseFlag();
      setSuccessMessage("Transaction submitted. Waiting for confirmation...");
      showSuccessNotification("Transaction submitted!");
      
      await tx.wait();
      setSuccessMessage("Flag released successfully!");
      showSuccessNotification("Flag released successfully!");
      
      // Refresh flag status
      await fetchFlagStatus(contract);
    } catch (err: any) {
      console.error("Error releasing flag:", err);
      
      const errorMessage = parseContractError(err);
      // For custom errors, show only the parsed message without the prefix
      if (errorMessage === "You already own the flag!" || errorMessage === "You don't own the flag!") {
        setError(errorMessage);
        showErrorNotification(errorMessage);
      } else {
        setError(`Failed to release flag: ${errorMessage}`);
        showErrorNotification(`Failed to release flag: ${errorMessage}`);
      }
    } finally {
      setTxInProgress(false);
    }
  };

  // Format timestamp to readable date
  const formatTimestamp = (timestamp: number) => {
    if (!timestamp) return "Never";
    return new Date(timestamp * 1000).toLocaleString();
  };

  // Show success notification
  const showSuccessNotification = (message: string) => {
    setSuccessMessage(message);
    setShowNotification(true);
    setTimeout(() => {
      setShowNotification(false);
    }, 3000);
  };

  // Show error notification
  const showErrorNotification = (message: string) => {
    setError(message);
    setShowNotification(true);
    setTimeout(() => {
      setShowNotification(false);
      // Clear error after notification disappears
      setError(null);
    }, 5000); // Longer display time for errors
  };

  return (
    <div className="flag-game-container">
      <div className="game-header">
        <h2>Capture The Flag Game</h2>
        <div className="flag-icon"></div>
      </div>
      
      <WalletConnect
        contractAddress={Contract_Address}
        contractAbi={Contract_Abi}
      >
        {({ 
          account, 
          contract, 
          isConnected, 
          isConnecting, 
          error: walletError, 
          networkName,
          connectWallet,
          disconnectWallet
        }) => {
          // Check if current user is the flag owner
          const isOwner = account && flagStatus?.owner === account;
          
          // Initialize flag status when contract is available
          useEffect(() => {
            if (contract && isConnected) {
              fetchFlagStatus(contract);
              
              // Set up event listeners for contract events
              const flagCapturedFilter = contract.filters.FlagCaptured();
              const flagReleasedFilter = contract.filters.FlagReleased();
              
              const handleFlagEvent = () => {
                fetchFlagStatus(contract);
              };
              
              contract.on(flagCapturedFilter, handleFlagEvent);
              contract.on(flagReleasedFilter, handleFlagEvent);
              
              // Clean up event listeners
              return () => {
                contract.off(flagCapturedFilter, handleFlagEvent);
                contract.off(flagReleasedFilter, handleFlagEvent);
              };
            }
          }, [contract, isConnected, account]);
          
          return (
            <div className="flag-game-interaction">
              {!isConnected ? (
                <div className="connect-prompt">
                  <p>Please connect your wallet to play the game</p>
                  <button 
                    onClick={isConnecting ? undefined : () => connectWallet()}
                    disabled={isConnecting}
                    className={`connect-button ${isConnecting ? "disabled" : ""}`}
                  >
                    {isConnecting ? (
                      <>
                        <span className="spinner"></span>
                        Connecting...
                      </>
                    ) : (
                      <>Connect Wallet</>
                    )}
                  </button>
                  {walletError && (
                    <div className="error-container">
                      <p className="error-message">{walletError}</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="game-content">
                  <div className="wallet-info">
                    <div className="account-section">
                      <span className="label">Connected Account:</span>
                      <span className="value">{account?.substring(0, 6)}...{account?.substring(38)}</span>
                      <button 
                        className="disconnect-button" 
                        onClick={disconnectWallet}
                        title="Disconnect Wallet"
                      >
                        ✕
                      </button>
                    </div>
                    <div className="network-section">
                      <span className="label">Network:</span>
                      <span className="value network">{networkName || "Unknown"}</span>
                    </div>
                  </div>
                  
                  <div className="flag-status">
                    <h3>Flag Status</h3>
                    {loading ? (
                      <div className="loading-status">
                        <span className="spinner"></span>
                        <p>Loading status...</p>
                      </div>
                    ) : (
                      <div className="status-content">
                        <div className="status-row">
                          <span className="label">Current Owner:</span>
                          <span className="value">
                            {flagStatus?.owner && flagStatus.owner !== ethers.ZeroAddress 
                              ? (flagStatus.owner === account 
                                  ? "You" 
                                  : `${flagStatus.owner.substring(0, 6)}...${flagStatus.owner.substring(38)}`)
                              : "Nobody owns the flag"}
                          </span>
                        </div>
                        {flagStatus?.owner && flagStatus.owner !== ethers.ZeroAddress && (
                          <div className="status-row">
                            <span className="label">Captured At:</span>
                            <span className="value">{formatTimestamp(flagStatus.captureTime)}</span>
                          </div>
                        )}
                        
                        <div className="flag-visual">
                          <div className={`flag ${isOwner ? "your-flag" : flagStatus?.owner && flagStatus.owner !== ethers.ZeroAddress ? "captured" : "uncaptured"}`}>
                            <div className="flag-pole"></div>
                            <div className="flag-cloth"></div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="game-actions">
                    <button 
                      onClick={() => captureFlag(contract!)} 
                      disabled={Boolean(txInProgress || loading || isOwner)} 
                      className={`capture-button ${(txInProgress || loading || isOwner) ? "disabled" : ""}`}
                    >
                      {txInProgress ? (
                        <>
                          <span className="spinner"></span>
                          Processing...
                        </>
                      ) : "Capture Flag"}
                    </button>
                    
                    <button 
                      onClick={() => releaseFlag(contract!)} 
                      disabled={txInProgress || loading} 
                      className={`release-button ${(txInProgress || loading ) ? "disabled" : ""}`}
                    >
                      {txInProgress ? (
                        <>
                          <span className="spinner"></span>
                          Processing...
                        </>
                      ) : "Release Flag"}
                    </button>
                    
                    <button 
                      onClick={() => fetchFlagStatus(contract!)} 
                      disabled={loading || txInProgress} 
                      className={`refresh-button ${(loading || txInProgress) ? "disabled" : ""}`}
                    >
                      {loading ? (
                        <>
                          <span className="spinner"></span>
                          Refreshing...
                        </>
                      ) : "Refresh Status"}
                    </button>
                  </div>
                  
                  {/* Improved error display area */}
                  {(walletError || error) && (
                    <div className="error-container">
                      {walletError && <p className="error-message">{walletError}</p>}
                      {error && <p className="error-message">{error}</p>}
                    </div>
                  )}
                  
                  {successMessage && <p className="success-message">{successMessage}</p>}

                  {showNotification && (
                    <div className={`notification ${error ? "error-notification" : "success-notification"}`}>
                      <div className="notification-content">
                        <span className="notification-icon">
                          {error ? "⚠️" : "✅"}
                        </span>
                        <span className="notification-message">
                          {error || successMessage}
                        </span>
                      </div>
                      <button 
                        className="notification-close"
                        onClick={() => setShowNotification(false)}
                      >
                        ✕
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        }}
      </WalletConnect>
    </div>
  );
};

export default FlagGame;