// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import {Script, console2} from "forge-std/Script.sol";
import {SendMerkleDrop} from "../src/SendMerkleDrop.sol";
import {Send} from "../src/Send.sol";
import {Helper} from "../src/Helper.sol";

contract CreateSendDistributionTrancheScript is Script, Helper {
    function setUp() public {
        this.labels();
    }

    function run() public {
        vm.startBroadcast();
        SendMerkleDrop sendMerkleDrop = SendMerkleDrop(SEND_MERKLE_DROP);
        Send send = Send(SEND_TOKEN);
        send.approve(SEND_MERKLE_DROP, 717100769);
        // TODO: figure out an easier way to test this
        sendMerkleDrop.addTranche(0x83c580aeb9546d9144688a39f479473fd7917b708b113bfbd4d62947d62cddff, 717100769);
        vm.stopBroadcast();
    }
}
