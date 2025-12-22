// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.20;

import {Script, console2} from "forge-std/Script.sol";
import {Helper} from "../src/Helper.sol";
import "../src/SendCheck.sol";

/// @dev forge script ./script/DeploySendCheck.s.sol:DeploySendCheckScript
contract DeploySendCheckScript is Script, Helper {
    function setUp() public {
        labels();
    }

    function run() external returns (SendCheck) {
        vm.startBroadcast();
        SendCheck sendCheck = new SendCheck{salt: 0}();

        /* solhint-disable no-console */
        console2.log("SendCheck address:", address(sendCheck));
        vm.stopBroadcast();
        return sendCheck;
    }
}
