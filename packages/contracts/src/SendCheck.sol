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
    IERC20 token;
}

contract SendCheck {
    using SafeERC20 for IERC20;

    mapping(address => Check) public checks;

    event CheckCreated(Check check);
    event CheckClaimed(Check check, address redeemer);

    function createCheck(IERC20 token, address ephemeralAddress, uint256 amount) external {
        require(address(token) != address(0), "Invalid token address");
        require(ephemeralAddress != address(0), "Invalid ephemeral address");
        require(amount > 0, "Invalid amount");
        require(checks[ephemeralAddress].ephemeralAddress == address(0), "Check already exists");

        checks[ephemeralAddress] =
            Check({ephemeralAddress: ephemeralAddress, from: msg.sender, amount: amount, token: token});

        emit CheckCreated(checks[ephemeralAddress]);
        token.safeTransferFrom(msg.sender, address(this), amount);
    }

    function claimCheckSelf(address ephemeralAddress) external {
        Check memory check = checks[ephemeralAddress];
        require(check.ephemeralAddress != address(0), "Check does not exist");
        require(msg.sender == check.from, "Not check sender");

        emit CheckClaimed(check, msg.sender);
        delete checks[ephemeralAddress];
        check.token.safeTransfer(msg.sender, check.amount);
    }

    function claimCheck(address ephemeralAddress, bytes memory _signature) external {
        Check memory check = checks[ephemeralAddress];
        require(check.ephemeralAddress != address(0), "Check does not exist");

        bytes32 message = MessageHashUtils.toEthSignedMessageHash(keccak256(abi.encodePacked(msg.sender)));
        address signer = ECDSA.recover(message, _signature);
        require(signer == ephemeralAddress, "Invalid signature");

        emit CheckClaimed(check, msg.sender);
        delete checks[ephemeralAddress];
        check.token.safeTransfer(msg.sender, check.amount);
    }

    function getCheck(address ephemeralAddress) external view returns (Check memory) {
        return checks[ephemeralAddress];
    }
}
