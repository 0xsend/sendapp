// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import {Script, console2} from "forge-std/Script.sol";
import {Helper} from "../src/Helper.sol";

import {SendToken} from "../src/SendToken.sol";

contract DeployTestnetSendTokenScript is Script, Helper {
    function setUp() public {
        this.labels();
    }

    function run() public {
        vm.startBroadcast();
        SendToken tst = new SendToken();
        // solhint-disable-next-line no-console
        console2.log("SendToken address: ", address(tst));
        vm.stopBroadcast();
    }
}
