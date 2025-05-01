import React from "react";
import FlagGame from "./components/FlagGame";
import "./App.css";

const App: React.FC = () => {
  return (
    <div className="app">
      <header>
        <h1>Capture The Flag - Base Sepolia</h1>
        <div className="network-badge">Base Sepolia Testnet</div>
      </header>
      
      <main>
        <FlagGame />
      </main>
      
      <footer>
        © {new Date().getFullYear()} Capture The Flag dApp - A Web3 Game Running on Base Sepolia
      </footer>
    </div>
  );
};

export default App;