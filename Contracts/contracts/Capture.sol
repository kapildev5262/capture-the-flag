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