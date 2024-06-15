// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.20;

import {Script} from "forge-std/Script.sol";
import {Helper} from "../src/Helper.sol";
import "../src/SendCheck.sol";

/// @dev forge script ./script/DeploySendCheckScript
contract DeploySendCheckScript is Script, Helper {
    function setUp() public {
        this.labels();
    }

    function run() external returns (SendCheck) {
        vm.startBroadcast();
        SendCheck sendCheck = new SendCheck();

        vm.stopBroadcast();
        return sendCheck;
    }
}