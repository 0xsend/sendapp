// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import {Script, console2} from "forge-std/Script.sol";
import {Helper} from "../src/Helper.sol";

import {SendTokenV0} from "../src/SendTokenV0.sol";

contract DeployTestnetSendTokenV0Script is Script, Helper {
    function setUp() public {
        this.labels();
    }

    function run() public {
        vm.startBroadcast();
        SendTokenV0 tst = new SendTokenV0();
        // solhint-disable-next-line no-console
        console2.log("SendTokenV0 address: ", address(tst));
        vm.stopBroadcast();
    }
}
