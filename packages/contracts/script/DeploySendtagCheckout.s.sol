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
        IERC20 token = IERC20(vm.envAddress("TOKEN"));
        require(multisig != address(0), "MULTISIG not set");
        require(token != IERC20(address(0)), "TOKEN not set");
        return this.deploy(multisig, token);
    }

    function deploy(address multisig, IERC20 token) external returns (SendtagCheckout) {
        vm.startBroadcast();
        SendtagCheckout sendtagCheckout = new SendtagCheckout{salt: 0}(multisig, token);
        vm.stopBroadcast();
        return sendtagCheckout;
    }
}
