// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.20;

import {Script, console2} from "forge-std/Script.sol";
import {Helper} from "../src/Helper.sol";

import {SendVerifier, SendVerifierProxy} from "../src/SendVerifier.sol";

contract DeploySendVerifierScript is Script, Helper {
    function setUp() public {
        this.labels();
    }

    function run() public {
        vm.startBroadcast();

        // use send verifier implementation for now
        bytes32 salt = keccak256("fjord");
        address verifier = address(new SendVerifier{salt: salt}());
        address owner = msg.sender;

        // solhint-disable-next-line no-console
        console2.log("verifier address:", verifier);
        // solhint-disable-next-line no-console
        console2.log("owner address:", owner);

        SendVerifierProxy svp =
            new SendVerifierProxy{salt: 0}(verifier, abi.encodeWithSelector(SendVerifier.init.selector, owner));

        // solhint-disable-next-line no-console
        console2.log("SendVerifierProxy address:", address(svp));

        vm.stopBroadcast();
    }
}
