// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.12;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";
import "openzeppelin-contracts/contracts/utils/cryptography/ECDSA.sol";

struct Check {
    address ephemeralAddress;
    address from;
    IERC20[] tokens;
    uint256[] amounts;
    uint256 expiresAt;
}

contract SendCheck {
    using SafeERC20 for IERC20;

    mapping(address => Check) internal _checks;

    event CheckCreated(Check check);
    event CheckClaimed(Check check, address redeemer);

    function checks(address ephemeralAddress)
        external
        view
        returns (address, address, IERC20[] memory, uint256[] memory, uint256)
    {
        Check storage check = _checks[ephemeralAddress];
        return (check.ephemeralAddress, check.from, check.tokens, check.amounts, check.expiresAt);
    }

    function createCheck(
        IERC20[] calldata tokens,
        address ephemeralAddress,
        uint256[] calldata amounts,
        uint256 expiresAt
    ) external {
        require(tokens.length > 0, "No tokens provided");
        require(tokens.length == amounts.length, "Array length mismatch");
        require(ephemeralAddress != address(0), "Invalid ephemeral address");
        require(expiresAt > block.timestamp, "Invalid expiration");
        require(_checks[ephemeralAddress].ephemeralAddress == address(0), "Check already exists");

        // Validate tokens and amounts, check for duplicates
        for (uint256 i = 0; i < tokens.length; i++) {
            require(address(tokens[i]) != address(0), "Invalid token address");
            require(amounts[i] > 0, "Invalid amount");
            // Check for duplicate tokens
            for (uint256 j = 0; j < i; j++) {
                require(tokens[i] != tokens[j], "Duplicate token");
            }
        }

        _checks[ephemeralAddress] = Check({
            ephemeralAddress: ephemeralAddress,
            from: msg.sender,
            tokens: tokens,
            amounts: amounts,
            expiresAt: expiresAt
        });

        emit CheckCreated(_checks[ephemeralAddress]);

        // Transfer all tokens from sender to contract
        for (uint256 i = 0; i < tokens.length; i++) {
            tokens[i].safeTransferFrom(msg.sender, address(this), amounts[i]);
        }
    }

    function claimCheckSelf(address ephemeralAddress) external {
        Check storage check = _checks[ephemeralAddress];
        require(check.ephemeralAddress != address(0), "Check does not exist");
        require(msg.sender == check.from, "Not check sender");

        // Cache values before deleting
        IERC20[] memory tokens = check.tokens;
        uint256[] memory amounts = check.amounts;

        emit CheckClaimed(check, msg.sender);
        delete _checks[ephemeralAddress];

        // Transfer all tokens back to sender
        for (uint256 i = 0; i < tokens.length; i++) {
            tokens[i].safeTransfer(msg.sender, amounts[i]);
        }
    }

    function claimCheck(address ephemeralAddress, bytes memory _signature) external {
        Check storage check = _checks[ephemeralAddress];
        require(check.ephemeralAddress != address(0), "Check does not exist");
        require(block.timestamp <= check.expiresAt, "Check expired");

        bytes32 message = MessageHashUtils.toEthSignedMessageHash(keccak256(abi.encodePacked(msg.sender)));
        address signer = ECDSA.recover(message, _signature);
        require(signer == ephemeralAddress, "Invalid signature");

        // Cache values before deleting
        IERC20[] memory tokens = check.tokens;
        uint256[] memory amounts = check.amounts;

        emit CheckClaimed(check, msg.sender);
        delete _checks[ephemeralAddress];

        // Transfer all tokens to claimer
        for (uint256 i = 0; i < tokens.length; i++) {
            tokens[i].safeTransfer(msg.sender, amounts[i]);
        }
    }
}
