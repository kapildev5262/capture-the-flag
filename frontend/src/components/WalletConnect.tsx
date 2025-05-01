import { ethers } from "ethers";
import { useEffect, useState } from "react";

// Define types
type WalletConnectProps = {
  contractAddress: string;
  contractAbi: any[];
  children: (walletProps: WalletState) => React.ReactNode;
};

type WalletState = {
  account: string | null;
  provider: ethers.BrowserProvider | null;
  signer: ethers.Signer | null;
  contract: ethers.Contract | null;
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
  networkName: string | null;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
};

// Declare window.ethereum type
declare global {
  interface Window {
    ethereum?: any;
  }
}

// Base Sepolia network configuration
const BASE_SEPOLIA_NETWORK = {
  chainId: "0x14a34", // Base Sepolia chain ID in hex (84532 in decimal)
  chainName: "Base Sepolia",
  nativeCurrency: {
    name: "Ethereum",
    symbol: "ETH",
    decimals: 18,
  },
  rpcUrls: ["https://sepolia.base.org"], // Base Sepolia RPC
  blockExplorerUrls: ["https://sepolia.basescan.org/"],
};

const WalletConnect: React.FC<WalletConnectProps> = ({ 
  contractAddress, 
  contractAbi, 
  children 
}) => {
  const [account, setAccount] = useState<string | null>(null);
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [contract, setContract] = useState<ethers.Contract | null>(null);
  const [signer, setSigner] = useState<ethers.Signer | null>(null);
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [networkName, setNetworkName] = useState<string | null>(null);

  const switchToBaseSepoliaNetwork = async () => {
    try {
      if (!window.ethereum) throw new Error("No crypto wallet found");
      
      // Try to switch to Base Sepolia
      try {
        await window.ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: BASE_SEPOLIA_NETWORK.chainId }],
        });
      } catch (switchError: any) {
        // This error code indicates that the chain has not been added to MetaMask
        if (switchError.code === 4902) {
          await window.ethereum.request({
            method: "wallet_addEthereumChain",
            params: [BASE_SEPOLIA_NETWORK],
          });
        } else {
          throw switchError;
        }
      }
      
      return true;
    } catch (error) {
      console.error("Error switching to Base Sepolia network:", error);
      setError("Failed to switch to Base Sepolia network. Please switch manually in your wallet.");
      return false;
    }
  };

  const connectWallet = async () => {
    try {
      setIsConnecting(true);
      setError(null);
      
      if (window.ethereum) {
        // First ensure we're on Base Sepolia
        const switchSuccess = await switchToBaseSepoliaNetwork();
        if (!switchSuccess) {
          setIsConnecting(false);
          return;
        }

        const provider = new ethers.BrowserProvider(window.ethereum);
        const accounts = await provider.send("eth_requestAccounts", []);
        const signerInstance = await provider.getSigner();
        const contractInstance = new ethers.Contract(
          contractAddress, 
          contractAbi, 
          signerInstance
        );
        
        // Get network information to confirm we're on Base Sepolia
        const chainId = await provider.send("eth_chainId", []);
        
        // Check if we're on Base Sepolia
        if (chainId !== BASE_SEPOLIA_NETWORK.chainId) {
          setError("Please connect to Base Sepolia network");
          setIsConnecting(false);
          return;
        }
        
        setNetworkName("Base Sepolia");
        setAccount(accounts[0]);
        setProvider(provider);
        setSigner(signerInstance);
        setContract(contractInstance);
      } else {
        setError("Please install MetaMask or another Ethereum wallet");
      }
    } catch (error) {
      console.error("Error connecting to wallet:", error);
      setError("Error connecting to wallet: " + (error instanceof Error ? error.message : String(error)));
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectWallet = () => {
    setAccount(null);
    setProvider(null);
    setSigner(null);
    setContract(null);
    setNetworkName(null);
  };

  // Listen for account changes
  useEffect(() => {
    if (window.ethereum) {
      const handleAccountsChanged = (accounts: string[]) => {
        if (accounts.length === 0) {
          // User disconnected their wallet
          disconnectWallet();
        } else if (accounts[0] !== account) {
          // Account changed, update state
          setAccount(accounts[0]);
        }
      };

      window.ethereum.on("accountsChanged", handleAccountsChanged);
      
      return () => {
        window.ethereum.removeListener("accountsChanged", handleAccountsChanged);
      };
    }
  }, [account]);

  // Listen for network changes
  useEffect(() => {
    if (window.ethereum) {
      const handleChainChanged = (chainId: string) => {
        // If the chain is changed and it's not Base Sepolia, show a warning
        if (chainId !== BASE_SEPOLIA_NETWORK.chainId) {
          setError("Please switch to Base Sepolia network");
          setNetworkName(null);
        } else {
          setError(null);
          setNetworkName("Base Sepolia");
          // Reconnect wallet on correct network if already connected before
          if (account) {
            connectWallet();
          }
        }
      };

      window.ethereum.on("chainChanged", handleChainChanged);

      return () => {
        window.ethereum.removeListener("chainChanged", handleChainChanged);
      };
    }
  }, [account]);

  // Check if wallet is already connected on component mount
  useEffect(() => {
    const checkConnection = async () => {
      if (window.ethereum) {
        try {
          const provider = new ethers.BrowserProvider(window.ethereum);
          const accounts = await provider.listAccounts();
          
          if (accounts.length > 0) {
            // User is already connected, initialize the connection
            connectWallet();
          }
        } catch (error) {
          console.error("Error checking wallet connection:", error);
        }
      }
    };

    checkConnection();
  }, []);

  const walletState: WalletState = {
    account,
    provider,
    signer,
    contract,
    isConnected: !!account,
    isConnecting,
    error,
    networkName,
    connectWallet,
    disconnectWallet,
  };

  return <>{children(walletState)}</>;
};

export default WalletConnect;