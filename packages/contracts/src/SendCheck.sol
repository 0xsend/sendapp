// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.12;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";
import "openzeppelin-contracts/contracts/utils/cryptography/ECDSA.sol";

struct Check {
    address ephemeralAddress;
    address from;
    uint256 amount;
}

contract SendCheck {
    using SafeERC20 for IERC20;

    mapping(IERC20 => mapping(address => Check)) public checks;

    event CheckCreated(Check check, IERC20 token);
    event CheckClaimed(Check check, IERC20 token, address redeemer);

    function createCheck(IERC20 token, address ephemeralAddress, uint256 amount) external {
        require(address(token) != address(0), "Cannot create /send Check: invalid token address");
        require(ephemeralAddress != address(0), "Cannot create /send Check: invalid ephemeral address");
        require(amount > 0, "Cannot create /send Check: invalid amount");
        require(checks[token][ephemeralAddress].ephemeralAddress == address(0), "Cannot create /send Check: check already exists");


        checks[token][ephemeralAddress] = Check({
            ephemeralAddress: ephemeralAddress,
            from: msg.sender,
            amount: amount
        });

        emit CheckCreated(checks[token][ephemeralAddress], token);
        token.safeTransferFrom(msg.sender, address(this), amount);
    }

    function claimCheckSelf(IERC20 token, address ephemeralAddress) external {
        Check memory check = checks[token][ephemeralAddress];
        require(address(token) != address(0), "Cannot claim /send Check: invalid token address");
        require(check.ephemeralAddress != address(0), "Cannot claim /send Check: check does not exist");
        require(msg.sender == check.from, "Cannot claim /send Check: not /send check sender");

        emit CheckClaimed(check, token, msg.sender);
        delete checks[token][ephemeralAddress];
        token.safeTransfer(msg.sender, check.amount);
    }

    function claimCheck(IERC20 token, address ephemeralAddress, bytes memory _signature) external {
        require(address(token) != address(0), "Cannot claim /send Check: invalid token address");
        Check memory check = checks[token][ephemeralAddress];
        require(check.ephemeralAddress != address(0), "Cannot claim /send Check: check does not exist");

        bytes32 message = MessageHashUtils.toEthSignedMessageHash(
            keccak256(abi.encodePacked(msg.sender))
        );
        address signer = ECDSA.recover(message, _signature);
        require(signer == ephemeralAddress, "Cannot claim /send Check: invalid signature");

        emit CheckClaimed(check, token, msg.sender);
        delete checks[token][ephemeralAddress];
        token.safeTransfer(msg.sender, check.amount);
    }
}