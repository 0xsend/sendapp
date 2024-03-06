// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import {Script, console2} from "forge-std/Script.sol";
import {SendMerkleDrop} from "../src/SendMerkleDrop.sol";
import {SendToken} from "../src/SendToken.sol";
import {Helper} from "../src/Helper.sol";

contract CreateSendDistributionTrancheScript is Script, Helper {
    function setUp() public {
        this.labels();
    }

    function run() public {
        vm.startBroadcast();
        SendMerkleDrop sendMerkleDrop = SendMerkleDrop(SEND_MERKLE_DROP);
        SendToken send = SendToken(SEND_TOKEN);
        send.approve(SEND_MERKLE_DROP, 585002498);
        // TODO: figure out an easier way to test this
        sendMerkleDrop.addTranche(0x74e8d928d7453878f3d2b0628db0ed202cf0b177154d655e0dd0b509e7dc60ca, 585002498);
        vm.stopBroadcast();
    }
}
