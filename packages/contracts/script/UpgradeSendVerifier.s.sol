// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.20;

import {Script, console2} from "forge-std/Script.sol";
import {Helper} from "../src/Helper.sol";

import {SendVerifier, SendVerifierProxy} from "../src/SendVerifier.sol";

/**
 * Upgrades the SendVerifierProxy to a new implementation.
 */
contract UpgradeSendVerifierScript is Script, Helper {
    function setUp() public {
        this.labels();
    }

    function run() public {
        address svpAddr = vm.envAddress("SVP_ADDRESS"); // send verifier proxy address
        address newVerifier = vm.envAddress("NEW_VERIFIER_ADDRESS"); // new verifier address
        require(svpAddr != address(0), "SVP_ADDRESS env variable not set");
        require(newVerifier != address(0), "NEW_VERIFIER_ADDRESS env variable not set");

        vm.startBroadcast();
        // solhint-disable-next-line no-console
        console2.log("new verifier address:", newVerifier);

        SendVerifier sv = SendVerifier(svpAddr);
        // solhint-disable-next-line no-console
        console2.log("SendVerifierProxy implementation before upgrade:", address(sv.implementation()));
        sv.upgradeTo(newVerifier);

        // solhint-disable-next-line no-console
        console2.log("Upgraded SendVerifierProxy address:", address(sv));

        vm.stopBroadcast();
    }
}
