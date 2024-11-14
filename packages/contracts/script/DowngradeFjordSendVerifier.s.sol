// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.20;

import {Script, console2} from "forge-std/Script.sol";
import {Helper} from "../src/Helper.sol";

import {SendVerifier, SendVerifierProxy} from "../src/SendVerifier.sol";

/**
 * Downgrades the SendVerifierProxy to the legacy verifier implementation.
 */
contract DeployFjordSendVerifierScript is Script, Helper {
    function setUp() public {
        this.labels();
    }

    function run() public {
        address svpAddr = vm.envAddress("SVP_ADDRESS"); // send verifier proxy address

        require(svpAddr != address(0), "SVP_ADDRESS env variable not set");

        vm.startBroadcast();

        SendVerifier sv = SendVerifier(svpAddr);
        sv.upgradeTo(0xE269194e41Cd50E2986f82Fc23A2B95D8bAFED2B);

        // solhint-disable-next-line no-console
        console2.log("Downgraded SendVerifierProxy address:", address(sv));

        vm.stopBroadcast();
    }
}
