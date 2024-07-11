// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.20;

import {Script, console2} from "forge-std/Script.sol";
import {Helper} from "../src/Helper.sol";

import {SendVerifier, SendVerifierProxy} from "../src/SendVerifier.sol";

/**
 * Deploys new p256 precompiled verifier implementation and upgrades the SendVerifierProxy to it.
 */
contract DeployFjordSendVerifierScript is Script, Helper {
    function setUp() public {
        this.labels();
    }

    function run() public {
        address svpAddr = vm.envAddress("SVP_ADDRESS"); // send verifier proxy address

        require(svpAddr != address(0), "SVP_ADDRESS env variable not set");

        vm.startBroadcast();

        // use send verifier implementation for now
        bytes32 salt = keccak256("fjord");
        address verifier = address(new SendVerifier{salt: salt}()); // deploy new implementation with native p256
        address owner = msg.sender;

        // solhint-disable-next-line no-console
        console2.log("new verifier address:", verifier);
        // solhint-disable-next-line no-console
        console2.log("owner address:", owner);

        SendVerifier sv = SendVerifier(svpAddr);
        sv.upgradeTo(verifier);

        // solhint-disable-next-line no-console
        console2.log("Upgraded SendVerifierProxy address:", address(sv));

        vm.stopBroadcast();
    }
}
