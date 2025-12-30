// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract AuditTrail {
    event RecordUploaded(bytes32 indexed resourceId, address indexed actor, string metadata, uint256 ts);
    event AccessGranted(bytes32 indexed resourceId, address indexed grantee, address indexed actor, string metadata, uint256 ts);
    event AccessRevoked(bytes32 indexed resourceId, address indexed grantee, address indexed actor, string metadata, uint256 ts);
    event RecordFetched(bytes32 indexed resourceId, address indexed actor, string metadata, uint256 ts);

    // These functions emit events that off-chain listeners can index.
    // In production you'd restrict who can call these; for now they are public for flexibility.
    function recordUploaded(bytes32 resourceId, string calldata metadata) external {
        emit RecordUploaded(resourceId, msg.sender, metadata, block.timestamp);
    }

    function grantAccess(bytes32 resourceId, address grantee, string calldata metadata) external {
        emit AccessGranted(resourceId, grantee, msg.sender, metadata, block.timestamp);
    }

    function revokeAccess(bytes32 resourceId, address grantee, string calldata metadata) external {
        emit AccessRevoked(resourceId, grantee, msg.sender, metadata, block.timestamp);
    }

    function recordFetched(bytes32 resourceId, string calldata metadata) external {
        emit RecordFetched(resourceId, msg.sender, metadata, block.timestamp);
    }
}
