// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.20;

import {Script} from "forge-std/Script.sol";
import {Helper} from "../src/Helper.sol";
import {SendtagCheckout} from "../src/SendtagCheckout.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/// @dev forge script ./script/DeploySendtagCheckout.s.sol:DeploySendtagCheckoutScript
contract DeploySendtagCheckoutScript is Script, Helper {
    function setUp() public {
        this.labels();
    }

    function run() external returns (SendtagCheckout) {
        address multisig = vm.envAddress("MULTISIG");
        address token = vm.envAddress("TOKEN");
        address owner = vm.envAddress("OWNER");
        require(multisig != address(0), "MULTISIG not set");
        require(token != address(0), "TOKEN not set");
        require(owner != address(0), "OWNER not set");
        return this.deploy(multisig, token, owner);
    }

    function deploy(address multisig, address token, address owner) external returns (SendtagCheckout) {
        vm.startBroadcast();
        bytes32 salt = keccak256("fjord");
        SendtagCheckout sendtagCheckout = new SendtagCheckout{salt: salt}(multisig, token, owner);
        vm.stopBroadcast();
        return sendtagCheckout;
    }
}
