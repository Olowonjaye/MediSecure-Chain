// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title MediSecure Registry
 * @notice A blockchain-based registry for encrypted medical records.
 * @dev Synchronizes with backend audit trail and access management logic.
 *      Uses role-based access control (RBAC) from OpenZeppelin.
 */

import "@openzeppelin/contracts/access/AccessControl.sol";

contract MedisecureRegistry is AccessControl {
    // --- Roles ---
    bytes32 public constant EMERGENCY_ISSUER_ROLE = keccak256("EMERGENCY_ISSUER_ROLE");
    bytes32 public constant AUDITOR_ROLE = keccak256("AUDITOR_ROLE");

    // --- Structs ---
    struct Resource {
        address owner;
        string cid;              // IPFS CID or encrypted URI
        bytes32 cipherHash;      // SHA-256 hash of encrypted content
        string metadata;         // Descriptive metadata (JSON string or key:value pairs)
        uint256 createdAt;       // Block timestamp
        bool isRevoked;          // Optional: mark deleted/revoked records
    }

    // --- Mappings ---
    mapping(bytes32 => Resource) public resources;
    mapping(bytes32 => mapping(address => bytes)) private encryptedKeys;

    // --- Events ---
    event ResourceRegistered(
        bytes32 indexed resourceId,
        address indexed owner,
        string cid,
        bytes32 cipherHash,
        string metadata
    );

    event ResourceRevoked(bytes32 indexed resourceId, address indexed owner);

    event AccessGranted(
        bytes32 indexed resourceId,
        address indexed grantee,
        bytes encryptedSymKey
    );

    event AccessRevoked(
        bytes32 indexed resourceId,
        address indexed grantee
    );

    event EmergencyAccessIssued(
        bytes32 indexed resourceId,
        address indexed requester,
        string reason
    );

    // --- Constructor ---
    constructor(address initialAdmin) {
        address admin = initialAdmin == address(0) ? msg.sender : initialAdmin;
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _setRoleAdmin(EMERGENCY_ISSUER_ROLE, DEFAULT_ADMIN_ROLE);
        _setRoleAdmin(AUDITOR_ROLE, DEFAULT_ADMIN_ROLE);
    }

    // --- Core Functions ---

    /**
     * @notice Registers a new medical resource (encrypted file).
     * @dev The resourceId should be a keccak256 hash of the file’s metadata or CID.
     */
    function registerResource(
        bytes32 resourceId,
        string calldata cid,
        bytes32 cipherHash,
        string calldata metadata
    ) external {
        require(resources[resourceId].owner == address(0), "Resource already exists");

        resources[resourceId] = Resource({
            owner: msg.sender,
            cid: cid,
            cipherHash: cipherHash,
            metadata: metadata,
            createdAt: block.timestamp,
            isRevoked: false
        });

        emit ResourceRegistered(resourceId, msg.sender, cid, cipherHash, metadata);
    }

    /**
     * @notice Grants access to a grantee with an encrypted symmetric key.
     */
    function grantAccess(
        bytes32 resourceId,
        address grantee,
        bytes calldata encryptedSymKey
    ) external {
        require(resources[resourceId].owner == msg.sender, "Only owner can grant access");
        encryptedKeys[resourceId][grantee] = encryptedSymKey;
        emit AccessGranted(resourceId, grantee, encryptedSymKey);
    }

    /**
     * @notice Revokes a grantee's access to a resource.
     */
    function revokeAccess(bytes32 resourceId, address grantee) external {
        require(resources[resourceId].owner == msg.sender, "Only owner can revoke access");
        delete encryptedKeys[resourceId][grantee];
        emit AccessRevoked(resourceId, grantee);
    }

    /**
     * @notice Allows an authorized emergency issuer to grant temporary access.
     */
    function issueEmergencyAccess(
        bytes32 resourceId,
        address requester,
        string calldata reason
    ) external onlyRole(EMERGENCY_ISSUER_ROLE) {
        emit EmergencyAccessIssued(resourceId, requester, reason);
    }

    /**
     * @notice Revokes a resource (soft delete).
     */
    function revokeResource(bytes32 resourceId) external {
        require(resources[resourceId].owner == msg.sender, "Not resource owner");
        resources[resourceId].isRevoked = true;
        emit ResourceRevoked(resourceId, msg.sender);
    }

    /**
     * @notice Retrieves the encrypted symmetric key for a specific grantee.
     */
    function getEncryptedKey(bytes32 resourceId, address grantee)
        external
        view
        returns (bytes memory)
    {
        return encryptedKeys[resourceId][grantee];
    }

    /**
     * @notice Fetch resource details (view only).
     */
    function getResource(bytes32 resourceId)
        external
        view
        returns (Resource memory)
    {
        return resources[resourceId];
    }
}
