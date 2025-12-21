// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.12;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";
import "openzeppelin-contracts/contracts/utils/cryptography/ECDSA.sol";

struct CheckAmount {
    IERC20 token;
    uint256 amount;
}

struct Check {
    address ephemeralAddress;
    address from;
    CheckAmount[] amounts;
    uint256 expiresAt;
}

contract SendCheck {
    using SafeERC20 for IERC20;

    mapping(address => Check) internal _checks;

    event CheckCreated(Check check);
    event CheckClaimed(Check check, address redeemer);

    function checks(address ephemeralAddress) external view returns (address, address, CheckAmount[] memory, uint256) {
        Check storage check = _checks[ephemeralAddress];
        return (check.ephemeralAddress, check.from, check.amounts, check.expiresAt);
    }

    function createCheck(CheckAmount[] calldata amounts, address ephemeralAddress, uint256 expiresAt) external {
        require(amounts.length > 0, "No tokens provided");
        require(ephemeralAddress != address(0), "Invalid ephemeral address");
        require(expiresAt > block.timestamp, "Invalid expiration");
        require(_checks[ephemeralAddress].ephemeralAddress == address(0), "Check already exists");

        // Validate tokens and amounts, check for duplicates
        for (uint256 i = 0; i < amounts.length; i++) {
            require(address(amounts[i].token) != address(0), "Invalid token address");
            require(amounts[i].amount > 0, "Invalid amount");
            // Check for duplicate tokens
            for (uint256 j = 0; j < i; j++) {
                require(amounts[i].token != amounts[j].token, "Duplicate token");
            }
        }

        Check storage check = _checks[ephemeralAddress];
        check.ephemeralAddress = ephemeralAddress;
        check.from = msg.sender;
        check.expiresAt = expiresAt;
        for (uint256 i = 0; i < amounts.length; i++) {
            check.amounts.push(amounts[i]);
        }

        emit CheckCreated(check);

        // Transfer all tokens from sender to contract
        for (uint256 i = 0; i < amounts.length; i++) {
            amounts[i].token.safeTransferFrom(msg.sender, address(this), amounts[i].amount);
        }
    }

    function claimCheckSelf(address ephemeralAddress) external {
        Check storage check = _checks[ephemeralAddress];
        require(check.ephemeralAddress != address(0), "Check does not exist");
        require(msg.sender == check.from, "Not check sender");

        // Cache values before deleting
        CheckAmount[] memory amounts = check.amounts;

        emit CheckClaimed(check, msg.sender);
        delete _checks[ephemeralAddress];

        // Transfer all tokens back to sender
        for (uint256 i = 0; i < amounts.length; i++) {
            amounts[i].token.safeTransfer(msg.sender, amounts[i].amount);
        }
    }

    function claimCheck(address ephemeralAddress, bytes memory _signature) external {
        Check storage check = _checks[ephemeralAddress];
        require(check.ephemeralAddress != address(0), "Check does not exist");
        require(block.timestamp <= check.expiresAt, "Check expired");

        bytes32 message =
            MessageHashUtils.toEthSignedMessageHash(keccak256(abi.encodePacked(msg.sender, block.chainid)));
        address signer = ECDSA.recover(message, _signature);
        require(signer == ephemeralAddress, "Invalid signature");

        // Cache values before deleting
        CheckAmount[] memory amounts = check.amounts;

        emit CheckClaimed(check, msg.sender);
        delete _checks[ephemeralAddress];

        // Transfer all tokens to claimer
        for (uint256 i = 0; i < amounts.length; i++) {
            amounts[i].token.safeTransfer(msg.sender, amounts[i].amount);
        }
    }
}
