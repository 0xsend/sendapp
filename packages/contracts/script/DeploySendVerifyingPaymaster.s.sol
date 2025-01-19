// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.20;

import {Script, console2} from "forge-std/Script.sol";
import {Helper} from "../src/Helper.sol";
import "../src/SendVerifyingPaymaster.sol";

contract DeploySendVerifyingPaymasterScript is Script, Helper {
    bytes32 salt = bytes32(uint256(1));

    function setUp() public {
        this.labels();
    }

    function run() public {
        address verifier = vm.envAddress("VERIFIER");
        address owner = vm.envAddress("OWNER");
        vm.startBroadcast();
        SendVerifyingPaymaster paymaster = SendVerifyingPaymaster(deploy(owner, verifier));

        IEntryPoint entryPoint = IEntryPoint(AA_ENTRY_POINT_V0_7);
        IEntryPoint(entryPoint).depositTo{value: 0.025 ether}(address(paymaster));
        paymaster.addStake{value: 0.0005 ether}(1);
        vm.stopBroadcast();
    }

    function deploy(address owner, address verifier) public returns (address) {
        IEntryPoint entryPoint = IEntryPoint(AA_ENTRY_POINT_V0_7);
        SendVerifyingPaymaster paymaster = new SendVerifyingPaymaster{salt: salt}(entryPoint, verifier, owner);

        // solhint-disable no-console
        console2.log("Deployed SendVerifyingPaymaster at address: ", address(paymaster));
        console2.log("Deployed SendVerifyingPaymaster verifier: ", verifier);
        console2.log("Deployed SendVerifyingPaymaster owner: ", owner);

        return address(paymaster);
    }
}
