// scripts/deploy.js
const { ethers } = require("hardhat");

async function main() {
  console.log("Deploying CaptureTheFlag contract...");
  
  const CaptureTheFlag = await ethers.getContractFactory("CaptureTheFlag");
  const captureTheFlag = await CaptureTheFlag.deploy();
  
  console.log("Waiting for deployment...");
  await captureTheFlag.waitForDeployment();
  
  const address = await captureTheFlag.getAddress();
  console.log("CaptureTheFlag deployed to:", address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });