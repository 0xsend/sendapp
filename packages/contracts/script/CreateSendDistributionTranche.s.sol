// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.20;

import {Script, console2} from "forge-std/Script.sol";
import {SendMerkleDrop} from "../src/SendMerkleDrop.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {Helper} from "../src/Helper.sol";

contract CreateSendDistributionTrancheScript is Script, Helper {
    function setUp() public {
        this.labels();
    }

    function run() public {
        address smdAddr = vm.envAddress("SEND_MERKLE_DROP_ADDRESS");
        bytes32 merkleRoot = vm.envBytes32("MERKLE_ROOT");
        uint256 amount = vm.envUint("AMOUNT");
        require(smdAddr != address(0), "SEND_MERKLE_DROP_ADDRESS not set");
        require(merkleRoot != bytes32(0), "MERKLE_ROOT not set");
        require(amount > 0, "AMOUNT not set");
        vm.startBroadcast();
        SendMerkleDrop sendMerkleDrop = SendMerkleDrop(smdAddr);
        ERC20 send = ERC20(SEND_TOKEN);
        send.approve(smdAddr, amount);
        sendMerkleDrop.addTranche(merkleRoot, amount);
        vm.stopBroadcast();
    }
}
