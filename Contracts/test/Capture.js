const {
  time,
  loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const { expect } = require("chai");

describe("CaptureTheFlag", function () {
  // We define a fixture to reuse the same setup in every test
  async function deployCaptureTheFlag() {
    // Get three signers - we need at least two for testing different users
    const [deployer, user1, user2] = await ethers.getSigners();

    // Deploy the contract
    const CaptureTheFlag = await ethers.getContractFactory("CaptureTheFlag");
    const captureTheFlag = await CaptureTheFlag.deploy();

    return { captureTheFlag, deployer, user1, user2 };
  }

  describe("Deployment", function () {
    it("Should start with no flag owner", async function () {
      const { captureTheFlag } = await loadFixture(deployCaptureTheFlag);
      
      // Get flag status
      const [owner, captureTime] = await captureTheFlag.getFlagStatus();
      
      // Check initial state - no owner (address(0))
      expect(owner).to.equal("0x0000000000000000000000000000000000000000");
      expect(captureTime).to.equal(0);
    });
  });

  describe("captureFlag", function () {
    describe("Validations", function () {
      it("Should allow a user to capture the flag initially", async function () {
        const { captureTheFlag, user1 } = await loadFixture(deployCaptureTheFlag);
        
        // User1 captures the flag
        await captureTheFlag.connect(user1).captureFlag();
        
        // Check flag status
        const [owner, captureTime] = await captureTheFlag.getFlagStatus();
        expect(owner).to.equal(user1.address);
        expect(captureTime).to.be.gt(0); // Timestamp should be greater than 0
      });

      it("Should allow a different user to capture the flag", async function () {
        const { captureTheFlag, user1, user2 } = await loadFixture(deployCaptureTheFlag);
        
        // User1 captures the flag first
        await captureTheFlag.connect(user1).captureFlag();
        
        // User2 captures the flag from user1
        await captureTheFlag.connect(user2).captureFlag();
        
        // Check flag status
        const [owner, captureTime] = await captureTheFlag.getFlagStatus();
        expect(owner).to.equal(user2.address);
      });

      it("Should revert when current owner tries to capture again", async function () {
        const { captureTheFlag, user1 } = await loadFixture(deployCaptureTheFlag);
        
        // User1 captures the flag
        await captureTheFlag.connect(user1).captureFlag();
        
        // User1 tries to capture again
        await expect(
          captureTheFlag.connect(user1).captureFlag()
        ).to.be.revertedWithCustomError(captureTheFlag, "AlreadyFlagOwner");
      });
    });

    describe("Events", function () {
      it("Should emit FlagCaptured event when flag is captured", async function () {
        const { captureTheFlag, user1 } = await loadFixture(deployCaptureTheFlag);
        
        // Check for FlagCaptured event with correct parameters
        await expect(captureTheFlag.connect(user1).captureFlag())
          .to.emit(captureTheFlag, "FlagCaptured")
          .withArgs(user1.address, anyValue); // anyValue for timestamp
      });
    });
  });

  describe("releaseFlag", function () {
    describe("Validations", function () {
      it("Should allow the owner to release the flag", async function () {
        const { captureTheFlag, user1 } = await loadFixture(deployCaptureTheFlag);
        
        // User1 captures the flag
        await captureTheFlag.connect(user1).captureFlag();
        
        // User1 releases the flag
        await captureTheFlag.connect(user1).releaseFlag();
        
        // Check flag status after release
        const [owner, captureTime] = await captureTheFlag.getFlagStatus();
        expect(owner).to.equal("0x0000000000000000000000000000000000000000");
        expect(captureTime).to.equal(0);
      });

      it("Should revert when non-owner tries to release the flag", async function () {
        const { captureTheFlag, user1, user2 } = await loadFixture(deployCaptureTheFlag);
        
        // User1 captures the flag
        await captureTheFlag.connect(user1).captureFlag();
        
        // User2 tries to release the flag (should fail)
        await expect(
          captureTheFlag.connect(user2).releaseFlag()
        ).to.be.revertedWithCustomError(captureTheFlag, "NotFlagOwner");
      });

      it("Should allow a user to capture flag after it was released", async function () {
        const { captureTheFlag, user1, user2 } = await loadFixture(deployCaptureTheFlag);
        
        // User1 captures the flag
        await captureTheFlag.connect(user1).captureFlag();
        
        // User1 releases the flag
        await captureTheFlag.connect(user1).releaseFlag();
        
        // User2 captures the released flag
        await captureTheFlag.connect(user2).captureFlag();
        
        // Check flag status
        const [owner, captureTime] = await captureTheFlag.getFlagStatus();
        expect(owner).to.equal(user2.address);
      });
    });

    describe("Events", function () {
      it("Should emit FlagReleased event when flag is released", async function () {
        const { captureTheFlag, user1 } = await loadFixture(deployCaptureTheFlag);
        
        // User1 captures the flag
        await captureTheFlag.connect(user1).captureFlag();
        
        // Check for FlagReleased event with correct parameters
        await expect(captureTheFlag.connect(user1).releaseFlag())
          .to.emit(captureTheFlag, "FlagReleased")
          .withArgs(user1.address, anyValue); // anyValue for timestamp
      });
    });
  });

  describe("getFlagStatus", function () {
    it("Should return correct flag status", async function () {
      const { captureTheFlag, user1 } = await loadFixture(deployCaptureTheFlag);
      
      // Initial status
      let [owner, captureTime] = await captureTheFlag.getFlagStatus();
      expect(owner).to.equal("0x0000000000000000000000000000000000000000");
      expect(captureTime).to.equal(0);
      
      // After capture
      await captureTheFlag.connect(user1).captureFlag();
      [owner, captureTime] = await captureTheFlag.getFlagStatus();
      expect(owner).to.equal(user1.address);
      expect(captureTime).to.be.gt(0);
      
      // Get current time for comparison
      const captureTimeAfterCapture = captureTime;
      
      // After release
      await captureTheFlag.connect(user1).releaseFlag();
      [owner, captureTime] = await captureTheFlag.getFlagStatus();
      expect(owner).to.equal("0x0000000000000000000000000000000000000000");
      expect(captureTime).to.equal(0);
    });
  });
});