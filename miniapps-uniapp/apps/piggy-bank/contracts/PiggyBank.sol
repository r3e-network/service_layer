// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title PiggyBank
 * @dev A privacy-focused Piggy Bank contract using Zero Knowledge proofs.
 * Supports ETH and ANY ERC-20 token on Ethereum.
 * Users deposit funds into commitments.
 * Users can only withdraw after the unlock time embedded in the commitment.
 */

interface IVerifier {
    function verifyProof(
        uint[2] calldata a,
        uint[2][2] calldata b,
        uint[2] calldata c,
        uint[6] calldata input
    ) external view returns (bool);
}

contract PiggyBank is ReentrancyGuard {
    using SafeERC20 for IERC20;

    IVerifier public immutable verifier;
    
    // Commitment tracking
    mapping(uint256 => bool) public commitments;
    mapping(uint256 => bool) public nullifiers;
    
    // Commitment metadata (for transparency without revealing amounts)
    struct CommitmentInfo {
        address token;      // Token address (address(0) for ETH)
        uint256 amount;     // Amount deposited
        uint256 timestamp;  // Deposit time
        bool exists;
    }
    mapping(uint256 => CommitmentInfo) public commitmentInfo;

    // Events
    event Deposit(
        uint256 indexed commitment,
        address indexed token,
        uint256 amount,
        uint256 timestamp
    );
    event Withdrawal(
        address indexed recipient, 
        address indexed token,
        uint256 nullifierHash, 
        uint256 amount
    );

    constructor(address _verifier) {
        verifier = IVerifier(_verifier);
    }

    /**
     * @dev Deposit ETH into the piggy bank
     * @param _commitment The commitment hash: H(secret, nullifier, amount, unlockTime, token, recipient)
     */
    function depositETH(uint256 _commitment) external payable nonReentrant {
        require(msg.value > 0, "Must deposit ETH");
        require(!commitments[_commitment], "Commitment already exists");
        
        commitments[_commitment] = true;
        commitmentInfo[_commitment] = CommitmentInfo({
            token: address(0),
            amount: msg.value,
            timestamp: block.timestamp,
            exists: true
        });
        
        emit Deposit(_commitment, address(0), msg.value, block.timestamp);
    }

    /**
     * @dev Deposit ANY ERC-20 token into the piggy bank
     * @param _commitment The commitment hash
     * @param _token The ERC-20 token address (must be a valid ERC-20 contract)
     * @param _amount The amount to deposit (in token's smallest unit)
     */
    function depositToken(
        uint256 _commitment,
        address _token,
        uint256 _amount
    ) external nonReentrant {
        require(_token != address(0), "Use depositETH for native ETH");
        require(_amount > 0, "Must deposit tokens");
        require(!commitments[_commitment], "Commitment already exists");
        
        // Verify it's a valid ERC-20 by checking it has code and responds to balanceOf
        require(_token.code.length > 0, "Not a contract");
        
        // Transfer tokens from user (will revert if not a valid ERC-20)
        IERC20(_token).safeTransferFrom(msg.sender, address(this), _amount);
        
        commitments[_commitment] = true;
        commitmentInfo[_commitment] = CommitmentInfo({
            token: _token,
            amount: _amount,
            timestamp: block.timestamp,
            exists: true
        });
        
        emit Deposit(_commitment, _token, _amount, block.timestamp);
    }

    /**
     * @dev Withdraw funds from the piggy bank with ZK proof
     * @param a ZK proof part A
     * @param b ZK proof part B
     * @param c ZK proof part C
     * @param _nullifierHash The nullifier hash to prevent double spending
     * @param _recipient The address to receive funds
     * @param _token The token address (address(0) for ETH)
     * @param _amount The amount to withdraw
     * @param _unlockTime The timestamp after which withdrawal is allowed
     * @param _commitment The original commitment hash
     */
    function withdraw(
        uint[2] calldata a,
        uint[2][2] calldata b,
        uint[2] calldata c,
        uint256 _nullifierHash,
        address payable _recipient,
        address _token,
        uint256 _amount,
        uint256 _unlockTime,
        uint256 _commitment
    ) external nonReentrant {
        require(!nullifiers[_nullifierHash], "Note has been spent");
        CommitmentInfo memory info = commitmentInfo[_commitment];
        require(info.exists, "Unknown commitment");
        require(info.token == _token, "Token mismatch");
        require(info.amount == _amount, "Amount mismatch");
        require(block.timestamp >= _unlockTime, "Piggy Bank is not unlocked yet!");

        // Public inputs to the circuit:
        // 1. Commitment
        // 2. Nullifier Hash
        // 3. Recipient (packed as uint256)
        // 4. Token (packed as uint256)
        // 5. Amount
        // 6. Unlock Time
        uint[6] memory input = [
            _commitment,
            _nullifierHash,
            uint256(uint160(_recipient)),
            uint256(uint160(_token)),
            _amount,
            _unlockTime
        ];

        require(verifier.verifyProof(a, b, c, input), "Invalid ZK Proof");

        nullifiers[_nullifierHash] = true;

        // Transfer funds
        if (_token == address(0)) {
            // ETH
            (bool success, ) = _recipient.call{value: _amount}("");
            require(success, "ETH transfer failed");
        } else {
            // ERC-20
            IERC20(_token).safeTransfer(_recipient, _amount);
        }

        emit Withdrawal(_recipient, _token, _nullifierHash, _amount);
    }

    /**
     * @dev Check if a commitment exists
     */
    function commitmentExists(uint256 _commitment) external view returns (bool) {
        return commitments[_commitment];
    }

    /**
     * @dev Get commitment info
     */
    function getCommitmentInfo(uint256 _commitment) external view returns (
        address token,
        uint256 amount,
        uint256 timestamp,
        bool exists
    ) {
        CommitmentInfo memory info = commitmentInfo[_commitment];
        return (info.token, info.amount, info.timestamp, info.exists);
    }

    // Allow contract to receive ETH
    receive() external payable {}
}
