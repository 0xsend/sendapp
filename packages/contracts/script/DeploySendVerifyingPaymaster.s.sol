// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.20;

import {Script, console2} from "forge-std/Script.sol";
import {Helper} from "../src/Helper.sol";
import "../src/SendVerifyingPaymaster.sol";

contract DeploySendVerifyingPaymasterScript is Script, Helper {
    function setUp() public {
        this.labels();
    }

    function run() public {
        bytes32 salt = bytes32(uint256(1));
        vm.startBroadcast();

        address verifier = vm.envAddress("VERIFIER");
        address owner = vm.envAddress("OWNER");

        IEntryPoint entryPoint = IEntryPoint(AA_ENTRY_POINT_V0_7);
        SendVerifyingPaymaster paymaster = new SendVerifyingPaymaster{salt: salt}(entryPoint, verifier, owner);

        // solhint-disable no-console
        console2.log("Deployed SendVerifyingPaymaster at address: ", address(paymaster));
        console2.log("Deployed SendVerifyingPaymaster verifier: ", verifier);
        console2.log("Deployed SendVerifyingPaymaster owner: ", owner);

        IEntryPoint(entryPoint).depositTo{value: 0.025 ether}(address(paymaster));
        paymaster.addStake{value: 0.025 ether}(1);
        vm.stopBroadcast();
    }
}
